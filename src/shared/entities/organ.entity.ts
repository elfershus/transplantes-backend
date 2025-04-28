import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Donor } from './donor.entity';
import { Compatibility } from './compatibility.entity';
import { Transportation } from './transportation.entity';

@Entity('organs')
export class Organ extends BaseEntity {
  @Column()
  type: string;

  @Column({ name: 'retrieval_date', type: 'timestamp', nullable: true })
  retrievalDate: Date;

  @Column({ name: 'expiration_date', type: 'timestamp', nullable: true })
  expirationDate: Date;

  @Column()
  condition: string;

  @Column()
  status: string;

  @Column({ name: 'storage_location', nullable: true })
  storageLocation: string;

  @ManyToOne(() => Donor, (donor) => donor.organs)
  @JoinColumn({ name: 'donor_id' })
  donor: Donor;

  @OneToMany(() => Compatibility, (compatibility) => compatibility.organ)
  compatibilities: Compatibility[];

  @OneToMany(() => Transportation, (transportation) => transportation.organ)
  transportations: Transportation[];
}
