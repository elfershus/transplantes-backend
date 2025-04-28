import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Doctor } from './doctor.entity';
import { Institution } from './institution.entity';
import { Receiver } from './receiver.entity';
import { Organ } from './organ.entity';
import { Compatibility } from './compatibility.entity';

@Entity('transplant_procedures')
export class TransplantProcedure extends BaseEntity {
  @Column({ name: 'scheduled_date', type: 'timestamp' })
  scheduledDate: Date;

  @Column({ name: 'actual_date', type: 'timestamp', nullable: true })
  actualDate: Date;

  @Column({ name: 'duration_minutes', nullable: true })
  durationMinutes: number;

  @Column({ nullable: true })
  outcome: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  status: string; // Add this field

  @ManyToOne(() => Doctor, (doctor) => doctor.procedures)
  @JoinColumn({ name: 'lead_doctor_id' })
  leadDoctor: Doctor;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @ManyToOne(() => Receiver, (receiver) => receiver.procedures)
  @JoinColumn({ name: 'receiver_id' })
  receiver: Receiver;

  @ManyToOne(() => Organ)
  @JoinColumn({ name: 'organ_id' })
  organ: Organ;

  @OneToOne(() => Compatibility, (compatibility) => compatibility.transplantProcedure)
  @JoinColumn({ name: 'compatibility_id' })
  compatibility: Compatibility;
}
