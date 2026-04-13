import { Injectable, NotFoundException } from '@nestjs/common';
import { AnnouncementsRepository } from '../repositories/announcements.repository';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';
import { Announcement } from '../entities/announcement.entity';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly repo: AnnouncementsRepository) {}

  create(data: CreateAnnouncementDto, userId: string): Promise<Announcement> {
    return this.repo.create(data, userId);
  }

  findAll(): Promise<Announcement[]> {
    return this.repo.findAll();
  }

  findPublished(): Promise<Announcement[]> {
    return this.repo.findPublished();
  }

  async update(id: string, data: UpdateAnnouncementDto): Promise<Announcement> {
    const result = await this.repo.update(id, data);
    if (!result) throw new NotFoundException('Announcement not found');
    return result;
  }

  async publish(id: string): Promise<Announcement> {
    const result = await this.repo.publish(id);
    if (!result) throw new NotFoundException('Announcement not found');
    return result;
  }

  async unpublish(id: string): Promise<Announcement> {
    const result = await this.repo.unpublish(id);
    if (!result) throw new NotFoundException('Announcement not found');
    return result;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundException('Announcement not found');
  }
}
