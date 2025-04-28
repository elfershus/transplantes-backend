import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Institution } from './institution.entity';
import { Notification } from './notification.entity';
import { TransplantProcedure } from './transplant-procedure.entity';

@Entity('doctors')
export class Doctor extends BaseEntity {
  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  specialty: string;

  @Column({ name: 'license_number', unique: true })
  licenseNumber: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @ManyToMany(() => Institution)
  @JoinTable({
    name: 'doctor_institutions',
    joinColumn: { name: 'doctor_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'institution_id', referencedColumnName: 'id' },
  })
  institutions: Institution[];

  @OneToMany(() => Notification, (notification) => notification.doctor)
  notifications: Notification[];

  @OneToMany(() => TransplantProcedure, (procedure) => procedure.leadDoctor)
  procedures: TransplantProcedure[];
}
