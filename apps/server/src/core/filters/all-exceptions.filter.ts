import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiErrorResponse } from '../../common/interfaces/api-error-response.interface';
import { ErrorCodes } from '../../common/constants/error-codes';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCodes.INTERNAL_ERROR;
    let message = 'Internal server error';
    let userMessage = undefined;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      message = exception.message;
      const res: any = exception.getResponse();

      // Check if response is object with custom fields
      if (typeof res === 'object' && res !== null) {
        if (res.code) code = res.code;
        if (res.user_message) userMessage = res.user_message;

        // Handle ValidationPipe array of messages
        if (Array.isArray(res.message)) {
          message = res.message.join(', ');
          code = ErrorCodes.VALIDATION_ERROR;
          userMessage = 'Please check the form for errors.';
        }
      }

      // Default codes for standard statuses if not set
      if (code === ErrorCodes.INTERNAL_ERROR) {
        switch (httpStatus) {
          case HttpStatus.BAD_REQUEST:
            code = ErrorCodes.INVALID_REQUEST;
            break;
          case HttpStatus.UNAUTHORIZED:
            code = ErrorCodes.UNAUTHORIZED;
            break;
          case HttpStatus.FORBIDDEN:
            code = ErrorCodes.FORBIDDEN;
            break;
          case HttpStatus.NOT_FOUND:
            code = ErrorCodes.RESOURCE_NOT_FOUND;
            break;
          case HttpStatus.CONFLICT:
            code = ErrorCodes.CONFLICT;
            break;
        }
      }
    } else if (exception && typeof exception === 'object' && 'code' in exception) {
      // Handle Database Errors (Postgres)
      const dbError = exception as { code: string; message: string; detail?: string };

      switch (dbError.code) {
        case '23505': {
          // Unique violation
          httpStatus = HttpStatus.CONFLICT;
          code = ErrorCodes.DUPLICATE_ENTRY;
          message = 'Duplicate entry found';

          // Safe extraction logic
          // Postgres detail often looks like: "Key (email)=(john@example.com) already exists."
          const match = dbError.detail?.match(/\((.*?)\)=/);
          const field = match ? match[1] : 'record';

          userMessage = `This ${field} already exists. Please use a different one.`;
          break;
        }
        case '23503': // Foreign key violation
          httpStatus = HttpStatus.BAD_REQUEST;
          code = ErrorCodes.DB_CONSTRAINT_VIOLATION;
          message = 'Foreign key constraint violation';
          userMessage = 'This operation refers to a missing record.';
          break;
        case '23514': // Check violation
          httpStatus = HttpStatus.BAD_REQUEST;
          code = ErrorCodes.INVALID_REQUEST;
          message = dbError.message;
          // Extract constraint name if possible, or provide generic message
          userMessage = 'Operation violates a business rule constraint.';
          if (dbError.message.includes('chk_booking_dates')) {
            userMessage = 'End date must be after the start date.';
          }
          break;
        case '23502': // Not null violation
        case '22P02': // Invalid text representation (e.g. UUID format)
          httpStatus = HttpStatus.BAD_REQUEST;
          code = ErrorCodes.INVALID_REQUEST;
          message = 'Database validation error';
          break;
        case 'P0001': // Raise Exception from PL/pgSQL
          httpStatus = HttpStatus.BAD_REQUEST;
          code = ErrorCodes.INVALID_REQUEST;
          message = dbError.message;
          userMessage = dbError.message;
          break;
        default:
          // Keep internal server error for unknown DB errors
          break;
      }
    }

    if (!userMessage && httpStatus >= 500) {
      userMessage = 'An unexpected error occurred. Please try again later.';
    }

    const responseBody: ApiErrorResponse = {
      status: httpStatus,
      code,
      message,
      user_message: userMessage,
    };

    const errMessage =
      exception instanceof Error
        ? exception.message
        : ((exception as any)?.message ?? String(exception));
    const errStack = exception instanceof Error ? exception.stack : undefined;

    if (httpStatus >= 500) {
      this.logger.error(`💥 Unhandled Exception: ${errMessage}`, errStack);
    } else {
      this.logger.warn(`⚠️ Client Error [${code}]: ${errMessage}`);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
