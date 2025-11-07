// api/investorProfAPI.ts
import apiClient from './axiosConfig';

export interface InvestorProfile {
  id?: number;
  userId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  userProfileImage?: string;
  profileImage?: string; // Alternative field name
  company?: string;
  position?: string;
  // Add other investor profile fields as needed
}

export interface InvestorProfileResponse {
  success: boolean;
  investorProfile?: InvestorProfile;
  message?: string;
}

export interface AllInvestorProfilesResponse {
  success: boolean;
  investorProfiles: InvestorProfile[];
  message?: string;
}

export const investorProfAPI = {
  // Get all investor profiles
  getAllInvestorProfiles: async (): Promise<AllInvestorProfilesResponse> => {
    try {
      console.log('📊 Fetching all investor profiles...');
      const response = await apiClient.get<AllInvestorProfilesResponse>(
        '/InvestorProfile/GetAllInvestorProfiles'
      );
      console.log('📊 All investor profiles retrieved:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get all investor profiles error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to load investor profiles.'
      );
    }
  },

  // Get investor profile by ID
// api/investorProfAPI.ts - Update getInvestorProfileById
// Get investor profile by ID
getInvestorProfileById: async (userId: string): Promise<InvestorProfileResponse> => {
  try {
    console.log(`👤 Fetching investor profile for userId: ${userId}`);
    const response = await apiClient.get<any>( // Use any to handle the actual response
      '/InvestorProfile/GetInvestorProfileById',
      {
        params: { userId }
      }
    );
    console.log('✅ Investor profile raw response:', response.data);
    
    // Handle the actual API response structure
    const apiData = response.data;
    
    if (apiData && apiData.userId) {
      // The API returns the profile directly, not wrapped
      const investorProfile: InvestorProfile = {
        userId: apiData.userId,
        name: apiData.name || '',
        profileImage: apiData.userProfileImage || apiData.profileImage,
        company: apiData.companyName,
        // Add other fields as needed
      };
      
      return {
        success: true,
        investorProfile
      };
    } else {
      console.log('⚠️ No investor profile data in response');
      return {
        success: false,
        message: 'Investor profile not found'
      };
    }
  } catch (error: any) {
    console.error(`❌ Get investor profile error for ${userId}:`, error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message ||
      'Failed to load investor profile.'
    );
  }
},

  // Get current user's investor profile
  getInvestorProfile: async (): Promise<InvestorProfileResponse> => {
    try {
      console.log('👤 Fetching current investor profile...');
      const response = await apiClient.get<InvestorProfileResponse>(
        '/InvestorProfile/GetInvestorProfile'
      );
      console.log('👤 Current investor profile retrieved:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get current investor profile error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to load current investor profile.'
      );
    }
  },
};