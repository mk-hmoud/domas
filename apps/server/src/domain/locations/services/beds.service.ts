import { Injectable, NotFoundException } from '@nestjs/common';
import { BedsRepository } from '../repositories/beds.repository';
import { CreateBedDto } from '../dto/create-bed.dto';
import { UpdateBedDto } from '../dto/update-bed.dto';
import { Bed } from '../entities/bed.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Injectable()
export class BedsService {
  constructor(
    private readonly bedsRepository: BedsRepository,
    private readonly db: DatabaseService,
  ) {}

  async create(data: CreateBedDto, context: AuditUserContext): Promise<Bed> {
    return this.db.transaction(async (client) => {
      // Relying on DB FK constraint for location existence check for now
      // or we can inject LocationsRepository to check manually and throw NotFoundException
      try {
        return await this.bedsRepository.create(data, client);
      } catch (error: any) {
        if (error.code === '23503') {
          // Foreign key violation
          throw new NotFoundException(`Location with ID ${data.locationId} not found`);
        }
        throw error;
      }
    }, context);
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
}
