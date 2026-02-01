import { Injectable, NotFoundException } from '@nestjs/common';
import { BedsRepository } from '../repositories/beds.repository';
import { CreateBedDto } from '../dto/create-bed.dto';
import { UpdateBedDto } from '../dto/update-bed.dto';
import { BulkCreateBedDto, BulkDeleteBedDto, BulkUpdateBedStatusDto } from '../dto/bulk-bed.dto';
import {
  UpdateBedTrOnlyDto,
  UpdateBedGuestZoneDto,
  UpdateBedOwnershipDto,
} from '../dto/update-bed-policies.dto';
import {
  BulkUpdateBedTrOnlyDto,
  BulkUpdateBedGuestZoneDto,
  BulkUpdateBedOwnershipDto,
} from '../dto/bulk-update-bed-policies.dto';
import { Bed } from '../entities/bed.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { PoolClient } from 'pg';

@Injectable()
export class BedsService {
  constructor(
    private readonly bedsRepository: BedsRepository,
    private readonly db: DatabaseService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters?: { locationId?: number; status?: BedStatus },
  ): Promise<PaginatedResult<Bed>> {
    return this.bedsRepository.findAll(pagination, filters);
  }

  async create(
    data: CreateBedDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Bed> {
    const operation = async (client: PoolClient) => {
      try {
        return await this.bedsRepository.create(data, client);
      } catch (error: any) {
        if (error.code === '23503') {
          throw new NotFoundException(`Location with ID ${data.locationId} not found`);
        }
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
      const bed = await this.bedsRepository.findById(id, client);
      if (!bed) {
        throw new NotFoundException(`Bed with ID ${id} not found`);
      }

      try {
        return await this.bedsRepository.update(id, data, client);
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
      const bed = await this.bedsRepository.findById(id, client);
      if (!bed) {
        throw new NotFoundException(`Bed with ID ${id} not found`);
      }
      await this.bedsRepository.delete(id, client);
    }, context);
  }

  async updateTrOnly(id: number, isTrOnly: boolean, context: AuditUserContext): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const bed = await this.bedsRepository.findById(id, client);
      if (!bed) throw new NotFoundException(`Bed with ID ${id} not found`);
      return this.bedsRepository.updateTrOnly(id, isTrOnly, client);
    }, context);
  }

  async updateOwnership(id: number, ownership: any, context: AuditUserContext): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const bed = await this.bedsRepository.findById(id, client);
      if (!bed) throw new NotFoundException(`Bed with ID ${id} not found`);
      return this.bedsRepository.updateOwnership(id, ownership, client);
    }, context);
  }

  async updateGuestZone(id: number, isGuestZone: boolean, context: AuditUserContext): Promise<Bed> {
    return this.db.transaction(async (client) => {
      const bed = await this.bedsRepository.findById(id, client);
      if (!bed) throw new NotFoundException(`Bed with ID ${id} not found`);
      return this.bedsRepository.updateGuestZone(id, isGuestZone, client);
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
        await this.bedsRepository.updateStatus(id, dto.status, client);
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
}
