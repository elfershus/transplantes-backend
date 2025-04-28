import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiversService } from './receivers.service';
import { ReceiversController } from './receivers.controller';
import { Receiver } from '../../shared/entities/receiver.entity';
import { ClinicHistory } from '../../shared/entities/clinic-history.entity';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Receiver, ClinicHistory])],
  controllers: [ReceiversController],
  providers: [ReceiversService, SearchFilterService, EventEmitterService],
  exports: [ReceiversService],
})
export class ReceiversModule {}
