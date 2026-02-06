import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { CreateInventoryCatalogDto } from '../dto/create-inventory-catalog.dto';
import { UpdateInventoryCatalogDto } from '../dto/update-inventory-catalog.dto';
import { CreateInventoryAssignmentDto } from '../dto/create-inventory-assignment.dto';
import { UpdateInventoryAssignmentDto } from '../dto/update-inventory-assignment.dto';

@Controller('inventory')
@UseGuards(AuthenticatedGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- Catalog ---

  @Post('catalog')
  createCatalog(@Body() data: CreateInventoryCatalogDto, @UserContext() context: AuditUserContext) {
    return this.inventoryService.createCatalog(data, context);
  }

  @Get('catalog')
  findAllCatalog(@Query('scope') scope?: string, @Query('isActive') isActive?: string) {
    return this.inventoryService.findAllCatalog({
      scope,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('catalog/:id')
  findCatalogById(@Param('id') id: string) {
    return this.inventoryService.findCatalogById(parseInt(id, 10));
  }

  @Patch('catalog/:id')
  updateCatalog(
    @Param('id') id: string,
    @Body() data: UpdateInventoryCatalogDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.inventoryService.updateCatalog(parseInt(id, 10), data, context);
  }

  @Delete('catalog/:id')
  deleteCatalog(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.inventoryService.deleteCatalog(parseInt(id, 10), context);
  }

  // --- Assignments ---

  @Post('assignments')
  createAssignment(
    @Body() data: CreateInventoryAssignmentDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.inventoryService.createAssignment(data, context);
  }

  @Get('assignments/location/:id')
  findByLocation(@Param('id') id: string) {
    return this.inventoryService.findAssignmentsByLocation(parseInt(id, 10));
  }

  @Get('assignments/bed/:id')
  findByBed(@Param('id') id: string) {
    return this.inventoryService.findAssignmentsByBed(parseInt(id, 10));
  }

  @Patch('assignments/:id')
  updateAssignment(
    @Param('id') id: string,
    @Body() data: UpdateInventoryAssignmentDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.inventoryService.updateAssignment(id, data, context);
  }

  @Delete('assignments/:id')
  deleteAssignment(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.inventoryService.deleteAssignment(id, context);
  }
}
