import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { BedsRepository } from '../repositories/beds.repository';
import { LocationsRepository } from '../repositories/locations.repository';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { CreateBedDto } from '../dto/create-bed.dto';
import { UpdateBedDto } from '../dto/update-bed.dto';
import { BulkCreateBedDto, BulkDeleteBedDto, BulkUpdateBedStatusDto } from '../dto/bulk-bed.dto';
import {
  UpdateBedTrOnlyDto,
  UpdateBedForeignerOnlyDto,
  UpdateBedGuestZoneDto,
  UpdateBedIsRectorateDto,
} from '../dto/update-bed-policies.dto';
import {
  BulkUpdateBedTrOnlyDto,
  BulkUpdateBedForeignerOnlyDto,
  BulkUpdateBedGuestZoneDto,
  BulkUpdateBedIsRectorateDto,
} from '../dto/bulk-update-bed-policies.dto';
import { Bed } from '../entities/bed.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { FindAllBedsDto } from '../dto/find-all-beds.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { PoolClient } from 'pg';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { Inject, forwardRef } from '@nestjs/common';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { PERMISSIONS } from '../../../common/constants/permissions';

@Injectable()
export class BedsService {
  constructor(
    private readonly bedsRepository: BedsRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly studentsRepository: StudentsRepository,
    @Inject(forwardRef(() => UndoService))
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
    private readonly locationScopeService: LocationScopeService,
  ) {}

  private canAccessRectorate(context: AuditUserContext): boolean {
    return (
      context.isRecoveryAdmin === true ||
      context.permissions?.includes(PERMISSIONS.LOCATIONS_RECTORATE) === true
    );
  }

  // Fetches the bed's room and asserts the current staff member's location
  // scope covers it. Used before any single-bed read or mutation.
  private async assertBedInScope(
    bedId: number,
    context: AuditUserContext,
    client?: PoolClient,
  ): Promise<Bed> {
    const bed = await this.bedsRepository.findById(bedId, client);
    if (!bed) throw new NotFoundException(`Bed with ID ${bedId} not found`);

    if (!context.locationScope?.unrestricted) {
      const room = await this.locationsRepository.findById(bed.locationId, client);
      this.locationScopeService.assertAccess(context.locationScope, room?.treePath ?? '');
    }

    return bed;
  }

  private validateStatusTransition(current: BedStatus, next?: BedStatus) {
    if (!next || current === next) return;

    // RULE: Cannot change status FROM 'occupied' to anything else via general methods
    if (current === BedStatus.OCCUPIED) {
      throw new BadRequestException(
        'Cannot manually change status of an occupied bed. Use the check-out or undo process.',
      );
    }

    // RULE: Cannot change status TO 'occupied' via general methods
    if (next === BedStatus.OCCUPIED) {
      throw new BadRequestException(
        'Cannot manually change status to occupied. Occupancy is managed via bookings.',
      );
    }

    // Explicitly allow transitions only between AVAILABLE and MAINTENANCE
    const allowed = [BedStatus.AVAILABLE, BedStatus.MAINTENANCE];
    if (!allowed.includes(current) || !allowed.includes(next)) {
      throw new BadRequestException(`Invalid status transition from ${current} to ${next}`);
    }
  }

  async findAll(filters: FindAllBedsDto, context: AuditUserContext): Promise<PaginatedResult<Bed>> {
    const effectiveFilters = this.canAccessRectorate(context)
      ? filters
      : { ...filters, isRectorate: false };
    return this.bedsRepository.findAll(effectiveFilters, undefined, context.locationScope);
  }

  async create(
    data: CreateBedDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Bed> {
    if (data.isRectorate && !this.canAccessRectorate(context)) {
      throw new ForbiddenException('You do not have permission to create rectorate beds');
    }
    const operation = async (client: PoolClient) => {
      // Fetch room to copy initial state
      const room = await this.locationsRepository.findById(data.locationId, client);
      if (!room) {
        throw new NotFoundException(`Location with ID ${data.locationId} not found`);
      }
      this.locationScopeService.assertAccess(context.locationScope, room.treePath);

      const bed = await this.bedsRepository.create(
        {
          ...data,
          isTrOnly: data.isTrOnly ?? room.isTrOnly,
          isGuestZone: data.isGuestZone ?? room.isGuestZone,
          isRectorate: data.isRectorate ?? room.isRectorate,
        },
        client,
      );

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.CREATE_BED,
          entityType: 'bed',
          entityId: bed.id.toString(),
          undoData: {},
          description: `Created bed ${bed.label} in room ${room.name}`,
        },
        client,
      );

      return bed;
    };

