import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VideoStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  fileName: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column()
  mimeType: string;

  @Column()
  originalUrl: string;

  @Column({ nullable: true })
  lowResUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({
    type: 'enum',
    enum: VideoStatus,
    default: VideoStatus.UPLOADING,
  })
  status: VideoStatus;

  @Column({ type: 'float', nullable: true })
  duration: number;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ type: 'text', nullable: true })
  processingError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
