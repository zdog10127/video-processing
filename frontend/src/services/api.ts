import axios from 'axios';
import { Video, PaginatedResponse, UploadResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const videoService = {
  uploadVideo: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('video', file);

    console.log('Uploading file:', file.name, 'Size:', file.size);

    const response = await api.post('/videos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      },
    });

    return response.data;
  },

  getVideos: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse> => {
    const response = await api.get(`/videos?page=${page}&limit=${limit}`);
    return response.data;
  },

  getVideo: async (id: string): Promise<Video> => {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  deleteVideo: async (id: string): Promise<void> => {
    await api.delete(`/videos/${id}`);
  },

  getDownloadUrls: async (id: string) => {
    const response = await api.get(`/videos/${id}/download-url`);
    return response.data;
  },

  testConnection: async (): Promise<boolean> => {
    try {
      const response = await api.get('/videos?page=1&limit=1');
      return response.status === 200;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  },
};

export default api;