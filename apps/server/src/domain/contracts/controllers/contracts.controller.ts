import { Controller, Get, Param, Res, UseGuards, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ContractsService } from '../services/contracts.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';

@Controller('contracts')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get(':bookingId')
  @RequirePermissions(PERMISSIONS.BOOKINGS_VIEW)
  async getContract(
    @Param('bookingId') bookingId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const contract = await this.contractsService.getContractByBookingId(bookingId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contract-${bookingId}.pdf"`,
      'Content-Length': contract.fileSize,
    });

    return new StreamableFile(contract.pdfData);
  }
}
