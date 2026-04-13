import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GuestsRepository } from '../repositories/guests.repository';
import { GuestStaysRepository } from '../repositories/guest-stays.repository';
import { CreateGuestDto } from '../dto/create-guest.dto';
import { UpdateGuestDto } from '../dto/update-guest.dto';
import { CreateGuestStayDto } from '../dto/create-guest-stay.dto';
import { UpdateGuestStayDto } from '../dto/update-guest-stay.dto';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Injectable()
export class GuestsService {
  constructor(
    private readonly guestsRepository: GuestsRepository,
    private readonly staysRepository: GuestStaysRepository,
  ) {}

  // ─── Guests ──────────────���─────────────────────────────────────────────────

  async findAllGuests(search?: string) {
    return this.guestsRepository.findAll(search);
  }

  async findGuestById(id: string) {
    const guest = await this.guestsRepository.findById(id);
    if (!guest) throw new NotFoundException('Guest not found');
    return guest;
  }

  async findGuestByIdNumber(idNumber: string) {
    return this.guestsRepository.findByIdNumber(idNumber);
  }

  async createGuest(data: CreateGuestDto) {
    return this.guestsRepository.create(data);
  }

  async updateGuest(id: string, data: UpdateGuestDto) {
    const guest = await this.guestsRepository.findById(id);
    if (!guest) throw new NotFoundException('Guest not found');
    return this.guestsRepository.update(id, data);
  }

  // ─── Guest Stays ─────────────────────────────��─────────────────────────────

  async findAllStays(filters: { status?: string; upcoming?: boolean; bedId?: number }) {
    return this.staysRepository.findAll(filters);
  }

  async findStayById(id: string) {
    const stay = await this.staysRepository.findById(id);
    if (!stay) throw new NotFoundException('Guest stay not found');
    return stay;
  }

  async createStay(data: CreateGuestStayDto, context: AuditUserContext) {
    const guest = await this.guestsRepository.findById(data.guestId);
    if (!guest) throw new NotFoundException('Guest not found');

    if (new Date(data.checkOutDate) <= new Date(data.checkInDate)) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    return this.staysRepository.create(data, context.userId);
  }

  async updateStay(id: string, data: UpdateGuestStayDto) {
    const stay = await this.staysRepository.findById(id);
    if (!stay) throw new NotFoundException('Guest stay not found');
    if (stay.status === 'cancelled' || stay.status === 'completed') {
      throw new BadRequestException(`Cannot update a ${stay.status} stay`);
    }
    return this.staysRepository.update(id, data);
  }

  async checkIn(id: string) {
    const stay = await this.staysRepository.findById(id);
    if (!stay) throw new NotFoundException('Guest stay not found');
    if (stay.status !== 'confirmed') {
      throw new BadRequestException(`Cannot check in a stay with status '${stay.status}'`);
    }
    return this.staysRepository.checkIn(id);
  }

  async checkOut(id: string) {
    const stay = await this.staysRepository.findById(id);
    if (!stay) throw new NotFoundException('Guest stay not found');
    if (stay.status !== 'active') {
      throw new BadRequestException(`Cannot check out a stay with status '${stay.status}'`);
    }
    return this.staysRepository.checkOut(id);
  }

  async cancel(id: string) {
    const stay = await this.staysRepository.findById(id);
    if (!stay) throw new NotFoundException('Guest stay not found');
    if (stay.status === 'completed' || stay.status === 'cancelled') {
      throw new BadRequestException(`Stay is already ${stay.status}`);
    }
    return this.staysRepository.cancel(id);
  }
}
