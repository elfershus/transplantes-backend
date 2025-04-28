import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Receiver } from '../../shared/entities/receiver.entity';
import { ClinicHistory } from '../../shared/entities/clinic-history.entity';
import { CreateReceiverDto } from './dto/create-receiver.dto';
import { UpdateReceiverDto } from './dto/update-receiver.dto';
import { GenericCrudService } from '../../shared/services/generic-crud.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';

@Injectable()
export class ReceiversService extends GenericCrudService<Receiver> {
  constructor(
    @InjectRepository(Receiver)
    protected readonly repository: Repository<Receiver>,
    @InjectRepository(ClinicHistory)
    private clinicHistoryRepository: Repository<ClinicHistory>,
    private eventEmitter: EventEmitterService,
  ) {
    super(repository);
  }

  async create(createReceiverDto: CreateReceiverDto): Promise<Receiver> {
    const receiver = await super.create(createReceiverDto);

    // Create associated clinic history record
    const clinicHistory = this.clinicHistoryRepository.create({
      patientType: 'receiver',
      receiver: receiver,
      medicalHistory: createReceiverDto.clinicHistory?.medicalHistory,
      allergies: createReceiverDto.clinicHistory?.allergies,
      currentMedications: createReceiverDto.clinicHistory?.currentMedications,
      previousSurgeries: createReceiverDto.clinicHistory?.previousSurgeries,
      laboratoryResults: createReceiverDto.clinicHistory?.laboratoryResults,
      imagingResults: createReceiverDto.clinicHistory?.imagingResults,
    });

    await this.clinicHistoryRepository.save(clinicHistory);

    if (receiver.urgencyStatus <= 2) {
      this.eventEmitter.emitReceiverUrgencyUpdated(receiver, 999); // Assuming 999 as default for new receivers
    }

    return this.findOne(receiver.id, ['clinicHistory']);
  }

  // Use a different method name to avoid override conflicts
  async createReceiver(createReceiverDto: CreateReceiverDto): Promise<Receiver> {
    const receiverData: DeepPartial<Receiver> = {
      firstName: createReceiverDto.firstName,
      lastName: createReceiverDto.lastName,
      dateOfBirth: createReceiverDto.dateOfBirth,
      bloodType: createReceiverDto.bloodType,
      gender: createReceiverDto.gender,
      hlaType: createReceiverDto.hlaType,
      urgencyStatus: createReceiverDto.urgencyStatus,
      registrationDate: createReceiverDto.registrationDate,
      status: createReceiverDto.status,
    };

    const receiver = await super.create(receiverData);

    // Create associated clinic history record
    const clinicHistory = this.clinicHistoryRepository.create({
      patientType: 'receiver',
      receiver: receiver,
      medicalHistory: createReceiverDto.clinicHistory?.medicalHistory,
      allergies: createReceiverDto.clinicHistory?.allergies,
      currentMedications: createReceiverDto.clinicHistory?.currentMedications,
      previousSurgeries: createReceiverDto.clinicHistory?.previousSurgeries,
      laboratoryResults: createReceiverDto.clinicHistory?.laboratoryResults,
      imagingResults: createReceiverDto.clinicHistory?.imagingResults,
    });

    await this.clinicHistoryRepository.save(clinicHistory);

    if (receiver.urgencyStatus <= 2) {
      this.eventEmitter.emitReceiverUrgencyUpdated(receiver, 999);
    }

    return this.findOne(receiver.id, ['clinicHistory']);
  }

  async update(id: number, updateReceiverDto: UpdateReceiverDto): Promise<Receiver> {
    const receiver = await this.findOne(id, ['clinicHistory']);
    const oldUrgencyStatus = receiver.urgencyStatus;

    // Update receiver
    Object.assign(receiver, updateReceiverDto);
    const updatedReceiver = await this.repository.save(receiver);

    // Update clinic history if provided
    if (updateReceiverDto.clinicHistory) {
      if (receiver.clinicHistory) {
        Object.assign(receiver.clinicHistory, updateReceiverDto.clinicHistory);
        await this.clinicHistoryRepository.save(receiver.clinicHistory);
      } else {
        const clinicHistory = this.clinicHistoryRepository.create({
          patientType: 'receiver',
          receiver: updatedReceiver,
          ...updateReceiverDto.clinicHistory,
        });
        await this.clinicHistoryRepository.save(clinicHistory);
      }
    }

    // Emit urgency update event if urgency was changed
    if (oldUrgencyStatus !== updatedReceiver.urgencyStatus) {
      this.eventEmitter.emitReceiverUrgencyUpdated(updatedReceiver, oldUrgencyStatus);
    }

    return this.findOne(id, ['clinicHistory']);
  }

  async findByUrgencyLevel(urgencyLevel: number): Promise<Receiver[]> {
    return this.repository.find({
      where: { urgencyStatus: urgencyLevel, status: 'waiting' },
      relations: ['clinicHistory', 'compatibilities'],
      order: { registrationDate: 'ASC' },
    });
  }

  async findByBloodType(bloodType: string, organType?: string): Promise<Receiver[]> {
    const query = this.repository
      .createQueryBuilder('receiver')
      .leftJoinAndSelect('receiver.clinicHistory', 'clinicHistory')
      .where('receiver.bloodType = :bloodType', { bloodType })
      .andWhere('receiver.status = :status', { status: 'waiting' });

    if (organType) {
      // This would require additional filtering based on the organ type needed
      // For now, we'll return all receivers with the matching blood type
    }

    return query.orderBy('receiver.urgencyStatus', 'ASC').getMany();
  }

  async findWaitingReceivers(): Promise<Receiver[]> {
    return this.repository.find({
      where: { status: 'waiting' },
      relations: ['clinicHistory'],
      order: { urgencyStatus: 'ASC', registrationDate: 'ASC' },
    });
  }

  async getWaitlistStatistics(): Promise<any> {
    const waitingReceivers = await this.findWaitingReceivers();

    const statistics = {
      total: waitingReceivers.length,
      byUrgencyLevel: {},
      byBloodType: {},
      byAgeGroup: {},
      averageWaitTime: 0,
    };

    let totalWaitTimeInDays = 0;

    waitingReceivers.forEach((receiver) => {
      // By urgency level
      const urgencyLevel = receiver.urgencyStatus.toString();
      statistics.byUrgencyLevel[urgencyLevel] = (statistics.byUrgencyLevel[urgencyLevel] || 0) + 1;

      // By blood type
      statistics.byBloodType[receiver.bloodType] =
        (statistics.byBloodType[receiver.bloodType] || 0) + 1;

      // By age group
      const age = this.calculateAge(receiver.dateOfBirth);
      const ageGroup = this.getAgeGroup(age);
      statistics.byAgeGroup[ageGroup] = (statistics.byAgeGroup[ageGroup] || 0) + 1;

      // Calculate wait time
      const waitTimeInDays = Math.floor(
        (new Date().getTime() - new Date(receiver.registrationDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      totalWaitTimeInDays += waitTimeInDays;
    });

    statistics.averageWaitTime =
      waitingReceivers.length > 0 ? totalWaitTimeInDays / waitingReceivers.length : 0;

    return statistics;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return '0-17';
    if (age < 35) return '18-34';
    if (age < 50) return '35-49';
    if (age < 65) return '50-64';
    return '65+';
  }
}
