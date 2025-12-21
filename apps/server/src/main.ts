import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import session from 'express-session';
import * as passport from 'passport';
import { DatabaseService } from './core/database/database.service';
import { ValidationPipe } from '@nestjs/common';

const pgSession = require('connect-pg-simple')(session);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // strip properties not in the DTO
      forbidNonWhitelisted: true, // throw error if unknown properties are present
    }),
  );

  const databaseService = app.get(DatabaseService);
  const pool = databaseService.getPool();

  app.use(
    session({
      store: new pgSession({
        pool: pool,
        tableName: 'session',
      }),
      secret: process.env.SESSION_SECRET || 'super-secret-session-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
