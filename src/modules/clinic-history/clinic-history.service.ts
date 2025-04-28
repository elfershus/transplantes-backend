import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicHistory } from '../../shared/entities/clinic-history.entity';
import { Donor } from '../../shared/entities/donor.entity';
import { Receiver } from '../../shared/entities/receiver.entity';
import { CreateClinicHistoryDto } from './dto/create-clinic-history.dto';
import { UpdateClinicHistoryDto } from './dto/update-clinic-history.dto';
import { GenericCrudService } from '../../shared/services/generic-crud.service';

@Injectable()
export class ClinicHistoryService extends GenericCrudService<ClinicHistory> {
  constructor(
    @InjectRepository(ClinicHistory)
    protected readonly repository: Repository<ClinicHistory>,
    @InjectRepository(Donor)
    private donorRepository: Repository<Donor>,
    @InjectRepository(Receiver)
    private receiverRepository: Repository<Receiver>,
  ) {
    super(repository);
  }

  async create(createClinicHistoryDto: CreateClinicHistoryDto): Promise<ClinicHistory> {
    const { patientType, patientId, ...clinicHistoryData } = createClinicHistoryDto;

    // Check if a clinic history already exists for this patient
    const existingHistory = await this.repository.findOne({
      where: [
        { patientType, donor: { id: patientId } },
        { patientType, receiver: { id: patientId } },
      ],
    });

    if (existingHistory) {
      throw new BadRequestException(`Clinic history already exists for this ${patientType}`);
    }

    const clinicHistory = this.repository.create(clinicHistoryData);
    clinicHistory.patientType = patientType;

    if (patientType === 'donor') {
      const donor = await this.donorRepository.findOne({ where: { id: patientId } });
      if (!donor) {
        throw new NotFoundException(`Donor with ID ${patientId} not found`);
      }
      clinicHistory.donor = donor;
    } else if (patientType === 'receiver') {
      const receiver = await this.receiverRepository.findOne({ where: { id: patientId } });
      if (!receiver) {
        throw new NotFoundException(`Receiver with ID ${patientId} not found`);
      }
      clinicHistory.receiver = receiver;
    } else {
      throw new BadRequestException('Invalid patient type. Must be either "donor" or "receiver"');
    }

    return this.repository.save(clinicHistory);
  }

  async findByPatient(
    patientType: 'donor' | 'receiver',
    patientId: number,
  ): Promise<ClinicHistory> {
    const clinicHistory = await this.repository.findOne({
      where:
        patientType === 'donor'
          ? { patientType, donor: { id: patientId } }
          : { patientType, receiver: { id: patientId } },
      relations: [patientType],
    });

    if (!clinicHistory) {
      throw new NotFoundException(
        `Clinic history not found for ${patientType} with ID ${patientId}`,
      );
    }

    return clinicHistory;
  }

  async updateLaboratoryResults(id: number, laboratoryResults: any): Promise<ClinicHistory> {
    const clinicHistory = await this.findOne(id);

    // Merge with existing laboratory results
    clinicHistory.laboratoryResults = {
      ...(clinicHistory.laboratoryResults || {}),
      ...laboratoryResults,
      lastUpdated: new Date(),
    };

    return this.repository.save(clinicHistory);
  }

  async updateImagingResults(id: number, imagingResults: any): Promise<ClinicHistory> {
    const clinicHistory = await this.findOne(id);

    // Merge with existing imaging results
    clinicHistory.imagingResults = {
      ...(clinicHistory.imagingResults || {}),
      ...imagingResults,
      lastUpdated: new Date(),
    };

    return this.repository.save(clinicHistory);
  }

  async addMedicalHistoryEntry(id: number, entry: string): Promise<ClinicHistory> {
    const clinicHistory = await this.findOne(id);

    const timestamp = new Date().toISOString();
    const newEntry = `[${timestamp}] ${entry}`;

    clinicHistory.medicalHistory = clinicHistory.medicalHistory
      ? `${clinicHistory.medicalHistory}\n${newEntry}`
      : newEntry;

    return this.repository.save(clinicHistory);
  }

  async getClinicHistorySummary(id: number): Promise<any> {
    const clinicHistory = await this.findOne(id, ['donor', 'receiver']);

    const summary = {
      patientInfo:
        clinicHistory.patientType === 'donor'
          ? {
              type: 'donor',
              name: `${clinicHistory.donor.firstName} ${clinicHistory.donor.lastName}`,
              bloodType: clinicHistory.donor.bloodType,
              status: clinicHistory.donor.status,
            }
          : {
              type: 'receiver',
              name: `${clinicHistory.receiver.firstName} ${clinicHistory.receiver.lastName}`,
              bloodType: clinicHistory.receiver.bloodType,
              status: clinicHistory.receiver.status,
              urgencyStatus: clinicHistory.receiver.urgencyStatus,
            },
      hasAllergies: !!clinicHistory.allergies,
      hasMedications: !!clinicHistory.currentMedications,
      hasPreviousSurgeries: !!clinicHistory.previousSurgeries,
      lastLabResults: clinicHistory.laboratoryResults?.lastUpdated || null,
      lastImagingResults: clinicHistory.imagingResults?.lastUpdated || null,
    };

    return summary;
  }
}
