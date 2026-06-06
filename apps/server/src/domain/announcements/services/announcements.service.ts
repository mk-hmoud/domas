import { Injectable, NotFoundException } from '@nestjs/common';
import { AnnouncementsRepository } from '../repositories/announcements.repository';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';
import { Announcement } from '../entities/announcement.entity';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly repo: AnnouncementsRepository,
    private readonly undoService: UndoService,
  ) {}

  async create(data: CreateAnnouncementDto, userId: string): Promise<Announcement> {
    const result = await this.repo.create(data, userId);
    await this.undoService.registerUndo({
      userId,
      actionType: UndoActionType.CREATE_ANNOUNCEMENT,
      entityType: 'announcement',
      entityId: result.id,
      undoData: {},
      description: `Created announcement "${result.title}"`,
    });
    return result;
  }

  findAll(): Promise<Announcement[]> {
    return this.repo.findAll();
  }

  findPublished(): Promise<Announcement[]> {
    return this.repo.findPublished();
  }

  async update(id: string, data: UpdateAnnouncementDto, userId?: string): Promise<Announcement> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Announcement not found');
    const result = await this.repo.update(id, data);
    if (!result) throw new NotFoundException('Announcement not found');
    if (userId) {
      await this.undoService.registerUndo({
        userId,
        actionType: UndoActionType.UPDATE_ANNOUNCEMENT,
        entityType: 'announcement',
        entityId: id,
        undoData: {
          title: existing.title,
          body: existing.body,
          pinned: existing.pinned,
          expiresAt: existing.expiresAt,
        },
        description: `Updated announcement "${existing.title}"`,
      });
    }
    return result;
  }

  async publish(id: string, userId?: string): Promise<Announcement> {
    const result = await this.repo.publish(id);
    if (!result) throw new NotFoundException('Announcement not found');
    if (userId) {
      await this.undoService.registerUndo({
        userId,
        actionType: UndoActionType.PUBLISH_ANNOUNCEMENT,
        entityType: 'announcement',
        entityId: id,
        undoData: {},
        description: `Published announcement "${result.title}"`,
      });
    }
    return result;
  }

  async unpublish(id: string, userId?: string): Promise<Announcement> {
    const result = await this.repo.unpublish(id);
    if (!result) throw new NotFoundException('Announcement not found');
    if (userId) {
      await this.undoService.registerUndo({
        userId,
        actionType: UndoActionType.UNPUBLISH_ANNOUNCEMENT,
        entityType: 'announcement',
        entityId: id,
        undoData: {},
        description: `Unpublished announcement "${result.title}"`,
      });
    }
    return result;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Announcement not found');
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundException('Announcement not found');
    if (userId) {
      await this.undoService.registerUndo({
        userId,
        actionType: UndoActionType.DELETE_ANNOUNCEMENT,
        entityType: 'announcement',
        entityId: id,
        undoData: {
          title: existing.title,
          body: existing.body,
          pinned: existing.pinned,
          isPublished: existing.isPublished,
          expiresAt: existing.expiresAt,
          createdBy: existing.createdBy,
        },
        description: `Deleted announcement "${existing.title}"`,
      });
    }
  }

  async uploadAttachments(id: string, files: Express.Multer.File[]): Promise<Announcement> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Announcement not found');
    if (files && files.length > 0) {
      await this.repo.createAttachments(id, files);
    }
    return this.repo.findById(id) as Promise<Announcement>;
  }

  async downloadAttachment(
    announcementId: string,
    attachmentId: string,
  ): Promise<{ data: Buffer; filename: string; mimeType: string }> {
    const attachment = await this.repo.findAttachmentById(attachmentId, announcementId);
    if (!attachment) throw new NotFoundException('Attachment not found');
    return attachment;
  }

  async deleteAttachment(announcementId: string, attachmentId: string): Promise<void> {
    const deleted = await this.repo.deleteAttachment(attachmentId, announcementId);
    if (!deleted) throw new NotFoundException('Attachment not found');
  }
}
