import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from '../../shared/entities/notification.entity';
import { Doctor } from '../../shared/entities/doctor.entity';
import { WebsocketGateway } from './websocket.gateway';
import { NotificationListeners } from './notification.listeners';
import { Compatibility } from '../../shared/entities/compatibility.entity';
import { Transportation } from '../../shared/entities/transportation.entity';
import { Receiver } from '../../shared/entities/receiver.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Doctor, Compatibility, Transportation, Receiver]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, WebsocketGateway, NotificationListeners],
  exports: [NotificationsService],
})
export class NotificationsModule {}
