// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

export type BottomTabParamList = {
  Listing: NavigatorScreenParams<ListingStackParamList>;
  Followers: NavigatorScreenParams<FollowersStackParamList>;
  Chats: NavigatorScreenParams<ChatsStackParamList>;
  MyTasks: NavigatorScreenParams<TasksStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Add these new types for Followers and Chats stacks
export type FollowersStackParamList = {
  FollowersMain: undefined;
  UserProfile: { userId: string; userName?: string };
};

export type ChatsStackParamList = {
  ChatsMain: undefined;
  ChatConversation: { 
    chatId: string; 
    userId: string; 
    userName: string;
  };
};

// Your existing types...
export type ListingStackParamList = {
  ListingMain: undefined;
  CreateListing: undefined;
  PreviewListing: { listingData: any };
  EditListing: { listing: any };
  PropertyDetails: { propertyId: number };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

export type TasksStackParamList = {
  TasksMain: undefined;
  TaskDetails: { taskId: string };
};