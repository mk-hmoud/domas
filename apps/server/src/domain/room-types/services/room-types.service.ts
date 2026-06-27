import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RoomTypesRepository } from '../repositories/room-types.repository';
import { StorageService } from '../../../common/storage/storage.service';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../dto/room-type.dto';
import { RoomType } from '../entities/room-type.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

const FLAG_KEYS: (keyof UpdateRoomTypeDto)[] = [
  'genderLock',
  'studentYearLock',
  'isGuestZone',
  'isTrOnly',
  'isForeignerOnly',
  'isRectorate',
];

@Injectable()
export class RoomTypesService {
  constructor(
    private readonly repo: RoomTypesRepository,
    private readonly storage: StorageService,
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
  ) {}

  findAll(): Promise<RoomType[]> {
    return this.repo.findAll();
  }

  async findById(id: number): Promise<RoomType> {
    const rt = await this.repo.findById(id);
    if (!rt) throw new NotFoundException(`Room type ${id} not found`);
    return rt;
  }

  async create(data: CreateRoomTypeDto, userId?: string): Promise<RoomType> {
    const result = await this.repo.create(data);
    if (userId) {
      await this.undoService.registerUndo({
        userId,
        actionType: UndoActionType.CREATE_ROOM_TYPE,
        entityType: 'room_type',
        entityId: String(result.id),
        undoData: {},
        description: `Created room type "${result.name}"`,
      });
    }
    return result;
  }

  async update(id: number, data: UpdateRoomTypeDto, context?: AuditUserContext): Promise<RoomType> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Room type ${id} not found`);

    // Block capacity change if any linked room has a different bed count
    if (data.capacity !== undefined && data.capacity !== existing.capacity) {
      const conflicts = await this.repo.checkCapacityConflicts(id, data.capacity);
      if (conflicts.length > 0) {
        const details = conflicts
          .map((c) => `"${c.name}" (${c.bedCount} bed${c.bedCount === 1 ? '' : 's'})`)
          .join(', ');
        throw new ConflictException(
          `Cannot change capacity to ${data.capacity}: ${conflicts.length} room(s) have a different bed count — ${details}. Adjust those rooms' beds first.`,
        );
      }
    }

    return this.db.transaction(async (client) => {
      const rt = await this.repo.update(id, data, client);
      if (!rt) throw new NotFoundException(`Room type ${id} not found`);

      // Cascade all policy flags to linked rooms
      const flagsChanged = FLAG_KEYS.some((k) => k in data);
      if (flagsChanged) {
        await this.repo.cascadeFlags(
          id,
          {
            genderLock: rt.genderLock,
            studentYearLock: rt.studentYearLock,
            isGuestZone: rt.isGuestZone,
            isTrOnly: rt.isTrOnly,
            isForeignerOnly: rt.isForeignerOnly,
            isRectorate: rt.isRectorate,
          },
          client,
        );

        if ('isRectorate' in data) {
          await this.repo.cascadeIsRectorateToBeds(id, rt.isRectorate, client);
        }
      }

      if (context?.userId) {
        await this.undoService.registerUndo(
          {
            userId: context.userId,
            actionType: UndoActionType.UPDATE_ROOM_TYPE,
            entityType: 'room_type',
            entityId: String(id),
            undoData: {
              name: existing.name,
              nameTr: existing.nameTr,
              description: existing.description,
              descriptionTr: existing.descriptionTr,
              capacity: existing.capacity,
              amenities: existing.amenities,
              genderLock: existing.genderLock,
              studentYearLock: existing.studentYearLock,
              isGuestZone: existing.isGuestZone,
              isTrOnly: existing.isTrOnly,
              isForeignerOnly: existing.isForeignerOnly,
              isRectorate: existing.isRectorate,
            },
            description: `Updated room type "${existing.name}"`,
          },
          client,
        );
      }

      return rt;
    }, context);
  }

  async uploadImage(id: number, file: Express.Multer.File): Promise<RoomType> {
    const rt = await this.repo.findByIdRaw(id);
    if (!rt) throw new NotFoundException(`Room type ${id} not found`);
    const key = `room-types/${id}/${randomUUID()}`;
    await this.storage.upload(key, file.buffer, file.mimetype);
    return this.repo.appendImageKey(id, key);
  }

  async removeImage(id: number, index: number): Promise<RoomType> {
    const rt = await this.repo.findByIdRaw(id);
    if (!rt) throw new NotFoundException(`Room type ${id} not found`);
    const key = rt.galleryUrls[index];
    if (!key) throw new NotFoundException('Image not found');
    await this.storage.delete(key);
    return this.repo.removeImageAtIndex(id, index);
  }

  async delete(id: number, userId?: string): Promise<void> {
    const rt = await this.repo.findByIdRaw(id);
    if (!rt) throw new NotFoundException(`Room type ${id} not found`);
    await Promise.all(rt.galleryUrls.map((key) => this.storage.delete(key)));
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundException(`Room type ${id} not found`);
    if (userId) {
      await this.undoService.registerUndo({
        userId,
        actionType: UndoActionType.DELETE_ROOM_TYPE,
        entityType: 'room_type',
        entityId: String(id),
        undoData: {
          name: rt.name,
          nameTr: rt.nameTr,
          description: rt.description,
          descriptionTr: rt.descriptionTr,
          capacity: rt.capacity,
          amenities: rt.amenities,
          genderLock: rt.genderLock,
          studentYearLock: rt.studentYearLock,
          isGuestZone: rt.isGuestZone,
          isTrOnly: rt.isTrOnly,
          isForeignerOnly: rt.isForeignerOnly,
          isRectorate: rt.isRectorate,
        },
        description: `Deleted room type "${rt.name}"`,
      });
    }
  }
}
