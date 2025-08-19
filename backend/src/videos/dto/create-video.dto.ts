import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VideoStatus } from '../entities/video.entity';

export class CreateVideoDto {
  @ApiProperty({ description: 'Nome original do arquivo' })
  @IsString()
  originalName: string;

  @ApiProperty({ description: 'Nome do arquivo no storage' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'Tamanho do arquivo em bytes' })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: 'Tipo MIME do arquivo' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'URL do arquivo original' })
  @IsString()
  originalUrl: string;

  @ApiPropertyOptional({ description: 'Duração do vídeo em segundos' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Largura do vídeo' })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ description: 'Altura do vídeo' })
  @IsOptional()
  @IsNumber()
  height?: number;
}