import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Offre } from '../../offres/entities/offre.entity';

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('candidatures')
export class Candidature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nomPrenom: string;

  @Column()
  ville: string;

  @Column()
  email: string;

  @Column()
  telephone: string;

  @Column()
  cvFilename: string;

  @Column()
  cvPath: string;

  @Column({ nullable: true })
  lettreFilename: string;

  @Column({ nullable: true })
  lettrePath: string;

  @Column({ nullable: true, type: 'int' })
  offreId: number;

  @ManyToOne(() => Offre, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'offreId' })
  offre: Offre;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  emailStatus: EmailStatus;

  @Column({ nullable: true, type: 'text' })
  emailErrorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;
}