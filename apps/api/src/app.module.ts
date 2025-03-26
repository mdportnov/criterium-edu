import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import configuration from './config/configuration';
import { dataSourceOptions } from './database/data-source';

// Module imports
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TaskSolutionsModule } from './modules/task-solutions/task-solutions.module';
import { TaskSolutionReviewsModule } from './modules/task-solution-reviews/task-solution-reviews.module';
import { CheckerModule } from './modules/checker/checker.module';

@Module({
  imports: [
    // Configuration - make sure it's loaded first and globally available
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
    }),

    // Database - with proper error handling
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        if (!dbConfig) {
          throw new Error('Database configuration is missing');
        }
        return {
          ...dataSourceOptions,
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV === 'development',
        };
      },
    }),

    // Logging - with proper error handling
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const loggingConfig = configService.get('logging');
        return {
          pinoHttp: {
            transport:
              process.env.NODE_ENV !== 'production'
                ? {
                    target: 'pino-pretty',
                    options: {
                      singleLine: true,
                    },
                  }
                : undefined,
            level: (loggingConfig && loggingConfig.level) || 'info',
          },
        };
      },
    }),

    // Application modules
    UsersModule,
    AuthModule,
    TasksModule,
    TaskSolutionsModule,
    TaskSolutionReviewsModule,
    CheckerModule,
  ],
})
export class AppModule {}
