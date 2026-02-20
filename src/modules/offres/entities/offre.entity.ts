import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('offres')
export class Offre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titre: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column('text')
  description: string;

  @Column()
  lieu: string;

  @Column()
  typeContrat: string;

  @Column()
  email: string;

  @Column({ type: 'date' })
  datePublication: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}