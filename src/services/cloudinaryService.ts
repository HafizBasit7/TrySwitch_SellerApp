// services/cloudinaryService.ts
import Config from 'react-native-config';

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
}

class CloudinaryService {
  private cloudName: string;
  private apiKey: string;
  private imageUploadPreset: string;
  private videoUploadPreset: string;

  constructor() {
    // Get from environment variables - these will be undefined in production
    // if not set, and that's OK - we'll handle it gracefully
    this.cloudName = Config.CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = Config.CLOUDINARY_API_KEY || '';
    this.imageUploadPreset = Config.CLOUDINARY_IMAGE_UPLOAD_PRESET || '';
    this.videoUploadPreset = Config.CLOUDINARY_VIDEO_UPLOAD_PRESET || '';

    this.validateConfig();
  }

  private validateConfig(): void {
    const missingConfigs: string[] = [];
    
    if (!this.cloudName) missingConfigs.push('CLOUDINARY_CLOUD_NAME');
    if (!this.apiKey) missingConfigs.push('CLOUDINARY_API_KEY');
    if (!this.imageUploadPreset) missingConfigs.push('CLOUDINARY_IMAGE_UPLOAD_PRESET');
    if (!this.videoUploadPreset) missingConfigs.push('CLOUDINARY_VIDEO_UPLOAD_PRESET');

    if (missingConfigs.length > 0) {
      console.warn('⚠️ Cloudinary configuration missing:', missingConfigs);
      // Don't throw error here - let it fail gracefully during upload
    } else {
      console.log('✅ Cloudinary Config Loaded');
    }
  }

  private checkConfig(): void {
    if (!this.cloudName || !this.apiKey) {
      throw new Error(
        'Cloudinary configuration missing. Please check your environment variables.'
      );
    }
  }
  
  async uploadImage(base64Image: string): Promise<string> {
    try {
      const base64Data = base64Image.includes('base64,') 
        ? base64Image.split('base64,')[1] 
        : base64Image;

      const formData = new FormData();
      formData.append('file', `data:image/jpeg;base64,${base64Data}`);
      formData.append('upload_preset', this.imageUploadPreset);
      formData.append('cloud_name', this.cloudName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary image upload failed:', errorText);
        throw new Error(`Image upload failed: ${response.status}`);
      }

      const data: CloudinaryUploadResponse = await response.json();
      console.log('Cloudinary image upload success:', data.secure_url);
      return data.secure_url;

    } catch (error) {
      console.error('Cloudinary image upload error:', error);
      throw new Error('Failed to upload image to cloud storage');
    }
  }

  async uploadVideo(videoUri: string): Promise<string> {
    try {
      console.log('Starting video upload:', videoUri);
      
      const formData = new FormData();
      
      // For videos, we need to append the file directly
      const videoFile = {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video.mp4',
      };
      
      formData.append('file', videoFile as any);
      formData.append('upload_preset', this.videoUploadPreset);
      formData.append('cloud_name', this.cloudName);
      formData.append('resource_type', 'video');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary video upload failed:', errorText);
        throw new Error(`Video upload failed: ${response.status}`);
      }

      const data: CloudinaryUploadResponse = await response.json();
      console.log('Cloudinary video upload success:', data.secure_url);
      return data.secure_url;

    } catch (error) {
      console.error('Cloudinary video upload error:', error);
      throw new Error('Failed to upload video to cloud storage');
    }
  }

  async uploadMultipleImages(base64Images: string[]): Promise<string[]> {
    const uploadPromises = base64Images.map(image => this.uploadImage(image));
    return Promise.all(uploadPromises);
  }
}

export const cloudinaryService = new CloudinaryService();