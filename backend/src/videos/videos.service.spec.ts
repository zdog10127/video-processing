import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { VideosService } from './videos.service';
import { Video, VideoStatus } from './entities/video.entity';

describe('VideosService', () => {
  let service: VideosService;
  let repository: Repository<Video>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: getRepositoryToken(Video),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    repository = module.get<Repository<Video>>(getRepositoryToken(Video));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a video', async () => {
      const createVideoDto = {
        originalName: 'test.mp4',
        fileName: 'test_123.mp4',
        fileSize: 1000,
        mimeType: 'video/mp4',
        originalUrl: 'https://example.com/test.mp4',
      };

      const expectedVideo = {
        id: '123',
        ...createVideoDto,
        status: VideoStatus.UPLOADING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(expectedVideo);
      mockRepository.save.mockResolvedValue(expectedVideo);

      const result = await service.create(createVideoDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createVideoDto);
      expect(mockRepository.save).toHaveBeenCalledWith(expectedVideo);
      expect(result).toEqual(expectedVideo);
    });
  });

  describe('findOne', () => {
    it('should find a video by id', async () => {
      const video = {
        id: '123',
        originalName: 'test.mp4',
        status: VideoStatus.COMPLETED,
      };

      mockRepository.findOne.mockResolvedValue(video);

      const result = await service.findOne('123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      expect(result).toEqual(video);
    });

    it('should throw NotFoundException when video not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('123')).rejects.toThrow(NotFoundException);
    });
  });
});
