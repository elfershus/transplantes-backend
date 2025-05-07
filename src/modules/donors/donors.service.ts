import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Donor } from '../../shared/entities/donor.entity';
import { ClinicHistory } from '../../shared/entities/clinic-history.entity';
import { CreateDonorDto } from './dto/create-donor.dto';
import { UpdateDonorDto } from './dto/update-donor.dto';
import { GenericCrudService } from '../../shared/services/generic-crud.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';

@Injectable()
export class DonorsService extends GenericCrudService<Donor> {
  constructor(
    @InjectRepository(Donor)
    protected readonly repository: Repository<Donor>,
    @InjectRepository(ClinicHistory)
    private clinicHistoryRepository: Repository<ClinicHistory>,
    private eventEmitter: EventEmitterService,
  ) {
    super(repository);
  }

  async createDonor(createDonorDto: CreateDonorDto): Promise<Donor> {
    const donorData: DeepPartial<Donor> = {
      firstName: createDonorDto.firstName,
      lastName: createDonorDto.lastName,
      dateOfBirth: createDonorDto.dateOfBirth,
      bloodType: createDonorDto.bloodType,
      gender: createDonorDto.gender,
      hlaType: createDonorDto.hlaType,
      consentStatus: createDonorDto.consentStatus,
      donationDate: createDonorDto.donationDate,
      status: createDonorDto.status,
      email: createDonorDto.email,
      phone: createDonorDto.phone,
      address: createDonorDto.address,
      city: createDonorDto.city,
      postalCode: createDonorDto.postalCode,
    };

    const donor = await super.create(donorData);

    // Create associated clinic history record
    const clinicHistory = this.clinicHistoryRepository.create({
      patientType: 'donor',
      donor: donor,
      medicalHistory: createDonorDto.clinicHistory?.medicalHistory,
      allergies: createDonorDto.clinicHistory?.allergies,
      currentMedications: createDonorDto.clinicHistory?.currentMedications,
      previousSurgeries: createDonorDto.clinicHistory?.previousSurgeries,
    });

    await this.clinicHistoryRepository.save(clinicHistory);

    return this.findOne(donor.id, ['clinicHistory']);
  }

  async create(createDonorDto: CreateDonorDto): Promise<Donor> {
    const donor = await super.create(createDonorDto);

    // Create associated clinic history record
    const clinicHistory = this.clinicHistoryRepository.create({
      patientType: 'donor',
      donor: donor,
      medicalHistory: createDonorDto.clinicHistory?.medicalHistory,
      allergies: createDonorDto.clinicHistory?.allergies,
      currentMedications: createDonorDto.clinicHistory?.currentMedications,
      previousSurgeries: createDonorDto.clinicHistory?.previousSurgeries,
    });

    await this.clinicHistoryRepository.save(clinicHistory);

    return this.findOne(donor.id, ['clinicHistory']);
  }

  async update(id: number, updateDonorDto: UpdateDonorDto): Promise<Donor> {
    const donor = await this.findOne(id, ['clinicHistory']);
    const oldStatus = donor.status;

    // Update donor
    Object.assign(donor, updateDonorDto);
    const updatedDonor = await this.repository.save(donor);

    // Update clinic history if provided
    if (updateDonorDto.clinicHistory) {
      if (donor.clinicHistory) {
        Object.assign(donor.clinicHistory, updateDonorDto.clinicHistory);
        await this.clinicHistoryRepository.save(donor.clinicHistory);
      } else {
        const clinicHistory = this.clinicHistoryRepository.create({
          patientType: 'donor',
          donor: updatedDonor,
          ...updateDonorDto.clinicHistory,
        });
        await this.clinicHistoryRepository.save(clinicHistory);
      }
    }

    // Emit status change event if status was updated
    if (oldStatus !== updatedDonor.status && updatedDonor.status === 'active') {
      this.eventEmitter.emit('donor.activated', updatedDonor);
    }

    return this.findOne(id, ['clinicHistory']);
  }

  async findByBloodType(bloodType: string): Promise<Donor[]> {
    return this.repository.find({
      where: { bloodType, status: 'active' },
      relations: ['organs', 'clinicHistory'],
    });
  }

  async findWithAvailableOrgans(): Promise<Donor[]> {
    return this.repository
      .createQueryBuilder('donor')
      .leftJoinAndSelect('donor.organs', 'organ')
      .leftJoinAndSelect('donor.clinicHistory', 'clinicHistory')
      .where('organ.status = :status', { status: 'available' })
      .getMany();
  }

  async findActiveDonors(): Promise<Donor[]> {
    return this.repository.find({
      where: { status: 'active', consentStatus: true },
      relations: ['clinicHistory'],
      order: { donationDate: 'DESC' },
    });
  }
}
