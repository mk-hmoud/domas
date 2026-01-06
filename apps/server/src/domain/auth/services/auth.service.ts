import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import * as argon2 from 'argon2';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly usersService: UsersService) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn({ email }, 'Login failed: User not found');
      return null;
    }

    if (!user.isActive) {
      this.logger.warn({ userId: user.id, email }, 'Login failed: User inactive');
      return null;
    }

    const isMatch = await argon2.verify(user.passwordHash, pass);
    if (isMatch) {
      const { passwordHash, ...result } = user;
      this.logger.log({ userId: user.id, email }, 'Login successful');
      return result;
    }

    this.logger.warn({ userId: user.id, email }, 'Login failed: Invalid password');
    return null;
  }
}
