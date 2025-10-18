import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  name?: string;
  email?: string;
  // Add other user fields as needed
}

interface AuthContextType {
  userToken: string | null;
  userInfo: User | null;
  isLoading: boolean;
  signIn: (token: string, userData?: User) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (token: string, userData?: User) => Promise<void>;
  updateUserInfo: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userInfo');
        setUserToken(token);
        if (userData) {
          setUserInfo(JSON.parse(userData));
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
    signIn: async (token: string, userData?: User) => {
      try {
        await AsyncStorage.setItem('userToken', token);
        if (userData) {
          await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
          setUserInfo(userData);
        }
        setUserToken(token);
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
    signUp: async (token: string, userData?: User) => {
      try {
        await AsyncStorage.setItem('userToken', token);
        if (userData) {
          await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
          setUserInfo(userData);
        }
        setUserToken(token);
      } catch (e) {
        console.error('Failed to save token after signup', e);
      }
    },
    updateUserInfo: (userData: User) => {
      setUserInfo(userData);
      AsyncStorage.setItem('userInfo', JSON.stringify(userData));
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