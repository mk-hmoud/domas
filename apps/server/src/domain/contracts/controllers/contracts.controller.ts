import { Controller, Get, Param, Query, Res, UseGuards, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ContractsService } from '../services/contracts.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { ContractType } from '../../../common/enums/contract-type.enum';

@Controller('contracts')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get(':bookingId')
  @RequirePermissions(PERMISSIONS.BOOKINGS_VIEW)
  async getContract(
    @Param('bookingId') bookingId: string,
    @Query('type') type: ContractType = ContractType.CHECK_IN,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { fileSize, buffer } = await this.contractsService.getContract(
      bookingId,
      type || ContractType.CHECK_IN,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${type || 'contract'}-${bookingId}.pdf"`,
      'Content-Length': fileSize,
    });

    return new StreamableFile(buffer);
  }
}
