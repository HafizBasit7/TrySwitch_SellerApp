// store/slices/marketplaceSlice.ts - COMPLETE REWRITE
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MarketPlaceMessage, MarketPlaceChatThread } from '../../types/marketplace';

interface MarketplaceState {
  socket: any | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Chat list
  chats: MarketPlaceChatThread[];
  isLoadingChats: boolean;
  
  // Active conversation
  activePropertyId: number | null;
  activeUserId: string | null;
  messages: { [key: string]: MarketPlaceMessage[] }; // Key: `${propertyId}-${userId}`
  isLoadingMessages: boolean;
  
  // Pagination
  pagination: {
    [key: string]: {
      pageNumber: number;
      pageSize: number;
      hasNextPage: boolean;
      totalCount: number;
    };
  };
  
  // Unread counts
  totalUnreadCount: number;
  
  // Error state
  error: string | null;
}

const initialState: MarketplaceState = {
  socket: null,
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  
  chats: [],
  isLoadingChats: false,
  
  activePropertyId: null,
  activeUserId: null,
  messages: {},
  isLoadingMessages: false,
  
  pagination: {},
  
  totalUnreadCount: 0,
  
  error: null,
};

// Helper to generate conversation key (SAME PATTERN AS CHAT)
const getConversationKey = (propertyId: number, userId: string) => 
  `${propertyId}-${userId}`;

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    // Socket connection management
    setSocket: (state, action: PayloadAction<any>) => {
      state.socket = action.payload;
    },
    
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.isConnecting = false;
        state.connectionError = null;
      }
    },
    
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    
    setConnectionError: (state, action: PayloadAction<string | null>) => {
      state.connectionError = action.payload;
    },

    // Chat list management
    setChats: (state, action: PayloadAction<MarketPlaceChatThread[]>) => {
      state.chats = action.payload;
      state.isLoadingChats = false;
    },
    
    setLoadingChats: (state, action: PayloadAction<boolean>) => {
      state.isLoadingChats = action.payload;
    },
    
    updateChatLastMessage: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string; 
      message: MarketPlaceMessage 
    }>) => {
      const { propertyId, userId, message } = action.payload;
      const chatIndex = state.chats.findIndex(chat => 
        chat.propertyId === propertyId && chat.userId === userId
      );
      
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message.content;
        state.chats[chatIndex].lastMessageTime = message.timestamp;
        
        // Move chat to top (SAME AS CHAT PATTERN)
        const chat = state.chats.splice(chatIndex, 1)[0];
        state.chats.unshift(chat);
      } else {
        // Create new chat entry if it doesn't exist
        const newChat: MarketPlaceChatThread = {
          propertyId,
          userId,
          userName: message.senderName || 'Unknown User',
          userProfileImage: message.senderProfileImage || '',
          propertyAddress: message.propertyAddress || '',
          propertyImage: '',
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
          unreadCount: message.isRead ? 0 : 1,
          userProfileType: 1,
          isExpired: false,
          soldStatus: 'Available',
          profileDeleteStatus: 'Active',
          propertyIsDeleted: false,
          timestamp: message.timestamp,
        };
        state.chats.unshift(newChat);
        if (!message.isRead) {
          state.totalUnreadCount += 1;
        }
      }
    },

    // Active conversation management
    setActiveConversation: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string 
    }>) => {
      state.activePropertyId = action.payload.propertyId;
      state.activeUserId = action.payload.userId;
    },
    
    clearActiveConversation: (state) => {
      state.activePropertyId = null;
      state.activeUserId = null;
    },

    // Message management - FOLLOWING CHAT PATTERN EXACTLY
    setMessages: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string; 
      messages: MarketPlaceMessage[] 
    }>) => {
      const { propertyId, userId, messages } = action.payload;
      const key = getConversationKey(propertyId, userId);
      
      // Sort messages chronologically
      const sortedMessages = [...messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      state.messages[key] = sortedMessages;
      state.isLoadingMessages = false;
    },
    
    setLoadingMessages: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMessages = action.payload;
    },
    
    // Add message with robust duplicate prevention
    addMessage: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string; 
      message: MarketPlaceMessage 
    }>) => {
      const { propertyId, userId, message } = action.payload;
      const key = getConversationKey(propertyId, userId);
      
      if (!state.messages[key]) {
        state.messages[key] = [];
      }
      
      // Enhanced duplicate check (SAME AS CHAT)
      const exists = state.messages[key].some(m => {
        // Check by message ID
        if (m.id && message.id && m.id === message.id) {
          console.log(`⏹️ Marketplace: Duplicate skipped by id: ${message.id}`);
          return true;
        }
        // Check temporary messages
        if (m.id === message.id && message.id > 1000000000000) {
          console.log(`⏹️ Marketplace: Temporary message duplicate: ${message.id}`);
          return true;
        }
        // Check by content and timestamp
        if (m.content === message.content && 
            m.senderId === message.senderId && 
            Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000) {
          console.log(`⏹️ Marketplace: Duplicate skipped by content: ${message.content.substring(0, 50)}`);
          return true;
        }
        return false;
      });
      
      if (!exists) {
        // Add message and maintain sort order
        const updatedMessages = [...state.messages[key], message].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        state.messages[key] = updatedMessages;
        console.log(`✅ Marketplace: Message added: ${message.id}`, {
          content: message.content.substring(0, 50),
          isTemporary: message.id > 1000000000000
        });
        
        // Update unread count if message is from other user and not read
        if (message.senderId !== state.activeUserId && !message.isRead) {
          const chatIndex = state.chats.findIndex(chat => 
            chat.propertyId === propertyId && chat.userId === userId
          );
          if (chatIndex !== -1) {
            state.chats[chatIndex].unreadCount = (state.chats[chatIndex].unreadCount || 0) + 1;
            state.totalUnreadCount = (state.totalUnreadCount || 0) + 1;
          }
        }
      }
    },
    
    // Replace temporary message with real one (LIKE CHAT)
    replaceOptimisticMessage: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string; 
      tempId: number; 
      realMessage: MarketPlaceMessage 
    }>) => {
      const { propertyId, userId, tempId, realMessage } = action.payload;
      const key = getConversationKey(propertyId, userId);
      
      if (state.messages[key]) {
        const messageIndex = state.messages[key].findIndex(m => m.id === tempId);
        if (messageIndex !== -1) {
          // Replace optimistic message with real message
          state.messages[key][messageIndex] = realMessage;
          console.log(`✅ Marketplace: Replaced temporary message ${tempId} with real message ${realMessage.id}`);
        } else {
          // If optimistic message not found, add the real message
          state.messages[key].push(realMessage);
        }
        
        // Maintain sort order
        state.messages[key].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      }
    },
    
    // Mark messages as read
    markMessagesAsRead: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string; 
      messageIds: number[] 
    }>) => {
      const { propertyId, userId, messageIds } = action.payload;
      const key = getConversationKey(propertyId, userId);
      
      console.log(`📖 Marketplace: Marking messages as read:`, { propertyId, userId, messageIds });
      
      if (state.messages[key]) {
        let markedCount = 0;
        
        state.messages[key] = state.messages[key].map(message => {
          const shouldMark = messageIds.includes(message.id);
          
          if (shouldMark && !message.isRead) {
            markedCount += 1;
            return { ...message, isRead: true };
          }
          return message;
        });
        
        // Update unread count in chats
        const chatIndex = state.chats.findIndex(chat => 
          chat.propertyId === propertyId && chat.userId === userId
        );
        
        if (chatIndex !== -1 && markedCount > 0) {
          const previousUnread = state.chats[chatIndex].unreadCount || 0;
          const newUnreadCount = Math.max(0, previousUnread - markedCount);
          
          state.chats[chatIndex].unreadCount = newUnreadCount;
          state.totalUnreadCount = Math.max(0, (state.totalUnreadCount || 0) - markedCount);
          
          console.log(`✅ Marketplace: Updated unread count: ${previousUnread} -> ${newUnreadCount}`);
        }
        
        console.log(`✅ Marketplace: Marked ${markedCount} messages as read`);
      }
    },
    
    // Mark entire chat as read
    markChatAsRead: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string 
    }>) => {
      const { propertyId, userId } = action.payload;
      const key = getConversationKey(propertyId, userId);
      
      console.log(`📖 Marketplace: Marking all messages as read for:`, { propertyId, userId });
      
      // Reset unread count for this chat
      const chatIndex = state.chats.findIndex(chat => 
        chat.propertyId === propertyId && chat.userId === userId
      );
      
      if (chatIndex !== -1) {
        const previousUnread = state.chats[chatIndex].unreadCount || 0;
        state.chats[chatIndex].unreadCount = 0;
        state.totalUnreadCount = Math.max(0, (state.totalUnreadCount || 0) - previousUnread);
        
        console.log(`✅ Marketplace: Reset unread count: ${previousUnread} -> 0`);
      }
      
      // Also mark messages as read in conversation
      if (state.messages[key]) {
        let readCount = 0;
        
        state.messages[key] = state.messages[key].map(message => {
          if (!message.isRead && message.senderId === userId) {
            readCount += 1;
            return { ...message, isRead: true };
          }
          return message;
        });
        
        console.log(`✅ Marketplace: Marked ${readCount} messages as read in conversation`);
      }
    },
    
    // Delete message
    deleteMessage: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string; 
      messageId: number 
    }>) => {
      const { propertyId, userId, messageId } = action.payload;
      const key = getConversationKey(propertyId, userId);
      
      if (state.messages[key]) {
        state.messages[key] = state.messages[key].filter(m => m.id !== messageId);
        console.log(`✅ Marketplace: Deleted message: ${messageId}`);
      }
    },
    
    // Prepend older messages (pagination)
    prependMessages: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string; 
      messages: MarketPlaceMessage[] 
    }>) => {
      const { propertyId, userId, messages } = action.payload;
      const key = getConversationKey(propertyId, userId);
      
      if (!state.messages[key]) {
        state.messages[key] = [];
      }
      
      // Filter out duplicates
      const existingIds = new Set(state.messages[key].map(m => m.id));
      const uniqueNewMessages = messages.filter(msg => !existingIds.has(msg.id));
      
      // Add older messages to beginning and maintain sort
      const updatedMessages = [...uniqueNewMessages, ...state.messages[key]].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      state.messages[key] = updatedMessages;
      console.log(`✅ Marketplace: Prepended ${uniqueNewMessages.length} older messages`);
    },
    
    // Pagination management
    setPagination: (state, action: PayloadAction<{
      propertyId: number;
      userId: string;
      pageNumber: number;
      pageSize: number;
      hasNextPage: boolean;
      totalCount: number;
    }>) => {
      const { propertyId, userId, ...pagination } = action.payload;
      const key = getConversationKey(propertyId, userId);
      state.pagination[key] = pagination;
    },
    
    // Unread count management
    setTotalUnreadCount: (state, action: PayloadAction<number>) => {
      state.totalUnreadCount = action.payload;
    },
    
    incrementUnreadCount: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string 
    }>) => {
      const { propertyId, userId } = action.payload;
      const chatIndex = state.chats.findIndex(chat => 
        chat.propertyId === propertyId && chat.userId === userId
      );
      
      if (chatIndex !== -1) {
        state.chats[chatIndex].unreadCount += 1;
        state.totalUnreadCount += 1;
      }
    },
    
    decrementUnreadCount: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string; 
      count?: number 
    }>) => {
      const { propertyId, userId, count = 1 } = action.payload;
      const chatIndex = state.chats.findIndex(chat => 
        chat.propertyId === propertyId && chat.userId === userId
      );
      
      if (chatIndex !== -1) {
        const currentUnread = state.chats[chatIndex].unreadCount;
        state.chats[chatIndex].unreadCount = Math.max(0, currentUnread - count);
        state.totalUnreadCount = Math.max(0, state.totalUnreadCount - count);
      }
    },

    // Add to marketplaceSlice reducers
