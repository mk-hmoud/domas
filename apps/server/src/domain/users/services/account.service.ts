import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersRepository } from '../repositories/users.repository';
import { AccessRepository } from '../repositories/access.repository';
import { DatabaseService } from '../../../core/database/database.service';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { UpdateProfileDto, ChangePasswordDto } from '../dto/account.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class AccountService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accessRepository: AccessRepository,
    private readonly db: DatabaseService,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.roles = await this.accessRepository.getRolesForUser(userId);
    user.permissions = await this.accessRepository.getPermissionsForUser(userId);

    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    context: AuditUserContext,
  ): Promise<void> {
    await this.db.transaction(async (client) => {
      await this.usersRepository.update(
        userId,
        {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phoneNumber: dto.phoneNumber,
        },
        client,
      );
    }, context);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    context: AuditUserContext,
  ): Promise<void> {
    const user = await this.usersRepository.findById(userId, undefined, true);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await argon2.verify(user.passwordHash || '', dto.currentPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid current password');
    }

    const newHash = await argon2.hash(dto.newPassword);

    await this.db.transaction(async (client) => {
      await this.usersRepository.update(userId, { passwordHash: newHash }, client);
    }, context);
  }
}
