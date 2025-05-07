import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsSimpleDate } from '../../../common/validators';

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

  @ApiProperty({ description: 'Date of birth in YYYY-MM-DD format' })
  @IsNotEmpty()
  @IsSimpleDate()
  dateOfBirth: string | Date;

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

  @ApiProperty({ required: false, description: 'Donation date in YYYY-MM-DD format' })
  @IsOptional()
  @IsSimpleDate()
  donationDate?: string | Date;

  @ApiProperty({ enum: ['active', 'inactive', 'deceased', 'disqualified'] })
  @IsNotEmpty()
  @IsEnum(['active', 'inactive', 'deceased', 'disqualified'])
  status: string;

  @ApiProperty({ type: ClinicHistoryDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicHistoryDto)
  clinicHistory?: ClinicHistoryDto;

  // Contact information fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;
}