updateMarketplaceChatLastMessage: (state, action: PayloadAction<{ 
  propertyId: number; 
  userId: string; 
  message: MarketPlaceMessage 
}>) => {
  const { propertyId, userId, message } = action.payload;
  const chatIndex = state.chats.findIndex(chat => 
    chat.propertyId === propertyId && chat.userId === userId
  );
  
  if (chatIndex !== -1) {
    state.chats[chatIndex].lastMessage = message.content;
    state.chats[chatIndex].lastMessageTime = message.timestamp;
    
    // Move chat to top
    const chat = state.chats.splice(chatIndex, 1)[0];
    state.chats.unshift(chat);
  } else {
    // Create new chat entry
    const newChat: MarketPlaceChatThread = {
      propertyId,
      userId,
      userName: message.senderId === state.activeUserId ? message.receiverName : message.senderName,
      userProfileImage: message.senderId === state.activeUserId ? message.receiverProfileImage : message.senderProfileImage,
      propertyAddress: message.propertyAddress || '',
      propertyImage: '',
      lastMessage: message.content,
      lastMessageTime: message.timestamp,
      unreadCount: message.senderId === state.activeUserId ? 0 : 1,
      userProfileType: 1,
      isExpired: false,
      soldStatus: 'Available',
      profileDeleteStatus: 'Active',
      propertyIsDeleted: false,
      timestamp: message.timestamp,
    };
    state.chats.unshift(newChat);
  }
},

