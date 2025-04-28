import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from '../../shared/entities/doctor.entity';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { SearchFilterService } from '../../shared/services/search-filter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor])],
  controllers: [DoctorsController],
  providers: [DoctorsService, SearchFilterService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
