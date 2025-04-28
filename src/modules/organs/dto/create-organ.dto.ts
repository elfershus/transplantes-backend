import { IsNotEmpty, IsString, IsEnum, IsDateString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  donorId: number;

  @ApiProperty({ enum: ['heart', 'liver', 'kidney', 'lung', 'pancreas', 'intestine'] })
  @IsNotEmpty()
  @IsEnum(['heart', 'liver', 'kidney', 'lung', 'pancreas', 'intestine'])
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  retrievalDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expirationDate?: Date;

  @ApiProperty({ enum: ['excellent', 'good', 'fair', 'poor'] })
  @IsNotEmpty()
  @IsEnum(['excellent', 'good', 'fair', 'poor'])
  condition: string;

  @ApiProperty({ enum: ['available', 'matched', 'in-transit', 'transplanted', 'expired'] })
  @IsNotEmpty()
  @IsEnum(['available', 'matched', 'in-transit', 'transplanted', 'expired'])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  storageLocation?: string;
}
