import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { LocationsRepository } from '../repositories/locations.repository';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import {
  BulkCreateLocationDto,
  BulkUpdateLocationDto,
  BulkDeleteLocationDto,
} from '../dto/bulk-location.dto';
import { Location } from '../entities/location.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { LocationType } from '../../../common/enums/location-type.enum';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PoolClient } from 'pg';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    private readonly locationsRepository: LocationsRepository,
    private readonly db: DatabaseService,
  ) {}

  // Internal helper to avoid nested transactions overhead if needed,
  // but for now reusing create is safer logic-wise.
  // We will modify create to accept an optional client to participate in external transaction.

  async create(
    data: CreateLocationDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Location> {
    const operation = async (client: PoolClient) => {
      const tempPath = 'temp';
      const created = await this.locationsRepository.create(
        { ...data, treePath: tempPath },
        client,
      );

      let treePath = created.id.toString();

      if (data.parentId) {
        const parent = await this.locationsRepository.findById(data.parentId, client);
        if (!parent) {
          throw new NotFoundException(`Parent location with ID ${data.parentId} not found`);
        }
        treePath = `${parent.treePath}.${treePath}`;
      }

      return this.locationsRepository.update(created.id, { treePath } as any, client);
    };

    if (externalClient) {
      return operation(externalClient);
    }

    this.logger.log({ data }, 'Creating new location');
    const location = await this.db.transaction(operation, context);
    this.logger.log({ locationId: location.id }, 'Location created successfully');
    return location;
  }

  async createMany(dto: BulkCreateLocationDto, context: AuditUserContext): Promise<Location[]> {
    this.logger.log({ count: dto.locations.length }, 'Bulk creating locations');
    return this.db.transaction(async (client) => {
      const results: Location[] = [];
      for (const loc of dto.locations) {
        results.push(await this.create(loc, context, client));
      }
      return results;
    }, context);
  }

  async updateMany(dto: BulkUpdateLocationDto, context: AuditUserContext): Promise<void> {
    this.logger.log({ count: dto.ids.length, data: dto.data }, 'Bulk updating locations');
    await this.db.transaction(async (client) => {
      await this.locationsRepository.updateMany(dto.ids, dto.data, client);
    }, context);
  }

  async deleteMany(dto: BulkDeleteLocationDto, context: AuditUserContext): Promise<void> {
    this.logger.log({ count: dto.ids.length }, 'Bulk deleting locations');
    await this.db.transaction(async (client) => {
      await this.locationsRepository.deleteMany(dto.ids, client);
    }, context);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Location>> {
    return this.locationsRepository.findAll(pagination);
  }

  async findById(id: number): Promise<Location> {
    const location = await this.locationsRepository.findById(id);
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  async findChildren(id: number): Promise<Location[]> {
    const exists = await this.locationsRepository.exists(id);
    if (!exists) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return this.locationsRepository.findChildren(id);
  }

  async findWithAncestors(id: number): Promise<Location[]> {
    const exists = await this.locationsRepository.exists(id);
    if (!exists) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return this.locationsRepository.findWithAncestors(id);
  }

  async search(query: string): Promise<Location[]> {
    return this.locationsRepository.searchByName(query);
  }

  async update(id: number, data: UpdateLocationDto, context: AuditUserContext): Promise<Location> {
    this.logger.log({ locationId: id, data }, 'Updating location');
    const location = await this.db.transaction(async (client) => {
      const location = await this.locationsRepository.findById(id, client);
      if (!location) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }

      return this.locationsRepository.update(id, data, client);
    }, context);
    this.logger.log({ locationId: id }, 'Location updated successfully');
    return location;
  }

  async delete(id: number, context: AuditUserContext): Promise<void> {
    this.logger.log({ locationId: id }, 'Deleting location');
    await this.db.transaction(async (client) => {
      const exists = await this.locationsRepository.exists(id, client);
      if (!exists) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }
      await this.locationsRepository.delete(id, client);
    }, context);
    this.logger.log({ locationId: id }, 'Location deleted successfully');
  }
}
