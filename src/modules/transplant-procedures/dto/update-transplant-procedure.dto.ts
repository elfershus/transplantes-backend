import { PartialType } from '@nestjs/swagger';
import { CreateTransplantProcedureDto } from './create-transplant-procedure.dto';
import { IsEnum, IsNumber, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTransplantProcedureDto extends PartialType(CreateTransplantProcedureDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  actualDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiProperty({ enum: ['successful', 'failed', 'complications'], required: false })
  @IsOptional()
  @IsEnum(['successful', 'failed', 'complications'])
  outcome?: string;

  @ApiProperty({ enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], required: false })
  @IsOptional()
  @IsEnum(['scheduled', 'in-progress', 'completed', 'cancelled'])
  status?: string;
}
