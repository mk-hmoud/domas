import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { LocationsRepository } from '../repositories/locations.repository';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Location } from '../entities/location.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { LocationType } from '../../../common/enums/location-type.enum';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    private readonly locationsRepository: LocationsRepository,
    private readonly db: DatabaseService,
  ) {}

  private sanitizeForPath(str: string): string {
    // Keep only alphanumeric and underscore
    return str.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  async create(data: CreateLocationDto, context: AuditUserContext): Promise<Location> {
    this.logger.log({ data }, 'Creating new location');
    const location = await this.db.transaction(async (client) => {
      let treePath = this.sanitizeForPath(data.name);

      if (data.parentId) {
        const parent = await this.locationsRepository.findById(data.parentId, client);
        if (!parent) {
          throw new NotFoundException(`Parent location with ID ${data.parentId} not found`);
        }
        treePath = `${parent.treePath}.${treePath}`;
      }

      // Merge treePath into the data object for the repository
      return this.locationsRepository.create(
        {
          ...data,
          treePath,
        },
        client,
      );
    }, context);
    this.logger.log({ locationId: location.id }, 'Location created successfully');
    return location;
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
