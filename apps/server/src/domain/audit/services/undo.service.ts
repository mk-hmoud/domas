import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { UndoRepository } from '../repositories/undo.repository';
import { UsersRepository } from '../../users/repositories/users.repository';
import { DatabaseService } from '../../../core/database/database.service';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { UndoLog } from '../entities/undo-log.entity';
import { PoolClient } from 'pg';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles';

@Injectable()
export class UndoService {
  private readonly logger = new Logger(UndoService.name);

  constructor(
    private readonly undoRepository: UndoRepository,
    private readonly usersRepository: UsersRepository,
    private readonly db: DatabaseService,
  ) {}

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  async registerUndo(data: Partial<UndoLog>, client?: PoolClient): Promise<UndoLog> {
    return this.undoRepository.create(data, client);
  }

  async findLatest(context: AuditUserContext): Promise<UndoLog[]> {
    const isAdminRole = context.roles?.some((r) => r.name === SYSTEM_ROLES.ADMIN);
    const hasUndoAllPerm = context.permissions?.includes(PERMISSIONS.UNDO_ALL);

    // 1. Recovery Admin: Sees everything
    if (context.isRecoveryAdmin) {
      return this.undoRepository.findAllRecent(10, {
        excludeRecovery: false,
        excludeAdmins: false,
      });
    }

    // 2. Admin Role: Sees everything except Recovery Admin logs
    if (isAdminRole) {
      return this.undoRepository.findAllRecent(10, {
        excludeRecovery: true,
        excludeAdmins: false,
      });
    }

    // 3. User with undo.all (but no Admin role): Sees everything except Recovery Admin and Admin role logs
    if (hasUndoAllPerm) {
      return this.undoRepository.findAllRecent(10, {
        excludeRecovery: true,
        excludeAdmins: true,
      });
    }

    // 4. Regular Users: See only their own logs
    return this.undoRepository.findLatestForUser(context.userId);
  }

  async undo(id: string, context: AuditUserContext): Promise<void> {
    const log = await this.undoRepository.findById(id);
    if (!log) throw new NotFoundException('Undo log not found');
    if (log.undoneAt) throw new BadRequestException('This action has already been undone');
    if (new Date(log.expiresAt) < new Date())
      throw new BadRequestException('Undo period has expired');

    // CHECK PERMISSIONS
    const canUndo = await this.canUserUndo(log, context);
    if (!canUndo.allowed) {
      throw new ForbiddenException(canUndo.reason);
    }

    this.logger.log(
      { auditId: id, action: log.actionType, entity: log.entityType },
      'Performing undo',
    );

    await this.db.transaction(async (client) => {
      // 1. Perform Reversion
      await this.executeReversion(log, context.userId, client);

      // 2. Mark as Undone
      await this.undoRepository.markAsUndone(id, context.userId, client);
    }, context);
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private async canUserUndo(
    log: UndoLog,
    context: AuditUserContext,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const isRequestingAdmin =
      context.isRecoveryAdmin || context.roles?.some((r) => r.name === SYSTEM_ROLES.ADMIN);
    const hasUndoAll = isRequestingAdmin || context.permissions?.includes(PERMISSIONS.UNDO_ALL);
    const hasUndoOwn = context.permissions?.includes(PERMISSIONS.UNDO_OWN);

    // 1. Own Action
    if (log.userId === context.userId) {
      if (hasUndoOwn || hasUndoAll) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'You do not have permission to undo your own actions.' };
    }

    // 2. Undo All (with restrictions)
    if (hasUndoAll) {
      const logOwner = await this.usersRepository.findById(log.userId);
      if (!logOwner) return { allowed: false, reason: 'Original user not found' };

      // Protection: Cannot undo actions of Recovery Admin or Admin
      if (logOwner.isRecoveryAdmin) {
        return { allowed: false, reason: 'Cannot undo actions performed by Recovery Admin.' };
      }

      if (logOwner.roles?.some((r) => r.name === SYSTEM_ROLES.ADMIN)) {
        return { allowed: false, reason: 'Cannot undo actions performed by an Administrator.' };
      }

      return { allowed: true };
    }

    return { allowed: false, reason: 'Permission denied.' };
  }

