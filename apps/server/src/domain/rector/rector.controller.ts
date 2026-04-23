import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { RectorService } from './rector.service';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';

@Controller('rector')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.RECTOR_VIEW)
export class RectorController {
  constructor(private readonly service: RectorService) {}

  @Get('beds')
  @Header('Cache-Control', 'no-store')
  getBeds() {
    return this.service.getBeds();
  }

  @Get('residents')
  @Header('Cache-Control', 'no-store')
  getResidents() {
    return this.service.getResidents();
  }
}
