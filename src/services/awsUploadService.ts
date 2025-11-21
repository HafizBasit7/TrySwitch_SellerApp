// services/awsUploadService.ts
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';


export interface AwsFileRequest {
  fileName: string;
  contentType: string;
  category: string;
}

export interface AwsFileResponse {
  clientFileName: string;
  uploadUrl: string;
  publicUrl: string;
}

export interface AwsUploadResponse {
  files: AwsFileResponse[];
}

export type UploadModule = 'sellerProfile' | 'propertyImages'| 'chat';

class AwsUploadService {
  private baseUrl = 'https://goswitch.app';

  async getPreSignedUrls(
    userId: string,
    module: UploadModule,
    files: AwsFileRequest[]
  ): Promise<AwsUploadResponse> {
    try {
      console.log('Requesting pre-signed URLs:', { userId, module, files });
      
      const url = `${this.baseUrl}/api/UploadASWFiles/Pre-Sign-URL?userId=${userId}`;
      console.log('Making request to:', url);
      
      const requestBody = {
        module,
        files,
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AWS pre-signed URL request failed:', errorText);
        throw new Error(`Failed to get pre-signed URLs: ${response.status}`);
      }

      const data: AwsUploadResponse = await response.json();
      console.log('Pre-signed URLs received:', data);
      return data;
    } catch (error) {
      console.error('AWS pre-signed URL error:', error);
      throw new Error('Failed to get upload URLs');
    }
  }

  async uploadToS3(uploadUrl: string, fileBlob: Blob): Promise<void> {
    try {
      console.log('Uploading to S3:', { uploadUrl, fileSize: fileBlob.size });
      
      const headers: HeadersInit = {
        'x-amz-acl': 'public-read',
        'x-amz-server-side-encryption': 'AES256',
      };

      console.log('S3 upload headers:', headers);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileBlob,
        headers: headers,
      });

      console.log('S3 upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('S3 upload failed - Status:', response.status);
        console.error('S3 upload failed - Response:', errorText);
        throw new Error(`S3 upload failed: ${response.status}`);
      }

      console.log('S3 upload successful');
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  async uploadImage(
    imageUri: string, 
    userId: string, 
    module: UploadModule = 'propertyImages'
  ): Promise<string> {
    try {
      console.log('Starting image upload to AWS S3 from URI:', imageUri);
      
      const fileName = `image_${Date.now()}.jpg`;
      const contentType = 'image/jpeg';
      const category = 'images';
      
      const presignedResponse = await this.getPreSignedUrls(
        userId,
        module,
        [
          {
            fileName,
            contentType,
            category,
          },
        ]
      );

      const presignedFile = presignedResponse.files[0];
      
      console.log('Fetching image from URI...');
      
      let fileBlob: Blob;
      
      if (imageUri.startsWith('file://')) {
        fileBlob = await this.uriToBlob(imageUri);
      } else {
        const response = await fetch(imageUri);
        fileBlob = await response.blob();
      }
      
      console.log('Image blob created, size:', fileBlob.size);

      console.log('Uploading to S3...');
      await this.uploadToS3(presignedFile.uploadUrl, fileBlob);

      console.log('Image upload successful:', presignedFile.publicUrl);
      return presignedFile.publicUrl;

    } catch (error) {
      console.error('AWS image upload error:', error);
      throw new Error('Failed to upload image to AWS S3');
    }
  }

