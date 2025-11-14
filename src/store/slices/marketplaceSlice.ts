// store/slices/marketplaceSlice.ts - Marketplace Redux Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MarketPlaceMessage, MarketPlaceChatThread } from '../../types/marketplace';

interface MarketplaceState {
  socket: any | null;
  isConnected: boolean;
  connectionError: string | null;
  chats: MarketPlaceChatThread[];
  currentConversation: {
    propertyId: number | null;
    userId: string | null;
    messages: MarketPlaceMessage[];
    isLoading: boolean;
  };
  unreadCount: number;
}

const initialState: MarketplaceState = {
  socket: null,
  isConnected: false,
  connectionError: null,
  chats: [],
  currentConversation: {
    propertyId: null,
    userId: null,
    messages: [],
    isLoading: false,
  },
  unreadCount: 0,
};

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
        state.connectionError = null;
      }
    },
    setConnectionError: (state, action: PayloadAction<string | null>) => {
      state.connectionError = action.payload;
    },

    // Chat list management
    setChats: (state, action: PayloadAction<MarketPlaceChatThread[]>) => {
      state.chats = action.payload;
    },
    // store/slices/marketplaceSlice.ts - ADD SIMILAR REDUCERS

// Add these to marketplace slice:
updateMessageStatus: (
  state, 
  action: PayloadAction<{ 
    tempId: number; 
    actualId: number; 
    status: 'sent' | 'failed';
    timestamp?: string;
  }>
) => {
  const { tempId, actualId, status, timestamp } = action.payload;
  const messageIndex = state.currentConversation.messages.findIndex(
    m => m.tempId === tempId
  );
  
  if (messageIndex !== -1) {
    const updatedMessage = {
      ...state.currentConversation.messages[messageIndex],
      id: actualId,
      tempId: undefined,
      isSending: false,
      failed: status === 'failed',
      ...(timestamp && { timestamp }),
    };
    
    state.currentConversation.messages[messageIndex] = updatedMessage;
  }
},
    updateChatThread: (state, action: PayloadAction<MarketPlaceChatThread>) => {
      const index = state.chats.findIndex(
        (chat) =>
          chat.propertyId === action.payload.propertyId &&
          chat.userId === action.payload.userId
      );
      if (index !== -1) {
        state.chats[index] = action.payload;
      } else {
        state.chats.unshift(action.payload);
      }
      // Sort by lastMessageTime
      state.chats.sort(
        (a, b) =>
          new Date(b.lastMessageTime).getTime() -
          new Date(a.lastMessageTime).getTime()
      );
    },
    incrementUnreadCount: (
      state,
      action: PayloadAction<{ propertyId: number; userId: string }>
    ) => {
      const chat = state.chats.find(
        (c) =>
          c.propertyId === action.payload.propertyId &&
          c.userId === action.payload.userId
      );
      if (chat) {
        chat.unreadCount += 1;
        state.unreadCount += 1;
      }
    },
    resetUnreadCount: (
      state,
      action: PayloadAction<{ propertyId: number; userId: string }>
    ) => {
      const chat = state.chats.find(
        (c) =>
          c.propertyId === action.payload.propertyId &&
          c.userId === action.payload.userId
      );
      if (chat) {
        state.unreadCount = Math.max(0, state.unreadCount - chat.unreadCount);
        chat.unreadCount = 0;
      }
    },
    setTotalUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },

    // Current conversation management
    setCurrentConversation: (
      state,
      action: PayloadAction<{ propertyId: number; userId: string }>
    ) => {
      state.currentConversation.propertyId = action.payload.propertyId;
      state.currentConversation.userId = action.payload.userId;
      state.currentConversation.messages = [];
      state.currentConversation.isLoading = true;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation.propertyId = null;
      state.currentConversation.userId = null;
      state.currentConversation.messages = [];
      state.currentConversation.isLoading = false;
    },
    setConversationMessages: (state, action: PayloadAction<MarketPlaceMessage[]>) => {
      state.currentConversation.messages = action.payload;
      state.currentConversation.isLoading = false;
    },
    addMessage: (state, action: PayloadAction<MarketPlaceMessage>) => {
      const message = action.payload;
      
      // Add to current conversation if it matches
      if (
        state.currentConversation.propertyId === message.propertyId &&
        (state.currentConversation.userId === message.senderId ||
          state.currentConversation.userId === message.receiverId)
      ) {
        // Check for duplicates
        const exists = state.currentConversation.messages.some(
          (m) => m.id === message.id
        );
        if (!exists) {
          state.currentConversation.messages.push(message);
        }
      }
    },
    updateMessage: (state, action: PayloadAction<MarketPlaceMessage>) => {
      const index = state.currentConversation.messages.findIndex(
        (m) => m.id === action.payload.id
      );
      if (index !== -1) {
        state.currentConversation.messages[index] = action.payload;
      }
    },
    deleteMessage: (state, action: PayloadAction<number>) => {
      state.currentConversation.messages = state.currentConversation.messages.filter(
        (m) => m.id !== action.payload
      );
    },
    appendOlderMessages: (state, action: PayloadAction<MarketPlaceMessage[]>) => {
      const existingIds = new Set(state.currentConversation.messages.map((m) => m.id));
      const newMessages = action.payload.filter((m) => !existingIds.has(m.id));
      state.currentConversation.messages = [
        ...newMessages,
        ...state.currentConversation.messages,
      ];
    },

    // Reset state
    resetMarketplaceState: () => initialState,
  },
});

export const {
  setSocket,
  setConnectionStatus,
  setConnectionError,
  setChats,
  updateChatThread,
  incrementUnreadCount,
  resetUnreadCount,
  setTotalUnreadCount,
  setCurrentConversation,
  clearCurrentConversation,
  setConversationMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  appendOlderMessages,
  resetMarketplaceState,
} = marketplaceSlice.actions;

export default marketplaceSlice.reducer;