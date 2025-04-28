import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organ } from './organ.entity';
import { Institution } from './institution.entity';

@Entity('transportation')
export class Transportation extends BaseEntity {
  @Column({ name: 'departure_time', type: 'timestamp' })
  departureTime: Date;

  @Column({ name: 'estimated_arrival_time', type: 'timestamp' })
  estimatedArrivalTime: Date;

  @Column({ name: 'actual_arrival_time', type: 'timestamp', nullable: true })
  actualArrivalTime: Date;

  @Column({ name: 'transport_method' })
  transportMethod: string;

  @Column({ name: 'transport_company', nullable: true })
  transportCompany: string;

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber: string;

  @Column()
  status: string;

  @ManyToOne(() => Organ, (organ) => organ.transportations)
  @JoinColumn({ name: 'organ_id' })
  organ: Organ;

  @ManyToOne(() => Institution, (institution) => institution.outgoingTransports)
  @JoinColumn({ name: 'origin_institution_id' })
  originInstitution: Institution;

  @ManyToOne(() => Institution, (institution) => institution.incomingTransports)
  @JoinColumn({ name: 'destination_institution_id' })
  destinationInstitution: Institution;
}
