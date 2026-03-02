import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { LocationsRepository } from '../repositories/locations.repository';
import { BedsRepository } from '../repositories/beds.repository';
import { StudentsRepository } from '../../students/repositories/students.repository';
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
  BulkUpdateForeignerOnlyDto,
  BulkUpdateOwnershipDto,
} from '../dto/bulk-update-policies.dto';
import {
  UpdateGenderLockDto,
  UpdateGuestZoneDto,
  UpdateTrOnlyDto,
  UpdateForeignerOnlyDto,
  UpdateOwnershipDto,
} from '../dto/update-policies.dto';
import { Location } from '../entities/location.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { LocationType } from '../../../common/enums/location-type.enum';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PoolClient } from 'pg';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { Inject, forwardRef } from '@nestjs/common';

import { FindAllLocationsDto } from '../dto/find-all-locations.dto';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    private readonly locationsRepository: LocationsRepository,
    private readonly bedsRepository: BedsRepository,
    private readonly studentsRepository: StudentsRepository,
    @Inject(forwardRef(() => UndoService))
    private readonly undoService: UndoService,
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
      let parentFlags: Partial<Location> = {};

      if (data.parentId) {
        const parent = await this.locationsRepository.findById(data.parentId, client);
        if (parent) {
          parentFlags = {
            genderLock: parent.genderLock,
            isTrOnly: parent.isTrOnly,
            isGuestZone: parent.isGuestZone,
            ownership: parent.ownership,
          };
        }
      }

      const tempPath = 'temp';
      const created = await this.locationsRepository.create(
        { ...parentFlags, ...data, treePath: tempPath },
        client,
      );

      let treePath = created.id.toString();

      if (data.parentId) {
        const parent = await this.locationsRepository.findById(data.parentId, client);
        treePath = `${parent!.treePath}.${treePath}`;
      }

      const location = await this.locationsRepository.update(
        created.id,
        { treePath } as any,
        client,
      );

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.CREATE_LOCATION,
          entityType: 'location',
          entityId: location.id.toString(),
          undoData: {},
          description: `Created location ${location.name}`,
        },
        client,
      );

      return location;
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

  async findAll(
    filters: FindAllLocationsDto,
  ): Promise<PaginatedResult<Location & { totalBeds?: number; occupiedBeds?: number }>> {
    return this.locationsRepository.findAll(filters);
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

  async search(query: string, options: { includePath?: boolean } = {}): Promise<Location[]> {
    return this.locationsRepository.searchByName(query, options);
  }

  async findActiveResidents(locationId: number) {
    return this.studentsRepository.findActiveResidentsByLocation(locationId);
  }

  async update(id: number, data: UpdateLocationDto, context: AuditUserContext): Promise<Location> {
    this.logger.log({ locationId: id, data }, 'Updating location');
    const location = await this.db.transaction(async (client) => {
      const existing = await this.locationsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }

      const updated = await this.locationsRepository.update(id, data, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_LOCATION,
          entityType: 'location',
          entityId: id.toString(),
          undoData: existing,
          description: `Updated location ${existing.name}`,
        },
        client,
      );

      return updated;
    }, context);
    this.logger.log({ locationId: id }, 'Location updated successfully');
    return location;
  }

  async delete(id: number, context: AuditUserContext): Promise<void> {
    this.logger.log({ locationId: id }, 'Deleting location');
    await this.db.transaction(async (client) => {
      const existing = await this.locationsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }
      await this.locationsRepository.delete(id, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.DELETE_LOCATION,
          entityType: 'location',
          entityId: id.toString(),
          undoData: existing,
          description: `Deleted location ${existing.name}`,
        },
        client,
      );
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

      const updated = await this.locationsRepository.updateGenderLock(
        id,
        genderLock,
        cascade,
        client,
      );

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_GENDER_LOCK,
          entityType: 'location',
          entityId: id.toString(),
          undoData: { previousGenderLock: location.genderLock, cascade },
          description: `Updated gender lock on ${location.name}`,
        },
        client,
      );

      return updated;
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

      const updated = await this.locationsRepository.updateGuestZone(
        id,
        isGuestZone,
        cascade,
        client,
      );

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_GUEST_ZONE,
          entityType: 'location',
          entityId: id.toString(),
          undoData: { previousGuestZone: location.isGuestZone, cascade },
          description: `Updated guest zone on ${location.name}`,
        },
        client,
      );

      return updated;
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

      const updated = await this.locationsRepository.updateTrOnly(id, isTrOnly, cascade, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_TR_ONLY,
          entityType: 'location',
          entityId: id.toString(),
          undoData: { previousTrOnly: location.isTrOnly, cascade },
          description: `Updated TR-only status on ${location.name}`,
        },
        client,
      );

      return updated;
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

      const updated = await this.locationsRepository.updateOwnership(
        id,
        ownership,
        cascade,
        client,
      );

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_OWNERSHIP,
          entityType: 'location',
          entityId: id.toString(),
          undoData: { previousOwnership: location.ownership, cascade },
          description: `Updated ownership on ${location.name}`,
        },
        client,
      );

      return updated;
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

  async updateForeignerOnly(
    id: number,
    isForeignerOnly: boolean,
    cascade: boolean,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Location> {
    const operation = async (client: PoolClient) => {
      const location = await this.locationsRepository.findById(id, client);
      if (!location) throw new NotFoundException(`Location with ID ${id} not found`);

      const updated = await this.locationsRepository.updateForeignerOnly(
        id,
        isForeignerOnly,
        cascade,
        client,
      );

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_FOREIGNER_ONLY,
          entityType: 'location',
          entityId: id.toString(),
          undoData: { previousForeignerOnly: location.isForeignerOnly, cascade },
          description: `Updated Foreigner-only status on ${location.name}`,
        },
        client,
      );

      return updated;
    };

    if (externalClient) return operation(externalClient);

    this.logger.log({ locationId: id, isForeignerOnly, cascade }, 'Updating Foreigner Only status');
    return this.db.transaction(operation, context);
  }

  async updateForeignerOnlyMany(
    dto: BulkUpdateForeignerOnlyDto,
    context: AuditUserContext,
  ): Promise<void> {
    this.logger.log(
      { count: dto.ids.length, isForeignerOnly: dto.isForeignerOnly },
      'Bulk updating Foreigner Only',
    );
    await this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        await this.updateForeignerOnly(
          id,
          dto.isForeignerOnly,
          dto.cascade ?? true,
          context,
          client,
        );
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
