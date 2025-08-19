import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoStatus } from './entities/video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { PaginatedVideoResponseDto } from './dto/video-response.dto';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
  ) {}

  async create(createVideoDto: CreateVideoDto): Promise<Video> {
    try {
      const video = this.videoRepository.create(createVideoDto);
      const savedVideo = await this.videoRepository.save(video);

      this.logger.log(`Video created with ID: ${savedVideo.id}`);
      return savedVideo;
    } catch (error) {
      this.logger.error('Error creating video:', error);
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedVideoResponseDto> {
    try {
      const [videos, total] = await this.videoRepository.findAndCount({
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: videos,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error fetching videos:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Video> {
    try {
      const video = await this.videoRepository.findOne({ where: { id } });

      if (!video) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }

      return video;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching video ${id}:`, error);
      throw error;
    }
  }

  async updateStatus(id: string, status: VideoStatus): Promise<Video> {
    try {
      const result = await this.videoRepository.update(id, {
        status,
        updatedAt: new Date(),
      });

      if (result.affected === 0) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }

      this.logger.log(`Video ${id} status updated to: ${status}`);
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Error updating video ${id} status:`, error);
      throw error;
    }
  }

  async updateVideoProcessingResult(
    id: string,
    data: Partial<Video>,
  ): Promise<Video> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const result = await this.videoRepository.update(id, updateData);

      if (result.affected === 0) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }

      this.logger.log(`Video ${id} processing result updated`);
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Error updating video ${id} processing result:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const video = await this.findOne(id); // This will throw if not found

      const result = await this.videoRepository.delete(id);

      if (result.affected === 0) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }

      this.logger.log(`Video ${id} deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting video ${id}:`, error);
      throw error;
    }
  }

  async getVideosByStatus(status: VideoStatus): Promise<Video[]> {
    try {
      return await this.videoRepository.find({
        where: { status },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error fetching videos by status ${status}:`, error);
      throw error;
    }
  }
}
