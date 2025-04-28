import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Compatibility } from './compatibility.entity';
import { ClinicHistory } from './clinic-history.entity';
import { TransplantProcedure } from './transplant-procedure.entity';

@Entity('receivers')
export class Receiver extends BaseEntity {
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

  @Column({ name: 'urgency_status' })
  urgencyStatus: number;

  @Column({ name: 'registration_date', type: 'date' })
  registrationDate: Date;

  @Column()
  status: string;

  @OneToMany(() => Compatibility, (compatibility) => compatibility.receiver)
  compatibilities: Compatibility[];

  @OneToOne(() => ClinicHistory, (history) => history.receiver)
  clinicHistory: ClinicHistory;

  @OneToMany(() => TransplantProcedure, (procedure) => procedure.receiver)
  procedures: TransplantProcedure[];
}
