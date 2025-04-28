import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Institution } from '../../shared/entities/institution.entity';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { GenericCrudService } from '../../shared/services/generic-crud.service';

@Injectable()
export class InstitutionsService extends GenericCrudService<Institution> {
  constructor(
    @InjectRepository(Institution)
    protected readonly repository: Repository<Institution>,
  ) {
    super(repository);
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Institution | null> {
    return this.repository.findOne({ where: { licenseNumber } });
  }

  async findWithDoctors(id: number): Promise<Institution> {
    const institution = await this.repository.findOne({
      where: { id },
      relations: ['doctors'],
    });

    if (!institution) {
      throw new NotFoundException(`Institution with ID ${id} not found`);
    }

    return institution;
  }

  async findWithActiveDoctors(id: number): Promise<Institution> {
    const institution = await this.repository
      .createQueryBuilder('institution')
      .leftJoinAndSelect('institution.doctors', 'doctor')
      .where('institution.id = :id', { id })
      .andWhere('doctor.status = :status', { status: 'active' })
      .getOne();

    if (!institution) {
      throw new NotFoundException(`Institution with ID ${id} not found`);
    }

    return institution;
  }

  async findInstitutionsWithAvailableOrgans(): Promise<Institution[]> {
    return this.repository
      .createQueryBuilder('institution')
      .leftJoinAndSelect('institution.organs', 'organ')
      .where('organ.status = :status', { status: 'available' })
      .getMany();
  }
}
