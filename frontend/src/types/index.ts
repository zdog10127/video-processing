export interface Video {
  id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  originalUrl: string;
  lowResUrl?: string;
  thumbnailUrl?: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  duration?: number;
  width?: number;
  height?: number;
  processingError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse {
  data: Video[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UploadResponse {
  message: string;
  videoId: string;
  status: string;
}