import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransplantProceduresService } from './transplant-procedures.service';
import { TransplantProceduresController } from './transplant-procedures.controller';
import { TransplantProcedure } from '../../shared/entities/transplant-procedure.entity';
import { Compatibility } from '../../shared/entities/compatibility.entity';
import { Receiver } from '../../shared/entities/receiver.entity';
import { Organ } from '../../shared/entities/organ.entity';
import { Doctor } from '../../shared/entities/doctor.entity';
import { Institution } from '../../shared/entities/institution.entity';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransplantProcedure,
      Compatibility,
      Receiver,
      Organ,
      Doctor,
      Institution,
    ]),
    NotificationsModule,
  ],
  controllers: [TransplantProceduresController],
  providers: [TransplantProceduresService, SearchFilterService, EventEmitterService],
  exports: [TransplantProceduresService],
})
export class TransplantProceduresModule {}