  async uploadVideo(
    videoUri: string, 
    userId: string, 
    module: UploadModule = 'propertyImages'
  ): Promise<string> {
    try {
      console.log('Starting video upload to AWS S3:', videoUri);
      
      let finalVideoUri = videoUri;
      
      // Convert content URI to file URI for Android
      if (Platform.OS === 'android' && videoUri.startsWith('content://')) {
        console.log('Converting content URI to file URI...');
        finalVideoUri = await this.convertContentUriToFileUri(videoUri);
        console.log('Converted URI:', finalVideoUri);
      }
      
      // Now use the same approach as images
      const fileName = `video_${Date.now()}.mp4`;
      const contentType = 'video/mp4';
      const category = 'videos';
      
      const presignedResponse = await this.getPreSignedUrls(
        userId,
        module,
        [
          {
            fileName,
            contentType,
            category,
          },
        ]
      );

      const presignedFile = presignedResponse.files[0];
      
      console.log('Fetching video file...');
      let fileBlob: Blob;
      
      if (finalVideoUri.startsWith('file://')) {
        fileBlob = await this.uriToBlob(finalVideoUri);
      } else {
        const response = await fetch(finalVideoUri);
        fileBlob = await response.blob();
      }
      
      console.log('Video blob created, size:', fileBlob.size);

      console.log('Uploading video to S3...');
      await this.uploadToS3(presignedFile.uploadUrl, fileBlob);

      console.log('Video upload successful:', presignedFile.publicUrl);
      return presignedFile.publicUrl;

    } catch (error) {
      console.error('AWS video upload error:', error);
      throw new Error('Failed to upload video to AWS S3');
    }
  }

  private async convertContentUriToFileUri(contentUri: string): Promise<string> {
    try {
      // Create temporary file path
      const tempFilePath = `${RNFS.TemporaryDirectoryPath}/video_${Date.now()}.mp4`;
      console.log('Converting content URI to file path:', tempFilePath);
      
      // Copy the content URI to a temporary file
      await RNFS.copyFile(contentUri, tempFilePath);
      console.log('Content URI copied successfully');
      
      // Return as file URI
      return `file://${tempFilePath}`;
      
    } catch (error) {
      console.error('Error converting content URI:', error);
      
      // Fallback: Try a different approach if copyFile fails
      console.log('Trying fallback approach...');
      return await this.fallbackContentUriHandler(contentUri);
    }
  }

  private async fallbackContentUriHandler(contentUri: string): Promise<string> {
    try {
      // Alternative approach: Use react-native-image-picker's built-in conversion
      // or try to read the content URI directly as blob
      console.log('Using fallback content URI handler');
      
      // For now, let's try to use the content URI directly with a different approach
      // We'll use XMLHttpRequest with responseType 'blob' but handle it differently
      const blob = await this.contentUriToBlob(contentUri);
      
      // Convert blob to file URI by creating a temporary file
      const tempFilePath = `${RNFS.TemporaryDirectoryPath}/video_${Date.now()}.mp4`;
      const base64 = await this.blobToBase64(blob);
      await RNFS.writeFile(tempFilePath, base64, 'base64');
      
      return `file://${tempFilePath}`;
      
    } catch (fallbackError) {
      console.error('Fallback content URI handler also failed:', fallbackError);
      throw new Error('Could not process video file. Please try a different video.');
    }
  }

  private async contentUriToBlob(contentUri: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 0) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Failed to load content URI: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error while loading content URI'));
      };
      
      xhr.onabort = function() {
        reject(new Error('Request aborted for content URI'));
      };
      
      xhr.responseType = 'blob';
      xhr.open('GET', contentUri, true);
      
      // Add timeout
      xhr.timeout = 30000; // 30 seconds
      xhr.ontimeout = function() {
        reject(new Error('Timeout while loading content URI'));
      };
      
      xhr.send(null);
    });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Original URI to blob method (for images and file URIs)
  private async uriToBlob(uri: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 0) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Failed to convert URI to blob: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Failed to convert URI to blob'));
      };
      
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  }

  async uploadMultipleImages(
    imageUris: string[], 
    userId: string, 
    module: UploadModule = 'propertyImages'
  ): Promise<string[]> {
    const uploadPromises = imageUris.map(uri => 
      this.uploadImage(uri, userId, module)
    );
    return Promise.all(uploadPromises);
  }
}

export const awsUploadService = new AwsUploadService();