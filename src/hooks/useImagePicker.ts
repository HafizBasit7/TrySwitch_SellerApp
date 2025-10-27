// hooks/useImagePicker.ts
import { useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { Alert } from 'react-native';
import { cloudinaryService } from '../services/cloudinaryService';

interface UseImagePickerReturn {
  pickAndUploadMedia: () => Promise<{url: string, type: 'image' | 'video'} | null>;
  pickAndUploadDocument: () => Promise<string | null>;
  uploading: boolean;
  uploadingDocument: boolean;
}

export const useImagePicker = (): UseImagePickerReturn => {
  const [uploading, setUploading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const pickAndUploadMedia = async (): Promise<{url: string, type: 'image' | 'video'} | null> => {
    try {
      console.log('Starting media picker');
      const mediaResult = await pickMedia();
      
      if (!mediaResult) {
        console.log('Media pick cancelled');
        return null;
      }

      console.log(`Media picked, starting upload - type: ${mediaResult.type}`);
      setUploading(true);

      let mediaUrl: string;
      
      if (mediaResult.type === 'image') {
        mediaUrl = await cloudinaryService.uploadImage(mediaResult.data);
      } else {
        mediaUrl = await cloudinaryService.uploadVideo(mediaResult.data);
      }

      console.log(`Upload successful for ${mediaResult.type}:`, mediaUrl);
      return { url: mediaUrl, type: mediaResult.type };

    } catch (error) {
      console.error('Error picking/uploading media:', error);
      Alert.alert('Upload Error', 'Failed to upload media. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const pickAndUploadDocument = async (): Promise<string | null> => {
    try {
      console.log('Starting document picker');
      const documentResult = await pickDocument();
      
      if (!documentResult) {
        console.log('Document pick cancelled');
        return null;
      }

      console.log('Document picked, starting upload');
      setUploadingDocument(true);
      
      const documentUrl = await cloudinaryService.uploadImage(documentResult);
      console.log('Document upload successful:', documentUrl);
      
      return documentUrl;

    } catch (error) {
      console.error('Error picking/uploading document:', error);
      Alert.alert('Upload Error', 'Failed to upload document. Please try again.');
      return null;
    } finally {
      setUploadingDocument(false);
    }
  };

  return {
    pickAndUploadMedia,
    pickAndUploadDocument,
    uploading,
    uploadingDocument,
  };
};

// Helper function to pick either image or video
const pickMedia = (): Promise<{data: string, type: 'image' | 'video'} | null> => {
  return new Promise((resolve) => {
    const options = {
      mediaType: 'mixed' as const,
      quality: 0.8,
      includeBase64: true,
      maxWidth: 1024,
      maxHeight: 1024,
      videoQuality: 'high' as const,
      durationLimit: 60,
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
        
        if (asset.type?.startsWith('image/') && asset.base64) {
          const base64Image = `data:image/jpeg;base64,${asset.base64}`;
          console.log('Image picked successfully, base64 length:', base64Image.length);
          resolve({ data: base64Image, type: 'image' });
        } else if (asset.type?.startsWith('video/') && asset.uri) {
          console.log('Video picked successfully, URI:', asset.uri);
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

// Helper function to pick documents
const pickDocument = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8,
      includeBase64: true,
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
      
      if (response.assets && response.assets[0] && response.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${response.assets[0].base64}`;
        console.log('Document picked successfully, base64 length:', base64Image.length);
        resolve(base64Image);
      } else {
        console.log('No document data found');
        Alert.alert('Error', 'No document data found');
        resolve(null);
      }
    });
  });
};