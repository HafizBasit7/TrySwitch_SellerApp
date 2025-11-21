// hooks/useSignalR.ts - UPDATED WITH MARKETPLACE HANDLERS
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
import {
  addMarketplaceMessage,
  markMarketplaceMessagesAsRead,
  deleteMarketplaceMessage,
  updateMarketplaceChatThread,
  replaceOptimisticMarketplaceMessage,
  updateMarketplaceChatLastMessage

} from '../store/slices/marketplaceSlice';
import { signalRService, SignalREventHandlers } from '../services/signalRService';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types/chat';
import { MarketPlaceMessage } from '../types/marketplace';

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
    const messageIds = Array.isArray(data.messageIds) ? data.messageIds : [];
    const userId = data.userId || data.senderId;
    
    if (messageIds.length > 0 && userId) {
      dispatch(markMessagesAsRead({ userId, messageIds }));
    }
  }, [dispatch]);

  /**
   * MARKETPLACE MESSAGE HANDLER - NEW
   */
// In hooks/useSignalR.ts - UPDATE MARKETPLACE HANDLERS
 const handleMarketplaceMessageReceived = useCallback((rawMessage: any) => {
    console.log('📦 [Hook] Marketplace message received:', rawMessage);
    
    if (!userInfo?.id) {
      console.warn('⚠️ [Hook] No user info available for marketplace message');
      return;
    }

    try {
      // Normalize marketplace message
      const normalizedMessage: MarketPlaceMessage = {
        id: rawMessage.id || rawMessage.messageId || Date.now(),
        messageId: rawMessage.id || rawMessage.messageId,
        senderId: rawMessage.senderId,
        senderName: rawMessage.senderName || '',
        senderProfileImage: rawMessage.senderProfileImage || '',
        receiverId: rawMessage.receiverId,
        receiverName: rawMessage.receiverName || '',
        receiverProfileImage: rawMessage.receiverProfileImage || '',
        content: rawMessage.content,
        timestamp: rawMessage.timestamp || new Date().toISOString(),
        isRead: rawMessage.isRead || false,
        propertyId: rawMessage.propertyId,
        propertyAddress: rawMessage.propertyAddress || '',
        replyedMessageId: rawMessage.replyedMessageId,
      };

      console.log('📦 [Hook] Normalized marketplace message:', normalizedMessage);
      
      const otherUserId = normalizedMessage.senderId === userInfo.id 
        ? normalizedMessage.receiverId 
        : normalizedMessage.senderId;
      
      // Check if this might be replacing an optimistic message
      const isPotentialReplacement = !rawMessage.id && rawMessage.messageId;
      
      if (isPotentialReplacement) {
        dispatch(replaceOptimisticMarketplaceMessage({
          propertyId: normalizedMessage.propertyId,
          userId: otherUserId,
          tempId: normalizedMessage.id,
          realMessage: normalizedMessage
        }));
      } else {
        dispatch(addMarketplaceMessage({ 
          propertyId: normalizedMessage.propertyId, 
          userId: otherUserId, 
          message: normalizedMessage 
        }));
        dispatch(updateMarketplaceChatLastMessage({ 
          propertyId: normalizedMessage.propertyId, 
          userId: otherUserId, 
          message: normalizedMessage 
        }));
      }
      
      console.log('✅ [Hook] Marketplace message processed for property:', normalizedMessage.propertyId);
    } catch (error) {
      console.error('❌ [Hook] Error processing marketplace message:', error);
    }
  }, [dispatch, userInfo?.id]);

  const handleMarketMessageRead = useCallback((data: any) => {
    console.log('✅ [Hook] Marketplace messages read:', data);
    const messageIds = Array.isArray(data.messageIds) ? data.messageIds : [data.messageId].filter(Boolean);
    const propertyId = data.propertyId;
    const userId = data.userId;
    
    if (messageIds.length > 0 && propertyId && userId) {
      dispatch(markMarketplaceMessagesAsRead({ propertyId, userId, messageIds }));
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

  /**
   * MARKETPLACE MESSAGE DELETE HANDLER - NEW
   */
  const handleMessageDeleteMarket = useCallback((data: any) => {
    console.log('🗑️ [Hook] Marketplace message deleted:', data);
    const messageId = data.messageId || data.id;
    
    if (messageId) {
      dispatch(deleteMarketplaceMessage(messageId));
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
        
        // MARKETPLACE HANDLERS - UPDATED FROM STUBS
        onMarketPlaceMessageReceived: handleMarketplaceMessageReceived,
        onMarketMessageRead: handleMarketMessageRead,
        onMessageDeleteMarket: handleMessageDeleteMarket,
        
        // Connection handlers
        onReconnecting: handleReconnecting,
        onReconnected: handleReconnected,
        onConnectionClosed: handleConnectionClosed,
        
        // Other handlers
        onUserLoggedIn: (userId) => {
          console.log('👤 User logged in:', userId);
        },
        onNotificationReceived: (notification) => {
          console.log('🔔 Notification received:', notification);
        },
        onNotificationSeen: (notificationId) => {
          console.log('👁️ Notification seen:', notificationId);
        },
        onInvitationAccepted: (data) => {
          console.log('🤝 Invitation accepted:', data);
        },
        onInvestorDeleted: (data) => {
          console.log('🚫 Investor deleted:', data);
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
    } finally {
      isConnectingRef.current = false;
    }
  }, [
    userToken,
    userInfo,
    isConnected,
    dispatch,
    handleMessageReceived,
    handleMarketplaceMessageReceived,
    handleMessageRead,
    handleMarketMessageRead,
    handleMessageDeleted,
    handleMessageDeleteMarket,
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
  };
};

export default useSignalR;