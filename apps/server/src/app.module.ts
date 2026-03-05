import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLoggerModule } from './core/logger/logger.module';
import { DatabaseModule } from './core/database/database.module';
import { databaseConfig } from './config';
import { AuthModule } from './domain/auth/auth.module';
import { UsersModule } from './domain/users/users.module';
import { SemestersModule } from './domain/semesters/semesters.module';
import { LocationsModule } from './domain/locations/locations.module';
import { BookingsModule } from './domain/bookings/bookings.module';
import { StudentsModule } from './domain/students/students.module';
import { InventoryModule } from './domain/inventory/inventory.module';
import { AccessCardsModule } from './domain/access-cards/access-cards.module';
import { ContractsModule } from './domain/contracts/contracts.module';
import { DamagesModule } from './domain/damages/damages.module';
import { ImportsModule } from './domain/imports/imports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    ScheduleModule.forRoot(),
    AppLoggerModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    SemestersModule,
    LocationsModule,
    BookingsModule,
    StudentsModule,
    InventoryModule,
    AccessCardsModule,
    ContractsModule,
    DamagesModule,
    ImportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
