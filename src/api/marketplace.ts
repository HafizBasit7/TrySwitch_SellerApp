// api/marketplaceAPI.ts - UPDATED WITH PROPERTY DETAILS
import apiClient from './axiosConfig';
import {
  SendMarketPlaceMessageRequest,
  SendMarketPlaceMessageResponse,
  GetMarketPlaceMessageHistoryRequest,
  GetMarketPlaceMessageHistoryResponse,
  MarkMarketPlaceAsReadRequest,
  MarkMarketPlaceAsReadResponse,
  GetMarketPlaceUserChatsResponse,
  GetUnreadMessagesResponse,
  DeleteMarketPlaceMessageResponse,
  DeleteMarketPlaceThreadsResponse,
  DeleteMarketPlaceThreadRequest,
  MarketPlaceMessage,
  MarketPlaceChatThread,
  RawMarketPlaceMessage,
  RawMarketPlaceChatThread,
  PropertyDetailResponse,
} from '../types/marketplace';

export const marketplaceAPI = {
  /**
   * Send a marketplace message about a property
   * POST /api/MarketPlaceMessage/SendMarketPlaceMessage
   */
// In marketplaceAPI.ts - update the sendMarketPlaceMessage function
sendMarketPlaceMessage: async (
  data: SendMarketPlaceMessageRequest
): Promise<SendMarketPlaceMessageResponse> => {
  try {
    console.log('📤 [Marketplace] Sending message:', {
      receiverId: data.receiverId,
      propertyId: data.propertyId,
      contentLength: data.content.length,
    });

    const response = await apiClient.post<SendMarketPlaceMessageResponse>(
      '/MarketPlaceMessage/SendMarketPlaceMessage',
      null,
      {
        params: {
          receiverId: data.receiverId,
          propertyId: data.propertyId,
          content: data.content,
          ...(data.replyedMessageId && { replyedMessageId: data.replyedMessageId }),
        },
      }
    );

    console.log('✅ [Marketplace] Message sent successfully, response:', response.data);
    
    // FIX: Handle different response structures
    const apiResponse = response.data;
    
    // If the API returns just { success: true } without data, that's fine
    // The real message will come via SignalR
    return {
      success: apiResponse.success !== false,
      message: apiResponse.message,
      data: apiResponse.data // This might be undefined, which is OK
    };
    
  } catch (error: any) {
    console.error('❌ [Marketplace] Send message error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to send message. Please try again.'
    );
  }
},

  /**
   * Get message history for a property conversation
   * POST /api/MarketPlaceMessage/GetMessageHistoryWithProperty
   */
  getMarketPlaceMessageHistory: async (
    data: GetMarketPlaceMessageHistoryRequest
  ): Promise<GetMarketPlaceMessageHistoryResponse> => {
    try {
      console.log('📜 [Marketplace] Fetching message history:', {
        reciverId: data.reciverId,
        propertyId: data.propertyId,
        pageNumber: data.pageNumber,
      });

      const response = await apiClient.post<any>(
        '/MarketPlaceMessage/GetMessageHistoryWithProperty',
        data
      );

      const apiData = response.data;
      let messages: MarketPlaceMessage[] = [];
      let success = true;
      let hasNextPage = false;
      let propertyDetail = null;

      // Handle multiple response structures
      if (Array.isArray(apiData)) {
        console.log('📥 [Marketplace] API returned array');
        messages = apiData.map((msg) => normalizeMarketPlaceMessage(msg));
      } else if (apiData?.messages && Array.isArray(apiData.messages)) {
        console.log('📥 [Marketplace] API returned {messages: []}');
        messages = apiData.messages.map((msg) => normalizeMarketPlaceMessage(msg));
        propertyDetail = apiData.propertyDetail;
      } else if (apiData?.data && Array.isArray(apiData.data)) {
        console.log('📥 [Marketplace] API returned {data: []}');
        messages = apiData.data.map((msg) => normalizeMarketPlaceMessage(msg));
      } else {
        console.warn('⚠️ [Marketplace] Unexpected response structure');
        success = false;
      }

      // Calculate if more pages exist
      if (data.pageSize && messages.length === data.pageSize) {
        hasNextPage = true;
      }

      console.log(
        `✅ [Marketplace] Processed ${messages.length} messages, hasNextPage: ${hasNextPage}`
      );

      return {
        success,
        messages,
        totalCount: messages.length,
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        hasNextPage,
        propertyDetail,
        message: success ? undefined : 'No messages found',
      };
    } catch (error: any) {
      console.error(
        '❌ [Marketplace] Get history error:',
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || 'Failed to load messages. Please try again.'
      );
    }
  },

  /**
   * Get all marketplace chats for current user
   * GET /api/MarketPlaceMessage/GetMarketPlaceUserChats
   */
  getMarketPlaceUserChats: async (): Promise<GetMarketPlaceUserChatsResponse> => {
    try {
      console.log('🏪 [Marketplace] Fetching all user chats');

      const response = await apiClient.get<any>('/MarketPlaceMessage/GetMarketPlaceUserChats');

      const apiData = response.data;
      let chats: MarketPlaceChatThread[] = [];
      let success = false;
      let message = '';

      console.log('📥 [Marketplace] Raw API response:', apiData);

      // Handle multiple response structures
      if (Array.isArray(apiData)) {
        console.log('📥 [Marketplace] API returned array');
        chats = apiData.map((item) => normalizeMarketPlaceChatThread(item));
        success = true;
      } else if (apiData?.chats && Array.isArray(apiData.chats)) {
        console.log('📥 [Marketplace] API returned {chats: []}');
        chats = apiData.chats.map((item) => normalizeMarketPlaceChatThread(item));
        success = apiData.success !== false;
        message = apiData.message || '';
      } else if (apiData?.data && Array.isArray(apiData.data)) {
        console.log('📥 [Marketplace] API returned {data: []}');
        chats = apiData.data.map((item) => normalizeMarketPlaceChatThread(item));
        success = apiData.success !== false;
        message = apiData.message || '';
      } else {
        console.warn('⚠️ [Marketplace] Unexpected response structure:', apiData);
        message = 'Unexpected response format';
      }

      console.log(`✅ [Marketplace] Fetched ${chats.length} chat threads`);

      return {
        success,
        chats,
        message: message || undefined,
      };
    } catch (error: any) {
      console.error('❌ [Marketplace] Get chats error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      if (error.response?.status === 404) {
        console.log('ℹ️ [Marketplace] No marketplace chats found (404) - empty state');
        return {
          success: true,
          chats: [],
          message: 'No marketplace chats yet',
        };
      }
      
      throw new Error(
        error.response?.data?.message || 'Failed to load marketplace chats. Please try again.'
      );
    }
  },

  /**
   * Get property details by ID
   * GET /api/PropertyListings/GetPropertyListingById
   */
  getPropertyDetails: async (propertyId: number): Promise<PropertyDetailResponse> => {
    try {
      console.log('🏠 [Marketplace] Fetching property details for ID:', propertyId);

      const response = await apiClient.get<any>(
        '/PropertyListings/GetPropertyListingById',
        {
          params: { id: propertyId },
        }
      );

      console.log('✅ [Marketplace] Property details fetched successfully');
      
      return {
        success: true,
        property: response.data,
      };
    } catch (error: any) {
      console.error('❌ [Marketplace] Get property details error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(
        error.response?.data?.message || 'Failed to load property details. Please try again.'
      );
    }
  },

  /**
   * Mark marketplace messages as read
   * POST /api/MarketPlaceMessage/MarkMarkePlacetMessageAsRead
   */
  markMarketPlaceAsRead: async (
    messageIds: number[]
  ): Promise<MarkMarketPlaceAsReadResponse> => {
    try {
      if (messageIds.length === 0) return { success: true };

      console.log('✏️ [Marketplace] Marking', messageIds.length, 'messages as read');

      const response = await apiClient.post<MarkMarketPlaceAsReadResponse>(
        '/MarketPlaceMessage/MarkMarkePlacetMessageAsRead',
        messageIds
      );

      console.log('✅ [Marketplace] Messages marked as read');
      return response.data;
    } catch (error: any) {
      console.error('❌ [Marketplace] Mark as read error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Failed to mark messages as read.'
      );
    }
  },

  /**
   * Delete a single marketplace message
   * POST /api/MarketPlaceMessage/DeleteMessage
   */
  deleteMarketPlaceMessage: async (
    messageId: number
  ): Promise<DeleteMarketPlaceMessageResponse> => {
    try {
      console.log('🗑️ [Marketplace] Deleting message:', messageId);

      const response = await apiClient.post<DeleteMarketPlaceMessageResponse>(
        '/MarketPlaceMessage/DeleteMessage',
        null,
        {
          params: { messageId },
        }
      );

      console.log('✅ [Marketplace] Message deleted');
      return response.data;
    } catch (error: any) {
      console.error('❌ [Marketplace] Delete message error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Failed to delete message.'
      );
    }
  },

  /**
   * Get unread marketplace messages and chat threads info
   * GET /api/MarketPlaceMessage/GetUnreadMessagesAndChatThreadsInfo
   */
  getUnreadMarketPlaceMessages: async (): Promise<GetUnreadMessagesResponse> => {
    try {
      console.log('🔔 [Marketplace] Fetching unread messages info');

      const response = await apiClient.get<GetUnreadMessagesResponse>(
        '/MarketPlaceMessage/GetUnreadMessagesAndChatThreadsInfo'
      );

      console.log('✅ [Marketplace] Unread count:', response.data.unreadCount);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ [Marketplace] Get unread error:',
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || 'Failed to get unread count.'
      );
    }
  },

  /**
   * Delete marketplace chat thread(s)
   * POST /api/MarketPlaceMessage/DeleteMarketPlaceThreads
   */
  deleteMarketPlaceThreads: async (
    threads: DeleteMarketPlaceThreadRequest[]
  ): Promise<DeleteMarketPlaceThreadsResponse> => {
    try {
      console.log('🗑️ [Marketplace] Deleting', threads.length, 'thread(s)');

      const response = await apiClient.post<DeleteMarketPlaceThreadsResponse>(
        '/MarketPlaceMessage/DeleteMarketPlaceThreads',
        threads
      );

      console.log('✅ [Marketplace] Thread(s) deleted');
      return response.data;
    } catch (error: any) {
      console.error('❌ [Marketplace] Delete threads error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Failed to delete thread(s).'
      );
    }
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Normalize raw API message to standardized format
 */
const normalizeMarketPlaceMessage = (raw: RawMarketPlaceMessage): MarketPlaceMessage => {
  return {
    id: raw.messageId || raw.id || 0,
    senderId: raw.senderId,
    senderName: raw.senderName || '',
    senderProfileImage: raw.senderProfileImage || raw.profileImage,
    receiverId: raw.receiverId,
    receiverName: raw.receiverName || '',
    receiverProfileImage: raw.receiverProfileImage,
    content: raw.content,
    timestamp: raw.timestamp,
    isRead: raw.isRead,
    propertyId: raw.propertyId,
    propertyAddress: raw.propertyAddress,
    replyedMessageId: raw.replyedMessageId,
    ...(raw.replyedMessage && {
      replyedMessage: normalizeMarketPlaceMessage(raw.replyedMessage),
    }),
  };
};

/**
 * Normalize raw API chat thread to standardized format
 */
const normalizeMarketPlaceChatThread = (
  raw: RawMarketPlaceChatThread
): MarketPlaceChatThread => {
  return {
    propertyId: raw.propertyId,
    propertyAddress: raw.propertyAddress,
    propertyImage: raw.propertyImage,
    userId: raw.userId,
    userName: raw.userName,
    userProfileImage: raw.userProfileImage || raw.profileImage,
    userProfileType: raw.userProfileType || 1,
    lastMessage: raw.lastMessage,
    lastMessageTime: raw.lastMessageTime || raw.timestamp || new Date().toISOString(),
    unreadCount: raw.unreadCount ?? raw.unreadMessagesCount ?? 0,
  };
};