    if (externalClient) return operation(externalClient);

    return this.db.transaction(operation, context);
  }

  async findById(id: number, context: AuditUserContext): Promise<Bed> {
    return this.assertBedInScope(id, context);
  }

  async findByLocation(locationId: number, context: AuditUserContext): Promise<Bed[]> {
    const location = await this.locationsRepository.findById(locationId);
    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }
    this.locationScopeService.assertAccess(context.locationScope, location.treePath);
    return this.bedsRepository.findByLocation(locationId);
  }

  async update(id: number, data: UpdateBedDto, context: AuditUserContext): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const existing = await this.assertBedInScope(id, context, client);

      if (
        data.isRectorate !== undefined &&
        data.isRectorate !== existing.isRectorate &&
        !this.canAccessRectorate(context)
      ) {
        throw new ForbiddenException('You do not have permission to modify the rectorate flag');
      }

      if (data.locationId !== undefined && data.locationId !== existing.locationId) {
        const targetRoom = await this.locationsRepository.findById(data.locationId, client);
        if (!targetRoom) {
          throw new NotFoundException(`Location with ID ${data.locationId} not found`);
        }
        this.locationScopeService.assertAccess(context.locationScope, targetRoom.treePath);
      }

      this.validateStatusTransition(existing.status, data.status);

      try {
        const updated = await this.bedsRepository.update(id, data, client);

        await this.undoService.registerUndo(
          {
            userId: context.userId,
            actionType: UndoActionType.UPDATE_BED,
            entityType: 'bed',
            entityId: id.toString(),
            undoData: existing,
            description: `Updated bed ${existing.label}`,
          },
          client,
        );

        return updated;
      } catch (error: any) {
        if (error.code === '23503') {
          // Foreign key violation
          throw new NotFoundException(`Location with ID ${data.locationId} not found`);
        }
        throw error;
      }
    }, context);
  }

  async delete(id: number, context: AuditUserContext, force = false): Promise<void> {
    return this.db.transaction(async (client) => {
      const existing = await this.assertBedInScope(id, context, client);

      // Guard: prevent deletion if it would leave the room below its room type's required bed count
      const capacityCheck = await client.query<{ capacity: number; bedCount: number }>(
        `SELECT rt.capacity, COUNT(b.id)::int AS "bedCount"
         FROM beds b
         JOIN locations l ON l.id = b.location_id AND l.deleted_at IS NULL
         JOIN room_types rt ON rt.id = l.room_type_id
         WHERE b.location_id = $1 AND b.deleted_at IS NULL
         GROUP BY rt.capacity`,
        [existing.locationId],
      );
      if (capacityCheck.rows[0]) {
        const { capacity, bedCount } = capacityCheck.rows[0];
        if (bedCount <= capacity) {
          const canForce =
            force && context.permissions?.includes(PERMISSIONS.LOCATIONS_UPDATE) === true;
          if (!canForce) {
            throw new ConflictException(
              `Cannot delete bed: the room requires ${capacity} bed(s) per its room type and currently has ${bedCount}. Use ?force=true with LOCATIONS_UPDATE permission to override.`,
            );
          }
        }
      }

      await this.bedsRepository.delete(id, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.DELETE_BED,
          entityType: 'bed',
          entityId: id.toString(),
          undoData: existing,
          description: `Deleted bed ${existing.label}`,
        },
        client,
      );
    }, context);
  }

  async updateTrOnly(id: number, isTrOnly: boolean, context: AuditUserContext): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const bed = await this.assertBedInScope(id, context, client);

      if (isTrOnly && bed.isForeignerOnly)
        throw new BadRequestException(
          'A bed cannot be both TR-only and Foreigner-only at the same time.',
        );

      const updated = await this.bedsRepository.updateTrOnly(id, isTrOnly, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_BED_TR_ONLY,
          entityType: 'bed',
          entityId: id.toString(),
          undoData: { previousTrOnly: bed.isTrOnly },
          description: `Updated TR-only status on bed ${bed.label}`,
        },
        client,
      );

      return updated;
    }, context);
  }

  async updateForeignerOnly(
    id: number,
    isForeignerOnly: boolean,
    context: AuditUserContext,
  ): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const bed = await this.assertBedInScope(id, context, client);

      if (isForeignerOnly && bed.isTrOnly)
        throw new BadRequestException(
          'A bed cannot be both TR-only and Foreigner-only at the same time.',
        );

      const updated = await this.bedsRepository.updateForeignerOnly(id, isForeignerOnly, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_BED_FOREIGNER_ONLY,
          entityType: 'bed',
          entityId: id.toString(),
          undoData: { previousForeignerOnly: bed.isForeignerOnly },
          description: `Updated Foreigner-only status on bed ${bed.label}`,
        },
        client,
      );

      return updated;
    }, context);
  }

  async updateIsRectorate(
    id: number,
    isRectorate: boolean,
    context: AuditUserContext,
  ): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const bed = await this.assertBedInScope(id, context, client);

      const updated = await this.bedsRepository.updateIsRectorate(id, isRectorate, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_BED_IS_RECTORATE,
          entityType: 'bed',
          entityId: id.toString(),
          undoData: { previousIsRectorate: bed.isRectorate },
          description: `Updated rectorate flag on bed ${bed.label}`,
        },
        client,
      );

      return updated;
    }, context);
  }

  async updateGuestZone(id: number, isGuestZone: boolean, context: AuditUserContext): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const bed = await this.assertBedInScope(id, context, client);

      const updated = await this.bedsRepository.updateGuestZone(id, isGuestZone, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_BED_GUEST_ZONE,
          entityType: 'bed',
          entityId: id.toString(),
          undoData: { previousGuestZone: bed.isGuestZone },
          description: `Updated guest zone on bed ${bed.label}`,
        },
        client,
      );

      return updated;
    }, context);
  }

  async createMany(dto: BulkCreateBedDto, context: AuditUserContext): Promise<Bed[]> {
    return this.db.transaction(async (client) => {
      const results: Bed[] = [];
      for (const bed of dto.beds) {
        results.push(await this.create(bed, context, client));
      }
      return results;
    }, context);
  }

  async deleteMany(dto: BulkDeleteBedDto, context: AuditUserContext): Promise<void> {
    return this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        await this.assertBedInScope(id, context, client);
      }
      await this.bedsRepository.deleteMany(dto.ids, client);
    }, context);
  }

  async updateStatusMany(dto: BulkUpdateBedStatusDto, context: AuditUserContext): Promise<void> {
    return this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        const bed = await this.assertBedInScope(id, context, client);
        this.validateStatusTransition(bed.status, dto.status);
        await this.bedsRepository.updateStatus(id, dto.status, client);
      }
    }, context);
  }

  async updateTrOnlyMany(dto: BulkUpdateBedTrOnlyDto, context: AuditUserContext): Promise<void> {
    return this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        const bed = await this.assertBedInScope(id, context, client);
        if (dto.isTrOnly && bed.isForeignerOnly)
          throw new BadRequestException(
            'A bed cannot be both TR-only and Foreigner-only at the same time.',
          );
        await this.bedsRepository.updateTrOnly(id, dto.isTrOnly, client);
      }
    }, context);
  }

  async updateForeignerOnlyMany(
    dto: BulkUpdateBedForeignerOnlyDto,
    context: AuditUserContext,
  ): Promise<void> {
    return this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        const bed = await this.assertBedInScope(id, context, client);
        if (dto.isForeignerOnly && bed.isTrOnly)
          throw new BadRequestException(
            'A bed cannot be both TR-only and Foreigner-only at the same time.',
          );
        await this.bedsRepository.updateForeignerOnly(id, dto.isForeignerOnly, client);
      }
    }, context);
  }

  async updateIsRectorateMany(
    dto: BulkUpdateBedIsRectorateDto,
    context: AuditUserContext,
  ): Promise<void> {
    return this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        await this.assertBedInScope(id, context, client);
        await this.bedsRepository.updateIsRectorate(id, dto.isRectorate, client);
      }
    }, context);
  }

  async updateGuestZoneMany(
    dto: BulkUpdateBedGuestZoneDto,
    context: AuditUserContext,
  ): Promise<void> {
    return this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        await this.assertBedInScope(id, context, client);
        await this.bedsRepository.updateGuestZone(id, dto.isGuestZone, client);
      }
    }, context);
  }

  async findEligibleBeds(studentId: string): Promise<Bed[]> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) throw new NotFoundException(`Student with ID ${studentId} not found`);

    return this.bedsRepository.findEligibleBeds({
      gender: student.gender,
      nationalityCode: student.nationalityCode,
    });
  }
}
