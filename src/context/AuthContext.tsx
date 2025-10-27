import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  name?: string;
  email: string;
  id: string;
  profileType: string;
}

interface AuthContextType {
  userToken: string | null;
  userInfo: User | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (token: string) => Promise<void>;
  updateUserInfo: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT decode function
const decodeJWT = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
};

// atob polyfill for React Native
const atob = (input: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }

  for (let bc = 0, bs = 0, buffer, i = 0;
      buffer = str.charAt(i++);
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ?
      output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Extract user info from token
  const extractUserInfo = (token: string): User => {
    const decoded = decodeJWT(token);
    if (!decoded) {
      throw new Error('Failed to decode token');
    }

    return {
      email: decoded.email || decoded.unique_name || '',
      id: decoded.nameid || decoded.sid || '',
      profileType: decoded.UserProfileType || 'Unknown',
      name: decoded.name || null, // Name might not be in the token initially
    };
  };

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        
        if (token) {
          setUserToken(token);
          if (storedUserInfo) {
            setUserInfo(JSON.parse(storedUserInfo));
          } else {
            // Extract user info from token if not stored
            const userInfoFromToken = extractUserInfo(token);
            setUserInfo(userInfoFromToken);
            await AsyncStorage.setItem('userInfo', JSON.stringify(userInfoFromToken));
          }
        }
      } catch (e) {
        console.error('Failed to load token or user info', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    userToken,
    userInfo,
    isLoading,
    signIn: async (token: string) => {
      try {
        const userInfoFromToken = extractUserInfo(token);
        
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfoFromToken));
        
        setUserToken(token);
        setUserInfo(userInfoFromToken);
      } catch (e) {
        console.error('Failed to save token or user info', e);
      }
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        setUserToken(null);
        setUserInfo(null);
      } catch (e) {
        console.error('Failed to remove token or user info', e);
      }
    },
    signUp: async (token: string) => {
      try {
        const userInfoFromToken = extractUserInfo(token);
        
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfoFromToken));
        
        setUserToken(token);
        setUserInfo(userInfoFromToken);
      } catch (e) {
        console.error('Failed to save token after signup', e);
      }
    },
    updateUserInfo: (userData: Partial<User>) => {
      setUserInfo(prev => prev ? { ...prev, ...userData } : null);
      if (userInfo) {
        AsyncStorage.setItem('userInfo', JSON.stringify({ ...userInfo, ...userData }));
      }
    },
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};