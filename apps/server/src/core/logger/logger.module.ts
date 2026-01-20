import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { Request } from 'express';
import * as crypto from 'crypto';
import { IncomingMessage } from 'http';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        // 1. Environment-aware transport
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                  ignore: 'pid,hostname',
                  messageFormat: '{req.method} {req.url} {res.statusCode} - {responseTime}ms',
                },
              }
            : undefined, // JSON format in production

        // 2. Custom Serializers for rich context
        serializers: {
          req(req: any) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
              query: req.query,
              params: req.params,
              // Log authenticated user info if available
              user: req.user
                ? {
                    id: req.user.id,
                    email: req.user.email,
                    role: req.user.role,
                  }
                : undefined,
              ip: req.ip || req.socket?.remoteAddress,
              userAgent: req.headers?.['user-agent'],
            };
          },
          res(res) {
            return {
              statusCode: res.statusCode,
            };
          },
          err(err) {
            return {
              type: err.type,
              message: err.message,
              stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined, // Hide stack in prod logs? Usually keep for errors, but maybe redact.
            };
          },
        },

        // 3. Request ID Generation (Correlation ID)
        genReqId: (req: IncomingMessage) =>
          (req.headers['x-request-id'] as string) || crypto.randomUUID(),

        // 4. Redaction for Security
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.currentPassword',
            'req.body.newPassword',
            'req.body.token',
          ],
          remove: true,
        },

        // 5. Intelligent Log Levels
        customLogLevel: (req, res, err) => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          if (req.url === '/health' || req.url === '/api/health') return 'silent'; // Reduce noise
          return 'info';
        },

        // 6. Custom Messages
        customSuccessMessage: (req, res) => {
          return `${req.method} ${req.url} completed`;
        },
        customErrorMessage: (req, res, err) => {
          return `${req.method} ${req.url} failed: ${err?.message}`;
        },

        autoLogging: true,
      },
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggerModule {}
