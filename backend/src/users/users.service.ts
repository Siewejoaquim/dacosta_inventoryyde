import { Injectable, NotFoundException, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Check if username already exists
      const existingUser = await this.userModel.findOne({ username: createUserDto.username }).exec();
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const created = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });
      return await created.save();
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error?.code === 11000) {
        throw new ConflictException('Username already exists');
      }
      throw new BadRequestException('Failed to create user: ' + (error?.message || 'Unknown error'));
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const update: Partial<UpdateUserDto> = { ...updateUserDto };
    if (updateUserDto.password) {
      update.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: 'Password updated successfully' };
  }
}

