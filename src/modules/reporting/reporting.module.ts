import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { Organ } from '../../shared/entities/organ.entity';
import { Donor } from '../../shared/entities/donor.entity';
import { Receiver } from '../../shared/entities/receiver.entity';
import { TransplantProcedure } from '../../shared/entities/transplant-procedure.entity';
import { Transportation } from '../../shared/entities/transportation.entity';
import { Institution } from '../../shared/entities/institution.entity';
import { ParseDatePipe } from '../../common/pipes/parse-date.pipe';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organ,
      Donor,
      Receiver,
      TransplantProcedure,
      Transportation,
      Institution,
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService, ParseDatePipe],
  exports: [ReportingService],
})
export class ReportingModule {}
