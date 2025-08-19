import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { VideoProcessingService } from './videos-processing.service';
import { VideoProcessor } from './video.processor';
import { Video } from './entities/video.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    BullModule.registerQueue({
      name: 'video-processing',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    }),
    StorageModule,
  ],
  controllers: [VideosController],
  providers: [VideosService, VideoProcessingService, VideoProcessor],
  exports: [VideosService],
})
export class VideosModule {}
