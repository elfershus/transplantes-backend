import { IsNotEmpty, IsNumber, IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransplantProcedureDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  compatibilityId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  leadDoctorId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  institutionId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  scheduledDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
