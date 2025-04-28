import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionsService } from './institutions.service';
import { InstitutionsController } from './institutions.controller';
import { Institution } from '../../shared/entities/institution.entity';
import { SearchFilterService } from '../../shared/services/search-filter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Institution])],
  controllers: [InstitutionsController],
  providers: [InstitutionsService, SearchFilterService],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}
