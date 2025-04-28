import { PartialType } from '@nestjs/swagger';
import { CreateTransportationDto } from './create-transportation.dto';
import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTransportationDto extends PartialType(CreateTransportationDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  actualArrivalTime?: Date;
}
