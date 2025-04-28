// src/shared/services/event-emitter.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventEmitterService {
  constructor(private eventEmitter: EventEmitter2) {}

  emitOrganCreated(organ: any) {
    this.eventEmitter.emit('organ.created', organ);
  }

  emitOrganStatusChanged(organ: any, oldStatus: string) {
    this.eventEmitter.emit('organ.status.changed', { organ, oldStatus });
  }

  emitCompatibilityFound(compatibility: any) {
    this.eventEmitter.emit('compatibility.found', compatibility);
  }

  emitCompatibilityStatusChanged(compatibility: any, oldStatus: string) {
    this.eventEmitter.emit('compatibility.status.changed', { compatibility, oldStatus });
  }

  emitTransportationStatusChanged(transportation: any, oldStatus: string) {
    this.eventEmitter.emit('transportation.status.changed', { transportation, oldStatus });
  }

  emitReceiverUrgencyUpdated(receiver: any, oldUrgency: number) {
    this.eventEmitter.emit('receiver.urgency.updated', { receiver, oldUrgency });
  }

  emitTransplantScheduled(procedure: any) {
    this.eventEmitter.emit('transplant.scheduled', procedure);
  }

  emitTransplantCompleted(procedure: any) {
    this.eventEmitter.emit('transplant.completed', procedure);
  }

  emit(event: string, data: any) {
    this.eventEmitter.emit(event, data);
  }
}
