import { Module, Global } from '@nestjs/common';
import { LocationScopeService } from './location-scope.service';

@Global() // Available everywhere without importing LocationScopeModule, mirrors DatabaseModule
@Module({
  providers: [LocationScopeService],
  exports: [LocationScopeService],
})
export class LocationScopeModule {}
