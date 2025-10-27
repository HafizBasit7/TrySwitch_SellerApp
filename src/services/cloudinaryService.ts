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
  private cloudName = Config.CLOUDINARY_CLOUD_NAME;
  private apiKey = Config.CLOUDINARY_API_KEY;
  private imageUploadPreset = Config.CLOUDINARY_IMAGE_UPLOAD_PRESET;
  private videoUploadPreset = Config.CLOUDINARY_VIDEO_UPLOAD_PRESET;

  constructor() {
    console.log('Cloudinary Config:', {
      cloudName: this.cloudName,
      apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : 'missing', // Log only last 4 chars for security
      imageUploadPreset: this.imageUploadPreset,
      videoUploadPreset: this.videoUploadPreset
    });
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