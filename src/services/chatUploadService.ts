// services/chatUploadService.ts - COMPLETELY FIXED VERSION
import api from './api';

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

class ChatUploadService {
  private baseUrl = 'https://goswitch.app';

  /**
   * Get pre-signed URLs for CHAT uploads
   */
  async getChatPreSignedUrls(
    userId: string,
    files: AwsFileRequest[]
  ): Promise<AwsUploadResponse> {
    try {
      // Validate userId
      if (!userId || userId === 'undefined') {
        throw new Error('Invalid userId provided for chat upload');
      }

      console.log('Requesting CHAT pre-signed URLs:', { userId, files });
      
      const url = `${this.baseUrl}/api/UploadASWFiles/Pre-Sign-URL?userId=${encodeURIComponent(userId)}`;
      console.log('Making CHAT request to:', url);
      
      const requestBody = {
        module: 'chat',
        files,
      };
      
      console.log('CHAT Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('CHAT Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CHAT AWS pre-signed URL request failed:', errorText);
        throw new Error(`Failed to get chat pre-signed URLs: ${response.status}`);
      }

      const data: AwsUploadResponse = await response.json();
      console.log('CHAT Pre-signed URLs received:', data);
      
      // Fix the URL structure to remove userId from path if present
      if (data.files && data.files.length > 0) {
        data.files = data.files.map(file => ({
          ...file,
          publicUrl: this.fixChatUrl(file.publicUrl, userId),
        }));
        console.log('CHAT Pre-signed URLs (after fix):', data);
      }
      
      return data;
    } catch (error) {
      console.error('CHAT AWS pre-signed URL error:', error);
      throw new Error('Failed to get chat upload URLs');
    }
  }

  /**
   * Fix chat URL to remove userId from path and ensure correct structure
   */
  private fixChatUrl(originalUrl: string, userId: string): string {
    if (!originalUrl) return originalUrl;

    // Remove userId from path if present
    let fixedUrl = originalUrl;
    if (userId && fixedUrl.includes(`/chat/${userId}/`)) {
      fixedUrl = fixedUrl.replace(`/chat/${userId}/`, '/chat/');
    }
    
    // Remove 'undefined' from path if present
    if (fixedUrl.includes('/chat/undefined/')) {
      fixedUrl = fixedUrl.replace('/chat/undefined/', '/chat/');
    }

    // Ensure the URL structure is correct
    // Should be: https://tryswitch.s3.us-east-2.amazonaws.com/chat/Images/...
    // or: https://tryswitch.s3.us-east-2.amazonaws.com/chat/Documents/...
    const correctBaseUrl = 'https://tryswitch.s3.us-east-2.amazonaws.com/chat/';
    
    if (fixedUrl.startsWith(correctBaseUrl)) {
      console.log('✅ Chat URL is correct:', fixedUrl);
    } else {
      console.warn('⚠️ Chat URL structure may be incorrect:', fixedUrl);
    }

    return fixedUrl;
  }

  async uploadToS3(uploadUrl: string, fileBlob: Blob): Promise<void> {
    try {
      console.log('Uploading to S3:', { fileSize: fileBlob.size });
      
      const headers: HeadersInit = {
        'x-amz-acl': 'public-read',
        'x-amz-server-side-encryption': 'AES256',
      };

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileBlob,
        headers: headers,
      });

      console.log('S3 upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('S3 upload failed - Status:', response.status);
        throw new Error(`S3 upload failed: ${response.status}`);
      }

      console.log('S3 upload successful');
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

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

  /**
   * Upload image for chat with proper URL structure
   */
  async uploadChatImage(
    imageUri: string,
    userId: string
  ): Promise<string> {
    try {
      // Validate userId
      if (!userId || userId === 'undefined') {
        throw new Error('Valid userId is required for chat image upload');
      }

      console.log('Starting CHAT image upload to AWS S3:', { imageUri, userId });
      
      const fileName = `image_${Date.now()}.jpg`;
      const contentType = 'image/jpeg';
      const category = 'Images';
      
      const presignedResponse = await this.getChatPreSignedUrls(userId, [
        { fileName, contentType, category },
      ]);

      const presignedFile = presignedResponse.files[0];
      
      console.log('Fetching CHAT image from URI...');
      
      let fileBlob: Blob;
      
      if (imageUri.startsWith('file://')) {
        fileBlob = await this.uriToBlob(imageUri);
      } else {
        const response = await fetch(imageUri);
        fileBlob = await response.blob();
      }
      
      console.log('CHAT Image blob created, size:', fileBlob.size);

      console.log('Uploading CHAT image to S3...');
      await this.uploadToS3(presignedFile.uploadUrl, fileBlob);

      const finalUrl = this.fixChatUrl(presignedFile.publicUrl, userId);
      console.log('✅ CHAT Image upload successful:', finalUrl);
      return finalUrl;

    } catch (error) {
      console.error('❌ CHAT AWS image upload error:', error);
      throw new Error('Failed to upload image to AWS S3 for chat');
    }
  }

  /**
   * Upload document for chat with proper URL structure
   */
  async uploadChatDocument(
    documentUri: string,
    userId: string
  ): Promise<string> {
    try {
      // Validate userId
      if (!userId || userId === 'undefined') {
        throw new Error('Valid userId is required for chat document upload');
      }

      console.log('Starting CHAT document upload to AWS S3:', { documentUri, userId });
      
      const fileName = `document_${Date.now()}.pdf`;
      const contentType = 'application/pdf';
      const category = 'Documents';
      
      const presignedResponse = await this.getChatPreSignedUrls(userId, [
        { fileName, contentType, category },
      ]);

      const presignedFile = presignedResponse.files[0];
      
      console.log('Fetching CHAT document file...');
      let fileBlob: Blob;
      
      if (documentUri.startsWith('file://')) {
        fileBlob = await this.uriToBlob(documentUri);
      } else {
        const response = await fetch(documentUri);
        fileBlob = await response.blob();
      }
      
      console.log('CHAT Document blob created, size:', fileBlob.size);

      console.log('Uploading CHAT document to S3...');
      await this.uploadToS3(presignedFile.uploadUrl, fileBlob);

      const finalUrl = this.fixChatUrl(presignedFile.publicUrl, userId);
      console.log('✅ CHAT Document upload successful:', finalUrl);
      return finalUrl;

    } catch (error) {
      console.error('❌ CHAT AWS document upload error:', error);
      throw new Error('Failed to upload document to AWS S3 for chat');
    }
  }
}

export const chatUploadService = new ChatUploadService();