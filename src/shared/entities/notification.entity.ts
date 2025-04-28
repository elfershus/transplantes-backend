import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Doctor } from './doctor.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column()
  type: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @ManyToOne(() => Doctor, (doctor) => doctor.notifications)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;
}
