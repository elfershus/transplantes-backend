import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsSimpleDate } from '../../../common/validators';

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

  @ApiProperty({ description: 'Scheduled date in YYYY-MM-DD format' })
  @IsNotEmpty()
  @IsSimpleDate()
  scheduledDate: string | Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