  private async executeReversion(
    log: UndoLog,
    undoUserId: string,
    client: PoolClient,
  ): Promise<void> {
    switch (log.actionType) {
      // Locations
      case UndoActionType.CREATE_LOCATION:
        return this.undoCreateLocation(log, client);
      case UndoActionType.UPDATE_LOCATION:
        return this.undoUpdateLocation(log, client);
      case UndoActionType.DELETE_LOCATION:
        return this.undoDeleteLocation(log, client);
      case UndoActionType.UPDATE_GENDER_LOCK:
        return this.undoUpdateGenderLock(log, client);
      case UndoActionType.UPDATE_GUEST_ZONE:
        return this.undoUpdateGuestZone(log, client);
      case UndoActionType.UPDATE_TR_ONLY:
        return this.undoUpdateTrOnly(log, client);
      case UndoActionType.UPDATE_OWNERSHIP:
        return this.undoUpdateOwnership(log, client);

      // Beds
      case UndoActionType.CREATE_BED:
        return this.undoCreateBed(log, client);
      case UndoActionType.DELETE_BED:
        return this.undoDeleteBed(log, client);
      case UndoActionType.UPDATE_BED_STATUS:
        return this.undoUpdateBedStatus(log, client);

      // Students
      case UndoActionType.DELETE_STUDENT:
        return this.undoDeleteStudent(log, client);

      case UndoActionType.UPDATE_STUDENT:
        return this.undoUpdateStudent(log, client);

      // Users
      case UndoActionType.DELETE_USER:
        return this.undoDeleteUser(log, client);

      case UndoActionType.UPDATE_USER:
        return this.undoUpdateUser(log, client);

      // Access
      case UndoActionType.ASSIGN_ROLE:
        return this.undoAssignRole(log, client);
      case UndoActionType.REVOKE_ROLE:
        return this.undoRevokeRole(log, client);

      // Semesters
      case UndoActionType.CREATE_SEMESTER:
        return this.undoCreateSemester(log, client);
      case UndoActionType.DELETE_SEMESTER:
        return this.undoDeleteSemester(log, client);
      case UndoActionType.UPDATE_SEMESTER:
        return this.undoUpdateSemester(log, client);
      case UndoActionType.UPDATE_SEMESTER_STATUS:
        return this.undoUpdateSemesterStatus(log, client);

      // Bookings
      case UndoActionType.CREATE_BOOKING:
        return this.undoCreateBooking(log, client);
      case UndoActionType.UPDATE_BOOKING:
        return this.undoUpdateBooking(log, client);
      case UndoActionType.CANCEL_BOOKING:
        return this.undoCancelBooking(log, client);
      case UndoActionType.CHECK_IN_BOOKING:
        return this.undoCheckInBooking(log, undoUserId, client);
      case UndoActionType.APPROVE_BOOKING_FINANCIALS:
        return this.undoApproveBookingFinancials(log, client);
      case UndoActionType.REJECT_BOOKING:
        return this.undoRejectBooking(log, client);

      // Inventory Catalog
      case UndoActionType.CREATE_INVENTORY_CATALOG:
        return this.undoCreateInventoryCatalog(log, client);
      case UndoActionType.UPDATE_INVENTORY_CATALOG:
        return this.undoUpdateInventoryCatalog(log, client);
      case UndoActionType.DELETE_INVENTORY_CATALOG:
        return this.undoDeleteInventoryCatalog(log, client);

      // Inventory Assignments
      case UndoActionType.CREATE_INVENTORY_ASSIGNMENT:
        return this.undoCreateInventoryAssignment(log, client);
      case UndoActionType.UPDATE_INVENTORY_ASSIGNMENT:
        return this.undoUpdateInventoryAssignment(log, client);
      case UndoActionType.DELETE_INVENTORY_ASSIGNMENT:
        return this.undoDeleteInventoryAssignment(log, client);

      // Access Cards
      case UndoActionType.CREATE_CARD_BATCH:
        return this.undoCreateCardBatch(log, client);
      case UndoActionType.ISSUE_CARD:
        return this.undoIssueCard(log, undoUserId, client);
      case UndoActionType.RETURN_CARD:
        return this.undoReturnCard(log, undoUserId, client);

      default:
        throw new BadRequestException(`Unsupported undo action: ${log.actionType}`);
    }
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  // ===========================================================================
  // Location Handlers
  // ===========================================================================

  private async undoCreateLocation(log: UndoLog, client: PoolClient): Promise<void> {
    const locationId = parseInt(log.entityId, 10);
    const exists = await client.query('SELECT 1 FROM locations WHERE id = $1', [locationId]);
    if (exists.rowCount === 0) throw new BadRequestException('Location does not exist');
    await client.query('UPDATE locations SET deleted_at = NOW() WHERE id = $1', [locationId]);
  }

  private async undoDeleteLocation(log: UndoLog, client: PoolClient): Promise<void> {
    const locationId = parseInt(log.entityId, 10);
    const location = await client.query(
      'SELECT id, tree_path, deleted_at FROM locations WHERE id = $1',
      [locationId],
    );
    if (location.rowCount === 0) throw new BadRequestException('Location does not exist');
    if (!location.rows[0].deleted_at) throw new BadRequestException('Location is not deleted');

    const treePath = location.rows[0].tree_path;
    if (treePath.includes('.')) {
      const parentPath = treePath.substring(0, treePath.lastIndexOf('.'));
      const parent = await client.query(
        'SELECT 1 FROM locations WHERE tree_path = $1 AND deleted_at IS NULL',
        [parentPath],
      );
      if (parent.rowCount === 0)
        throw new BadRequestException('Cannot restore: parent location is deleted or missing');
    }

    await client.query('UPDATE locations SET deleted_at = NULL WHERE id = $1', [locationId]);
  }

  private async undoUpdateLocation(log: UndoLog, client: PoolClient): Promise<void> {
    const locationId = parseInt(log.entityId, 10);
    const data = log.undoData;

    const allowedFields = {
      name: 'name',
      type: 'type',
      basePrice: 'base_price',
    };

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [camelKey, snakeKey] of Object.entries(allowedFields)) {
      if (data[camelKey] !== undefined) {
        updates.push(`${snakeKey} = $${paramIndex++}`);
        values.push(data[camelKey]);
      }
    }

    if (updates.length === 0) return;

    values.push(locationId);
    const query = `
      UPDATE locations 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND deleted_at IS NULL
    `;

    const res = await client.query(query, values);
    if (res.rowCount === 0) throw new BadRequestException('Location not found or is deleted');
  }

