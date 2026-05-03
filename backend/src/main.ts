import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  // Log environment check on startup
  console.log('Starting DaCosta All Motors API...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
  console.log('PORT:', process.env.PORT || 4000);

  // Temporary: use hardcoded DATABASE_URL if env var not set (REMOVE AFTER FIXING RAILWAY)
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not in env, using hardcoded public URL');
    process.env.DATABASE_URL = 'postgresql://postgres:zoLDBsGDhcxKJrLoNRqZLMnwzbYXsuzz@switchback.proxy.rlwy.net:45282/dacosta_db';
  }

  // JWT_SECRET fallback for debugging only
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET not set, using fallback. SET THIS IN PRODUCTION!');
    process.env.JWT_SECRET = 'fallback-secret-set-jwt-secret-in-railway-variables';
  }

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

