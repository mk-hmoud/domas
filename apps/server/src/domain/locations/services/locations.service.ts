import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { LocationsRepository } from '../repositories/locations.repository';
import { BedsRepository } from '../repositories/beds.repository';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import {
  BulkCreateLocationDto,
  BulkUpdateLocationDto,
  BulkDeleteLocationDto,
} from '../dto/bulk-location.dto';
import { CreateRoomWithBedsDto, BulkCreateRoomWithBedsDto } from '../dto/create-room-with-beds.dto';
import {
  BulkUpdateGenderLockDto,
  BulkUpdateGuestZoneDto,
  BulkUpdateTrOnlyDto,
  BulkUpdateOwnershipDto,
} from '../dto/bulk-update-policies.dto';
import { Location } from '../entities/location.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { LocationType } from '../../../common/enums/location-type.enum';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PoolClient } from 'pg';
import { BedStatus } from '../../../common/enums/bed-status.enum';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    private readonly locationsRepository: LocationsRepository,
    private readonly bedsRepository: BedsRepository,
    private readonly db: DatabaseService,
  ) {}

  // ... (existing create helper)

  // ... (existing methods)

  async createRoomWithBeds(
    dto: CreateRoomWithBedsDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Location> {
    const operation = async (client: PoolClient) => {
      // 1. Create Room (Location)
      const room = await this.create(dto, context, client);

      // 2. Create Beds
      const bedPromises = [];
      for (let i = 1; i <= dto.bedCount; i++) {
        // Generate label: "A", "B", "C"... or "1", "2", "3"
        // Using Letters A-Z for now
        const label = String.fromCharCode(64 + i);
        bedPromises.push(
          this.bedsRepository.create(
            {
              locationId: room.id,
              label: label,
              status: BedStatus.AVAILABLE,
            },
            client,
          ),
        );
      }
      await Promise.all(bedPromises);
      return room;
    };

    if (externalClient) return operation(externalClient);

    this.logger.log({ room: dto.name, bedCount: dto.bedCount }, 'Creating room with beds');
    return this.db.transaction(operation, context);
  }

  async createRoomsWithBedsMany(
    dto: BulkCreateRoomWithBedsDto,
    context: AuditUserContext,
  ): Promise<Location[]> {
    this.logger.log({ count: dto.rooms.length }, 'Bulk creating rooms with beds');
    return this.db.transaction(async (client) => {
      const results: Location[] = [];
      for (const roomDto of dto.rooms) {
        results.push(await this.createRoomWithBeds(roomDto, context, client));
      }
      return results;
    }, context);
  }

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

  async updateGenderLock(
    id: number,
    genderLock: any,
    cascade: boolean,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Location> {
    const operation = async (client: PoolClient) => {
      const location = await this.locationsRepository.findById(id, client);
      if (!location) throw new NotFoundException(`Location with ID ${id} not found`);
      return this.locationsRepository.updateGenderLock(id, genderLock, cascade, client);
    };

    if (externalClient) return operation(externalClient);

    this.logger.log({ locationId: id, genderLock, cascade }, 'Updating gender lock');
    return this.db.transaction(operation, context);
  }

  async updateGuestZone(
    id: number,
    isGuestZone: boolean,
    cascade: boolean,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Location> {
    const operation = async (client: PoolClient) => {
      const location = await this.locationsRepository.findById(id, client);
      if (!location) throw new NotFoundException(`Location with ID ${id} not found`);
      return this.locationsRepository.updateGuestZone(id, isGuestZone, cascade, client);
    };

    if (externalClient) return operation(externalClient);

    this.logger.log({ locationId: id, isGuestZone, cascade }, 'Updating guest zone');
    return this.db.transaction(operation, context);
  }

  async updateTrOnly(
    id: number,
    isTrOnly: boolean,
    cascade: boolean,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Location> {
    const operation = async (client: PoolClient) => {
      const location = await this.locationsRepository.findById(id, client);
      if (!location) throw new NotFoundException(`Location with ID ${id} not found`);
      return this.locationsRepository.updateTrOnly(id, isTrOnly, cascade, client);
    };

    if (externalClient) return operation(externalClient);

    this.logger.log({ locationId: id, isTrOnly, cascade }, 'Updating TR Only status');
    return this.db.transaction(operation, context);
  }

  async updateOwnership(
    id: number,
    ownership: any,
    cascade: boolean,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Location> {
    const operation = async (client: PoolClient) => {
      const location = await this.locationsRepository.findById(id, client);
      if (!location) throw new NotFoundException(`Location with ID ${id} not found`);
      return this.locationsRepository.updateOwnership(id, ownership, cascade, client);
    };

    if (externalClient) return operation(externalClient);

    this.logger.log({ locationId: id, ownership, cascade }, 'Updating ownership');
    return this.db.transaction(operation, context);
  }

  async updateGenderLockMany(
    dto: BulkUpdateGenderLockDto,
    context: AuditUserContext,
  ): Promise<void> {
    this.logger.log(
      { count: dto.ids.length, genderLock: dto.genderLock },
      'Bulk updating gender lock',
    );
    await this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        await this.updateGenderLock(id, dto.genderLock, dto.cascade ?? true, context, client);
      }
    }, context);
  }

  async updateGuestZoneMany(dto: BulkUpdateGuestZoneDto, context: AuditUserContext): Promise<void> {
    this.logger.log(
      { count: dto.ids.length, isGuestZone: dto.isGuestZone },
      'Bulk updating guest zone',
    );
    await this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        await this.updateGuestZone(id, dto.isGuestZone, dto.cascade ?? true, context, client);
      }
    }, context);
  }

  async updateTrOnlyMany(dto: BulkUpdateTrOnlyDto, context: AuditUserContext): Promise<void> {
    this.logger.log({ count: dto.ids.length, isTrOnly: dto.isTrOnly }, 'Bulk updating TR only');
    await this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        await this.updateTrOnly(id, dto.isTrOnly, dto.cascade ?? true, context, client);
      }
    }, context);
  }

  async updateOwnershipMany(dto: BulkUpdateOwnershipDto, context: AuditUserContext): Promise<void> {
    this.logger.log({ count: dto.ids.length, ownership: dto.ownership }, 'Bulk updating ownership');
    await this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        await this.updateOwnership(id, dto.ownership, dto.cascade ?? true, context, client);
      }
    }, context);
  }
}
