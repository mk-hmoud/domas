import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLoggerModule } from './core/logger/logger.module';
import { DatabaseModule } from './core/database/database.module';
import { LocationScopeModule } from './core/location-scope/location-scope.module';
import { StorageModule } from './common/storage/storage.module';
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
import { StudentPortalModule } from './domain/student-portal/student-portal.module';
import { NotificationsModule } from './domain/notifications/notifications.module';
import { AnnouncementsModule } from './domain/announcements/announcements.module';
import { GuestsModule } from './domain/guests/guests.module';
import { StatsModule } from './domain/stats/stats.module';
import { RoomTypesModule } from './domain/room-types/room-types.module';
import { RoomChangesModule } from './domain/room-changes/room-changes.module';
import { PreReservationsModule } from './domain/pre-reservations/pre-reservations.module';
import { DormCertificatesModule } from './domain/dorm-certificates/dorm-certificates.module';
import { MessagesModule } from './domain/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    ScheduleModule.forRoot(),
    AppLoggerModule,
    DatabaseModule,
    LocationScopeModule,
    StorageModule,
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
    StudentPortalModule,
    NotificationsModule,
    AnnouncementsModule,
    GuestsModule,
    StatsModule,
    RoomTypesModule,
    RoomChangesModule,
    PreReservationsModule,
    DormCertificatesModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
