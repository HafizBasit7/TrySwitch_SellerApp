// hooks/useSignalR.ts - UPDATED FOR RECEIVE-ONLY
import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  setSocket,
  setConnectionStatus,
  setConnecting,
  addMessage,
  markMessagesAsRead,
  deleteMessage,
  updateChatLastMessage,
  setError,
} from '../store/slices/chatSlice';
import { signalRService, SignalREventHandlers } from '../services/signalRService';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types/chat';

/**
 * Custom hook to manage SignalR connection for RECEIVING messages only
 */
export const useSignalR = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { userToken, userInfo } = useAuth();
  const { socket, isConnected } = useSelector((state: RootState) => state.chat);
  
  const isConnectingRef = useRef(false);

  /**
   * Event Handlers - ONLY for receiving and processing messages
   */
const handleMessageReceived = useCallback((rawMessage: any) => {
  console.log('📨 [Hook] Raw message received:', rawMessage);
  
  // Normalize the message structure to match our Message interface
  const normalizedMessage: Message = {
    id: rawMessage.id || Date.now(),
    messageId: rawMessage.id,
    senderId: rawMessage.senderId,
    senderName: '', // Will be populated from chat list
    senderProfileImage: '', // Will be populated from chat list
    receiverId: rawMessage.receiverId,
    receiverName: '', // Will be populated from chat list
    receiverProfileImage: '', // Will be populated from chat list
    content: rawMessage.content,
    timestamp: rawMessage.timestamp,
    isRead: rawMessage.isRead || false,
    replyedMessageId: rawMessage.replyedMessageId,
  };

  console.log('📨 [Hook] Normalized message:', normalizedMessage);
  
  // Determine which user this message belongs to
  const otherUserId = normalizedMessage.senderId === userInfo?.id 
    ? normalizedMessage.receiverId 
    : normalizedMessage.senderId;
  
  // Add message to Redux store
  dispatch(addMessage({ userId: otherUserId, message: normalizedMessage }));
  dispatch(updateChatLastMessage({ userId: otherUserId, message: normalizedMessage }));
  
  console.log('✅ [Hook] Message added to store for user:', otherUserId);
}, [dispatch, userInfo?.id]);

  const handleMessageRead = useCallback((data: any) => {
    console.log('✅ [Hook] Messages read notification:', data);
    // Extract message IDs and user ID from the data
    const messageIds = Array.isArray(data.messageIds) ? data.messageIds : [];
    const userId = data.userId || data.senderId;
    
    if (messageIds.length > 0 && userId) {
      dispatch(markMessagesAsRead({ userId, messageIds }));
    }
  }, [dispatch]);

  const handleMessageDeleted = useCallback((data: any) => {
    console.log('🗑️ [Hook] Message deleted:', data);
    const messageId = data.messageId || data.id;
    const userId = data.userId || data.senderId;
    
    if (messageId && userId) {
      dispatch(deleteMessage({ userId, messageId }));
    }
  }, [dispatch]);

  const handleReconnecting = useCallback((error?: Error) => {
    console.warn('🔄 [Hook] SignalR reconnecting...', error?.message);
    dispatch(setConnecting(true));
    dispatch(setConnectionStatus(false));
  }, [dispatch]);

  const handleReconnected = useCallback((connectionId?: string) => {
    console.log('✅ [Hook] SignalR reconnected:', connectionId);
    dispatch(setConnectionStatus(true));
    dispatch(setConnecting(false));
  }, [dispatch]);

  const handleConnectionClosed = useCallback((error?: Error) => {
    console.error('❌ [Hook] SignalR connection closed:', error?.message);
    dispatch(setConnectionStatus(false));
    dispatch(setConnecting(false));
    // Don't show error - SignalR is optional for receiving
  }, [dispatch]);

  /**
   * Initialize SignalR connection for RECEIVING only
   */
  const connectSignalR = useCallback(async () => {
    if (!userToken || !userInfo) {
      console.warn('⚠️ No token or user info available');
      return;
    }

    if (isConnectingRef.current || isConnected) {
      console.log('⚠️ Already connecting or connected');
      return;
    }

    isConnectingRef.current = true;
    dispatch(setConnecting(true));

    try {
      console.log('🔌 Connecting to SignalR for real-time receiving...');

      const handlers: Partial<SignalREventHandlers> = {
        // Core chat handlers
        onMessageReceived: handleMessageReceived,
        onMessageRead: handleMessageRead,
        onMessageDeleted: handleMessageDeleted,
        
        // Connection handlers
        onReconnecting: handleReconnecting,
        onReconnected: handleReconnected,
        onConnectionClosed: handleConnectionClosed,
        
        // Other handlers (stub implementations)
        onMarketPlaceMessageReceived: (message) => {
          console.log('📦 Marketplace message (stub):', message);
        },
        onMarketMessageRead: (data) => {
          console.log('✅ Marketplace read (stub):', data);
        },
        onMessageDeleteMarket: (data) => {
          console.log('🗑️ Marketplace deleted (stub):', data);
        },
        onUserLoggedIn: (userId) => {
          console.log('👤 User logged in (stub):', userId);
        },
        onNotificationReceived: (notification) => {
          console.log('🔔 Notification (stub):', notification);
        },
        onNotificationSeen: (notificationId) => {
          console.log('👁️ Notification seen (stub):', notificationId);
        },
        onInvitationAccepted: (data) => {
          console.log('🤝 Invitation accepted (stub):', data);
        },
        onInvestorDeleted: (data) => {
          console.log('🚫 Investor deleted (stub):', data);
        },
      };

      const connection = await signalRService.connect(userToken, handlers);
      
      dispatch(setSocket(connection));
      dispatch(setConnectionStatus(true));
      dispatch(setConnecting(false));
      dispatch(setError(null));
      
      console.log('✅ SignalR connected successfully for real-time receiving');
    } catch (error: any) {
      console.error('❌ SignalR connection failed:', error);
      dispatch(setConnectionStatus(false));
      dispatch(setConnecting(false));
      // Don't show error to user - SignalR is optional
    } finally {
      isConnectingRef.current = false;
    }
  }, [
    userToken,
    userInfo,
    isConnected,
    dispatch,
    handleMessageReceived,
    handleMessageRead,
    handleMessageDeleted,
    handleReconnecting,
    handleReconnected,
    handleConnectionClosed,
  ]);

  /**
   * Disconnect SignalR
   */
  const disconnectSignalR = useCallback(async () => {
    try {
      await signalRService.disconnect();
      dispatch(setSocket(null));
      dispatch(setConnectionStatus(false));
      console.log('✅ SignalR disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting SignalR:', error);
    }
  }, [dispatch]);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (userToken && !isConnected && !isConnectingRef.current) {
      connectSignalR();
    }

    return () => {
      isConnectingRef.current = false;
    };
  }, [userToken, isConnected, connectSignalR]);

  return {
    isConnected,
    connectSignalR,
    disconnectSignalR,
    // NO send methods - we use API for sending
  };
};

export default useSignalR;