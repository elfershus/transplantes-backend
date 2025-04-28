import { Entity, Column, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Doctor } from './doctor.entity';
import { Transportation } from './transportation.entity';

@Entity('institutions')
export class Institution extends BaseEntity {
  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'license_number' })
  licenseNumber: string;

  @ManyToMany(() => Doctor)
  doctors: Doctor[];

  @OneToMany(() => Transportation, (transport) => transport.originInstitution)
  outgoingTransports: Transportation[];

  @OneToMany(() => Transportation, (transport) => transport.destinationInstitution)
  incomingTransports: Transportation[];
}
