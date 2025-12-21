import { Injectable, NotFoundException } from '@nestjs/common';
import { SemestersRepository } from '../repositories/semesters.repository';
import { CreateSemesterDto } from '../dto/create-semester.dto';
import { UpdateSemesterDto } from '../dto/update-semester.dto';
import { Semester } from '../entities/semester.entity';

@Injectable()
export class SemestersService {
  constructor(private readonly semestersRepository: SemestersRepository) {}

  async create(data: CreateSemesterDto): Promise<Semester> {
    if (data.isActive) {
      await this.semestersRepository.deactivateAll();
    }
    return this.semestersRepository.create(data);
  }

  async findAll(): Promise<Semester[]> {
    return this.semestersRepository.findAll();
  }

  async findById(id: number): Promise<Semester> {
    const semester = await this.semestersRepository.findById(id);
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }
    return semester;
  }

  async update(id: number, data: UpdateSemesterDto): Promise<Semester> {
    const semester = await this.semestersRepository.findById(id);
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }

    if (data.isActive) {
      await this.semestersRepository.deactivateAll();
    }

    const updated = await this.semestersRepository.update(id, data);
    if (!updated) {
      // Should not happen as we checked existence, unless deleted concurrently
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }
    return updated;
  }

  async toggleActive(id: number): Promise<Semester> {
    const semester = await this.semestersRepository.findById(id);
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }

    const newActiveStatus = !semester.isActive;

    if (newActiveStatus) {
      await this.semestersRepository.deactivateAll();
    }

    const updated = await this.semestersRepository.update(id, { isActive: newActiveStatus });
    if (!updated) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const deleted = await this.semestersRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }
  }
}
