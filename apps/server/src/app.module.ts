import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    AppLoggerModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    SemestersModule,
    LocationsModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
