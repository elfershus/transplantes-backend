import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organ } from './organ.entity';
import { ClinicHistory } from './clinic-history.entity';

@Entity('donors')
export class Donor extends BaseEntity {
  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ name: 'blood_type' })
  bloodType: string;

  @Column()
  gender: string;

  @Column({ name: 'hla_type', nullable: true })
  hlaType: string;

  @Column({ name: 'consent_status', default: false })
  consentStatus: boolean;

  @Column({ name: 'donation_date', type: 'date', nullable: true })
  donationDate: Date;

  @Column()
  status: string;

  @OneToMany(() => Organ, (organ) => organ.donor)
  organs: Organ[];

  @OneToOne(() => ClinicHistory, (history) => history.donor)
  clinicHistory: ClinicHistory;
}
