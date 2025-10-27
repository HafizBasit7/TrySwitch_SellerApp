// axiosConfig.ts
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': `PropSeller/${Platform.OS}`,
  },
});

// Enhanced request interceptor to automatically add token
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from AsyncStorage
    const userToken = await AsyncStorage.getItem('userToken');
    
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }

    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📦 Request Headers:', config.headers);
    console.log('📤 Request Data:', config.data);
    return config;
  },
  (error) => {
    console.log('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with token expiration handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.log('❌ API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Handle token expiration
    if (error.response?.status === 401) {
      console.log('🔄 Token expired, logging out...');
      // You can trigger automatic logout here if needed
      // This would require passing a logout function to the interceptor
    }

    return Promise.reject(error);
  },


  
);

export default apiClient;