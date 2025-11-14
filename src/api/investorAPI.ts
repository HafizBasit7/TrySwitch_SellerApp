// src/api/investorAPI.ts
import apiClient from './axiosConfig';
import {
  InvestorProfile,
  FollowerData,
  SendInviteRequest,
  SendBulkEmailRequest,
  parseEmails,
  isValidEmail
} from '../types/investorTypes';

export const investorAPI = {
  /**
   * GET - Get all investor profiles (for Invite Clients screen)
   * Endpoint: /api/InvestorProfile/GetAllInvestorProfiles
   */
  getAllInvestorProfiles: async (): Promise<InvestorProfile[]> => {
    try {
      console.log('📋 Fetching all investor profiles...');
      
      const response = await apiClient.get<InvestorProfile[]>(
        '/InvestorProfile/GetAllInvestorProfiles'
      );
      
      console.log('✅ Fetched investor profiles:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get All Investor Profiles Error:', error);
      throw error;
    }
  },

  /**
   * GET - Get investors following the seller (for Followers List screen)
   * Endpoint: /api/InvestorNetwork/GetInvestorsFollowingSeller
   */
  getInvestorsFollowingSeller: async (): Promise<FollowerData[]> => {
    try {
      console.log('👥 Fetching followers...');
      
      const response = await apiClient.get<FollowerData[]>(
        '/InvestorNetwork/GetInvestorsFollowingSeller'
      );
      
      console.log('✅ Fetched followers:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get Followers Error:', error);
      throw error;
    }
  },

  /**
   * POST - Add or remove investor from network
   * Endpoint: /api/InvestorNetwork/AddOrRemoveToNetwork
   */
  addOrRemoveToNetwork: async (sellerId: string): Promise<void> => {
    try {
      console.log('🔄 Toggle network status for seller:', sellerId);
      
      await apiClient.post(
        `/InvestorNetwork/AddOrRemoveToNetwork?sellerId=${sellerId}`
      );
      
      console.log('✅ Network status toggled successfully');
    } catch (error: any) {
      console.error('❌ Add/Remove Network Error:', error);
      throw error;
    }
  },

  /**
   * POST - Remove investor from following
   * Endpoint: /api/InvestorNetwork/RemoveInvestorFromFollowing
   */
  removeInvestorFromFollowing: async (investorId: string): Promise<void> => {
    try {
      console.log('🗑️ Removing investor from following:', investorId);
      
      await apiClient.post(
        `/InvestorNetwork/RemoveInvestorFromFollowing?investorId=${investorId}`
      );
      
      console.log('✅ Investor removed successfully');
    } catch (error: any) {
      console.error('❌ Remove Investor Error:', error);
      throw error;
    }
  },

  /**
   * POST - Send invite to single investor (from search list)
   * Endpoint: /api/InvestorNetwork/send-invite
   */
  sendInviteToInvestor: async (investorId: string): Promise<void> => {
    try {
      console.log('📤 Sending invite to investor:', investorId);
      
      const requestData: SendInviteRequest = {
        investorId
      };
      
      await apiClient.post(
        '/InvestorNetwork/send-invite',
        requestData
      );
      
      console.log('✅ Invite sent successfully');
    } catch (error: any) {
      console.error('❌ Send Invite Error:', error);
      throw error;
    }
  },

  /**
   * POST - Send bulk email invites (via Email modal)
   * Endpoint: /api/Email/send-bulk
   */

sendBulkEmailInvites: async (
  recipients: string[],
  subject: string
): Promise<void> => {
  try {
    console.log('📬 Sending bulk emails to:', recipients.length, 'recipients');
    console.log('📧 Recipients:', recipients);
    console.log('📧 Subject:', subject);

     console.log('🔍 DEBUG - Starting sendBulkEmailInvites');
    console.log('🔍 DEBUG - Full recipients array:', recipients);
    console.log('🔍 DEBUG - Subject:', subject);
    
    // Create request data EXACTLY as shown in Swagger
    const requestData = {
      recipients: recipients,
      subject: subject
    };
    
    console.log('🚀 Bulk email request data:', JSON.stringify(requestData, null, 2));
    
    // Make the API call - ensure the endpoint is correct
    const response = await apiClient.post('/Email/send-bulk', requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    // console.log('✅ API Response Data:', response.data);
    
    // Verify the response matches Swagger
    if (response.data !== 'Emails sent successfully') {
      console.warn('⚠️ Unexpected response format:', response.data);
    }
    
    console.log('✅ Bulk emails sent successfully');
  } catch (error: any) {
    console.error('❌ Send Bulk Email Error:', error);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Error data:', error.response?.data);
    console.error('❌ Error message:', error.message);
    
    // Enhanced error handling
    if (error.response?.status === 500) {
      throw new Error('Email service is currently experiencing issues. Please try again later.');
    } else if (error.response?.status === 400) {
      throw new Error(`Invalid request: ${error.response.data || 'Please check the email format'}`);
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error('Failed to send email invitations. Please try again.');
    }
  }
},

  /**
   * MAIN METHOD: Send email invites via Email modal
   */
/**
 * MAIN METHOD: Send email invites via Email modal
 * This matches the Swagger API structure exactly
 */
sendEmailInvites: async (
  senderEmail: string,
  recipientEmailsString: string,
  senderName?: string
): Promise<void> => {
  try {
    console.log('📧 Starting email send process...');
    
    
    // Parse emails from comma-separated string
    const emailList = parseEmails(recipientEmailsString);
    
    // Filter valid emails
    const validEmails = emailList.filter(email => isValidEmail(email));
    const invalidEmails = emailList.filter(email => !isValidEmail(email));
    
    if (validEmails.length === 0) {
      throw new Error('No valid email addresses provided');
    }

    if (invalidEmails.length > 0) {
      console.warn('⚠️ Invalid emails skipped:', invalidEmails);
    }

    console.log('📧 Sending email invites to:', validEmails.length, 'recipients');
    console.log('📧 Valid recipients:', validEmails);

    // Use sender's email as subject (EXACTLY as shown in Swagger example)
    const subject = senderEmail;

    console.log('📧 Using subject (sender email):', subject);

    // Use bulk email API - this matches Swagger exactly
    await investorAPI.sendBulkEmailInvites(validEmails, subject);
    
    console.log('✅ Email invitations sent successfully');
  } catch (error: any) {
    console.error('❌ Send Email Invites Error:', error);
    
    // Re-throw with more context
    if (error.message.includes('No valid email')) {
      throw error; // Keep original message
    } else {
      throw new Error(`Failed to send invitations: ${error.message}`);
    }
  }
},


  /**
   * GET - Get invites for specific investor
   * Endpoint: /api/InvestorNetwork/invites/{investorId}
   */
  getInvestorInvites: async (investorId: string): Promise<any> => {
    try {
      console.log('📨 Fetching invites for investor:', investorId);
      
      const response = await apiClient.get(
        `/InvestorNetwork/invites/${investorId}`
      );
      
      console.log('✅ Fetched invites:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get Investor Invites Error:', error);
      throw error;
    }
  },

    getInvestorInviteStatus: async (investorId: string): Promise<any[]> => {
    try {
      console.log('📨 Fetching invite status for investor:', investorId);
      
      const response = await apiClient.get(
        `/InvestorNetwork/invites/${investorId}`
      );
      
      console.log('✅ Fetched invite status:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get Investor Invite Status Error:', error);
      // Return empty array if no invites found (404)
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Search investors by name (client-side filtering)
   */
  searchInvestors: (investors: InvestorProfile[], searchTerm: string): InvestorProfile[] => {
    if (!searchTerm.trim()) {
      return investors;
    }

    const term = searchTerm.toLowerCase();
    return investors.filter(investor => 
      investor.name.toLowerCase().includes(term) ||
      investor.email.toLowerCase().includes(term) ||
      investor.companyName?.toLowerCase().includes(term)
    );
  },

getInvestorProfileById: async (userId: string): Promise<InvestorProfile> => {
    try {
      console.log('📋 Fetching investor profile by user ID:', userId);
      
      const response = await apiClient.get<InvestorProfile>(
        `/InvestorProfile/GetInvestorProfileById?userId=${userId}`
      );
      
      console.log('✅ Fetched investor profile:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get Investor Profile Error:', error);
      throw error;
    }
  },
};