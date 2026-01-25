import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: User, done: (err: Error | null, id: string) => void): void {
    done(null, user.id);
  }

  async deserializeUser(
    userId: string,
    done: (err: Error | null, user: User | null) => void,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      if (user) {
        done(null, user);
      } else {
        done(null, null);
      }
    } catch (err) {
      done(err as Error, null);
    }
  }
}
