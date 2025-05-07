import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from '../entities/doctor.entity';
import { SeedService } from '../services/seed.service';
import { SeedAdminCommand } from '../commands/seed.command';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor])],
  providers: [SeedService, SeedAdminCommand],
  exports: [SeedService],
})
export class SeedModule {}
