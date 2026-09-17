import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from './common/zod';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const config: AppConfig = {
    nodeEnv: configService.getOrThrow('nodeEnv'),
    port: configService.getOrThrow('port'),
    isProduction: configService.getOrThrow('isProduction'),
    appBaseUrl: configService.getOrThrow('appBaseUrl'),
    database: configService.getOrThrow('database'),
    jwt: configService.getOrThrow('jwt'),
    security: configService.getOrThrow('security'),
    swagger: configService.getOrThrow('swagger'),
    logging: configService.getOrThrow('logging'),
  };

  const logger = app.get(Logger);
  app.useLogger(logger);
  app.flushLogs();

  app.use(
    helmet({
      // The API serves JSON only; CSP belongs to the frontend's nginx.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: config.security.corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Accept,Origin,X-Requested-With',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Everything the API serves lives under /api/v1. The prefix used to exist
  // only in the frontend's VITE_API_URL and in some proxy outside this
  // repository that stripped it again - nothing here declared it, so a clean
  // checkout could not reproduce the deployed URLs. /health stays outside so
  // orchestrators can reach it without knowing the version.
  app.setGlobalPrefix('api', { exclude: ['health', 'health/ready'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.use(cookieParser());

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (config.swagger.enabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Criterium API')
      .setDescription('API for the Criterium platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
    logger.log('Swagger UI enabled at /api/docs');
  }

  await app.listen(config.port);
  logger.log(`Application listening on port ${config.port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
