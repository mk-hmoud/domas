import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/domain/users/services/users.service';
import { LocationsService } from '../src/domain/locations/services/locations.service';
import { AccessRepository } from '../src/domain/users/repositories/access.repository';
import { DatabaseService } from '../src/core/database/database.service';
import { LocationType } from '../src/common/enums/location-type.enum';
import { AuditUserContext } from '../src/common/interfaces/audit-user-context.interface';
import { COUNTRIES } from '../src/common/constants/countries';
import { PERMISSIONS } from '../src/common/constants/permissions';
import { SYSTEM_ROLES } from '../src/common/constants/system-roles';
import { DocumentTemplatesService } from '../src/domain/document-templates/services/document-templates.service';
import { DOCUMENT_TEMPLATE_SEEDS } from './document-template-seeds';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'], // Mute info logs
  });

  const usersService = app.get(UsersService);
  const locationsService = app.get(LocationsService);
  const accessRepository = app.get(AccessRepository);
  const documentTemplatesService = app.get(DocumentTemplatesService);
  const db = app.get(DatabaseService);
  const logger = new Logger('SystemInit');

  const systemContext: AuditUserContext = {
    userId: '00000000-0000-0000-0000-000000000000',
    username: 'system_installer_script',
    isRecoveryAdmin: true,
    locationScope: { unrestricted: true, treePaths: [] },
    ipAddress: '127.0.0.1',
    userAgent: 'Production Init Script',
  };

  try {
    // 0. Handle Countries
    const countryCheck = await db.query('SELECT COUNT(*) FROM countries');
    if (parseInt(countryCheck.rows[0].count, 10) === 0) {
      console.log('\ud83c\udf0d  Populating countries table...');

      for (const [code, name] of COUNTRIES) {
        await db.query(
          'INSERT INTO countries (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
          [code, name],
        );
      }
      console.log('\u2705 Countries populated.');
    }

    // 0.1 Handle Permissions & Roles (RBAC Seed)
    console.log('\ud83d\udee1\ufe0f  Seeding RBAC system...');

    // Seed Permissions
    const allPermissionIds: number[] = [];
    for (const slug of Object.values(PERMISSIONS)) {
      const perm = await accessRepository
        .createPermission(slug, slug)
        .catch(() => accessRepository.findPermissionBySlug(slug)); // Handle conflict
      if (perm) allPermissionIds.push(perm.id);
    }

    // Seed Roles

    const studentRole = await accessRepository
      .createRole(SYSTEM_ROLES.STUDENT, 'Student Access', true)
      .catch(() => accessRepository.findRoleByName(SYSTEM_ROLES.STUDENT));

    const adminRole = await accessRepository
      .createRole(SYSTEM_ROLES.ADMIN, 'System Administrator with full access', true)
      .catch(() => accessRepository.findRoleByName(SYSTEM_ROLES.ADMIN));

    const managerRole = await accessRepository
      .createRole(SYSTEM_ROLES.DORM_MANAGER, 'Dormitory Manager with operational access', true)
      .catch(() => accessRepository.findRoleByName(SYSTEM_ROLES.DORM_MANAGER));

    // Assign Permissions
    if (adminRole) {
      await accessRepository.assignPermissionsToRole(adminRole.id, allPermissionIds);
    }

    if (managerRole) {
      // Manager gets most permissions EXCEPT Role Creation and Booking Approvals
      const managerPermissionIds = [];
      const forbiddenSlugs: string[] = [
        PERMISSIONS.ROLES_MANAGE, // Can't create roles
        PERMISSIONS.BOOKINGS_APPROVE_FINANCIAL, // Can't approve bookings
      ];

      for (const slug of Object.values(PERMISSIONS)) {
        if (!forbiddenSlugs.includes(slug)) {
          const perm = await accessRepository.findPermissionBySlug(slug);
          if (perm) managerPermissionIds.push(perm.id);
        }
      }
      await accessRepository.assignPermissionsToRole(managerRole.id, managerPermissionIds);
    }

    console.log('\u2705 RBAC seeded.');

    // 1. Handle Admin User
    const email = 'recovery_admin@dorm.com';
    const adminUser = await usersService.findByEmail(email);
    let adminUserId = adminUser?.id;

    if (!adminUser) {
      // Generates a 24-character random string (e.g. "aF92-kL4m-99xZ...")
      const password =
        crypto
          .randomBytes(12)
          .toString('hex')
          .match(/.{1,4}/g)
          ?.join('-') || 'secure-pass';

      // create recovery admin
      const createdAdmin = await usersService.createRecoveryAdmin(systemContext, {
        email,
        password: password,
      });
      adminUserId = createdAdmin.id;

      // Print credentials
      const border = '════════════════════════════════════════════════════════════';
      console.log('\n');
      console.log(`\u2554${border}\u2557`);
      console.log(`\u2551                                                            \u2551`);
      console.log(
        `\u2551   \ud83d\ude80 DORM SYSTEM PRODUCTION INITIALIZED                    \u2551`,
      );
      console.log(`\u2551                                                            \u2551`);
      console.log(`\u2551   Use these credentials to log in and create your          \u2551`);
      console.log(`\u2551   personal account immediately.                            \u2551`);
      console.log(`\u2551                                                            \u2551`);
      console.log(`\u2551   \ud83d\udce7 Email:    ${email.padEnd(43)} \u2551`);
      console.log(`\u2551   \ud83d\udd11 Password: \x1b[32m${password.padEnd(43)}\x1b[0m \u2551`);
      console.log(`\u2551                                                            \u2551`);
      console.log(
        `\u2551   \u26a0\ufe0f  STORE THIS SECURELY. IT CANNOT BE RECOVERED.          \u2551`,
      );
      console.log(`\u2551                                                            \u2551`);
      console.log(`\u255a${border}\u255d`);
      console.log('\n');
    } else {
      console.log('\u2705 Admin user already exists. Skipping user creation.');
    }

    // 2. Handle Root Location
    const locations = await locationsService.findAll({ page: 1, limit: 1 }, systemContext);
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

    // 3. Backfill staff_locations for existing users
    // Location scoping is deny-by-default: a staff user with zero rows in
    // staff_locations sees nothing location-bound. Anchor every existing
    // non-recovery-admin user at the top-level root node(s) so nobody loses
    // access the moment enforcement ships - admins can narrow people down
    // from there afterwards.
    console.log('\ud83d\udccd  Backfilling staff location scope...');
    const backfillResult = await db.query(
      `INSERT INTO staff_locations (user_id, location_id)
       SELECT u.id, l.id
       FROM users u
       CROSS JOIN (SELECT id FROM locations WHERE nlevel(tree_path) = 1 AND deleted_at IS NULL) l
       WHERE u.deleted_at IS NULL
         AND u.is_recovery_admin = FALSE
         AND NOT EXISTS (SELECT 1 FROM staff_locations sl WHERE sl.user_id = u.id)
       ON CONFLICT DO NOTHING`,
    );
    console.log(`\u2705 Staff location scope backfilled (${backfillResult.rowCount ?? 0} rows).`);

    // 4. Seed default (v1) document templates
    console.log('\ud83d\udcc4  Seeding default document templates...');
    for (const seed of DOCUMENT_TEMPLATE_SEEDS) {
      const existingVersions = await documentTemplatesService.findVersions(
        seed.documentType,
        seed.language,
      );
      if (existingVersions.length > 0) {
        console.log(
          `\u2705 ${seed.documentType} (${seed.language}) already has versions. Skipping seed.`,
        );
        continue;
      }
      const created = await documentTemplatesService.create(
        {
          documentType: seed.documentType,
          language: seed.language,
          name: seed.name,
          htmlBody: seed.htmlBody,
          css: seed.css,
        },
        adminUserId!,
      );
      await documentTemplatesService.publish(created.id);
      console.log(
        `\u2705 Seeded and published v1 template for ${seed.documentType} (${seed.language}).`,
      );
    }
  } catch (error) {
    logger.error('Failed to initialize system', error);
  } finally {
    await app.close();
  }
}

bootstrap();
