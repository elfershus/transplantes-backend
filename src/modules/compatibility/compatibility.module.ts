import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompatibilityService } from './compatibility.service';
import { CompatibilityController } from './compatibility.controller';
import { Compatibility } from '../../shared/entities/compatibility.entity';
import { Organ } from '../../shared/entities/organ.entity';
import { Receiver } from '../../shared/entities/receiver.entity';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Compatibility, Organ, Receiver]), NotificationsModule],
  controllers: [CompatibilityController],
  providers: [CompatibilityService, SearchFilterService, EventEmitterService],
  exports: [CompatibilityService],
})
export class CompatibilityModule {}
