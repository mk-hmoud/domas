import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CountriesRepository } from '../repositories/countries.repository';
import { CreateCountryDto, UpdateCountryDto } from '../dto/country.dto';
import { Country } from '../entities/country.entity';

// Codes special-cased elsewhere in the system (pricing, bed/location TR-only
// restrictions, document language) - see common/utils/nationality.utils.ts.
// Deleting them would silently break that logic even if no student
// currently references them, so block it independently of the FK check.
const PROTECTED_CODES = new Set(['TR', 'TRNC']);

@Injectable()
export class CountriesService {
  constructor(private readonly repo: CountriesRepository) {}

  findAll(): Promise<Country[]> {
    return this.repo.findAll();
  }

  async findByCode(code: string): Promise<Country> {
    const country = await this.repo.findByCode(code);
    if (!country) throw new NotFoundException(`Country ${code} not found`);
    return country;
  }

  create(data: CreateCountryDto): Promise<Country> {
    return this.repo.create({ ...data, code: data.code.toUpperCase() });
  }

  async update(code: string, data: UpdateCountryDto): Promise<Country> {
    const country = await this.repo.update(code, data);
    if (!country) throw new NotFoundException(`Country ${code} not found`);
    return country;
  }

  async delete(code: string): Promise<void> {
    if (PROTECTED_CODES.has(code.toUpperCase())) {
      throw new BadRequestException(
        `Country ${code} is used by core system logic and cannot be deleted`,
      );
    }
    const deleted = await this.repo.delete(code);
    if (!deleted) throw new NotFoundException(`Country ${code} not found`);
  }
}