  private async undoUpdateGenderLock(log: UndoLog, client: PoolClient): Promise<void> {
    const { previousGenderLock, affectedLocations } = log.undoData;
    const locationId = parseInt(log.entityId, 10);

    await client.query(
      `UPDATE locations SET gender_lock = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`,
      [previousGenderLock, locationId],
    );

    if (affectedLocations && affectedLocations.length > 0) {
      for (const loc of affectedLocations) {
        await client.query(
          `UPDATE locations SET gender_lock = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`,
          [loc.previousGenderLock, loc.id],
        );
      }
    }
  }

  private async undoUpdateGuestZone(log: UndoLog, client: PoolClient): Promise<void> {
    const { previousGuestZone, affectedLocations } = log.undoData;
    const locationId = parseInt(log.entityId, 10);

    await client.query(
      `UPDATE locations SET is_guest_zone = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`,
      [previousGuestZone, locationId],
    );

    if (affectedLocations) {
      for (const loc of affectedLocations) {
        await client.query(
          `UPDATE locations SET is_guest_zone = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`,
          [loc.previousGuestZone, loc.id],
        );
      }
    }
  }

  private async undoUpdateTrOnly(log: UndoLog, client: PoolClient): Promise<void> {
    const { previousTrOnly, affectedLocations } = log.undoData;
    const locationId = parseInt(log.entityId, 10);

    await client.query(
      `UPDATE locations SET is_tr_only = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`,
      [previousTrOnly, locationId],
    );

    if (affectedLocations) {
      for (const loc of affectedLocations) {
        await client.query(
          `UPDATE locations SET is_tr_only = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`,
          [loc.previousTrOnly, loc.id],
        );
      }
    }
  }

