import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: ['https://dacostaautos.netlify.app', 'http://localhost:5173'],
      credentials: true,
    },
  });

  // Security headers (XSS protection, clickjacking, MIME sniffing, etc.)
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
  // eslint-disable-next-line no-console
  console.log(`DaCosta All Motors API running on port ${port}`);
}

bootstrap();

