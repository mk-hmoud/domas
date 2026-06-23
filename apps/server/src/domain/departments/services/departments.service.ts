import { Injectable, NotFoundException } from '@nestjs/common';
import { DepartmentsRepository } from '../repositories/departments.repository';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../dto/department.dto';
import { Department } from '../entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(private readonly repo: DepartmentsRepository) {}

  findAll(): Promise<Department[]> {
    return this.repo.findAll();
  }

  async findByName(nameEn: string): Promise<Department> {
    const department = await this.repo.findByName(nameEn);
    if (!department) throw new NotFoundException(`Department "${nameEn}" not found`);
    return department;
  }

  create(data: CreateDepartmentDto): Promise<Department> {
    return this.repo.create(data);
  }

  async update(nameEn: string, data: UpdateDepartmentDto): Promise<Department> {
    const department = await this.repo.update(nameEn, data);
    if (!department) throw new NotFoundException(`Department "${nameEn}" not found`);
    return department;
  }

  async delete(nameEn: string): Promise<void> {
    const deleted = await this.repo.delete(nameEn);
    if (!deleted) throw new NotFoundException(`Department "${nameEn}" not found`);
  }
}
