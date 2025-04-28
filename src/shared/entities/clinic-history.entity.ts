import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Donor } from './donor.entity';
import { Receiver } from './receiver.entity';

@Entity('clinic_history')
export class ClinicHistory extends BaseEntity {
  @Column({ name: 'patient_type' })
  patientType: 'donor' | 'receiver';

  @Column({ name: 'medical_history', type: 'text', nullable: true })
  medicalHistory: string;

  @Column({ type: 'text', nullable: true })
  allergies: string;

  @Column({ name: 'current_medications', type: 'text', nullable: true })
  currentMedications: string;

  @Column({ name: 'previous_surgeries', type: 'text', nullable: true })
  previousSurgeries: string;

  @Column({ name: 'laboratory_results', type: 'jsonb', nullable: true })
  laboratoryResults: any;

  @Column({ name: 'imaging_results', type: 'jsonb', nullable: true })
  imagingResults: any;

  @OneToOne(() => Donor, (donor) => donor.clinicHistory, { nullable: true })
  @JoinColumn({ name: 'donor_id' })
  donor: Donor;

  @OneToOne(() => Receiver, (receiver) => receiver.clinicHistory, { nullable: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver: Receiver;
}
