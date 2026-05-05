import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RoomTypesRepository } from '../repositories/room-types.repository';
import { StorageService } from '../../../common/storage/storage.service';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../dto/room-type.dto';
import { RoomType } from '../entities/room-type.entity';

@Injectable()
export class RoomTypesService {
  constructor(
    private readonly repo: RoomTypesRepository,
    private readonly storage: StorageService,
  ) {}

  findAll(): Promise<RoomType[]> {
    return this.repo.findAll();
  }

  async findById(id: number): Promise<RoomType> {
    const rt = await this.repo.findById(id);
    if (!rt) throw new NotFoundException(`Room type ${id} not found`);
    return rt;
  }

  create(data: CreateRoomTypeDto): Promise<RoomType> {
    return this.repo.create(data);
  }

  async update(id: number, data: UpdateRoomTypeDto): Promise<RoomType> {
    const rt = await this.repo.update(id, data);
    if (!rt) throw new NotFoundException(`Room type ${id} not found`);
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

  async delete(id: number): Promise<void> {
    const rt = await this.repo.findByIdRaw(id);
    if (!rt) throw new NotFoundException(`Room type ${id} not found`);
    // Clean up all images from storage before deleting the room type
    await Promise.all(rt.galleryUrls.map((key) => this.storage.delete(key)));
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundException(`Room type ${id} not found`);
  }
}