  private async undoUpdateOwnership(log: UndoLog, client: PoolClient): Promise<void> {
    const { previousOwnership, affectedLocations } = log.undoData;
    const locationId = parseInt(log.entityId, 10);

    await client.query(
      `UPDATE locations SET ownership = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`,
      [previousOwnership, locationId],
    );

    if (affectedLocations) {
      for (const loc of affectedLocations) {
        await client.query(
          `UPDATE locations SET ownership = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`,
          [loc.previousOwnership, loc.id],
        );
      }
    }
  }

  // ===========================================================================
  // Bed Handlers
  // ===========================================================================

  private async undoCreateBed(log: UndoLog, client: PoolClient): Promise<void> {
    const bedId = parseInt(log.entityId, 10);
    await client.query('UPDATE beds SET deleted_at = NOW() WHERE id = $1', [bedId]);
  }

  private async undoDeleteBed(log: UndoLog, client: PoolClient): Promise<void> {
    const bedId = parseInt(log.entityId, 10);
    const bed = await client.query('SELECT id, location_id, deleted_at FROM beds WHERE id = $1', [
      bedId,
    ]);
    if (bed.rowCount === 0) throw new BadRequestException('Bed does not exist');
    if (!bed.rows[0].deleted_at) throw new BadRequestException('Bed is not deleted');

    const locationId = bed.rows[0].location_id;
    const loc = await client.query('SELECT 1 FROM locations WHERE id = $1 AND deleted_at IS NULL', [
      locationId,
    ]);
    if (loc.rowCount === 0)
      throw new BadRequestException('Cannot restore bed: parent location is deleted');

    await client.query('UPDATE beds SET deleted_at = NULL WHERE id = $1', [bedId]);
  }

  private async undoUpdateBedStatus(log: UndoLog, client: PoolClient): Promise<void> {
    const { previousStatus } = log.undoData;
    const bedId = parseInt(log.entityId, 10);
    const res = await client.query(
      'UPDATE beds SET status = $1 WHERE id = $2 AND deleted_at IS NULL',
      [previousStatus, bedId],
    );
    if (res.rowCount === 0) throw new BadRequestException('Bed not found or is deleted');
  }

  // ===========================================================================
  // Student Handlers
  // ===========================================================================

  private async undoDeleteStudent(log: UndoLog, client: PoolClient): Promise<void> {
    const studentId = log.entityId; // UUID
    const student = await client.query('SELECT id, deleted_at FROM students WHERE id = $1', [
      studentId,
    ]);

    if (student.rowCount === 0) throw new BadRequestException('Student does not exist');
    if (!student.rows[0].deleted_at) throw new BadRequestException('Student is not deleted');

    await client.query('UPDATE students SET deleted_at = NULL WHERE id = $1', [studentId]);
  }

  private async undoUpdateStudent(log: UndoLog, client: PoolClient): Promise<void> {
    const studentId = log.entityId;
    const data = log.undoData;

    const allowedFields = {
      firstName: 'first_name',
      lastName: 'last_name',
      studentNumber: 'student_number',
      gender: 'gender',
      nationalityCode: 'nationality_code',
      nationalId: 'national_id',
      birthDate: 'birth_date',
      birthPlace: 'birth_place',
      department: 'department',
      email: 'email',
      phoneNumber: 'phone_number',
      isActive: 'is_active',
    };

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [camelKey, snakeKey] of Object.entries(allowedFields)) {
      if (data[camelKey] !== undefined) {
        updates.push(`${snakeKey} = $${paramIndex++}`);
        values.push(data[camelKey]);
      }
    }

    if (updates.length === 0) return;

