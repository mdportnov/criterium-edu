import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import configuration, { type AppConfig } from './config/configuration';
import { CryptoModule } from './common/crypto/crypto.module';
import { GlobalPassportModule } from './common/passport/global-passport.module';
import { connectionOptions } from './database/data-source';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TaskSolutionsModule } from './modules/task-solutions/task-solutions.module';
import { TaskSolutionReviewsModule } from './modules/task-solution-reviews/task-solution-reviews.module';
import { CheckerModule } from './modules/checker/checker.module';
import { BulkOperationsModule } from './modules/bulk-operations/bulk-operations.module';
import { OpenaiModule } from './modules/openai/openai.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { CostTrackingModule } from './modules/cost-tracking/cost-tracking.module';
import { HealthModule } from './modules/health/health.module';
import { AuditMiddleware } from './modules/audit/audit.middleware';
import { CsrfGuard } from './modules/auth/guards/csrf.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
      // Values already in the environment (containers, CI) always win.
      envFilePath: ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const database =
          configService.getOrThrow<AppConfig['database']>('database');
        return {
          ...connectionOptions,
          // Entities come from the Nest modules that register them. The glob
          // on connectionOptions is for the TypeORM CLI, which has no Nest
          // container; letting it through here made the running app load
          // whatever *.entity.js happened to be sitting under dist.
          entities: [],
          autoLoadEntities: true,
          host: database.host,
          port: database.port,
          username: database.username,
          password: database.password,
          database: database.database,
          logging: database.logging,
          // Schema changes come from migrations only, never from sync.
          synchronize: false,
        };
      },
    }),

    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logging =
          configService.getOrThrow<AppConfig['logging']>('logging');
        const isProduction =
          configService.getOrThrow<AppConfig['isProduction']>('isProduction');
        return {
          pinoHttp: {
            level: logging.level,
            transport: isProduction
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'res.headers["set-cookie"]',
              ],
              censor: '[REDACTED]',
            },
          },
        };
      },
    }),

    CryptoModule,
    GlobalPassportModule,
    HealthModule,
    UsersModule,
    AuthModule,
    TasksModule,
    TaskSolutionsModule,
    TaskSolutionReviewsModule,
    CheckerModule,
    BulkOperationsModule,
    OpenaiModule,
    DashboardModule,
    AuditModule,
    AdminModule,
    SettingsModule,
    PromptsModule,
    CostTrackingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Runs on every request; only checks the ones authenticated by cookie.
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes('*');
  }
}
