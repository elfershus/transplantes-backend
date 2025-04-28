import { PartialType } from '@nestjs/swagger';
import { CreateCompatibilityDto } from './create-compatibility.dto';

export class UpdateCompatibilityDto extends PartialType(CreateCompatibilityDto) {}
