import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organ } from './organ.entity';
import { Receiver } from './receiver.entity';
import { TransplantProcedure } from './transplant-procedure.entity';

@Entity('compatibility')
export class Compatibility extends BaseEntity {
  @Column({ name: 'compatibility_score', type: 'float' })
  compatibilityScore: number;

  @Column({ name: 'match_date', type: 'timestamp', nullable: true })
  matchDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  status: string;

  @ManyToOne(() => Organ, (organ) => organ.compatibilities)
  @JoinColumn({ name: 'organ_id' })
  organ: Organ;

  @ManyToOne(() => Receiver, (receiver) => receiver.compatibilities)
  @JoinColumn({ name: 'receiver_id' })
  receiver: Receiver;

  @OneToOne(() => TransplantProcedure, (procedure) => procedure.compatibility)
  transplantProcedure: TransplantProcedure;
}
