import { PoolClient } from 'pg';
import { Location } from '../entities/location.entity';
import { LocationType } from '../../../common/enums/location-type.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface ILocationsRepository {
  create(data: Partial<Location>, client?: PoolClient): Promise<Location>;
  findById(id: number, client?: PoolClient): Promise<Location | null>;
  findByTreePath(path: string, client?: PoolClient): Promise<Location | null>;
  findAll(pagination: PaginationDto, client?: PoolClient): Promise<PaginatedResult<Location>>;
  findByType(type: LocationType, client?: PoolClient): Promise<Location[]>;
  findByParentPath(
    parentPath: string,
    type?: LocationType,
    client?: PoolClient,
  ): Promise<Location[]>;
  findChildren(id: number, client?: PoolClient): Promise<Location[]>;
  findWithAncestors(id: number, client?: PoolClient): Promise<Location[]>;
  update(id: number, data: Partial<Location>, client?: PoolClient): Promise<Location>;
  delete(id: number, client?: PoolClient): Promise<void>;
  exists(id: number, client?: PoolClient): Promise<boolean>;
  countByType(type: LocationType, client?: PoolClient): Promise<number>;
  searchByName(query: string, client?: PoolClient): Promise<Location[]>;
}
