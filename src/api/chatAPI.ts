// api/chatAPI.ts - UPDATED TO MATCH ACTUAL API
import apiClient from './axiosConfig';
import {
  SendMessageRequest,
  SendMessageResponse,
  GetMessageHistoryRequest,
  MessageHistoryResponse,
  MarkAsReadRequest,
  MarkAsReadResponse,
  UserChatsResponse,
  UnreadCountResponse,
  DeleteMessageResponse,
  Message,
  ChatUser,
  RawMessage,
} from '../types/chat';

export const chatAPI = {
  // Send a message - EXACTLY AS IN SWAGGER
  sendMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    try {
      console.log('📤 Sending message:', data);
      const response = await apiClient.post<SendMessageResponse>(
        '/Chat/SendMessage',
        data
      );
      console.log('✅ Message sent response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Send message error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to send message. Please try again.'
      );
    }
  },

  // Get message history - HANDLES ACTUAL API RESPONSE STRUCTURE
  getMessageHistory: async (
    data: GetMessageHistoryRequest
  ): Promise<MessageHistoryResponse> => {
    try {
      console.log('📜 Fetching message history with:', data);
      const response = await apiClient.post<any>(
        '/Chat/GetMessageHistory',
        data
      );
      console.log('✅ Message history raw response:', response.data);
      
      const apiData = response.data;
      let messages: Message[] = [];
      let success = true;
      let hasNextPage = false;
      let totalCount = 0;
      
      // Handle different response structures
      if (Array.isArray(apiData)) {
        // Case 1: API returns array of messages directly
        console.log('📥 API returned array directly');
        messages = apiData.map((msg: RawMessage) => normalizeMessage(msg));
      } else if (apiData && Array.isArray(apiData.messages)) {
        // Case 2: API returns { messages: [] }
        console.log('📥 API returned object with messages array');
        messages = apiData.messages.map((msg: RawMessage) => normalizeMessage(msg));
      } else if (apiData && Array.isArray(apiData.data)) {
        // Case 3: API returns { data: [] }
        console.log('📥 API returned object with data array');
        messages = apiData.data.map((msg: RawMessage) => normalizeMessage(msg));
      } else {
        console.log('⚠️ No messages array found in response');
        success = false;
      }
      
      totalCount = messages.length;
      
      // Calculate hasNextPage based on page size
      if (data.pageSize && messages.length === data.pageSize) {
        hasNextPage = true;
      }
      
      console.log(`✅ Processed ${messages.length} messages`);
      
      return {
        success,
        messages,
        totalCount,
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        hasNextPage,
        message: success ? undefined : 'No messages found'
      };
    } catch (error: any) {
      console.error('❌ Get message history error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to load messages. Please try again.'
      );
    }
  },

  // Mark messages as read - EXACTLY AS IN SWAGGER
  markAsRead: async (messageIds: number[]): Promise<MarkAsReadResponse> => {
    try {
      console.log('✅ Marking messages as read:', messageIds);
      const response = await apiClient.post<MarkAsReadResponse>(
        '/Chat/MarkAsRead',
        { messageIds }
      );
      console.log('✅ Mark as read response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Mark as read error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to mark messages as read.'
      );
    }
  },

  // Get unread messages count - EXACTLY AS IN SWAGGER
  getUnreadCount: async (userId: string): Promise<UnreadCountResponse> => {
    try {
      console.log('🔔 Getting unread count for user:', userId);
      const response = await apiClient.get<UnreadCountResponse>(
        '/Chat/unread-messages-count',
        {
          params: { userId }
        }
      );
      console.log('✅ Unread count response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get unread count error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to get unread count.'
      );
    }
  },

  // Get all user chats - HANDLES DIFFERENT RESPONSE STRUCTURES
  getUserChats: async (userId: string): Promise<UserChatsResponse> => {
    try {
      console.log('💬 Getting user chats for:', userId);
      const response = await apiClient.get<any>(
        '/Chat/GetUserChats',
        {
          params: { userId }
        }
      );
      console.log('✅ User chats raw response:', response.data);
      
      let chats: ChatUser[] = [];
      let success = false;
      let message = '';
      
      const apiData = response.data;
      
      if (Array.isArray(apiData)) {
        // Case 1: API returns array directly
        console.log('📥 API returned array directly');
        chats = apiData.map((item: any) => normalizeChatUser(item));
        success = true;
      } else if (apiData && Array.isArray(apiData.chats)) {
        // Case 2: API returns { chats: [] }
        console.log('📥 API returned object with chats array');
        chats = apiData.chats.map((item: any) => normalizeChatUser(item));
        success = apiData.success !== false;
        message = apiData.message || '';
      } else if (apiData && Array.isArray(apiData.data)) {
        // Case 3: API returns { data: [] }
        console.log('📥 API returned object with data array');
        chats = apiData.data.map((item: any) => normalizeChatUser(item));
        success = apiData.success !== false;
        message = apiData.message || '';
      } else {
        console.log('❌ Unexpected API response structure');
        message = 'Unexpected response format';
      }
      
      console.log(`✅ Processed ${chats.length} chats`);
      
      return {
        success,
        chats,
        message
      };
    } catch (error: any) {
      console.error('❌ Get user chats error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to load chats. Please try again.'
      );
    }
  },

  // Delete a message - EXACTLY AS IN SWAGGER
  deleteMessage: async (messageId: number): Promise<DeleteMessageResponse> => {
    try {
      console.log('🗑️ Deleting message:', messageId);
      const response = await apiClient.post<DeleteMessageResponse>(
        '/Chat/DeleteMessageById',
        null,
        {
          params: { id: messageId }
        }
      );
      console.log('✅ Delete message response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Delete message error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to delete message.'
      );
    }
  },
};

// Helper function to normalize message data from API
const normalizeMessage = (rawMessage: RawMessage): Message => {
  return {
    id: rawMessage.messageId || rawMessage.id, // Use messageId if available, fallback to id
    senderId: rawMessage.senderId,
    senderName: rawMessage.senderName || '',
    senderProfileImage: rawMessage.senderProfileImage || rawMessage.profileImage, // Handle both field names
    receiverId: rawMessage.receiverId,
    receiverName: rawMessage.receiverName || '',
    receiverProfileImage: rawMessage.receiverProfileImage,
    content: rawMessage.content,
    timestamp: rawMessage.timestamp,
    isRead: rawMessage.isRead,
    replyedMessageId: rawMessage.replyedMessageId,
    // Handle nested replied message if present
    ...(rawMessage.replyedMessage && {
      replyedMessage: normalizeMessage(rawMessage.replyedMessage)
    })
  };
};

// Helper function to normalize chat user data from API
const normalizeChatUser = (rawChat: any): ChatUser => {
  return {
    userId: rawChat.userId,
    userName: rawChat.userName,
    userProfileImage: rawChat.userProfileImage || rawChat.profileImage, // Handle both field names
    userProfileType: rawChat.userProfileType || 1, // Default to investor
    lastMessage: rawChat.lastMessage,
    lastMessageTime: rawChat.lastMessageTime || rawChat.timestamp, // Handle both field names
    unreadCount: rawChat.unreadCount || rawChat.unreadMessagesCount || 0 // Handle both field names
  };
};