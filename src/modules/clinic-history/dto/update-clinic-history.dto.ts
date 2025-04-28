import { PartialType } from '@nestjs/swagger';
import { CreateClinicHistoryDto } from './create-clinic-history.dto';

export class UpdateClinicHistoryDto extends PartialType(CreateClinicHistoryDto) {}
