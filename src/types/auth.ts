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
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
};

export type BottomTabParamList = {
  Listing: undefined;
  Followers: undefined;
  Chats: undefined;
  MyTasks: undefined;
  Profile: undefined;
};