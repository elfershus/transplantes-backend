import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsSimpleDate } from '../../../common/validators';

export class CreateOrganDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  donorId: number;

  @ApiProperty({ enum: ['heart', 'liver', 'kidney', 'lung', 'pancreas', 'intestine'] })
  @IsNotEmpty()
  @IsEnum(['heart', 'liver', 'kidney', 'lung', 'pancreas', 'intestine'])
  type: string;

  @ApiProperty({ required: false, description: 'Retrieval date in YYYY-MM-DD format' })
  @IsOptional()
  @IsSimpleDate()
  retrievalDate?: string | Date;

  @ApiProperty({ required: false, description: 'Expiration date in YYYY-MM-DD format' })
  @IsOptional()
  @IsSimpleDate()
  expirationDate?: string | Date;

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
