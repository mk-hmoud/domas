import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RoomTypesRepository } from '../repositories/room-types.repository';
import { StorageService } from '../../../common/storage/storage.service';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../dto/room-type.dto';
import { RoomType } from '../entities/room-type.entity';

@Injectable()
export class RoomTypesService {
  constructor(
    private readonly repo: RoomTypesRepository,
    private readonly storage: StorageService,
    private readonly undoService: UndoService,
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

  async update(id: number, data: UpdateRoomTypeDto, userId?: string): Promise<RoomType> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Room type ${id} not found`);
    const rt = await this.repo.update(id, data);
    if (!rt) throw new NotFoundException(`Room type ${id} not found`);
    if (userId) {
      await this.undoService.registerUndo({
        userId,
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
        },
        description: `Updated room type "${existing.name}"`,
      });
    }
    return rt;
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
        },
        description: `Deleted room type "${rt.name}"`,
      });
    }
  }
}
