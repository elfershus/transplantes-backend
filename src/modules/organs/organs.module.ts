import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgansService } from './organs.service';
import { OrgansController } from './organs.controller';
import { Organ } from '../../shared/entities/organ.entity';
import { Donor } from '../../shared/entities/donor.entity';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Organ, Donor]), NotificationsModule],
  controllers: [OrgansController],
  providers: [OrgansService, SearchFilterService, EventEmitterService],
  exports: [OrgansService],
})
export class OrgansModule {}
