import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
  UpdateBedOwnershipDto,
} from '../dto/update-bed-policies.dto';
import {
  BulkUpdateBedTrOnlyDto,
  BulkUpdateBedForeignerOnlyDto,
  BulkUpdateBedGuestZoneDto,
  BulkUpdateBedOwnershipDto,
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

@Injectable()
export class BedsService {
  constructor(
    private readonly bedsRepository: BedsRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly studentsRepository: StudentsRepository,
    @Inject(forwardRef(() => UndoService))
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
  ) {}

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

  async findAll(filters: FindAllBedsDto): Promise<PaginatedResult<Bed>> {
    return this.bedsRepository.findAll(filters);
  }

  async create(
    data: CreateBedDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Bed> {
    const operation = async (client: PoolClient) => {
      // Fetch room to copy initial state
      const room = await this.locationsRepository.findById(data.locationId, client);
      if (!room) {
        throw new NotFoundException(`Location with ID ${data.locationId} not found`);
      }

      try {
        const bed = await this.bedsRepository.create(
          {
            ...data,
            isTrOnly: data.isTrOnly ?? room.isTrOnly,
            isGuestZone: data.isGuestZone ?? room.isGuestZone,
            ownership: data.ownership ?? room.ownership,
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
      } catch (error: any) {
        throw error;
      }
    };

    if (externalClient) return operation(externalClient);

    return this.db.transaction(operation, context);
  }

  async findById(id: number): Promise<Bed> {
    const bed = await this.bedsRepository.findById(id);
    if (!bed) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }
    return bed;
  }

  async findByLocation(locationId: number): Promise<Bed[]> {
    return this.bedsRepository.findByLocation(locationId);
  }

  async update(id: number, data: UpdateBedDto, context: AuditUserContext): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const existing = await this.bedsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Bed with ID ${id} not found`);
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

  async delete(id: number, context: AuditUserContext): Promise<void> {
    return this.db.transaction(async (client) => {
      const existing = await this.bedsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Bed with ID ${id} not found`);
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
      const bed = await this.bedsRepository.findById(id, client);
      if (!bed) throw new NotFoundException(`Bed with ID ${id} not found`);

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
      const bed = await this.bedsRepository.findById(id, client);
      if (!bed) throw new NotFoundException(`Bed with ID ${id} not found`);

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

  async updateOwnership(id: number, ownership: any, context: AuditUserContext): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const bed = await this.bedsRepository.findById(id, client);
      if (!bed) throw new NotFoundException(`Bed with ID ${id} not found`);

      const updated = await this.bedsRepository.updateOwnership(id, ownership, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_BED_OWNERSHIP,
          entityType: 'bed',
          entityId: id.toString(),
          undoData: { previousOwnership: bed.ownership },
          description: `Updated ownership on bed ${bed.label}`,
        },
        client,
      );

      return updated;
    }, context);
  }

  async updateGuestZone(id: number, isGuestZone: boolean, context: AuditUserContext): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const bed = await this.bedsRepository.findById(id, client);
      if (!bed) throw new NotFoundException(`Bed with ID ${id} not found`);

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
      await this.bedsRepository.deleteMany(dto.ids, client);
    }, context);
  }

  async updateStatusMany(dto: BulkUpdateBedStatusDto, context: AuditUserContext): Promise<void> {
    return this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        const bed = await this.bedsRepository.findById(id, client);
        if (bed) {
          this.validateStatusTransition(bed.status, dto.status);
          await this.bedsRepository.updateStatus(id, dto.status, client);
        }
      }
    }, context);
  }

  async updateTrOnlyMany(dto: BulkUpdateBedTrOnlyDto, context: AuditUserContext): Promise<void> {
    return this.db.transaction(async (client) => {
      for (const id of dto.ids) {
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
        await this.bedsRepository.updateForeignerOnly(id, dto.isForeignerOnly, client);
      }
    }, context);
  }

  async updateOwnershipMany(
    dto: BulkUpdateBedOwnershipDto,
    context: AuditUserContext,
  ): Promise<void> {
    return this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        await this.bedsRepository.updateOwnership(id, dto.ownership, client);
      }
    }, context);
  }

  async updateGuestZoneMany(
    dto: BulkUpdateBedGuestZoneDto,
    context: AuditUserContext,
  ): Promise<void> {
    return this.db.transaction(async (client) => {
      for (const id of dto.ids) {
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
