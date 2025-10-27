// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';
import { 
  AuthStackParamList as AuthStackParams,
  AppStackParamList as AppStackParams,
  ProfileStackParamList as ProfileStackParams,
  BottomTabParamList as BottomTabParams 
} from '../types/auth';

// Re-export your existing types with NavigatorScreenParams where needed
export type AuthStackParamList = AuthStackParams;

export type AppStackParamList = AppStackParams;

export type ProfileStackParamList = ProfileStackParams;

export type ListingStackParamList = {
  Listing: undefined;
  CreateListing: undefined;
};

export type BottomTabParamList = BottomTabParams & {
  Listing: NavigatorScreenParams<ListingStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type DrawerParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  Home: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<DrawerParamList>;
};