import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomTypesRepository } from '../repositories/room-types.repository';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../dto/room-type.dto';
import { RoomType } from '../entities/room-type.entity';

@Injectable()
export class RoomTypesService {
  constructor(private readonly repo: RoomTypesRepository) {}

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

  async delete(id: number): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundException(`Room type ${id} not found`);
  }
}
