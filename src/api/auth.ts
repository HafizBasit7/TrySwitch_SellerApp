import {
  SignUpRequest,
  SignUpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  CreatePasswordRequest,
  CreatePasswordResponse,
  SignInRequest,
  SignInResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest, 
  ResetPasswordResponse,
} from '../types/auth';
import apiClient from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../utils/constants';

export const authAPI = {
  signup: async (data: SignUpRequest): Promise<SignUpResponse> => {
    const response = await apiClient.post<SignUpResponse>('/Account/signup', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<string> => {
    const response = await apiClient.post('/Account/verify-otp', data, {
      transformResponse: [(data) => data] 
    });
    return response.data;
  },

  createPassword: async (data: CreatePasswordRequest): Promise<string> => {
    const response = await apiClient.post('/Account/create-password', data, {
      transformResponse: [(data) => data] // Keep as string, don't parse JSON
    });
    return response.data;
  },

  signin: async (data: SignInRequest): Promise<SignInResponse> => {
    const response = await apiClient.post<SignInResponse>('/Account/signin', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const response = await apiClient.post<ForgotPasswordResponse>('/Account/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<string> => {
    const response = await apiClient.post('/Account/reset-password', data, {
      transformResponse: [(data) => data] // Keep as string, don't parse JSON
    });
    return response.data;
  },
};


// In api/profileAPI.ts
// Update your smsAPI in api/profileAPI.ts
// In your smsAPI file (likely services/smsAPI.ts or similar)

export const smsAPI = {
  sendOTP: async (phoneNumber: string) => {
    try {
      console.log('📱 Sending OTP to:', phoneNumber);
      
      // Clean the phone number - remove all non-digits
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      // Format: Remove country code if present
      let formattedNumber = cleanNumber;
      if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
        formattedNumber = cleanNumber.substring(1); // Remove leading 0: 03029248522 -> 3029248522
      } else if (cleanNumber.startsWith('92') && cleanNumber.length === 12) {
        formattedNumber = cleanNumber.substring(2); // Remove 92: 923029248522 -> 3029248522
      }
      
      console.log('📤 Formatted number:', formattedNumber);
      console.log('📤 JSON payload:', JSON.stringify(formattedNumber));
      
      // Get the token
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        throw new Error('Authentication token not found');
      }
      
      // Make the API call
      const response = await fetch(`${API_BASE_URL}/SMS/send`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedNumber)
      });
      
      console.log('📡 Response status:', response.status);
      
      // Get response as text first
      const responseText = await response.text();
      console.log('📡 Raw response text:', responseText);
      
      if (!response.ok) {
        // Handle 400 error - the API returns plain text errors
        console.log('❌ API Error - Status:', response.status, 'Response:', responseText);
        
        let errorMessage = 'Failed to send verification code';
        
        // Check common plain text error patterns
        if (responseText.includes('Phone number is already taken')) {
          errorMessage = 'This phone number is already registered. Please use a different number.';
        } else if (responseText.includes('required') || responseText.includes('Required')) {
          errorMessage = 'Phone number is required. Please check the format.';
        } else if (responseText.includes('invalid') || responseText.includes('Invalid')) {
          errorMessage = 'Invalid phone number format. Please check and try again.';
        } else if (responseText.trim().length > 0) {
          // Use the plain text error as-is
          errorMessage = responseText;
        } else {
          errorMessage = `Verification failed (Error ${response.status}). Please try again.`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Success case
      console.log('✅ API Success Response:', responseText);
      
      return {
        success: true,
        message: responseText
      };
    } catch (error: any) {
      console.error('❌ SMS API Error:', error);
      throw new Error(
        error.message || 
        'Failed to send verification code. Please try again.'
      );
    }
  },

  verifyOTP: async (phoneNumber: string, code: string) => {
    try {
      console.log('🔍 Verifying OTP for:', phoneNumber, 'Code:', code);
      
      // Clean the phone number (same logic as sendOTP)
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      let formattedNumber = cleanNumber;
      if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
        formattedNumber = cleanNumber.substring(1);
      } else if (cleanNumber.startsWith('92') && cleanNumber.length === 12) {
        formattedNumber = cleanNumber.substring(2);
      }
      
      // Verify endpoint expects JSON object
      const requestData = {
        phoneNumber: formattedNumber,
        code: code
      };

      console.log('📤 Verify request data:', requestData);
      
      const response = await apiClient.post('/SMS/verify', requestData);
      
      console.log('✅ OTP verified successfully');
      
      return {
        success: true,
        verified: true,
        message: 'Phone number verified successfully'
      };
    } catch (error: any) {
      console.error('❌ Verify OTP Error:', error);
      throw new Error(
        error.response?.data?.message || 
        'Invalid verification code. Please try again.'
      );
    }
  }
};

// Keep the same phone number formatting function
const formatPhoneNumberForSMSAPI = (phoneNumber: string): string => {
  if (!phoneNumber) return phoneNumber;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  console.log('🔧 Cleaning phone number:', { original: phoneNumber, cleaned });
  
  // Handle Pakistan numbers - remove country code
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    // 92XXXXXXXXXXX -> remove 92 to get 3XXXXXXXXXX
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // 03XXXXXXXXX -> remove 0 to get 3XXXXXXXXX
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('923') && cleaned.length === 12) {
    // 923XXXXXXXXXX -> remove 92 to get 3XXXXXXXXXX
    cleaned = cleaned.substring(2);
  }
  
  // Final validation - should be 10 digits starting with 3
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    console.log('✅ Valid Pakistan number format:', cleaned);
    return cleaned;
  } else {
    console.log('⚠️ Unexpected phone format, sending as-is:', cleaned);
    return cleaned;
  }
};
