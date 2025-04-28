// src/modules/institutions/dto/create-institution.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInstitutionDto {
  @ApiProperty({ example: 'City General Hospital' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Medical Center Drive, City, State 12345' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: '+1-555-123-4567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'contact@hospital.org', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'MED-12345' })
  @IsNotEmpty()
  @IsString()
  licenseNumber: string;
}
