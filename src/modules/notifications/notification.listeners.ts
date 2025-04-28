import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../../shared/entities/doctor.entity';
import { NotificationsService } from './notifications.service';
import { Compatibility } from 'src/shared/entities/compatibility.entity';
import { Receiver } from 'src/shared/entities/receiver.entity';
import { Transportation } from 'src/shared/entities/transportation.entity';

@Injectable()
export class NotificationListeners {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    @InjectRepository(Compatibility)
    private compatibilityRepository: Repository<Compatibility>,
    @InjectRepository(Transportation)
    private transportationRepository: Repository<Transportation>,
    @InjectRepository(Receiver)
    private receiversRepository: Repository<Receiver>,
    private notificationsService: NotificationsService,
  ) {}

  @OnEvent('organ.created')
  async handleOrganCreatedEvent(organ: any) {
    try {
      // Find doctors that might be interested in this new organ
      const doctors = await this.doctorsRepository.find({
        where: [{ specialty: 'Transplant Surgery' }, { specialty: 'Organ Procurement' }],
      });

      const doctorIds = doctors.map((d) => d.id);

      if (doctorIds.length > 0) {
        await this.notificationsService.createOrganAvailableNotification(
          organ.id,
          organ.type,
          doctorIds,
        );
      }
    } catch (error) {
      console.error('Error handling organ.created event:', error);
    }
  }

  @OnEvent('compatibility.found')
  async handleCompatibilityFoundEvent(compatibility: any) {
    try {
      // Load related data
      const fullCompatibility = await this.compatibilityRepository.findOne({
        where: { id: compatibility.id },
        relations: ['organ', 'receiver', 'receiver.clinicHistory'],
      });

      if (!fullCompatibility) return;

      // Find doctors that should be notified
      const doctors = await this.doctorsRepository.find({
        where: [{ specialty: 'Transplant Surgery' }, { specialty: 'Transplant Coordination' }],
      });

      const doctorIds = doctors.map((d) => d.id);
      const receiverName = `${fullCompatibility.receiver.firstName} ${fullCompatibility.receiver.lastName}`;

      if (doctorIds.length > 0) {
        await this.notificationsService.createCompatibilityFoundNotification(
          fullCompatibility.organ.id,
          fullCompatibility.organ.type,
          fullCompatibility.receiver.id,
          receiverName,
          fullCompatibility.id,
          fullCompatibility.compatibilityScore,
          doctorIds,
        );
      }
    } catch (error) {
      console.error('Error handling compatibility.found event:', error);
    }
  }

  @OnEvent('transportation.status.changed')
  async handleTransportationStatusChangedEvent(payload: {
    transportation: any;
    oldStatus: string;
  }) {
    try {
      const { transportation, oldStatus } = payload;

      // Load related data
      const fullTransportation = await this.transportationRepository.findOne({
        where: { id: transportation.id },
        relations: ['organ', 'originInstitution', 'destinationInstitution'],
      });

      if (!fullTransportation) return;

      // Only send notifications for status changes we care about
      const notifyStatuses = ['in-transit', 'delayed', 'delivered'];
      if (!notifyStatuses.includes(fullTransportation.status)) return;

      // Find doctors at origin and destination institutions
      const originDoctors = await this.doctorsRepository
        .createQueryBuilder('doctor')
        .innerJoin('doctor.institutions', 'institution')
        .where('institution.id = :institutionId', {
          institutionId: fullTransportation.originInstitution.id,
        })
        .getMany();

      const destinationDoctors = await this.doctorsRepository
        .createQueryBuilder('doctor')
        .innerJoin('doctor.institutions', 'institution')
        .where('institution.id = :institutionId', {
          institutionId: fullTransportation.destinationInstitution.id,
        })
        .getMany();

      // Combine doctor IDs (avoid duplicates)
      const doctorIds = [
        ...new Set([...originDoctors.map((d) => d.id), ...destinationDoctors.map((d) => d.id)]),
      ];

      if (doctorIds.length > 0) {
        await this.notificationsService.createTransportStatusNotification(
          fullTransportation.id,
          fullTransportation.organ.id,
          fullTransportation.organ.type,
          fullTransportation.status,
          doctorIds,
        );
      }
    } catch (error) {
      console.error('Error handling transportation.status.changed event:', error);
    }
  }

  @OnEvent('receiver.urgency.updated')
  async handleReceiverUrgencyUpdatedEvent(payload: { receiver: any; oldUrgency: number }) {
    try {
      const { receiver, oldUrgency } = payload;

      // Only notify if urgency increased significantly (e.g., to level 1 or 2)
      if (receiver.urgencyStatus > 2 || receiver.urgencyStatus >= oldUrgency) return;

      // Load related data
      const fullReceiver = await this.receiversRepository.findOne({
        where: { id: receiver.id },
        relations: ['clinicHistory'],
      });

      if (!fullReceiver) return;

      // Find doctors who specialize in transplants
      const doctors = await this.doctorsRepository.find({
        where: { specialty: 'Transplant Surgery' },
      });

      const doctorIds = doctors.map((d) => d.id);
      const receiverName = `${fullReceiver.firstName} ${fullReceiver.lastName}`;

      if (doctorIds.length > 0) {
        await this.notificationsService.createUrgentReceiverNotification(
          fullReceiver.id,
          receiverName,
          fullReceiver.urgencyStatus,
          fullReceiver.bloodType,
          'kidney', // This would come from the receiver's needs
          doctorIds,
        );
      }
    } catch (error) {
      console.error('Error handling receiver.urgency.updated event:', error);
    }
  }
}