replaceOptimisticMarketplaceMessage: (state, action: PayloadAction<{ 
  propertyId: number; 
  userId: string; 
  tempId: number; 
  realMessage: MarketPlaceMessage 
}>) => {
  const { propertyId, userId, tempId, realMessage } = action.payload;
  const key = getConversationKey(propertyId, userId);
  
  if (state.messages[key]) {
    const messageIndex = state.messages[key].findIndex(m => m.id === tempId);
    if (messageIndex !== -1) {
      // Replace optimistic message with real message
      state.messages[key][messageIndex] = {
        ...realMessage,
        id: realMessage.id || realMessage.messageId || tempId
      };
      console.log(`✅ Marketplace: Replaced temporary message ${tempId} with real message ${realMessage.id}`);
    } else {
      // If optimistic message not found, add the real message
      state.messages[key].push(realMessage);
    }
    
    // Maintain sort order
    state.messages[key].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
},
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Clear messages for a conversation
    clearMessages: (state, action: PayloadAction<{ 
      propertyId: number; 
      userId: string 
    }>) => {
      const key = getConversationKey(action.payload.propertyId, action.payload.userId);
      delete state.messages[key];
      delete state.pagination[key];
    },
    
    // Clear all cached conversations
    clearAllConversations: (state) => {
      state.messages = {};
      state.pagination = {};
      state.activePropertyId = null;
      state.activeUserId = null;
    },
    
    // Reset entire state
    resetMarketplaceState: () => initialState,
  },
});

export const {
  setSocket,
  setConnectionStatus,
  setConnecting,
  setConnectionError,
  setChats,
  setLoadingChats,
  updateChatLastMessage,
  setActiveConversation,
  clearActiveConversation,
  setMessages,
  setLoadingMessages,
  addMessage,
  replaceOptimisticMessage,
  markMessagesAsRead,
  markChatAsRead,
  deleteMessage,
  prependMessages,
  setPagination,
  setTotalUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  setError,
  clearMessages,
  clearAllConversations,
  replaceOptimisticMarketplaceMessage,
  resetMarketplaceState,
  updateMarketplaceChatLastMessage,
} = marketplaceSlice.actions;

export default marketplaceSlice.reducer;