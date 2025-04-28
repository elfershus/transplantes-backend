import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Doctor } from '../../shared/entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { GenericCrudService } from '../../shared/services/generic-crud.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DoctorsService extends GenericCrudService<Doctor> {
  constructor(
    @InjectRepository(Doctor)
    protected readonly repository: Repository<Doctor>,
  ) {
    super(repository);
  }

  getRepository(): Repository<Doctor> {
    return this.repository;
  }

  async createDoctor(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const doctor = this.repository.create(createDoctorDto);
    doctor.passwordHash = await bcrypt.hash(createDoctorDto.password, 10);
    return this.repository.save(doctor);
  }

  async updateDoctor(id: number, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);
    Object.assign(doctor, updateDoctorDto);

    if (updateDoctorDto.password) {
      doctor.passwordHash = await bcrypt.hash(updateDoctorDto.password, 10);
    }

    return this.repository.save(doctor);
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    return this.repository.findOne({ where: { email }, relations: ['institutions'] });
  }

  async findByInstitution(
    institutionId: number,
    options?: FindManyOptions<Doctor>,
  ): Promise<Doctor[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.institutions', 'institution')
      .where('institution.id = :institutionId', { institutionId });

    if (options?.where) {
      // Apply additional filters if provided
      Object.entries(options.where).forEach(([key, value]) => {
        queryBuilder.andWhere(`doctor.${key} = :${key}`, { [key]: value });
      });
    }

    if (options?.order) {
      Object.entries(options.order).forEach(([key, value]) => {
        queryBuilder.addOrderBy(`doctor.${key}`, value as 'ASC' | 'DESC');
      });
    }

    if (options?.skip) {
      queryBuilder.skip(options.skip);
    }

    if (options?.take) {
      queryBuilder.take(options.take);
    }

    return queryBuilder.getMany();
  }

  async countByInstitution(
    institutionId: number,
    options?: FindManyOptions<Doctor>,
  ): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder('doctor')
      .leftJoin('doctor.institutions', 'institution')
      .where('institution.id = :institutionId', { institutionId });

    if (options?.where) {
      // Apply additional filters if provided
      Object.entries(options.where).forEach(([key, value]) => {
        queryBuilder.andWhere(`doctor.${key} = :${key}`, { [key]: value });
      });
    }

    return queryBuilder.getCount();
  }
}
