// types/chat.ts - UPDATED TO MATCH SWAGGER API

// API Request Types - EXACTLY AS IN SWAGGER
export interface SendMessageRequest {
  receiverId: string;
  content: string;
  replyedMessageId?: number;
}

export interface GetMessageHistoryRequest {
  reciverId: string; // Note: API uses "reciverId" (misspelled)
  receiverProfileType: number;
  pageNumber: number;
  pageSize: number;
}

export interface MarkAsReadRequest {
  messageIds: number[];
}

// API Response Types - UPDATED BASED ON ACTUAL API STRUCTURE
export interface Message {
  id: number;
  senderId: string;
  senderName: string;
  senderProfileImage?: string;
  receiverId: string;
  receiverName: string;
  receiverProfileImage?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  replyedMessageId?: number;
  replyedMessage?: Message;
  // Add these fields that might come from API
  messageId?: number; // API might use messageId instead of id
  profileImage?: string; // API might use profileImage instead of senderProfileImage
}

// For API responses that return arrays directly
export interface RawMessage {
  messageId: number;
  senderId: string;
  senderName: string;
  senderProfileImage?: string;
  profileImage?: string; // Alternative field name
  receiverId: string;
  receiverName: string;
  receiverProfileImage?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  replyedMessageId?: number;
  replyedMessage?: RawMessage;
}

export interface MessageHistoryResponse {
  messages: Message[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasNextPage: boolean;
  success: boolean;
  message?: string;
}

export interface ChatUser {
  userId: string;
  userName: string;
  userProfileImage?: string;
  profileImage?: string; // API might use this field
  userProfileType: number;
  lastMessage: string;
  lastMessageTime: string;
  timestamp?: string; // API might use timestamp
  unreadCount: number;
  unreadMessagesCount?: number; // API might use this field
}

export interface UserChatsResponse {
  chats: ChatUser[];
  success: boolean;
  message?: string;
  data?: ChatUser[]; // API might return data array
}

export interface UnreadCountResponse {
  count: number;
  success: boolean;
  message?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
  data?: Message;
}

export interface MarkAsReadResponse {
  success: boolean;
  message?: string;
}

export interface DeleteMessageResponse {
  success: boolean;
  message?: string;
}

// Navigation Types
export interface ChatsStackParamList {
  ChatsMain: undefined;
  ChatConversation: {
    userId: string;
    userName: string;
    userProfileImage?: string;
    userProfileType: number;
  };
}

// Component Props Types
export interface ChatListItemProps {
  chat: ChatUser;
  onPress: () => void;
}

export interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onLongPress?: (messageId: number) => void;
}