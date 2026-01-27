import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    message: string,
    code: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    userMessage?: string,
  ) {
    super(
      {
        message,
        code,
        user_message: userMessage,
      },
      status,
    );
  }
}
