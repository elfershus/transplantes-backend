import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/auth.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { DonorsModule } from './modules/donors/donors.module';
import { ReceiversModule } from './modules/receivers/receivers.module';
import { OrgansModule } from './modules/organs/organs.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CompatibilityModule } from './modules/compatibility/compatibility.module';
import { TransportationModule } from './modules/transportation/transportation.module';
import { ClinicHistoryModule } from './modules/clinic-history/clinic-history.module';
import { TransplantProceduresModule } from './modules/transplant-procedures/transplant-procedures.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './modules/auth/auth.controller';
import { JwtStrategy } from './modules/auth/strategies/jwt.strategy';
import { LocalStrategy } from './modules/auth/strategies/local.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { SeedModule } from './shared/modules/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),

    EventEmitterModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: configService.get('environment') !== 'production',
        ssl: configService.get('database.ssl')
          ? {
              rejectUnauthorized: configService.get('database.sslRejectUnauthorized', true),
            }
          : false,
      }),
      inject: [ConfigService],
    }),

    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    DoctorsModule,
    InstitutionsModule,
    DonorsModule,
    ReceiversModule,
    OrgansModule,
    CompatibilityModule,
    TransportationModule,
    ClinicHistoryModule,
    TransplantProceduresModule,
    NotificationsModule,
    ReportingModule,
    SeedModule,
  ],
  providers: [LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AppModule {}
