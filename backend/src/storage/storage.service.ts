import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, Bucket } from '@google-cloud/storage';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private storage: Storage;
  private bucket: Bucket;
  private readonly useLocal: boolean;
  private readonly uploadsDir: string;

  constructor(private configService: ConfigService) {
    this.useLocal = this.configService.get('USE_LOCAL_STORAGE') === 'true';
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (this.useLocal) {
      this.ensureUploadsDir();
      this.logger.log('🗂️  Using LOCAL storage for development');
    } else {
      this.initializeGoogleCloudStorage();
    }
  }

  private async ensureUploadsDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      this.logger.log(`📁 Uploads directory ensured: ${this.uploadsDir}`);
    } catch (error) {
      this.logger.error('❌ Error creating uploads directory:', error);
    }
  }

  private initializeGoogleCloudStorage() {
    try {
      const projectId = this.configService.get('GOOGLE_CLOUD_PROJECT_ID');
      const keyFilename = this.configService.get('GOOGLE_APPLICATION_CREDENTIALS');
      const bucketName = this.configService.get('GOOGLE_CLOUD_BUCKET');

      if (!projectId || !keyFilename || !bucketName) {
        throw new Error('Missing Google Cloud configuration');
      }

      this.storage = new Storage({
        projectId,
        keyFilename,
      });

      this.bucket = this.storage.bucket(bucketName);
      
      this.logger.log(`☁️  Google Cloud Storage initialized`);
      this.logger.log(`📦 Project: ${projectId}`);
      this.logger.log(`🪣 Bucket: ${bucketName}`);
    } catch (error) {
      this.logger.error('❌ Failed to initialize Google Cloud Storage:', error);
      this.logger.warn('🔄 Falling back to local storage');
      this.ensureUploadsDir();
    }
  }

  async uploadFile(
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (this.useLocal) {
      return this.uploadFileLocal(fileName, buffer, mimeType);
    } else {
      return this.uploadFileGCP(fileName, buffer, mimeType);
    }
  }

  private async uploadFileLocal(
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    try {
      const filePath = path.join(this.uploadsDir, fileName);
      await fs.writeFile(filePath, buffer);
      
      const publicUrl = `http://localhost:${this.configService.get('PORT') || 3001}/uploads/${fileName}`;
      this.logger.log(`📁 File uploaded locally: ${fileName}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`❌ Local upload error for ${fileName}:`, error);
      throw error;
    }
  }

  private async uploadFileGCP(
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    try {
      const file = this.bucket.file(fileName);
      
      const stream = file.createWriteStream({
        metadata: {
          contentType: mimeType,
        },
        public: true,
        validation: 'md5',
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (err) => {
          this.logger.error(`❌ GCP upload failed for ${fileName}:`, err);
          reject(err);
        });

        stream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
          this.logger.log(`☁️  File uploaded to GCP: ${fileName}`);
          resolve(publicUrl);
        });

        stream.end(buffer);
      });
    } catch (error) {
      this.logger.error(`❌ GCP upload error for ${fileName}:`, error);
      throw error;
    }
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    if (this.useLocal) {
      try {
        const filePath = path.join(this.uploadsDir, fileName);
        const buffer = await fs.readFile(filePath);
        return buffer;
      } catch (error) {
        this.logger.error(`❌ Local download failed for ${fileName}:`, error);
        throw error;
      }
    } else {
      try {
        const file = this.bucket.file(fileName);
        const [buffer] = await file.download();
        return buffer;
      } catch (error) {
        this.logger.error(`❌ GCP download failed for ${fileName}:`, error);
        throw error;
      }
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    if (this.useLocal) {
      try {
        const filePath = path.join(this.uploadsDir, fileName);
        await fs.unlink(filePath);
        this.logger.log(`🗑️  Local file deleted: ${fileName}`);
      } catch (error) {
        this.logger.error(`❌ Local delete failed for ${fileName}:`, error);
        throw error;
      }
    } else {
      try {
        await this.bucket.file(fileName).delete();
        this.logger.log(`🗑️  GCP file deleted: ${fileName}`);
      } catch (error) {
        this.logger.error(`❌ GCP delete failed for ${fileName}:`, error);
        throw error;
      }
    }
  }

  async generateSignedUrl(fileName: string, expires: number = 15): Promise<string> {
    if (this.useLocal) {
      return `http://localhost:${this.configService.get('PORT') || 3001}/uploads/${fileName}`;
    } else {
      try {
        const options = {
          version: 'v4' as const,
          action: 'read' as const,
          expires: Date.now() + expires * 60 * 1000,
        };

        const [url] = await this.bucket.file(fileName).getSignedUrl(options);
        return url;
      } catch (error) {
        this.logger.error(`❌ Failed to generate signed URL for ${fileName}:`, error);
        throw error;
      }
    }
  }

  async fileExists(fileName: string): Promise<boolean> {
    if (this.useLocal) {
      try {
        const filePath = path.join(this.uploadsDir, fileName);
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    } else {
      try {
        const [exists] = await this.bucket.file(fileName).exists();
        return exists;
      } catch (error) {
        this.logger.error(`❌ Error checking file existence: ${fileName}:`, error);
        return false;
      }
    }
  }

  async testConnection(): Promise<{ success: boolean; method: string; error?: string }> {
    if (this.useLocal) {
      try {
        await fs.access(this.uploadsDir);
        return { success: true, method: 'Local Storage' };
      } catch (error) {
        return { success: false, method: 'Local Storage', error: error.message };
      }
    } else {
      try {
        await this.bucket.getMetadata();
        return { success: true, method: 'Google Cloud Storage' };
      } catch (error) {
        return { success: false, method: 'Google Cloud Storage', error: error.message };
      }
    }
  }
}