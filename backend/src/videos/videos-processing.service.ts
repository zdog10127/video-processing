import { Injectable, Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import { StorageService } from '../storage/storage.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

interface ProcessingResult {
  lowResUrl: string;
  thumbnailUrl: string;
  metadata: VideoMetadata;
}

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);
  private readonly tempDir: string;

  constructor(private storageService: StorageService) {
    this.tempDir = path.join(os.tmpdir(), 'video-processing');
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      this.logger.log(`Temp directory created: ${this.tempDir}`);
    } catch (error) {
      this.logger.error('Error creating temp directory:', error);
    }
  }

  async processVideo(
    originalFileName: string,
    videoBuffer: Buffer,
  ): Promise<ProcessingResult> {
    const timestamp = Date.now();
    const tempInputPath = path.join(
      this.tempDir,
      `input_${timestamp}_${originalFileName}`,
    );
    const tempOutputPath = path.join(
      this.tempDir,
      `output_${timestamp}_${originalFileName}`,
    );
    const tempThumbnailPath = path.join(
      this.tempDir,
      `thumb_${timestamp}_${originalFileName.replace(/\.[^/.]+$/, '.jpg')}`,
    );

    try {
      this.logger.log(`Starting video processing for: ${originalFileName}`);

      await fs.writeFile(tempInputPath, videoBuffer);

      const metadata = await this.getVideoMetadata(tempInputPath);
      this.logger.log(`Video metadata: ${JSON.stringify(metadata)}`);

      await this.createLowResVideo(tempInputPath, tempOutputPath, metadata);

      await this.generateThumbnail(tempInputPath, tempThumbnailPath);

      const [lowResBuffer, thumbnailBuffer] = await Promise.all([
        fs.readFile(tempOutputPath),
        fs.readFile(tempThumbnailPath),
      ]);

      const lowResFileName = originalFileName.replace(/(\.[^/.]+)$/, '_low$1');
      const thumbnailFileName = originalFileName.replace(
        /\.[^/.]+$/,
        '_thumb.jpg',
      );

      const [lowResUrl, thumbnailUrl] = await Promise.all([
        this.storageService.uploadFile(
          lowResFileName,
          lowResBuffer,
          'video/mp4',
        ),
        this.storageService.uploadFile(
          thumbnailFileName,
          thumbnailBuffer,
          'image/jpeg',
        ),
      ]);

      this.logger.log(`Video processing completed for: ${originalFileName}`);

      return {
        lowResUrl,
        thumbnailUrl,
        metadata,
      };
    } catch (error) {
      this.logger.error(
        `Video processing failed for: ${originalFileName}`,
        error,
      );
      throw error;
    } finally {
      await this.cleanupTempFiles([
        tempInputPath,
        tempOutputPath,
        tempThumbnailPath,
      ]);
    }
  }

  private getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`FFprobe error: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === 'video',
        );

        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
        });
      });
    });
  }

  private createLowResVideo(
    inputPath: string,
    outputPath: string,
    metadata: VideoMetadata,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetHeight = 480;
      const aspectRatio = metadata.width / metadata.height;
      const targetWidth = Math.round(aspectRatio * targetHeight);

      const evenWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth + 1;
      const evenHeight =
        targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;

      ffmpeg(inputPath)
        .size(`${evenWidth}x${evenHeight}`)
        .videoBitrate('500k')
        .audioBitrate('128k')
        .format('mp4')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-preset fast', '-movflags +faststart'])
        .on('start', (commandLine) => {
          this.logger.log(`FFmpeg started: ${commandLine}`);
        })
        .on('progress', (progress) => {
          this.logger.log(`Processing progress: ${progress.percent}%`);
        })
        .on('end', () => {
          this.logger.log('Low resolution video created successfully');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error('FFmpeg error:', err);
          reject(new Error(`Video processing error: ${err.message}`));
        })
        .save(outputPath);
    });
  }

  private generateThumbnail(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          count: 1,
          folder: path.dirname(outputPath),
          filename: path.basename(outputPath),
          timemarks: ['10%'],
          size: '320x240',
        })
        .on('end', () => {
          this.logger.log('Thumbnail generated successfully');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error('Thumbnail generation error:', err);
          reject(new Error(`Thumbnail generation error: ${err.message}`));
        });
    });
  }

  private async cleanupTempFiles(filePaths: string[]) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        this.logger.log(`Temp file deleted: ${filePath}`);
      } catch (error) {
        this.logger.warn(`Failed to delete temp file: ${filePath}`, error);
      }
    }
  }
}
