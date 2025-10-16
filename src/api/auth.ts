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
  ResetPasswordResponse
} from '../types/auth';
import apiClient from './axiosConfig';

export const authAPI = {
  signup: async (data: SignUpRequest): Promise<SignUpResponse> => {
    const response = await apiClient.post<SignUpResponse>('/Account/signup', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<string> => {
    const response = await apiClient.post('/Account/verify-otp', data, {
      transformResponse: [(data) => data] // Keep as string, don't parse JSON
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