// types.ts

// API Request Types
export interface SignUpRequest {
  email: string;
  userProfileType: number;
}

export interface VerifyOtpRequest {
  email: string;
  otp: number;
}

export interface CreatePasswordRequest {
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
  deviceToken: string;
  userProfileType: number;
  platform: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  password: string;
}

// API Response Types
export interface SignUpResponse {
  message: string;
  otp: {
    userId: string;
    otp: number;
  };
}

export interface VerifyOtpResponse {
  message: string;
}

export interface CreatePasswordResponse {
  message: string;
}

export interface SignInResponse {
  token: string;
  user?: any;
  message?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  otp: number;
}

export interface ResetPasswordResponse {
  message: string;
}

// Profile Types
export interface SellerProfile {
  id: number;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  personalWebsite: string;
  servingStates: string; // API returns string, not array
  noOfYears: number; // API uses noOfYears, not numberOfYears
  language: string; // API returns string, not array
  userProfileImage: string;
  passports: string[];
  driversLicenses: string[];
  stateIDs: string[];
  militaryIds: string[];
  greenCards: string[];
  votersCards: string[];
  realStateIdNo: string;
  realStateId: string;
  companyLogo: string;
  brokerName: string;
  brokerContact: string;
  market: string[];
  geographicalAreas: string;
  aboutMe: string;
  facebook: string;
  twitter: string;
  linkedIn: string;
  youtube: string;
  tikTok: string;
  instagram: string;
  status: string;
  profileStatus: string;
  pricingPlans: any;
  emailandPhoneVerified: boolean;
  governmentIsuueIdVerified: boolean;
  isFeedbacked: boolean;
  allowedListingsRemaining: any;
  quotaPeriodStartUtc: any;
  createdDate: string;
  modifiedDate: string;
}

// Update CreateSellerProfileRequest to match API expected fields


export interface CreateSellerProfileResponse {
  message: string;
  success: boolean;
  data?: SellerProfile;
}

export interface SellerProfileResponse {
  sellerProfile: SellerProfile;
  sellerPropertyStatistics: any; // or create a proper interface for this
  success?: boolean;
  message?: string;
}
export interface ApiResponse<T> {
  data?: T;
  sellerProfile?: T;
  success: boolean;
  message: string;
  [key: string]: any; // Allow additional properties
}

export interface DeleteProfileResponse {
  message: string;
  success: boolean;
}

// User Context Types
export interface UserInfo {
  email: string;
  token: string;
  userId: string;
  userProfileType: string;
}

export interface AuthContextType {
  userInfo: UserInfo | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (email: string, userProfileType: number) => Promise<void>;
  resetPassword: (email: string, password: string) => Promise<void>;
}

// Navigation Types
export type AuthStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  OtpResetPassword: { email: string };
  ResetPassword: { email: string; otp: number };
  Otp: { email: string; userProfileType: number };
  CreatePassword: { email: string };
  Home: undefined;
};

export type AppStackParamList = {
  Main: undefined;
  Home: undefined;
  EditProfile: { isEditMode: boolean }; 
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: { isEditMode: boolean };
};

export type BottomTabParamList = {
  Listing: undefined;
  Followers: undefined;
  Chats: undefined;
  MyTasks: undefined;
  Profile: undefined;
};

// Component Prop Types
export interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onPasswordChanged: () => void;
  userEmail: string | undefined;
}

// API Error Types
export interface ApiError {
  message: string;
  code: number;
  success: boolean;
}

// Form Types
export interface ProfileFormData {
  name: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  personalWebsite: string;
  servingStates: string[];
  numberOfYears: number;
  languages: string[];
  userProfileImage: string;
  passportUploads: string[];
  driversLicenseUploads: string[];
  stateIDUploads: string[];
  militaryIdUploads: string[];
  greenCardUploads: string[];
  votersCardUploads: string[];
  realStateIdNo: string;
  realStateId: string;
  companyLogo: string;
  brokerName: string;
  brokerContact: string;
  market: string[];
  geographicalAreas: string;
  aboutMe: string;
  facebook: string;
  twitter: string;
  linkedIn: string;
  youtube: string;
  tikTok: string;
  instagram: string;
}

// types.ts - Add specific update interface
// Keep CreateSellerProfileRequest as camelCase (matches your API)
export interface CreateSellerProfileRequest {
  name: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  personalWebsite: string;
  servingStates: string[];
  numberOfYears: number;
  languages: string[];
  userProfileImage: string;
  passportUploads: string[];
  driversLicenseUploads: string[];
  stateIDUploads: string[];
  militaryIdUploads: string[];
  greenCardUploads: string[];
  votersCardUploads: string[];
  realStateIdNo: string;
  realStateId: string;
  companyLogo: string;
  brokerName: string;
  brokerContact: string;
  market: string[];
  geographicalAreas: string;
  aboutMe: string;
  facebook: string;
  twitter: string;
  linkedIn: string;
  youtube: string;
  tikTok: string;
  instagram: string;
}

// Keep UpdateSellerProfileRequest as PascalCase (matches your API)
export interface UpdateSellerProfileRequest {
  Name: string;
  Email: string;
  PhoneNumber: string;
  BusinessName?: string;
  PersonalWebsite?: string;
  ServingStates?: string; // API expects string, not array
  NumberOfYears: number;
  Languages?: string; // API expects string, not array
  UserProfileImage?: string;
  PassportUploads?: string[];
  DriversLicenseUploads?: string[];
  StateIDUploads?: string[];
  MilitaryIdUploads?: string[];
  GreenCardUploads?: string[];
  VotersCardUploads?: string[];
  RealStateIdNo?: string;
  RealStateId?: string;
  CompanyLogo?: string;
  BrokerName?: string;
  BrokerContact?: string;
  Market?: string; // API expects string, not array
  GeographicalAreas?: string;
  AboutMe?: string;
  Facebook?: string;
  Twitter?: string;
  LinkedIn?: string;
  Youtube?: string;
  TikTok?: string;
  Instagram?: string;
}

export interface UpdateSellerProfileResponse {
  message: string;
  success: boolean;
  data?: SellerProfile;
}

// SMS Verification Types
export interface SendSMSRequest {
  phoneNumber: string;
}

export interface SendSMSResponse {
  message: string;
  success: boolean;
}

export interface VerifySMSRequest {
  phoneNumber: string;
  code: string;
}

export interface VerifySMSResponse {
  message: string;
  success: boolean;
  verified: boolean;
}