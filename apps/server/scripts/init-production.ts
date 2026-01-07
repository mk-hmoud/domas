import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/domain/users/services/users.service';
import { LocationsService } from '../src/domain/locations/services/locations.service';
import { UserRole } from '../src/common/enums/user-role.enum';
import { LocationType } from '../src/common/enums/location-type.enum';
import { AuditUserContext } from '../src/common/interfaces/audit-user-context.interface';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'], // Mute info logs
  });

  const usersService = app.get(UsersService);
  const locationsService = app.get(LocationsService);
  const logger = new Logger('SystemInit');

  const systemContext: AuditUserContext = {
    userId: '00000000-0000-0000-0000-000000000000',
    username: 'system_installer_script',
    ipAddress: '127.0.0.1',
    userAgent: 'Production Init Script',
  };

  try {
    // 1. Handle Admin User
    const adminExists = await usersService.existsByRole(UserRole.ADMIN);
    if (!adminExists) {
      // Generates a 24-character random string (e.g. "aF92-kL4m-99xZ...")
      const password =
        crypto
          .randomBytes(12)
          .toString('hex')
          .match(/.{1,4}/g)
          ?.join('-') || 'secure-pass';
      const email = 'recovery_admin@dorm.com';

      await usersService.createUser(systemContext, {
        email,
        password: password, // Service will hash this!
        role: UserRole.ADMIN,
      });

      // Print credentials
      console.log('\n');
      console.log(
        '\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557',
      );
      console.log('\u2551                                                             \u2551');
      console.log(
        '\u2551   \ud83d\ude80 DORM SYSTEM PRODUCTION INITIALIZED                     \u2551',
      );
      console.log('\u2551                                                             \u2551');
      console.log('\u2551   Use these credentials to log in and create your           \u2551');
      console.log('\u2551   personal account immediately.                             \u2551');
      console.log('\u2551                                                             \u2551');
      console.log(`\u2551   \ud83d\udce7 Email:    ${email.padEnd(37)}\u2551`);
      console.log(`\u2551   \ud83d\udd11 Password: \x1b[32m${password.padEnd(37)}\x1b[0m\u2551`);
      console.log('\u2551                                                             \u2551');
      console.log(
        '\u2551   \u26a0\ufe0f  STORE THIS SECURELY. IT CANNOT BE RECOVERED.           \u2551',
      );
      console.log('\u2551                                                             \u2551');
      console.log(
        '\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d',
      );
      console.log('\n');
    } else {
      console.log('\u2705 Admin user already exists. Skipping user creation.');
    }

    // 2. Handle Root Location
    const locations = await locationsService.findAll({ page: 1, limit: 1 });
    if (locations.total === 0) {
      console.log('\ud83c\udfdb  Creating root location: University...');
      await locationsService.create(
        {
          name: 'University',
          type: LocationType.UNIVERSITY,
        },
        systemContext,
      );
      console.log('\u2705 Root location created.');
    } else {
      console.log('\u2705 Locations already exist. Skipping root creation.');
    }
  } catch (error) {
    logger.error('Failed to initialize system', error);
  } finally {
    await app.close();
  }
}

bootstrap();
