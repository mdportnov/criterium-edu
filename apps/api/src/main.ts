import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  try {
    // Get configuration
    const configService = app.get(ConfigService);

    // Make sure configService is defined before using it
    if (!configService) {
      console.error(
        'ConfigService is undefined. Check your AppModule imports.',
      );
      process.exit(1);
    }

    const port = configService.get<number>('port') || 3000;

    // Use Pino logger - wrap in try/catch in case it's not available
    try {
      const logger = app.get(Logger);
      if (logger) {
        app.useLogger(logger);
      }
    } catch (error) {
      console.warn('Logger not available, using default logger');
    }

    // Enable CORS
    app.enableCors({
      origin: [
        'https://criterium.command.mephi.ru',
        'http://localhost:3000', // For the API itself, useful in some setups
        'http://localhost:3001', // Common port for local frontend development
        'http://localhost:5173', // Another common port for Vite-based frontend development
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type,Authorization,Accept,Origin,X-Requested-With',
      credentials: true,
      preflightContinue: false, // Ensure preflight requests are not passed to route handlers
      optionsSuccessStatus: 204 // Standard success status for OPTIONS requests
    });

    // Enable validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Swagger API documentation
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Criterium EDU API')
      .setDescription('API for the Criterium EDU platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    // Start server
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap application:', err);
  process.exit(1);
});
