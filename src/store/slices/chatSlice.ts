// store/slices/chatSlice.ts - UPDATED
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, ChatUser } from '../../types/chat';

interface ChatState {
  // Socket connection
  socket: any | null;
  isConnected: boolean;
  isConnecting: boolean;
  
  // Chat list
  userChats: ChatUser[];
  isLoadingChats: boolean;
  
  // Active conversation
  activeUserId: string | null;
  messages: { [userId: string]: Message[] }; // Keyed by userId for multiple conversations
  isLoadingMessages: boolean;
  
  // Pagination
  pagination: {
    [userId: string]: {
      pageNumber: number;
      pageSize: number;
      hasNextPage: boolean;
      totalCount: number;
    };
  };
  
  // Typing indicators
  typingUsers: { [userId: string]: boolean };
  
  // Unread counts
  totalUnreadCount: number;
  
  // UI states
  error: string | null;
}

const initialState: ChatState = {
  socket: null,
  isConnected: false,
  isConnecting: false,
  
  userChats: [],
  isLoadingChats: false,
  
  activeUserId: null,
  messages: {},
  isLoadingMessages: false,
  
  pagination: {},
  
  typingUsers: {},
  
  totalUnreadCount: 0,
  
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
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
        state.error = null;
      }
    },
    
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    
    // Chat list management
    setUserChats: (state, action: PayloadAction<ChatUser[]>) => {
      state.userChats = action.payload;
      state.isLoadingChats = false;
    },
    
    setLoadingChats: (state, action: PayloadAction<boolean>) => {
      state.isLoadingChats = action.payload;
    },
    
    updateChatLastMessage: (state, action: PayloadAction<{ userId: string; message: Message }>) => {
      const { userId, message } = action.payload;
      const chatIndex = state.userChats.findIndex(chat => chat.userId === userId);
      
      if (chatIndex !== -1) {
        state.userChats[chatIndex].lastMessage = message.content;
        state.userChats[chatIndex].lastMessageTime = message.timestamp;
        
        // Move chat to top
        const chat = state.userChats.splice(chatIndex, 1)[0];
        state.userChats.unshift(chat);
      } else {
        // Create new chat entry if it doesn't exist
        const newChat: ChatUser = {
          userId: userId,
          userName: message.senderName || 'Unknown User',
          userProfileImage: message.senderProfileImage,
          userProfileType: 1, // Default to investor
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
          unreadCount: 1,
        };
        state.userChats.unshift(newChat);
        state.totalUnreadCount += 1;
      }
    },
    
    // Active conversation management
    setActiveUserId: (state, action: PayloadAction<string | null>) => {
      state.activeUserId = action.payload;
    },
    
    // Message management
    setMessages: (state, action: PayloadAction<{ userId: string; messages: Message[] }>) => {
      const { userId, messages } = action.payload;
      state.messages[userId] = messages;
      state.isLoadingMessages = false;
    },
    
    setLoadingMessages: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMessages = action.payload;
    },
    
    // Add new message (from socket or sent) - OPTIMIZED FOR REAL-TIME
// In store/slices/chatSlice.ts - FIXED addMessage reducer
addMessage: (state, action: PayloadAction<{ userId: string; message: Message }>) => {
  const { userId, message } = action.payload;
  
  if (!state.messages[userId]) {
    state.messages[userId] = [];
  }
  
  // ENHANCED duplicate check - check multiple identifiers
  const exists = state.messages[userId].some(m => {
    // Check by messageId (from API/SignalR)
    if (m.messageId && message.messageId && m.messageId === message.messageId) {
      console.log(`⏹️ Duplicate message skipped by messageId: ${message.messageId}`);
      return true;
    }
    // Check by id (for optimistic messages)
    if (m.id && message.id && m.id === message.id) {
      console.log(`⏹️ Duplicate message skipped by id: ${message.id}`);
      return true;
    }
    // Check by content and timestamp as fallback
    if (m.content === message.content && 
        m.senderId === message.senderId && 
        Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000) {
      console.log(`⏹️ Duplicate message skipped by content+timestamp: ${message.content}`);
      return true;
    }
    return false;
  });
  
  if (!exists) {
    // Add message and sort by timestamp
    state.messages[userId] = [...state.messages[userId], message]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`✅ Message added to store: ${message.messageId || message.id}`);
    
    // Update unread count if message is from other user and not read
    if (message.senderId !== state.activeUserId && !message.isRead) {
      const chatIndex = state.userChats.findIndex(chat => chat.userId === userId);
      if (chatIndex !== -1) {
        state.userChats[chatIndex].unreadCount = (state.userChats[chatIndex].unreadCount || 0) + 1;
        state.totalUnreadCount = (state.totalUnreadCount || 0) + 1;
      }
    }
  }
},


