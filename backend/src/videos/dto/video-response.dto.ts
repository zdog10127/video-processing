import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VideoStatus } from '../entities/video.entity';

export class VideoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  originalUrl: string;

  @ApiPropertyOptional()
  lowResUrl?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiProperty({ enum: VideoStatus })
  status: VideoStatus;

  @ApiPropertyOptional()
  duration?: number;

  @ApiPropertyOptional()
  width?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiPropertyOptional()
  processingError?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedVideoResponseDto {
  @ApiProperty({ type: [VideoResponseDto] })
  data: VideoResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class UploadResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  videoId: string;

  @ApiProperty({ enum: VideoStatus })
  status: VideoStatus;
}
