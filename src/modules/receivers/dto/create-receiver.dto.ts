import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ClinicHistoryDto {
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

export class CreateReceiverDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: Date;

  @ApiProperty({ enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] })
  @IsNotEmpty()
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  bloodType: string;

  @ApiProperty({ enum: ['Male', 'Female', 'Other'] })
  @IsNotEmpty()
  @IsEnum(['Male', 'Female', 'Other'])
  gender: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  hlaType?: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  urgencyStatus: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  registrationDate: Date;

  @ApiProperty({ enum: ['waiting', 'matched', 'transplanted', 'inactive', 'deceased'] })
  @IsNotEmpty()
  @IsEnum(['waiting', 'matched', 'transplanted', 'inactive', 'deceased'])
  status: string;

  @ApiProperty({ type: ClinicHistoryDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicHistoryDto)
  clinicHistory?: ClinicHistoryDto;
}
