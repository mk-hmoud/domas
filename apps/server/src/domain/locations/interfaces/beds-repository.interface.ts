import { PoolClient } from 'pg';
import { Bed } from '../entities/bed.entity';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface IBedsRepository {
  create(data: Partial<Bed>, client?: PoolClient): Promise<Bed>;
  findById(id: number, client?: PoolClient): Promise<Bed | null>;
  findAll(
    pagination: PaginationDto,
    filters?: { locationId?: number; status?: BedStatus },
    client?: PoolClient,
  ): Promise<PaginatedResult<Bed>>;
  findByLocation(locationId: number, client?: PoolClient): Promise<Bed[]>;
  findAvailableBeds(locationId: number, client?: PoolClient): Promise<Bed[]>;
  findByStatus(status: BedStatus, client?: PoolClient): Promise<Bed[]>;
  update(id: number, data: Partial<Bed>, client?: PoolClient): Promise<Bed>;
  updateStatus(id: number, status: BedStatus, client?: PoolClient): Promise<void>;
  delete(id: number, client?: PoolClient): Promise<void>;
  countByLocation(locationId: number, client?: PoolClient): Promise<number>;
  countAvailableByLocation(locationId: number, client?: PoolClient): Promise<number>;
}
