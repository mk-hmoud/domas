import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
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
  BulkUpdateIsRectorateDto,
} from '../dto/bulk-update-policies.dto';
import {
  UpdateGenderLockDto,
  UpdateGuestZoneDto,
  UpdateTrOnlyDto,
  UpdateForeignerOnlyDto,
  UpdateIsRectorateDto,
} from '../dto/update-policies.dto';
import { Location } from '../entities/location.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { LocationType } from '../../../common/enums/location-type.enum';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { PoolClient } from 'pg';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { Inject, forwardRef } from '@nestjs/common';

import { FindAllLocationsDto } from '../dto/find-all-locations.dto';
import { PERMISSIONS } from '../../../common/constants/permissions';

interface AncestorFlagSource {
  value: any;
  sourceId: number;
  sourceName: string;
}

interface AncestorFlagsResult {
  isTrOnly: AncestorFlagSource | null;
  isForeignerOnly: AncestorFlagSource | null;
  isGuestZone: AncestorFlagSource | null;
  isRectorate: AncestorFlagSource | null;
  genderLock: AncestorFlagSource | null;
  studentYearLock: AncestorFlagSource | null;
}

interface LocationFlagContext {
  ancestorFlags: AncestorFlagsResult;
  descendantCount: { locations: number; beds: number };
  descendantPreview: { id: number; name: string; nameTr?: string; type: string }[];
}

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
    private readonly locationScopeService: LocationScopeService,
  ) {}

  // ... (existing create helper)

  private canAccessRectorate(context: AuditUserContext): boolean {
    return (
      context.isRecoveryAdmin === true ||
      context.permissions?.includes(PERMISSIONS.LOCATIONS_RECTORATE) === true
    );
  }

  async createRoomWithBeds(
    dto: CreateRoomWithBedsDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Location> {
    const operation = async (client: PoolClient) => {
      // 1. Resolve bed count from room type capacity
      if (!dto.roomTypeId) {
        throw new BadRequestException('A room must have a room type assigned');
      }
      const rtResult = await client.query<{ capacity: number }>(
        `SELECT capacity FROM room_types WHERE id = $1`,
        [dto.roomTypeId],
      );
      if (!rtResult.rows[0]) {
        throw new NotFoundException(`Room type ${dto.roomTypeId} not found`);
      }
      const bedCount = rtResult.rows[0].capacity;

      // 2. Create Room (Location)
      const room = await this.create(dto, context, client);

      // 3. Create Beds — one per room type capacity slot
      const bedPromises = [];
      for (let i = 1; i <= bedCount; i++) {
        const label = String.fromCharCode(64 + i); // A, B, C…
        bedPromises.push(
          this.bedsRepository.create(
            {
              locationId: room.id,
              label,
              status: BedStatus.AVAILABLE,
              isTrOnly: room.isTrOnly,
              isGuestZone: room.isGuestZone,
              isRectorate: room.isRectorate,
            },
            client,
          ),
        );
      }
      await Promise.all(bedPromises);
      return room;
    };

    if (externalClient) return operation(externalClient);

    this.logger.log({ room: dto.name, roomTypeId: dto.roomTypeId }, 'Creating room with beds');
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
    if (data.type === LocationType.ROOM && !data.roomTypeId) {
      throw new BadRequestException('A room must have a room type assigned');
    }
    if (data.isRectorate && !this.canAccessRectorate(context)) {
      throw new ForbiddenException('You do not have permission to create rectorate locations');
    }

    const operation = async (client: PoolClient) => {
      let parentFlags: Partial<Location> = {};

      if (data.parentId) {
        const parent = await this.locationsRepository.findById(data.parentId, client);
        if (parent) {
          this.locationScopeService.assertAccess(context.locationScope, parent.treePath);
          parentFlags = {
            genderLock: parent.genderLock,
            isTrOnly: parent.isTrOnly,
            isGuestZone: parent.isGuestZone,
            isRectorate: parent.isRectorate,
          };
        }
      } else {
        // Creating a new top-level node (campus/root) is reserved for
        // unrestricted staff - a scoped staff member has no anchor to check
        // a root node against.
        this.locationScopeService.assertAccess(context.locationScope, '');
      }

      // Room type flags override parent flags — the room type is the source of truth
      let roomTypeFlags: Partial<Location> = {};
      if (data.type === LocationType.ROOM && data.roomTypeId) {
        const rtResult = await client.query<{
          genderLock: string | null;
          studentYearLock: string | null;
          isGuestZone: boolean;
          isTrOnly: boolean;
          isForeignerOnly: boolean;
          isRectorate: boolean;
        }>(
          `SELECT gender_lock AS "genderLock", student_year_lock AS "studentYearLock",
                  is_guest_zone AS "isGuestZone", is_tr_only AS "isTrOnly",
                  is_foreigner_only AS "isForeignerOnly", is_rectorate AS "isRectorate"
           FROM room_types WHERE id = $1`,
          [data.roomTypeId],
        );
        if (rtResult.rows[0]) roomTypeFlags = rtResult.rows[0] as Partial<Location>;
      }

      const tempPath = 'temp';
      const created = await this.locationsRepository.create(
        { ...parentFlags, ...data, ...roomTypeFlags, treePath: tempPath },
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

  private async assertLocationsInScope(
    ids: number[],
    context: AuditUserContext,
    client?: PoolClient,
  ): Promise<void> {
    if (context.locationScope?.unrestricted) return;
    for (const id of ids) {
      const location = await this.locationsRepository.findById(id, client);
      if (!location) throw new NotFoundException(`Location with ID ${id} not found`);
      this.locationScopeService.assertAccess(context.locationScope, location.treePath);
    }
  }

  async updateMany(dto: BulkUpdateLocationDto, context: AuditUserContext): Promise<void> {
    this.logger.log({ count: dto.ids.length, data: dto.data }, 'Bulk updating locations');
    await this.db.transaction(async (client) => {
      await this.assertLocationsInScope(dto.ids, context, client);
      await this.locationsRepository.updateMany(dto.ids, dto.data, client);
    }, context);
  }

  async deleteMany(dto: BulkDeleteLocationDto, context: AuditUserContext): Promise<void> {
    this.logger.log({ count: dto.ids.length }, 'Bulk deleting locations');
    await this.db.transaction(async (client) => {
      await this.assertLocationsInScope(dto.ids, context, client);
      // Cascade: see delete() above for why beds go first.
      await this.bedsRepository.deleteByLocationIds(dto.ids, client);
      await this.locationsRepository.deleteMany(dto.ids, client);
    }, context);
  }

  async findAll(
    filters: FindAllLocationsDto,
    context: AuditUserContext,
  ): Promise<PaginatedResult<Location & { totalBeds?: number; occupiedBeds?: number }>> {
    const effectiveFilters = this.canAccessRectorate(context)
      ? filters
      : { ...filters, isRectorate: false };
    return this.locationsRepository.findAll(effectiveFilters, undefined, context.locationScope);
  }

  async findById(id: number, context: AuditUserContext): Promise<Location> {
    const location = await this.locationsRepository.findById(id);
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    this.locationScopeService.assertAccess(context.locationScope, location.treePath);
    return location;
  }

  async findChildren(id: number, context: AuditUserContext): Promise<Location[]> {
    const parent = await this.locationsRepository.findById(id);
    if (!parent) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    this.locationScopeService.assertAccess(context.locationScope, parent.treePath);
    return this.locationsRepository.findChildren(id);
  }

  async findWithAncestors(id: number, context: AuditUserContext): Promise<Location[]> {
    const target = await this.locationsRepository.findById(id);
    if (!target) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    // Breadcrumb: the leaf must be in scope, but ancestor names (campus,
    // building) are returned unfiltered for display purposes even if they
    // sit above the staff member's anchor point.
    this.locationScopeService.assertAccess(context.locationScope, target.treePath);
    return this.locationsRepository.findWithAncestors(id);
  }

  async search(query: string, options: { includePath?: boolean } = {}): Promise<Location[]> {
    return this.locationsRepository.searchByName(query, options);
  }

  async findActiveResidents(locationId: number, context: AuditUserContext) {
    const location = await this.locationsRepository.findById(locationId);
    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }
    this.locationScopeService.assertAccess(context.locationScope, location.treePath);
    return this.studentsRepository.findActiveResidentsByLocation(locationId);
  }

  async getRoomHistory(locationId: number, context: AuditUserContext) {
    const location = await this.locationsRepository.findById(locationId);
    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }
    this.locationScopeService.assertAccess(context.locationScope, location.treePath);
    return this.locationsRepository.findRoomHistory(locationId);
  }

  async getRoomPlan(locationId: number, context: AuditUserContext, semesterId?: number) {
    const location = await this.locationsRepository.findById(locationId);
    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }
    this.locationScopeService.assertAccess(context.locationScope, location.treePath);
    const rows = await this.locationsRepository.findRoomPlan(locationId, semesterId);
    return this.groupRoomPlanRows(rows);
  }

  private groupRoomPlanRows(rows: any[]) {
    const rooms = new Map<number, any>();

    for (const row of rows) {
      let room = rooms.get(row.roomId);
      if (!room) {
        room = {
          id: row.roomId,
          name: row.roomName,
          nameTr: row.roomNameTr,
          genderLock: row.genderLock,
          studentYearLock: row.studentYearLock,
          isGuestZone: row.isGuestZone,
          isTrOnly: row.isTrOnly,
          isForeignerOnly: row.isForeignerOnly,
          isRectorate: row.isRectorate,
          roomTypeId: row.roomTypeId,
          roomTypeName: row.roomTypeName,
          roomTypeNameTr: row.roomTypeNameTr,
          capacity: row.capacity,
          parentLocationId: row.parentLocationId,
          parentLocationName: row.parentLocationName,
          parentLocationNameTr: row.parentLocationNameTr,
          beds: [],
        };
        rooms.set(row.roomId, room);
      }

      if (row.bedId) {
        room.beds.push({
          id: row.bedId,
          label: row.bedLabel,
          status: row.bedStatus,
          occupant: row.currentStudentId
            ? {
                studentId: row.currentStudentId,
                bookingId: row.currentBookingId,
                firstName: row.currentFirstName,
                lastName: row.currentLastName,
                studentNumber: row.currentStudentNumber,
                gender: row.currentGender,
                nationalityCode: row.currentNationalityCode,
                email: row.currentEmail,
                phoneNumber: row.currentPhoneNumber,
                whatsappNumber: row.currentWhatsappNumber,
                paymentStatus: row.currentPaymentStatus,
                checkedInAt: row.currentCheckedInAt,
              }
            : null,
          pendingBooking: row.pendingStudentId
            ? {
                bookingId: row.pendingBookingId,
                studentId: row.pendingStudentId,
                firstName: row.pendingFirstName,
                lastName: row.pendingLastName,
                studentNumber: row.pendingStudentNumber,
                startDate: row.pendingStartDate,
                status: row.pendingStatus,
              }
            : null,
        });
      }
    }

    return Array.from(rooms.values());
  }

  async update(id: number, data: UpdateLocationDto, context: AuditUserContext): Promise<Location> {
    this.logger.log({ locationId: id, data }, 'Updating location');
    if (data.isRectorate !== undefined && !this.canAccessRectorate(context)) {
      throw new ForbiddenException('You do not have permission to modify the rectorate flag');
    }
    const location = await this.db.transaction(async (client) => {
      const existing = await this.locationsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }
      this.locationScopeService.assertAccess(context.locationScope, existing.treePath);

      // When changing a room's type, ensure bed count matches new type's capacity
      if (
        'roomTypeId' in data &&
        data.roomTypeId !== null &&
        data.roomTypeId !== existing.roomTypeId
      ) {
        const rtResult = await client.query<{
          capacity: number;
          genderLock: string | null;
          studentYearLock: string | null;
          isGuestZone: boolean;
          isTrOnly: boolean;
          isForeignerOnly: boolean;
          isRectorate: boolean;
        }>(
          `SELECT capacity, gender_lock AS "genderLock", student_year_lock AS "studentYearLock",
                  is_guest_zone AS "isGuestZone", is_tr_only AS "isTrOnly",
                  is_foreigner_only AS "isForeignerOnly", is_rectorate AS "isRectorate"
           FROM room_types WHERE id = $1`,
          [data.roomTypeId],
        );
        if (!rtResult.rows[0]) {
          throw new NotFoundException(`Room type ${data.roomTypeId} not found`);
        }
        const { capacity, ...rtFlags } = rtResult.rows[0];
        const bedCount = await this.bedsRepository.countByLocation(id, client);
        if (bedCount !== capacity) {
          throw new ConflictException(
            `Cannot change room type: room has ${bedCount} bed(s) but the new type requires ${capacity}. Adjust the room's beds first.`,
          );
        }
        // Apply new room type's flags to this room
        Object.assign(data, rtFlags);
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

  async getFlagContext(id: number, context: AuditUserContext): Promise<LocationFlagContext> {
    const location = await this.locationsRepository.findById(id);
    if (!location) throw new NotFoundException(`Location with ID ${id} not found`);
    this.locationScopeService.assertAccess(context.locationScope, location.treePath);

    const [ancestors, descendantCount, descendantPreview] = await Promise.all([
      this.locationsRepository.findWithAncestors(id),
      this.locationsRepository.countDescendants(id),
      this.locationsRepository.getDescendantPreview(id, 10),
    ]);

    const ancestorChain = ancestors.filter((a) => a.id !== id).reverse();

    const findSrc = (
      predicate: (a: Location) => boolean,
    ): { sourceId: number; sourceName: string } | null => {
      const found = ancestorChain.find(predicate);
      return found ? { sourceId: found.id, sourceName: found.name } : null;
    };

    const trSrc = findSrc((a) => a.isTrOnly);
    const foreignerSrc = findSrc((a) => a.isForeignerOnly);
    const guestSrc = findSrc((a) => a.isGuestZone);
    const rectorSrc = findSrc((a) => a.isRectorate);
    const genderSrc = findSrc((a) => !!a.genderLock);
    const yearSrc = findSrc((a) => !!a.studentYearLock);

    const ancestorFlags: AncestorFlagsResult = {
      isTrOnly: trSrc ? { value: true, ...trSrc } : null,
      isForeignerOnly: foreignerSrc ? { value: true, ...foreignerSrc } : null,
      isGuestZone: guestSrc ? { value: true, ...guestSrc } : null,
      isRectorate: rectorSrc ? { value: true, ...rectorSrc } : null,
      genderLock: genderSrc
        ? { value: ancestorChain.find((a) => !!a.genderLock)!.genderLock, ...genderSrc }
        : null,
      studentYearLock: yearSrc
        ? { value: ancestorChain.find((a) => !!a.studentYearLock)!.studentYearLock, ...yearSrc }
        : null,
    };

    return { ancestorFlags, descendantCount, descendantPreview };
  }

  async delete(id: number, context: AuditUserContext): Promise<void> {
    this.logger.log({ locationId: id }, 'Deleting location');
    await this.db.transaction(async (client) => {
      const existing = await this.locationsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }
      this.locationScopeService.assertAccess(context.locationScope, existing.treePath);
      // Cascade: soft-delete the beds under this subtree before the locations
      // themselves, so nothing is left orphaned (active beds pointing at a
      // deleted location).
      await this.bedsRepository.deleteByLocationId(id, client);
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

  private assertNotRoomTypeLocked(location: Location, context: AuditUserContext): void {
    if (location.roomTypeId !== null && !context.isRecoveryAdmin) {
      throw new ConflictException(
        `This room's flags are managed by its room type (ID ${location.roomTypeId}). Update the room type to change them, or use a recovery admin account for a direct override.`,
      );
    }
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
      this.locationScopeService.assertAccess(context.locationScope, location.treePath);
      this.assertNotRoomTypeLocked(location, context);

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

  async updateStudentYearLock(
    id: number,
    studentYearLock: string | null,
    cascade: boolean,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Location> {
    const operation = async (client: PoolClient) => {
      const location = await this.locationsRepository.findById(id, client);
      if (!location) throw new NotFoundException(`Location with ID ${id} not found`);
      this.locationScopeService.assertAccess(context.locationScope, location.treePath);
      this.assertNotRoomTypeLocked(location, context);

      const updated = await this.locationsRepository.updateStudentYearLock(
        id,
        studentYearLock,
        cascade,
        client,
      );

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_STUDENT_YEAR_LOCK,
          entityType: 'location',
          entityId: id.toString(),
          undoData: { previousStudentYearLock: location.studentYearLock, cascade },
          description: `Updated student year lock on ${location.name}`,
        },
        client,
      );

      return updated;
    };

    if (externalClient) return operation(externalClient);

    this.logger.log({ locationId: id, studentYearLock, cascade }, 'Updating student year lock');
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
      this.locationScopeService.assertAccess(context.locationScope, location.treePath);
      this.assertNotRoomTypeLocked(location, context);

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
      this.locationScopeService.assertAccess(context.locationScope, location.treePath);
      this.assertNotRoomTypeLocked(location, context);

      if (isTrOnly && location.isForeignerOnly)
        throw new BadRequestException(
          'A location cannot be both TR-only and Foreigner-only at the same time.',
        );

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

  async updateIsRectorate(
    id: number,
    isRectorate: boolean,
    cascade: boolean,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Location> {
    const operation = async (client: PoolClient) => {
      const location = await this.locationsRepository.findById(id, client);
      if (!location) throw new NotFoundException(`Location with ID ${id} not found`);
      this.locationScopeService.assertAccess(context.locationScope, location.treePath);
      this.assertNotRoomTypeLocked(location, context);

      const updated = await this.locationsRepository.updateIsRectorate(
        id,
        isRectorate,
        cascade,
        client,
      );

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_IS_RECTORATE,
          entityType: 'location',
          entityId: id.toString(),
          undoData: { previousIsRectorate: location.isRectorate, cascade },
          description: `Updated rectorate flag on ${location.name}`,
        },
        client,
      );

      return updated;
    };

    if (externalClient) return operation(externalClient);

    this.logger.log({ locationId: id, isRectorate, cascade }, 'Updating rectorate flag');
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
      this.locationScopeService.assertAccess(context.locationScope, location.treePath);
      this.assertNotRoomTypeLocked(location, context);

      if (isForeignerOnly && location.isTrOnly)
        throw new BadRequestException(
          'A location cannot be both TR-only and Foreigner-only at the same time.',
        );

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

  async updateIsRectorateMany(
    dto: BulkUpdateIsRectorateDto,
    context: AuditUserContext,
  ): Promise<void> {
    this.logger.log(
      { count: dto.ids.length, isRectorate: dto.isRectorate },
      'Bulk updating rectorate flag',
    );
    await this.db.transaction(async (client) => {
      for (const id of dto.ids) {
        await this.updateIsRectorate(id, dto.isRectorate, dto.cascade ?? true, context, client);
      }
    }, context);
  }
}
