// hooks/useImagePicker.ts
import { useState } from 'react';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { Alert, Platform } from 'react-native';
import { awsUploadService, UploadModule } from '../services/awsUploadService';

interface UseImagePickerReturn {
  pickAndUploadMedia: (userId: string, module?: UploadModule) => Promise<{url: string, type: 'image' | 'video'} | null>;
  pickAndUploadDocument: (userId: string, module?: UploadModule) => Promise<string | null>;
  uploadMultipleMedia: (files: Array<{data: string, type: 'image' | 'video'}>, userId: string, module?: UploadModule) => Promise<string[]>;
  uploading: boolean;
  uploadingDocument: boolean;
  uploadingMultiple: boolean;
}

export const useImagePicker = (): UseImagePickerReturn => {
  const [uploading, setUploading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadingMultiple, setUploadingMultiple] = useState(false);

  const pickAndUploadMedia = async (
    userId: string, 
    module: UploadModule = 'propertyImages'
  ): Promise<{url: string, type: 'image' | 'video'} | null> => {
    try {
      console.log('Starting media picker for AWS S3:', { userId, module });
      const mediaResult = await pickMedia();
      
      if (!mediaResult) {
        console.log('Media pick cancelled');
        return null;
      }

      console.log(`Media picked, starting AWS S3 upload - type: ${mediaResult.type}`);
      console.log('Media URI:', mediaResult.data);
      setUploading(true);

      let mediaUrl: string;
      
      if (mediaResult.type === 'image') {
        mediaUrl = await awsUploadService.uploadImage(mediaResult.data, userId, module);
      } else {
        mediaUrl = await awsUploadService.uploadVideo(mediaResult.data, userId, module);
      }

      console.log(`AWS S3 upload successful for ${mediaResult.type}:`, mediaUrl);
      return { url: mediaUrl, type: mediaResult.type };

    } catch (error) {
      console.error('Error picking/uploading media to AWS S3:', error);
      Alert.alert('Upload Error', 'Failed to upload media. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const pickAndUploadDocument = async (
    userId: string, 
    module: UploadModule = 'propertyImages'
  ): Promise<string | null> => {
    try {
      console.log('Starting document picker for AWS S3:', { userId, module });
      const documentResult = await pickDocument();
      
      if (!documentResult) {
        console.log('Document pick cancelled');
        return null;
      }

      console.log('Document picked, starting AWS S3 upload');
      setUploadingDocument(true);
      
      const documentUrl = await awsUploadService.uploadImage(documentResult, userId, module);
      console.log('Document upload successful to AWS S3:', documentUrl);
      
      return documentUrl;

    } catch (error) {
      console.error('Error picking/uploading document to AWS S3:', error);
      Alert.alert('Upload Error', 'Failed to upload document. Please try again.');
      return null;
    } finally {
      setUploadingDocument(false);
    }
  };

  const uploadMultipleMedia = async (
    files: Array<{data: string, type: 'image' | 'video'}>,
    userId: string,
    module: UploadModule = 'propertyImages'
  ): Promise<string[]> => {
    try {
      setUploadingMultiple(true);
      const uploadPromises = files.map(file => {
        if (file.type === 'image') {
          return awsUploadService.uploadImage(file.data, userId, module);
        } else {
          return awsUploadService.uploadVideo(file.data, userId, module);
        }
      });
      
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Error uploading multiple media to AWS S3:', error);
      Alert.alert('Upload Error', 'Failed to upload some files. Please try again.');
      throw error;
    } finally {
      setUploadingMultiple(false);
    }
  };

  return {
    pickAndUploadMedia,
    pickAndUploadDocument,
    uploadMultipleMedia,
    uploading,
    uploadingDocument,
    uploadingMultiple,
  };
};

// Helper functions - FIXED VERSION
const pickMedia = (): Promise<{data: string, type: 'image' | 'video'} | null> => {
  return new Promise((resolve) => {
    const options = {
      mediaType: 'mixed' as const,
      quality: 0.8,
      includeBase64: false,
      maxWidth: 1024,
      maxHeight: 1024,
      videoQuality: 'high' as const,
      durationLimit: 60,
      // CRITICAL: Add these options for better Android video handling
      includeExtra: true,
      selectionLimit: 1,
      // Force file:// URIs instead of content:// URIs
      ...(Platform.OS === 'android' && {
        // This helps get file URIs instead of content URIs
        presentationStyle: 'fullScreen' as const,
      }),
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled media picker');
        resolve(null);
        return;
      }
      
      if (response.errorCode) {
        console.error('Media picker error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick media');
        resolve(null);
        return;
      }
      
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        
        if (asset.type?.startsWith('image/') && asset.uri) {
          console.log('Image picked successfully, URI:', asset.uri);
          console.log('Image type:', asset.type);
          console.log('Image file name:', asset.fileName);
          resolve({ data: asset.uri, type: 'image' });
        } else if (asset.type?.startsWith('video/') && asset.uri) {
          console.log('Video picked successfully, URI:', asset.uri);
          console.log('Video type:', asset.type);
          console.log('Video file name:', asset.fileName);
          console.log('Video file size:', asset.fileSize);
          
          // For Android content URIs, we need special handling
          if (Platform.OS === 'android' && asset.uri.startsWith('content://')) {
            console.log('Android content URI detected, will need special handling');
          }
          
          resolve({ data: asset.uri, type: 'video' });
        } else {
          console.log('Unsupported media type:', asset.type);
          Alert.alert('Error', 'Unsupported media type');
          resolve(null);
        }
      } else {
        console.log('No media data found');
        Alert.alert('Error', 'No media data found');
        resolve(null);
      }
    });
  });
};

const pickDocument = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8,
      includeBase64: false,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled document picker');
        resolve(null);
        return;
      }
      
      if (response.errorCode) {
        console.error('Document picker error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick document');
        resolve(null);
        return;
      }
      
      if (response.assets && response.assets[0] && response.assets[0].uri) {
        console.log('Document picked successfully, URI:', response.assets[0].uri);
        resolve(response.assets[0].uri);
      } else {
        console.log('No document data found');
        Alert.alert('Error', 'No document data found');
        resolve(null);
      }
    });
  });
};