import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  console.log('Starting DaCosta All Motors API...');
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: ['https://dacostaautos.netlify.app', 'http://localhost:5173'],
      credentials: true,
    },
  });

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`DaCosta All Motors API running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
