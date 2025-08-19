import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { VideosService } from './videos.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { VideoProcessingJob } from './video.processor';
import {
  UploadResponseDto,
  VideoResponseDto,
  PaginatedVideoResponseDto,
} from './dto/video-response.dto';
import { QueryVideosDto } from './dto/query-videos.dto';

@ApiTags('videos')
@Controller('api/videos')
export class VideosController {
  private readonly maxFileSize: number;
  private readonly allowedFormats: string[];

  constructor(
    private readonly videosService: VideosService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    @InjectQueue('video-processing')
    private videoQueue: Queue<VideoProcessingJob>,
  ) {
    this.maxFileSize = parseInt(
      this.configService.get('MAX_FILE_SIZE') || '104857600',
    );
    this.allowedFormats = this.configService
      .get('ALLOWED_VIDEO_FORMATS')
      ?.split(',') || ['mp4', 'avi', 'mov', 'mkv'];
  }

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  @ApiOperation({ summary: 'Upload de vídeo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo de vídeo para upload',
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de vídeo (mp4, avi, mov, mkv)',
        },
      },
      required: ['video'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload realizado com sucesso',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou erro de validação',
  })
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo de vídeo foi enviado');
    }

    this.validateFile(file);

    const fileName = `${Date.now()}_${file.originalname}`;

    try {
      const originalUrl = await this.storageService.uploadFile(
        fileName,
        file.buffer,
        file.mimetype,
      );

      const video = await this.videosService.create({
        originalName: file.originalname,
        fileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        originalUrl,
      });

      await this.videoQueue.add('process-video', {
        videoId: video.id,
        fileName,
        buffer: file.buffer,
      });

      return {
        message: 'Vídeo enviado com sucesso',
        videoId: video.id,
        status: video.status,
      };
    } catch (error) {
      throw new BadRequestException(`Erro durante o upload: ${error.message}`);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar vídeos com paginação' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 10, máximo: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de vídeos',
    type: PaginatedVideoResponseDto,
  })
  async findAll(
    @Query() query: QueryVideosDto,
  ): Promise<PaginatedVideoResponseDto> {
    return this.videosService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar vídeo por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID único do vídeo',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do vídeo',
    type: VideoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Vídeo não encontrado',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VideoResponseDto> {
    return this.videosService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar vídeo' })
  @ApiParam({
    name: 'id',
    description: 'ID único do vídeo',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Vídeo deletado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Vídeo não encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.videosService.remove(id);
    return { message: 'Vídeo deletado com sucesso' };
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Gerar URL de download temporária' })
  @ApiParam({
    name: 'id',
    description: 'ID único do vídeo',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'URLs de download geradas',
    schema: {
      type: 'object',
      properties: {
        originalUrl: { type: 'string' },
        lowResUrl: { type: 'string' },
        thumbnailUrl: { type: 'string' },
      },
    },
  })
  async getDownloadUrls(@Param('id', ParseUUIDPipe) id: string) {
    const video = await this.videosService.findOne(id);

    const urls: any = {};

    if (video.fileName) {
      urls.originalUrl = await this.storageService.generateSignedUrl(
        video.fileName,
      );
    }

    if (video.lowResUrl) {
      const lowResFileName = video.fileName.replace(/(\.[^/.]+)$/, '_low$1');
      urls.lowResUrl =
        await this.storageService.generateSignedUrl(lowResFileName);
    }

    if (video.thumbnailUrl) {
      const thumbnailFileName = video.fileName.replace(
        /\.[^/.]+$/,
        '_thumb.jpg',
      );
      urls.thumbnailUrl =
        await this.storageService.generateSignedUrl(thumbnailFileName);
    }

    return urls;
  }

  private validateFile(file: Express.Multer.File) {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Tamanho do arquivo excede o limite máximo de ${Math.round(
          this.maxFileSize / 1024 / 1024,
        )}MB`,
      );
    }

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !this.allowedFormats.includes(fileExtension)) {
      throw new BadRequestException(
        `Formato de arquivo não permitido. Formatos aceitos: ${this.allowedFormats.join(
          ', ',
        )}`,
      );
    }

    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('O arquivo deve ser um vídeo válido');
    }
  }
}
