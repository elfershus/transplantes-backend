import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicHistoryService } from './clinic-history.service';
import { ClinicHistoryController } from './clinic-history.controller';
import { ClinicHistory } from '../../shared/entities/clinic-history.entity';
import { Donor } from '../../shared/entities/donor.entity';
import { Receiver } from '../../shared/entities/receiver.entity';
import { SearchFilterService } from '../../shared/services/search-filter.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicHistory, Donor, Receiver])],
  controllers: [ClinicHistoryController],
  providers: [ClinicHistoryService, SearchFilterService],
  exports: [ClinicHistoryService],
})
export class ClinicHistoryModule {}
