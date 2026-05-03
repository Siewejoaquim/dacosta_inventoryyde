import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

// Railway may use different variable names - check all of them
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRESQL_URL ||
  process.env.DATABASE_PRIVATE_URL ||
  process.env.POSTGRES_PRIVATE_URL;

if (dbUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl;
  console.log('Set DATABASE_URL from alternative env var');
}

if (!process.env.DATABASE_URL) {
  console.error('No database URL found in any env var!');
  console.error('Checked: DATABASE_URL, POSTGRES_URL, POSTGRESQL_URL, DATABASE_PRIVATE_URL, POSTGRES_PRIVATE_URL');
  console.error('All env var keys:', Object.keys(process.env).filter(k => 
    k.toLowerCase().includes('postgres') || 
    k.toLowerCase().includes('database') || 
    k.toLowerCase().includes('db')
  ));
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dacosta-super-secret-jwt-2024';
}

async function bootstrap() {
  console.log('Starting DaCosta All Motors API...');
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

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
