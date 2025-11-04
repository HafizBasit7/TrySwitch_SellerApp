// src/types/investorTypes.ts

/**
 * Investor Profile Response from GetAllInvestorProfiles API
 */
export interface InvestorProfile {
  id: number;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  companyName: string | null;
  userProfileImage: string;
  stateIDs: string[];
  userIdType: string | null;
  market: string[];
  geographicalAreas: string | null;
  status: string;
  profileStatus: string;
  emailandPhoneVerified: boolean;
  governmentIsuueIdVerified: boolean;
  isFeedbacked: boolean;
  createdDate: string;
  modifiedDate: string;
}

/**
 * Follower Response from GetInvestorsFollowingSeller API
 */
export interface FollowerData {
  totalInvestorsCount: number;
  investors: InvestorProfile[];
}

/**
 * Invite Request for send-invite API
 */
export interface SendInviteRequest {
  investorId: string;
}

/**
 * Bulk Email Request for send-bulk API
 */
export interface SendBulkEmailRequest {
  recipients: string[];
  subject: string;
}

/**
 * Bulk Email Response
 */
export interface SendBulkEmailResponse {
  success: boolean;
  message: string;
  failedEmails?: string[];
}

/**
 * Helper function to parse comma-separated emails
 */
// In your types/investorTypes.ts or utils
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const parseEmails = (emailString: string): string[] => {
  return emailString
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
};

// Add to your types/investorTypes.ts
export interface InviteStatus {
  id: number;
  sellerId: string;
  investorId: string;
  requestedDate: string;
  isAccepted: boolean;
  sellerName: string;
}

export interface InvestorWithStatus extends InvestorProfile {
  inviteStatus?: InviteStatus[];
  isFollowing?: boolean;
}