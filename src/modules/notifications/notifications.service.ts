import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../shared/entities/notification.entity';
import { Doctor } from '../../shared/entities/doctor.entity';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    private websocketGateway: WebsocketGateway,
  ) {}

  async findAllForDoctor(doctorId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { doctor: { id: doctorId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnreadForDoctor(doctorId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: {
        doctor: { id: doctorId },
        read: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number, doctorId: number): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: {
        id,
        doctor: { id: doctorId },
      },
    });

    if (!notification) {
      throw new Error('Notification not found or does not belong to the doctor');
    }

    notification.read = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(doctorId: number): Promise<void> {
    await this.notificationsRepository.update(
      { doctor: { id: doctorId }, read: false },
      { read: true },
    );
  }

  async createNotification(
    doctorId: number,
    type: string,
    title: string,
    message: string,
    data?: any,
  ): Promise<Notification> {
    const doctor = await this.doctorsRepository.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new Error(`Doctor with ID ${doctorId} not found`);
    }

    const notification = this.notificationsRepository.create({
      type,
      title,
      message,
      data,
      read: false,
      doctor,
    });

    const savedNotification = await this.notificationsRepository.save(notification);

    // Send realtime notification via WebSocket
    this.websocketGateway.sendNotificationToUser(doctorId, {
      id: savedNotification.id,
      type: savedNotification.type,
      title: savedNotification.title,
      message: savedNotification.message,
      createdAt: savedNotification.createdAt,
    });

    return savedNotification;
  }

  async createOrganAvailableNotification(
    organId: number,
    organType: string,
    doctorIds: number[],
  ): Promise<void> {
    const title = 'New Organ Available';
    const message = `A new ${organType} is now available for transplant.`;
    const type = 'ORGAN_AVAILABLE';
    const data = { organId, organType };

    for (const doctorId of doctorIds) {
      await this.createNotification(doctorId, type, title, message, data);
    }
  }

  async createCompatibilityFoundNotification(
    organId: number,
    organType: string,
    receiverId: number,
    receiverName: string,
    compatibilityId: number,
    compatibilityScore: number,
    doctorIds: number[],
  ): Promise<void> {
    const title = 'Potential Match Found';
    const message = `A potential match (score: ${compatibilityScore.toFixed(2)}) has been found between ${receiverName} and a ${organType}.`;
    const type = 'COMPATIBILITY_FOUND';
    const data = {
      organId,
      organType,
      receiverId,
      receiverName,
      compatibilityId,
      compatibilityScore,
    };

    for (const doctorId of doctorIds) {
      await this.createNotification(doctorId, type, title, message, data);
    }
  }

  async createTransportStatusNotification(
    transportId: number,
    organId: number,
    organType: string,
    status: string,
    doctorIds: number[],
  ): Promise<void> {
    const title = 'Transport Status Update';
    const message = `The ${organType} transport is now ${status}.`;
    const type = 'TRANSPORT_STATUS';
    const data = { transportId, organId, organType, status };

    for (const doctorId of doctorIds) {
      await this.createNotification(doctorId, type, title, message, data);
    }
  }

  async createUrgentReceiverNotification(
    receiverId: number,
    receiverName: string,
    urgencyLevel: number,
    receiverBloodType: string,
    neededOrganType: string,
    doctorIds: number[],
  ): Promise<void> {
    const title = 'Urgent Receiver Status';
    const message = `${receiverName} has been updated to urgency level ${urgencyLevel} and needs a ${neededOrganType} transplant (blood type: ${receiverBloodType}).`;
    const type = 'URGENT_RECEIVER';
    const data = {
      receiverId,
      receiverName,
      urgencyLevel,
      receiverBloodType,
      neededOrganType,
    };

    for (const doctorId of doctorIds) {
      await this.createNotification(doctorId, type, title, message, data);
    }
  }
}
