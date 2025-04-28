import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsOptional,
  ValidateNested,
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
}

export class CreateDonorDto {
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

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  consentStatus: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  donationDate?: Date;

  @ApiProperty({ enum: ['active', 'inactive', 'deceased', 'disqualified'] })
  @IsNotEmpty()
  @IsEnum(['active', 'inactive', 'deceased', 'disqualified'])
  status: string;

  @ApiProperty({ type: ClinicHistoryDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicHistoryDto)
  clinicHistory?: ClinicHistoryDto;
}