    values.push(studentId);
    const res = await client.query(
      `UPDATE students SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
      values,
    );
    if (res.rowCount === 0) throw new BadRequestException('Student not found or is deleted');
  }

  // ===========================================================================
  // User Handlers
  // ===========================================================================

  private async undoDeleteUser(log: UndoLog, client: PoolClient): Promise<void> {
    const userId = log.entityId; // UUID
    const user = await client.query('SELECT id, deleted_at FROM users WHERE id = $1', [userId]);

    if (user.rowCount === 0) throw new BadRequestException('User does not exist');
    if (!user.rows[0].deleted_at) throw new BadRequestException('User is not deleted');

    await client.query('UPDATE users SET deleted_at = NULL WHERE id = $1', [userId]);
  }

  private async undoUpdateUser(log: UndoLog, client: PoolClient): Promise<void> {
    const userId = log.entityId;
    const data = log.undoData;

    const allowedFields = {
      email: 'email',
      firstName: 'first_name',
      lastName: 'last_name',
      phoneNumber: 'phone_number',
      isActive: 'is_active',
    };

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [camelKey, snakeKey] of Object.entries(allowedFields)) {
      if (data[camelKey] !== undefined) {
        updates.push(`${snakeKey} = $${paramIndex++}`);
        values.push(data[camelKey]);
      }
    }

    if (updates.length === 0) return;

    values.push(userId);
    const res = await client.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
      values,
    );
    if (res.rowCount === 0) throw new BadRequestException('User not found or is deleted');
  }

  // ===========================================================================
  // Access Handlers (Roles)
  // ===========================================================================

  private async undoAssignRole(log: UndoLog, client: PoolClient): Promise<void> {
    const userId = log.entityId;
    const { roleId } = log.undoData;
    await client.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [
      userId,
      roleId,
    ]);
  }

  private async undoRevokeRole(log: UndoLog, client: PoolClient): Promise<void> {
    const userId = log.entityId;
    const { roleId } = log.undoData;
    await client.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, roleId],
    );
  }

  // ===========================================================================
  // Semester Handlers
  // ===========================================================================

  private async undoCreateSemester(log: UndoLog, client: PoolClient): Promise<void> {
    const semesterId = parseInt(log.entityId, 10);
    // Assuming hard delete for clean undo of creation
    await client.query('DELETE FROM semesters WHERE id = $1', [semesterId]);
  }

  private async undoDeleteSemester(log: UndoLog, client: PoolClient): Promise<void> {
    const semesterId = parseInt(log.entityId, 10);
    const { id, createdAt, updatedAt, ...data } = log.undoData;

    const keys = Object.keys(data);
    keys.forEach((key) => {
      if (!/^[a-zA-Z0-9_]+$/.test(key)) {
        throw new BadRequestException(`Invalid column name in undo data: ${key}`);
      }
    });

    const columns = keys.map((k) => `"${this.camelToSnake(k)}"`).join(', ');
    const values = keys.map((k) => data[k]);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    await client.query(
      `INSERT INTO semesters (id, ${columns}) VALUES (${semesterId}, ${placeholders})`,
      values,
    );
  }

  private async undoUpdateSemester(log: UndoLog, client: PoolClient): Promise<void> {
    const id = parseInt(log.entityId, 10);
    const data = log.undoData;

    const allowedFields = {
      type: 'type',
      academicYear: 'academic_year',
      displayName: 'display_name',
      startDate: 'start_date',
      endDate: 'end_date',
      bookingStartDate: 'booking_start_date',
      bookingEndDate: 'booking_end_date',
      depositAmountTry: 'deposit_amount_try',
      depositAmountForeign: 'deposit_amount_foreign',
      foreignCurrencyCode: 'foreign_currency_code',
      paymentDeadlineDate: 'payment_deadline_date',
      status: 'status',
      autoActivate: 'auto_activate',
      autoClose: 'auto_close',
    };

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [camelKey, snakeKey] of Object.entries(allowedFields)) {
      if (data[camelKey] !== undefined) {
        updates.push(`${snakeKey} = $${paramIndex++}`);
        values.push(data[camelKey]);
      }
    }

    if (updates.length === 0) return;

    values.push(id);
    const res = await client.query(
      `UPDATE semesters SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
      values,
    );
    if (res.rowCount === 0) throw new BadRequestException('Semester not found');
  }

  private async undoUpdateSemesterStatus(log: UndoLog, client: PoolClient): Promise<void> {
    const { previousStatus } = log.undoData;
    const id = parseInt(log.entityId, 10);
    const res = await client.query('UPDATE semesters SET status = $1 WHERE id = $2', [
      previousStatus,
      id,
    ]);
    if (res.rowCount === 0) throw new BadRequestException('Semester not found');
  }

  // ===========================================================================
  // Booking Handlers
  // ===========================================================================

  private async undoCreateBooking(log: UndoLog, client: PoolClient): Promise<void> {
    const bookingId = log.entityId;
    await client.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
  }

  private async undoUpdateBooking(log: UndoLog, client: PoolClient): Promise<void> {
    const id = log.entityId;
    const data = log.undoData;

    const allowedFields = {
      startDate: 'start_date',
      endDate: 'end_date',
      status: 'status',
      paymentStatus: 'payment_status',
      isAccountingApproved: 'is_accounting_approved',
      checkedInAt: 'checked_in_at',
      checkedOutAt: 'checked_out_at',
      contractSigned: 'contract_signed',
      contractUrl: 'contract_url',
    };

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [camelKey, snakeKey] of Object.entries(allowedFields)) {
      if (data[camelKey] !== undefined) {
        updates.push(`${snakeKey} = $${paramIndex++}`);
        values.push(data[camelKey]);
      }
    }

    if (updates.length === 0) return;

    values.push(id);
    const res = await client.query(
      `UPDATE bookings SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
      values,
    );
    if (res.rowCount === 0) throw new BadRequestException('Booking not found');
  }

  private async undoCancelBooking(log: UndoLog, client: PoolClient): Promise<void> {
    const { previousStatus } = log.undoData;
    const bookingId = log.entityId;
    await client.query('UPDATE bookings SET status = $1 WHERE id = $2', [
      previousStatus,
      bookingId,
    ]);
  }

  private async undoCheckInBooking(
    log: UndoLog,
    undoUserId: string,
    client: PoolClient,
  ): Promise<void> {
    const { previousStatus, previousCheckInDate } = log.undoData;
    const bookingId = log.entityId;

    // 1. Revert Booking Status
    await client.query('UPDATE bookings SET status = $1, checked_in_at = $2 WHERE id = $3', [
      previousStatus,
      previousCheckInDate,
      bookingId,
    ]);

    // 2. CLEANUP: Delete the inventory snapshots generated during check-in
    await client.query('DELETE FROM booking_inventory_snapshots WHERE booking_id = $1', [
      bookingId,
    ]);

    // 3. CARD REVERSION: If a card was issued during this check-in, return it to the pool
    // We look for any active card assigned to this booking and return it.
    const cardRes = await client.query(
      `UPDATE access_cards 
       SET status = 'available', 
           current_holder_id = NULL, 
           current_booking_id = NULL, 
           returned_at = NOW(),
           updated_at = NOW()
       WHERE current_booking_id = $1 AND status = 'active'
       RETURNING id, current_holder_id`,
      [bookingId],
    );

    if (cardRes.rows.length > 0) {
      for (const card of cardRes.rows) {
        await client.query(
          `INSERT INTO access_card_logs (card_id, student_id, booking_id, action_type, performed_by, notes)
           VALUES ($1, $2, $3, 'reversed', $4, $5)`,
          [
            card.id,
            card.current_holder_id,
            bookingId,
            undoUserId,
            'Undo: Check-in reversed, card auto-returned',
          ],
        );
      }
    }
  }

  private async undoApproveBookingFinancials(log: UndoLog, client: PoolClient): Promise<void> {
    const { previousStatus, previousPaymentStatus, previousIsAccountingApproved } = log.undoData;
    const bookingId = log.entityId;
    await client.query(
      'UPDATE bookings SET status = $1, payment_status = $2, is_accounting_approved = $3, accounting_approved_at = NULL, accounting_approved_by = NULL WHERE id = $4',
      [previousStatus, previousPaymentStatus, previousIsAccountingApproved, bookingId],
    );
  }

  private async undoRejectBooking(log: UndoLog, client: PoolClient): Promise<void> {
    const { previousStatus } = log.undoData;
    const bookingId = log.entityId;
    await client.query('UPDATE bookings SET status = $1 WHERE id = $2', [
      previousStatus,
      bookingId,
    ]);
  }

  // ===========================================================================
  // Inventory Handlers
  // ===========================================================================

  private async undoCreateInventoryCatalog(log: UndoLog, client: PoolClient): Promise<void> {
    const id = parseInt(log.entityId, 10);
    await client.query('UPDATE inventory_catalog SET deleted_at = NOW() WHERE id = $1', [id]);
  }

  private async undoDeleteInventoryCatalog(log: UndoLog, client: PoolClient): Promise<void> {
    const id = parseInt(log.entityId, 10);
    await client.query('UPDATE inventory_catalog SET deleted_at = NULL WHERE id = $1', [id]);
  }

  private async undoUpdateInventoryCatalog(log: UndoLog, client: PoolClient): Promise<void> {
    const id = parseInt(log.entityId, 10);
    const data = log.undoData;

    const allowedFields = {
      nameTr: 'name_tr',
      nameEn: 'name_en',
      descriptionTr: 'description_tr',
      descriptionEn: 'description_en',
      scope: 'scope',
      basePriceTry: 'base_price_try',
      basePriceForeign: 'base_price_foreign',
      foreignCurrencyCode: 'foreign_currency_code',
      isActive: 'is_active',
      isOptional: 'is_optional',
    };

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [camelKey, snakeKey] of Object.entries(allowedFields)) {
      if (data[camelKey] !== undefined) {
        updates.push(`${snakeKey} = $${paramIndex++}`);
        values.push(data[camelKey]);
      }
    }

    if (updates.length === 0) return;

    values.push(id);
    const res = await client.query(
      `UPDATE inventory_catalog SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
      values,
    );
    if (res.rowCount === 0) throw new BadRequestException('Catalog item not found');
  }

  private async undoCreateInventoryAssignment(log: UndoLog, client: PoolClient): Promise<void> {
    const id = log.entityId;
    await client.query('DELETE FROM inventory_assignments WHERE id = $1', [id]);
  }

  private async undoDeleteInventoryAssignment(log: UndoLog, client: PoolClient): Promise<void> {
    const id = log.entityId;
    const { catalog_id, location_id, bed_id, quantity, notes } = log.undoData;
    await client.query(
      `INSERT INTO inventory_assignments (id, catalog_id, location_id, bed_id, quantity, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, catalog_id, location_id, bed_id, quantity, notes],
    );
  }

  private async undoUpdateInventoryAssignment(log: UndoLog, client: PoolClient): Promise<void> {
    const id = log.entityId;
    const { quantity, notes } = log.undoData;
    await client.query(
      'UPDATE inventory_assignments SET quantity = $1, notes = $2, updated_at = NOW() WHERE id = $3',
      [quantity, notes, id],
    );
  }

  // ===========================================================================
  // Access Card Handlers
  // ===========================================================================

  private async undoCreateCardBatch(log: UndoLog, client: PoolClient): Promise<void> {
    const batchId = parseInt(log.entityId, 10);
    // Deleting a batch also deletes its cards due to ON DELETE CASCADE
    await client.query('DELETE FROM card_batches WHERE id = $1', [batchId]);
  }

  private async undoIssueCard(log: UndoLog, undoUserId: string, client: PoolClient): Promise<void> {
    const cardId = parseInt(log.entityId, 10);
    const { studentId, bookingId } = log.undoData;

    // 1. Revert card to available
    await client.query(
      `UPDATE access_cards 
       SET status = 'available', 
           current_holder_id = NULL, 
           current_booking_id = NULL, 
           issued_at = NULL,
           issued_by = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [cardId],
    );

    // 2. Add history log for reversal
    await client.query(
      `INSERT INTO access_card_logs (card_id, student_id, booking_id, action_type, performed_by, notes)
       VALUES ($1, $2, $3, 'reversed', $4, $5)`,
      [cardId, studentId, bookingId, undoUserId, 'Undo: Card issuance reversed'],
    );
  }

  private async undoReturnCard(
    log: UndoLog,
    undoUserId: string,
    client: PoolClient,
  ): Promise<void> {
    const cardId = parseInt(log.entityId, 10);
    const { previousStatus, previousHolderId, previousBookingId } = log.undoData;

    // 1. Restore previous issued state
    await client.query(
      `UPDATE access_cards 
       SET status = $1, 
           current_holder_id = $2, 
           current_booking_id = $3, 
           returned_at = NULL,
           updated_at = NOW()
       WHERE id = $4`,
      [previousStatus, previousHolderId, previousBookingId, cardId],
    );

    // 2. Add history log for reversal
    await client.query(
      `INSERT INTO access_card_logs (card_id, student_id, booking_id, action_type, performed_by, notes)
       VALUES ($1, $2, $3, 'reversed', $4, $5)`,
      [cardId, previousHolderId, previousBookingId, undoUserId, 'Undo: Card return reversed'],
    );
  }
}
