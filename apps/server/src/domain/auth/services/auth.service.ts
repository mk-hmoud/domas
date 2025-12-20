import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import * as argon2 from 'argon2';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    if (!user.isActive) {
      return null;
    }

    const isMatch = await argon2.verify(user.passwordHash, pass);
    if (isMatch) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }
}
