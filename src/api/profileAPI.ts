// api/profileAPI.ts
import apiClient from './axiosConfig';
import { 
  CreateSellerProfileRequest, 
  CreateSellerProfileResponse, 
  SellerProfileResponse,
  SellerProfile,
  DeleteProfileResponse,
  ApiResponse,
  UpdateSellerProfileRequest,
  UpdateSellerProfileResponse ,
  SendSMSRequest, SendSMSResponse, VerifySMSRequest, VerifySMSResponse
} from '../types/auth';


export const profileAPI = {
  createSellerProfile: async (data: CreateSellerProfileRequest): Promise<CreateSellerProfileResponse> => {
    const response = await apiClient.post<CreateSellerProfileResponse>('/SellerProfile/CreateSellerProfile', data);
    return response.data;
  },

  // ADD THIS UPDATE METHOD
  updateSellerProfile: async (data: UpdateSellerProfileRequest): Promise<UpdateSellerProfileResponse> => {
    try {
      console.log('🚀 Sending update request with data:', data);
      
      const formData = new FormData();
      
      // Required fields
      formData.append('Name', data.Name);
      formData.append('Email', data.Email);
      formData.append('PhoneNumber', data.PhoneNumber);
      formData.append('NumberOfYears', data.NumberOfYears.toString());
      
      // Optional fields - only append if they have values
      if (data.BusinessName) formData.append('BusinessName', data.BusinessName);
      if (data.PersonalWebsite) formData.append('PersonalWebsite', data.PersonalWebsite);
      if (data.UserProfileImage) formData.append('UserProfileImage', data.UserProfileImage);
      if (data.CompanyLogo) formData.append('CompanyLogo', data.CompanyLogo);
      if (data.RealStateIdNo) formData.append('RealStateIdNo', data.RealStateIdNo);
      if (data.RealStateId) formData.append('RealStateId', data.RealStateId);
      if (data.BrokerName) formData.append('BrokerName', data.BrokerName);
      if (data.BrokerContact) formData.append('BrokerContact', data.BrokerContact);
      if (data.GeographicalAreas) formData.append('GeographicalAreas', data.GeographicalAreas);
      if (data.AboutMe) formData.append('AboutMe', data.AboutMe);
      if (data.Facebook) formData.append('Facebook', data.Facebook);
      if (data.Twitter) formData.append('Twitter', data.Twitter);
      if (data.LinkedIn) formData.append('LinkedIn', data.LinkedIn);
      if (data.Youtube) formData.append('Youtube', data.Youtube);
      if (data.TikTok) formData.append('TikTok', data.TikTok);
      if (data.Instagram) formData.append('Instagram', data.Instagram);
      
      // Array fields - convert to strings
      if (data.ServingStates) {
        formData.append('ServingStates', Array.isArray(data.ServingStates) ? data.ServingStates.join(',') : data.ServingStates);
      }
      
      if (data.Languages) {
        formData.append('Languages', Array.isArray(data.Languages) ? data.Languages.join(',') : data.Languages);
      }
      
      if (data.Market) {
        formData.append('Market', Array.isArray(data.Market) ? data.Market.join(',') : data.Market);
      }
      
      // File upload arrays - handle properly
      if (data.PassportUploads && data.PassportUploads.length > 0) {
        data.PassportUploads.forEach((upload, index) => {
          formData.append('PassportUploads', upload);
        });
      } else {
        formData.append('PassportUploads', '');
      }
      
      if (data.DriversLicenseUploads && data.DriversLicenseUploads.length > 0) {
        data.DriversLicenseUploads.forEach((upload, index) => {
          formData.append('DriversLicenseUploads', upload);
        });
      } else {
        formData.append('DriversLicenseUploads', '');
      }
      
      // Add other upload arrays similarly
      if (data.StateIDUploads && data.StateIDUploads.length > 0) {
        data.StateIDUploads.forEach((upload, index) => {
          formData.append('StateIDUploads', upload);
        });
      } else {
        formData.append('StateIDUploads', '');
      }
      
      if (data.MilitaryIdUploads && data.MilitaryIdUploads.length > 0) {
        data.MilitaryIdUploads.forEach((upload, index) => {
          formData.append('MilitaryIdUploads', upload);
        });
      } else {
        formData.append('MilitaryIdUploads', '');
      }
      
      if (data.GreenCardUploads && data.GreenCardUploads.length > 0) {
        data.GreenCardUploads.forEach((upload, index) => {
          formData.append('GreenCardUploads', upload);
        });
      } else {
        formData.append('GreenCardUploads', '');
      }
      
      if (data.VotersCardUploads && data.VotersCardUploads.length > 0) {
        data.VotersCardUploads.forEach((upload, index) => {
          formData.append('VotersCardUploads', upload);
        });
      } else {
        formData.append('VotersCardUploads', '');
      }

      console.log('📦 Sending multipart form data');
      
      const response = await apiClient.post<SellerProfile>(
        '/SellerProfile/UpdateSellerProfile', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('✅ Update response received:', response.data);
      return {
        message: 'Profile updated successfully',
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Update profile API error:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteSellerProfile: async (): Promise<string> => {
    const response = await apiClient.post('/SellerProfile/DeleteSellerProfile', {}, {
      transformResponse: [(data) => data]
    });
    return response.data;
  },

  deleteInvestorProfile: async (): Promise<string> => {
    const response = await apiClient.post('/InvestorProfile/DeleteInvestorProfile', {}, {
      transformResponse: [(data) => data]
    });
    return response.data;
  },

  // Generic delete profile that tries both endpoints
  deleteProfile: async (userProfileType: string): Promise<string> => {
    if (userProfileType === 'Seller') {
      return await profileAPI.deleteSellerProfile();
    } else if (userProfileType === 'Investor') {
      return await profileAPI.deleteInvestorProfile();
    } else {
      throw new Error('Unknown user profile type');
    }
  },

  getSellerProfile: async (): Promise<SellerProfileResponse> => {
    const response = await apiClient.get<SellerProfileResponse>('/SellerProfile/GetSellerProfile');
    
    // Handle different response structures
    const responseData = response.data;
    
    // If the response has sellerProfile directly, return it as is
    if (responseData.sellerProfile) {
      return responseData;
    }
    
    // If it has data property, adapt it to the expected structure
    if (responseData.data) {
      return {
        sellerProfile: responseData.data,
        sellerPropertyStatistics: null,
        success: responseData.success,
        message: responseData.message
      };
    }
    
    throw new Error('Invalid response structure from GetSellerProfile API');
  },

  // Get seller profile by ID
  getSellerProfileById: async (sellerId: string): Promise<SellerProfileResponse> => {
    const response = await apiClient.get<SellerProfileResponse>(`/SellerProfile/GetSellerProfileById/${sellerId}`);
    return response.data;
  },
};


// SMS Verification APIs
// Update your smsAPI in api/profileAPI.ts
export const smsAPI = {
  // Send OTP to phone number - expects RAW STRING
  sendOTP: async (phoneNumber: string): Promise<SendSMSResponse> => {
    try {
      console.log('📱 Sending OTP to:', phoneNumber);
      
      // Format phone number for API - SIMPLIFIED based on API docs
      const formattedPhoneNumber = formatPhoneNumberForSMSAPI(phoneNumber);
      console.log('📱 Formatted for API:', formattedPhoneNumber);
      
      // CORRECT WAY: Send as raw JSON string
      // The API expects just the phone number string as JSON: "3029248522"
      const requestData = formattedPhoneNumber; // Just the string, Axios will serialize it
      
      console.log('📤 Request Data:', requestData);
      
      const response = await apiClient.post(
        '/SMS/send',
        requestData, // Send as string, Axios will handle JSON serialization
        {
          headers: {
            'Content-Type': 'application/json',
          },
          // Remove transformRequest - let Axios handle the serialization
        }
      );
      
      console.log('✅ OTP sent successfully');
      return {
        message: 'Verification code sent',
        success: true
      };
    } catch (error: any) {
      console.error('❌ Failed to send OTP:', error);
      
      // Enhanced error handling for validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        console.log('🔍 Validation errors:', validationErrors);
        
        let errorMessage = 'Validation failed: ';
        
        // Check for phoneNumber specific errors
        if (validationErrors.phoneNumber) {
          errorMessage += validationErrors.phoneNumber.join(', ');
        } else if (validationErrors.$) {
          errorMessage += 'Invalid request format';
        } else {
          errorMessage += JSON.stringify(validationErrors);
        }
        
        throw new Error(errorMessage);
      } else if (error.response?.data === 'Phone number is already taken.') {
        throw new Error('This phone number is already registered. Please use a different number or sign in.');
      } else if (error.response?.data) {
        throw new Error(typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data));
      } else {
        throw new Error('Failed to send verification code. Please try again.');
      }
    }
  },

  // Verify OTP code - expects JSON OBJECT (this is correct)
  verifyOTP: async (phoneNumber: string, code: string): Promise<VerifySMSResponse> => {
    try {
      console.log('🔍 Verifying OTP:', { phoneNumber, code });
      
      // Format phone number for API
      const formattedPhoneNumber = formatPhoneNumberForSMSAPI(phoneNumber);
      
      // Verify endpoint expects JSON object with phoneNumber and code fields
      const requestData: VerifySMSRequest = {
        phoneNumber: formattedPhoneNumber,
        code
      };

      console.log('📤 Verify Request Data (JSON object):', requestData);

      const response = await apiClient.post<VerifySMSResponse>(
        '/SMS/verify',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log('✅ OTP verified successfully');
      return {
        message: 'Phone number verified',
        success: true,
        verified: true
      };
    } catch (error: any) {
      console.error('❌ Failed to verify OTP:', error);
      
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        let errorMessage = 'Validation failed: ';
        
        if (validationErrors.phoneNumber) {
          errorMessage += validationErrors.phoneNumber.join(', ');
        } else if (validationErrors.code) {
          errorMessage += validationErrors.code.join(', ');
        } else {
          errorMessage += JSON.stringify(validationErrors);
        }
        
        throw new Error(errorMessage);
      } else if (error.response?.data) {
        throw new Error(typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data));
      } else {
        throw new Error('Invalid verification code. Please try again.');
      }
    }
  },
};

// SIMPLIFIED phone number formatting
const formatPhoneNumberForSMSAPI = (phoneNumber: string): string => {
  if (!phoneNumber) return phoneNumber;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  console.log('🔧 Cleaning phone number:', { original: phoneNumber, cleaned });
  
  // Based on API docs, it accepts "3029248522" directly
  // So we just need to ensure it's digits only
  // Remove leading country codes if present
  
  // Handle Pakistan numbers - remove country code if present
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    // 92XXXXXXXXXX -> remove 92 to get XXXXXXXXXX
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // 03XXXXXXXXX -> remove 0 to get 3XXXXXXXXX
    cleaned = cleaned.substring(1);
  }
  
  console.log('✅ Final phone number format:', cleaned);
  return cleaned;
};