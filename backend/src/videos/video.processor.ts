import { Process, Processor } from '@nestjs/bull';
import bull from 'bull';
import { Logger } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideoStatus } from './entities/video.entity';
import { VideoProcessingService } from './videos-processing.service';

export interface VideoProcessingJob {
  videoId: string;
  fileName: string;
  buffer: Buffer;
}

@Processor('video-processing')
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private videoProcessingService: VideoProcessingService,
    private videosService: VideosService,
  ) {}

  @Process('process-video')
  async handleVideoProcessing(job: bull.Job<VideoProcessingJob>) {
    const { videoId, fileName, buffer } = job.data;

    try {
      this.logger.log(`Starting video processing job for video: ${videoId}`);

      await this.videosService.updateStatus(videoId, VideoStatus.PROCESSING);

      const result = await this.videoProcessingService.processVideo(
        fileName,
        buffer,
      );

      await this.videosService.updateVideoProcessingResult(videoId, {
        lowResUrl: result.lowResUrl,
        thumbnailUrl: result.thumbnailUrl,
        duration: result.metadata.duration,
        width: result.metadata.width,
        height: result.metadata.height,
        status: VideoStatus.COMPLETED,
        processingError: undefined,
      });

      this.logger.log(
        `Video processing completed successfully for: ${videoId}`,
      );
    } catch (error) {
      this.logger.error(`Video processing failed for: ${videoId}`, error);

      await this.videosService.updateVideoProcessingResult(videoId, {
        status: VideoStatus.FAILED,
        processingError: error.message,
      });

      throw error; 
    }
  }
}
