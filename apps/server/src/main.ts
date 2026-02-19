import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import session from 'express-session';
import passport from 'passport';
import { DatabaseService } from './core/database/database.service';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';

const pgSession = require('connect-pg-simple')(session);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: {
      origin: true,
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    },
  });
  app.useLogger(app.get(Logger));

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // Essential for sessions to work behind a reverse proxy (Nginx, Cloudflare, etc)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

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
      name: 'domas.sid', // Explicit name
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
        // In prod with SSL (even via proxy), this must be true.
        // Lax sameSite allows cookies to be sent on top-level navigations.
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
