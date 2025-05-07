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

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @OneToMany(() => Organ, (organ) => organ.donor)
  organs: Organ[];

  @OneToOne(() => ClinicHistory, (history) => history.donor)
  clinicHistory: ClinicHistory;
}
