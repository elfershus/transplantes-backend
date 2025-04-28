import { IsNotEmpty, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClinicHistoryDto {
  @ApiProperty({ enum: ['donor', 'receiver'] })
  @IsNotEmpty()
  @IsEnum(['donor', 'receiver'])
  patientType: 'donor' | 'receiver';

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  patientId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currentMedications?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  previousSurgeries?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  laboratoryResults?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  imagingResults?: any;
}
