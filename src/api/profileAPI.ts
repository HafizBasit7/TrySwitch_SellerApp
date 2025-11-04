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

      // console.log('📦 Sending multipart form data');
      
      const response = await apiClient.post<SellerProfile>(
        '/SellerProfile/UpdateSellerProfile', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // console.log('✅ Update response received:', response.data);
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



// SMS Verification APIs - Send Raw String
// SMS Verification APIs - With Correct xxx-xxx-xxxx Format
export const smsAPI = {
  // Send OTP to phone number - With correct formatting
  sendOTP: async (phoneNumber: string): Promise<SendSMSResponse> => {
    try {
      console.log('📱 Starting OTP send for:', phoneNumber);
      
      // Format phone number for API - convert to xxx-xxx-xxxx format
      const formattedPhoneNumber = formatPhoneNumberForSMSAPI(phoneNumber);
      console.log('📱 Formatted for API:', formattedPhoneNumber);
      
      console.log('🚀 API Request: POST /Account/SendPhonenumberOTP');
      console.log('📤 Request Data (formatted):', formattedPhoneNumber);
      
      // Send as raw string in xxx-xxx-xxxx format
      const response = await apiClient.post(
        '/Account/SendPhonenumberOTP',
        formattedPhoneNumber, // This should be: "318-534-3522"
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log('✅ OTP sent successfully:', response.data);
      return {
        message: response.data?.message || 'Verification code sent',
        success: true
      };
    } catch (error: any) {
      console.error('❌ Failed to send OTP:', error);
      
      // Enhanced error handling
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        console.log('🔍 Validation errors:', validationErrors);
        
        let errorMessage = 'Validation failed: ';
        
        if (validationErrors.phoneNumber) {
          errorMessage += validationErrors.phoneNumber.join(', ');
        } else if (validationErrors.$) {
          errorMessage += validationErrors.$.join(', ');
        } else {
          errorMessage += JSON.stringify(validationErrors);
        }
        
        throw new Error(errorMessage);
      } else if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          throw new Error(errorData);
        } else if (errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error('Failed to send verification code');
        }
      } else {
        throw new Error('Failed to send verification code. Please try again.');
      }
    }
  },

  // Verify OTP code - Also needs formatting
  verifyOTP: async (phoneNumber: string, code: string): Promise<VerifySMSResponse> => {
    try {
      console.log('🔍 Verifying OTP:', { phoneNumber, code });
      
      // Format phone number for API - convert to xxx-xxx-xxxx format
      const formattedPhoneNumber = formatPhoneNumberForSMSAPI(phoneNumber);
      
      // For verification, send as proper JSON object with formatted phone
      const requestData = {
        phoneNumber: formattedPhoneNumber, // Should be "318-534-3522"
        otp: code
      };

      console.log('🚀 API Request: POST /Account/verify-phonenumber-otp');
      console.log('📤 Verify Request Data (JSON object):', requestData);

      const response = await apiClient.post<VerifySMSResponse>(
        '/Account/verify-phonenumber-otp',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log('✅ OTP verified successfully:', response.data);
      return {
        message: response.data?.message || 'Phone number verified',
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
        } else if (validationErrors.otp) {
          errorMessage += validationErrors.otp.join(', ');
        } else {
          errorMessage += JSON.stringify(validationErrors);
        }
        
        throw new Error(errorMessage);
      } else if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          throw new Error(errorData);
        } else if (errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error('Invalid verification code');
        }
      } else {
        throw new Error('Invalid verification code. Please try again.');
      }
    }
  },
};

// Phone number formatting - Convert to xxx-xxx-xxxx format
const formatPhoneNumberForSMSAPI = (phoneNumber: string): string => {
  if (!phoneNumber) return phoneNumber;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  console.log('🔧 Cleaning phone number:', { original: phoneNumber, cleaned });
  
  // Handle Pakistan numbers - remove country code if present
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    // 92XXXXXXXXXX -> remove 92 to get XXXXXXXXXX
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // 03XXXXXXXXX -> remove 0 to get 3XXXXXXXXX
    cleaned = cleaned.substring(1);
  }
  
  // Final validation - must be exactly 10 digits
  if (cleaned.length !== 10) {
    throw new Error('Phone number must be exactly 10 digits after formatting');
  }
  
  // Convert to xxx-xxx-xxxx format
  const formatted = `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  
  console.log('✅ Final phone number format (xxx-xxx-xxxx):', formatted);
  return formatted;
};