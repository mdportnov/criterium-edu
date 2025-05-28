import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import dataSource from './database/data-source';

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
    let logger: Logger;
    try {
      logger = app.get(Logger);
      if (logger) {
        app.useLogger(logger);
      }
    } catch (error) {
      console.warn('Logger not available, using default logger');
    }

    app.enableCors({
      origin: [
        'https://criterium.command.mephi.ru',
        'http://localhost:3000',
        'http://localhost:5173',
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders:
        'Content-Type,Authorization,Accept,Origin,X-Requested-With',
      credentials: true,
      preflightContinue: false, // Ensure preflight requests are not passed to route handlers
      optionsSuccessStatus: 204, // Standard success status for OPTIONS requests
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

    // Run migrations in production before starting the server
    if (process.env.NODE_ENV === 'production') {
      logger.log({
        message:
          'Production environment detected. Checking and running database migrations.',
        context: 'DB Migration',
      });

      try {
        if (!dataSource.isInitialized) {
          logger.log({
            message: 'Initializing data source for migrations.',
            context: 'DB Migration',
          });

          await dataSource.initialize();

          logger.log({
            message: 'Data source initialized successfully.',
            context: 'DB Migration',
          });
        }

        logger.log({
          message: 'Running pending migrations.',
          context: 'DB Migration',
        });

        const migrationsRun = await dataSource.runMigrations();

        if (migrationsRun.length > 0) {
          logger.log({
            message: `Successfully ran ${migrationsRun.length} migration(s).`,
            migrations: migrationsRun.map((m) => m.name),
            context: 'DB Migration',
          });
        } else {
          logger.log({
            message:
              'No pending migrations to run. Database schema is up to date.',
            context: 'DB Migration',
          });
        }
      } catch (migrationError) {
        logger.error({
          message: 'CRITICAL: Failed to run database migrations.',
          error: migrationError.message,
          stack: migrationError.stack,
          context: 'DB Migration',
        });

        process.exit(1); // Exit if migrations fail in production
      }
    }

    // Start server
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap application:', err);
  process.exit(1);
});
