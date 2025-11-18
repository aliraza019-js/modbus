import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Determine frontend URL based on environment
  const getFrontendUrl = () => {
    if (process.env.FRONTEND_URL) {
      return process.env.FRONTEND_URL;
    }
    
    const nodeEnv = process.env.NODE_ENV || 'local';
    if (nodeEnv === 'prod' || nodeEnv === 'production') {
      return 'https://modbus.ducorr.com';
    }
    
    // Default to localhost for local development
    return 'http://localhost:3000';
  };

  const frontendUrl = getFrontendUrl();

  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Modbus Backend is running on: http://localhost:${port}`);
  console.log(`📡 CORS enabled for: ${frontendUrl}`);
}

bootstrap();

