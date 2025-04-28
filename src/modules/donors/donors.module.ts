import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorsService } from './donors.service';
import { DonorsController } from './donors.controller';
import { Donor } from '../../shared/entities/donor.entity';
import { ClinicHistory } from '../../shared/entities/clinic-history.entity';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Donor, ClinicHistory])],
  controllers: [DonorsController],
  providers: [DonorsService, SearchFilterService, EventEmitterService],
  exports: [DonorsService],
})
export class DonorsModule {}
