import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportationService } from './transportation.service';
import { TransportationController } from './transportation.controller';
import { Transportation } from '../../shared/entities/transportation.entity';
import { Organ } from '../../shared/entities/organ.entity';
import { Institution } from '../../shared/entities/institution.entity';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transportation, Organ, Institution]), NotificationsModule],
  controllers: [TransportationController],
  providers: [TransportationService, SearchFilterService, EventEmitterService],
  exports: [TransportationService],
})
export class TransportationModule {}