// In chatSlice.ts - FIXED reducer
// In chatSlice.ts - FIXED markMessagesAsRead
markMessagesAsRead: (state, action: PayloadAction<{ userId: string; messageIds: number[] }>) => {
  const { userId, messageIds } = action.payload;
  
  console.log(`📖 [Redux] Marking specific messages as read:`, { userId, messageIds });
  
  if (state.messages[userId]) {
    let markedCount = 0;
    
    state.messages[userId] = state.messages[userId].map(message => {
      // Check both messageId (from API) and id (from SignalR/optimistic)
      const messageIdentifier = message.messageId || message.id;
      const shouldMark = messageIds.includes(messageIdentifier);
      
      if (shouldMark && !message.isRead) {
        markedCount += 1;
        console.log(`📖 [Redux] Marking message as read: ${messageIdentifier} (content: "${message.content}")`);
        return { ...message, isRead: true };
      }
      return message;
    });
    
    // Update unread count in userChats
    const chatIndex = state.userChats.findIndex(chat => chat.userId === userId);
    if (chatIndex !== -1 && markedCount > 0) {
      const previousUnread = state.userChats[chatIndex].unreadCount || 0;
      const newUnreadCount = Math.max(0, previousUnread - markedCount);
      
      state.userChats[chatIndex].unreadCount = newUnreadCount;
      state.totalUnreadCount = Math.max(0, (state.totalUnreadCount || 0) - markedCount);
      
      console.log(`✅ [Redux] Updated unread count: ${previousUnread} -> ${newUnreadCount}`);
    }
    
    console.log(`✅ [Redux] Marked ${markedCount} messages as read for user: ${userId}`);
  }
},

