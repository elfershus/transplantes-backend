// src/modules/transportation/dto/create-transportation.dto.ts
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransportationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  organId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  originInstitutionId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  destinationInstitutionId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  departureTime: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  estimatedArrivalTime: Date;

  @ApiProperty({ enum: ['ground', 'air', 'helicopter', 'ambulance'] })
  @IsNotEmpty()
  @IsEnum(['ground', 'air', 'helicopter', 'ambulance'])
  transportMethod: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  transportCompany?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({
    enum: ['scheduled', 'in-transit', 'delivered', 'delayed', 'cancelled'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['scheduled', 'in-transit', 'delivered', 'delayed', 'cancelled'])
  status?: string;
}
