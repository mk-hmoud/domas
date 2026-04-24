import {
  Controller,
  Post,
  Patch,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  Body,
} from '@nestjs/common';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthenticatedGuard } from '../guards/authenticated.guard';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { LoginDto } from '../dto/login.dto';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Request() req: ExpressRequest) {
    return req.user;
  }

  @UseGuards(AuthenticatedGuard)
  @Get('me')
  getProfile(@Request() req: ExpressRequest) {
    return req.user;
  }

  @UseGuards(AuthenticatedGuard)
  @Patch('onboarding')
  @HttpCode(HttpStatus.NO_CONTENT)
  async completeOnboarding(@Request() req: ExpressRequest) {
    const user = req.user as User;
    await this.usersService.completeOnboarding(user.id);
  }

  @Post('logout')
  async logout(@Request() req: ExpressRequest, @Res() res: ExpressResponse) {
    req.logout((err: Error | null) => {
      if (err) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
      }
      return res.status(HttpStatus.OK).send();
    });
  }
}