// In chatSlice.ts - ENHANCED markChatAsRead
// In chatSlice.ts - Fix the markChatAsRead reducer
markChatAsRead: (state, action: PayloadAction<{ userId: string }>) => {
  const { userId } = action.payload;
  
  console.log(`📖 [Redux] Marking all messages as read for user: ${userId}`);
  
  // Reset unread count for this chat regardless of messages
  const chatIndex = state.userChats.findIndex(chat => chat.userId === userId);
  if (chatIndex !== -1) {
    const previousUnread = state.userChats[chatIndex].unreadCount || 0;
    state.userChats[chatIndex].unreadCount = 0;
    state.totalUnreadCount = Math.max(0, (state.totalUnreadCount || 0) - previousUnread);
    
    console.log(`✅ [Redux] Reset unread count for ${userId}: ${previousUnread} -> 0`);
  }
  
  // Also mark messages as read if they exist
  if (state.messages[userId]) {
    let readCount = 0;
    
    state.messages[userId] = state.messages[userId].map(message => {
      // FIXED: Check if message is from the OTHER user and unread
      if (!message.isRead && message.senderId === userId) {
        readCount += 1;
        console.log(`📖 [Redux] Marking message as read: ${message.messageId} (content: "${message.content}")`);
        return { ...message, isRead: true };
      }
      return message;
    });
    
    console.log(`✅ [Redux] Marked ${readCount} messages as read for user: ${userId}`);
  }
},
    
    // Replace optimistic message with real message from SignalR
    replaceOptimisticMessage: (state, action: PayloadAction<{ 
      userId: string; 
      tempId: number; 
      realMessage: Message 
    }>) => {
      const { userId, tempId, realMessage } = action.payload;
      
      if (state.messages[userId]) {
        const messageIndex = state.messages[userId].findIndex(m => m.id === tempId);
        if (messageIndex !== -1) {
          // Replace optimistic message with real message
          state.messages[userId][messageIndex] = realMessage;
        } else {
          // If optimistic message not found, add the real message
          state.messages[userId].push(realMessage);
        }
        
        // Auto-sort messages
        state.messages[userId].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      }
    },
    
    // Prepend older messages (pagination)
    prependMessages: (state, action: PayloadAction<{ userId: string; messages: Message[] }>) => {
      const { userId, messages } = action.payload;
      
      if (!state.messages[userId]) {
        state.messages[userId] = [];
      }
      
      // Filter out duplicates before prepending
      const existingIds = new Set(state.messages[userId].map(m => m.id));
      const uniqueNewMessages = messages.filter(msg => !existingIds.has(msg.id));
      
      // Add older messages to the beginning
      state.messages[userId] = [...uniqueNewMessages, ...state.messages[userId]];
    },
    
    // Update message status (read, deleted, etc.)
    updateMessage: (state, action: PayloadAction<{ userId: string; messageId: number; updates: Partial<Message> }>) => {
      const { userId, messageId, updates } = action.payload;
      
      if (state.messages[userId]) {
        const messageIndex = state.messages[userId].findIndex(m => 
          m.id === messageId || m.messageId === messageId
        );
        if (messageIndex !== -1) {
          state.messages[userId][messageIndex] = {
            ...state.messages[userId][messageIndex],
            ...updates,
          };
        }
      }
    },
    
    // Mark messages as read - OPTIMIZED
    // markMessagesAsRead: (state, action: PayloadAction<{ userId: string; messageIds: number[] }>) => {
    //   const { userId, messageIds } = action.payload;
      
    //   if (state.messages[userId]) {
    //     let readCount = 0;
        
    //     state.messages[userId] = state.messages[userId].map(message => {
    //       const shouldMarkRead = messageIds.includes(message.id) || 
    //                            messageIds.includes(message.messageId || 0);
          
    //       if (shouldMarkRead && !message.isRead) {
    //         readCount += 1;
    //         return { ...message, isRead: true };
    //       }
    //       return message;
    //     });
        
    //     // Update unread count in chat list
    //     const chatIndex = state.userChats.findIndex(chat => chat.userId === userId);
    //     if (chatIndex !== -1 && readCount > 0) {
    //       const currentUnread = state.userChats[chatIndex].unreadCount;
    //       state.userChats[chatIndex].unreadCount = Math.max(0, currentUnread - readCount);
    //       state.totalUnreadCount = Math.max(0, state.totalUnreadCount - readCount);
    //     }
    //   }
    // },
    
    // Mark all messages as read for a user
    markAllMessagesAsRead: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      
      if (state.messages[userId]) {
        let readCount = 0;
        
        state.messages[userId] = state.messages[userId].map(message => {
          if (!message.isRead && message.senderId !== state.activeUserId) {
            readCount += 1;
            return { ...message, isRead: true };
          }
          return message;
        });
        
        // Update unread count in chat list
        const chatIndex = state.userChats.findIndex(chat => chat.userId === userId);
        if (chatIndex !== -1 && readCount > 0) {
          state.userChats[chatIndex].unreadCount = 0;
          state.totalUnreadCount = Math.max(0, state.totalUnreadCount - readCount);
        }
      }
    },
    
    // Delete message
    deleteMessage: (state, action: PayloadAction<{ userId: string; messageId: number }>) => {
      const { userId, messageId } = action.payload;
      
      if (state.messages[userId]) {
        state.messages[userId] = state.messages[userId].filter(m => 
          m.id !== messageId && m.messageId !== messageId
        );
      }
    },
    
    // Pagination management
    setPagination: (state, action: PayloadAction<{
      userId: string;
      pageNumber: number;
      pageSize: number;
      hasNextPage: boolean;
      totalCount: number;
    }>) => {
      const { userId, ...pagination } = action.payload;
      state.pagination[userId] = pagination;
    },
    
    // Typing indicators
    setUserTyping: (state, action: PayloadAction<{ userId: string; isTyping: boolean }>) => {
      const { userId, isTyping } = action.payload;
      state.typingUsers[userId] = isTyping;
    },
    
    // Unread count management
    setTotalUnreadCount: (state, action: PayloadAction<number>) => {
      state.totalUnreadCount = action.payload;
    },
    
    incrementUnreadCount: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      const chatIndex = state.userChats.findIndex(chat => chat.userId === userId);
      
      if (chatIndex !== -1) {
        state.userChats[chatIndex].unreadCount += 1;
        state.totalUnreadCount += 1;
      }
    },
    
    decrementUnreadCount: (state, action: PayloadAction<{ userId: string; count?: number }>) => {
      const { userId, count = 1 } = action.payload;
      const chatIndex = state.userChats.findIndex(chat => chat.userId === userId);
      
      if (chatIndex !== -1) {
        const currentUnread = state.userChats[chatIndex].unreadCount;
        state.userChats[chatIndex].unreadCount = Math.max(0, currentUnread - count);
        state.totalUnreadCount = Math.max(0, state.totalUnreadCount - count);
      }
    },

    
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Clear messages for a user
    clearMessages: (state, action: PayloadAction<string>) => {
      delete state.messages[action.payload];
      delete state.pagination[action.payload];
    },
    
    // Clear all cached conversations (useful for logout)
    clearAllConversations: (state) => {
      state.messages = {};
      state.pagination = {};
      state.typingUsers = {};
      state.activeUserId = null;
    },
    
    // Reset entire state
    resetChat: (state) => {
      return initialState;
    },
  },
});



export const {
  setSocket,
  setConnectionStatus,
  setConnecting,
  setUserChats,
  setLoadingChats,
  updateChatLastMessage,
  setActiveUserId,
  setMessages,
  setLoadingMessages,
  addMessage,
  replaceOptimisticMessage,
  prependMessages,
  updateMessage,
  markMessagesAsRead,
  markAllMessagesAsRead,
  deleteMessage,
  setPagination,
  setUserTyping,
  setTotalUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  setError,
  clearMessages,
  clearAllConversations,
  resetChat,
  markChatAsRead
} = chatSlice.actions;

export default chatSlice.reducer;