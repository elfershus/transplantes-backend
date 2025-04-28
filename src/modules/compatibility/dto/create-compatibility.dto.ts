import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompatibilityDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  organId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  receiverId: number;

  @ApiProperty({ minimum: 0, maximum: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  compatibilityScore?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ enum: ['potential', 'confirmed', 'rejected', 'completed'], required: false })
  @IsOptional()
  @IsEnum(['potential', 'confirmed', 'rejected', 'completed'])
  status?: string;
}
