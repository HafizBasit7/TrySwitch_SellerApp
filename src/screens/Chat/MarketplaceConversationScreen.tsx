// screens/Chat/MarketplaceConversationScreen.tsx - FINAL PROFESSIONAL VERSION
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';

// Reusable Components
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageMenuModal } from '../../components/chat/MessageMenuModal';
import { ChatHeader } from '../../components/chat/ChatHeader';

// API & Types
import { marketplaceAPI } from '../../api/marketplace';
import { 
  MarketPlaceMessage, 
  PropertyDetail,
  SendMarketPlaceMessageRequest,
  GetMarketPlaceMessageHistoryRequest, 
} from '../../types/marketplace';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../api/profileAPI';
import { useImagePicker } from '../../hooks/useImagePicker';
import { useSignalR } from '../../hooks/useSignalR';
import { AppDispatch, RootState } from '../../store';
import {
  setActiveConversation,
  setMessages,
  addMessage,
  prependMessages,
  markMessagesAsRead,
  markChatAsRead,
  deleteMessage,
  setPagination,
  setLoadingMessages,
  replaceOptimisticMessage,
  deleteMarketplaceMessage,
  replaceOptimisticMarketplaceMessage
} from '../../store/slices/marketplaceSlice';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RouteParams {
  propertyId: number;
  propertyAddress: string;
  propertyImage?: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  userProfileType: number;
}

interface Props {
  route: RouteProp<{ params: RouteParams }, 'params'>;
  navigation: StackNavigationProp<any>;
}

// Selectors
const selectMessagesForConversation = (state: RootState, propertyId: number, userId: string) => 
  state.marketplace.messages[`${propertyId}-${userId}`] || [];

const selectPaginationForConversation = (state: RootState, propertyId: number, userId: string) => 
  state.marketplace.pagination[`${propertyId}-${userId}`];

const MarketplaceConversationScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    propertyId,
    propertyAddress,
    propertyImage,
    userId,
    userName: initialUserName,
    userProfileImage: initialProfileImage,
    userProfileType,
  } = route.params;

  const { userInfo } = useAuth();
  const { isConnected: signalRConnected, connection } = useSignalR();
  
  // Redux state with memoized selectors
  const messages = useSelector((state: RootState) => 
    selectMessagesForConversation(state, propertyId, userId)
  );
  const isLoadingMessages = useSelector((state: RootState) => state.marketplace.isLoadingMessages);
  const pagination = useSelector((state: RootState) => 
    selectPaginationForConversation(state, propertyId, userId)
  );
  
  // Memoized derived state
  const hasMore = useMemo(() => pagination?.hasNextPage || false, [pagination]);
  const pageNumber = useMemo(() => pagination?.pageNumber || 1, [pagination]);

  // Local state
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [userName, setUserName] = useState(initialUserName);
  const [userImage, setUserImage] = useState(initialProfileImage);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MarketPlaceMessage | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [replyingTo, setReplyingTo] = useState<MarketPlaceMessage | null>(null);
  const [currentUserImage, setCurrentUserImage] = useState<string>('');
  const [showingPropertyCard, setShowingPropertyCard] = useState(true);
  const [propertyDetail, setPropertyDetail] = useState<PropertyDetail | null>(null);
  
  // Refs for scroll and state management
  const flatListRef = useRef<FlatList>(null);
  const loadingMoreRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const markAsReadCalledRef = useRef(false);
  const isManuallyScrollingRef = useRef(false);
  const messageCountRef = useRef(0);
  const apiCallInProgressRef = useRef(false);
  const scrollOffsetRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  const PAGE_SIZE = 20;

  // Image picker hook
  const { 
    pickAndUploadChatMedia, 
    pickAndUploadChatDocument, 
    uploading: imageUploading,
    uploadingDocument: docUploading 
  } = useImagePicker();

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    console.log('🎬 MarketplaceConversation mounted for:', { propertyId, userId });
    
    dispatch(setActiveConversation({ propertyId, userId }));
    initializeChat();
    setupSignalRListeners();
    
    return () => {
      console.log('🔚 MarketplaceConversation cleanup');
      dispatch(setActiveConversation({ propertyId: null, userId: null }));
      handleMarkAsRead();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // Clean up SignalR listeners
      if (connection) {
        connection.off('ReceiveMarketplaceMessage');
        connection.off('MarketplaceMessagesRead');
      }
    };
  }, [propertyId, userId]);

  // ==================== SIGNALR REAL-TIME MESSAGES ====================
  const setupSignalRListeners = useCallback(() => {
    if (!connection) {
      console.log('⚠️ [MARKETPLACE] No SignalR connection available');
      return;
    }

    console.log('🔌 [MARKETPLACE] Setting up SignalR listeners');

    // Listen for new marketplace messages
    connection.on('ReceiveMarketplaceMessage', (message: any) => {
      console.log('📦 [SIGNALR MARKETPLACE] New message received:', message);
      
      // Check if this message belongs to current conversation
      if (message.propertyId === propertyId && 
          (message.senderId === userId || message.receiverId === userId)) {
        
        console.log('✅ [SIGNALR MARKETPLACE] Message belongs to current conversation');
        
        // Normalize the message format according to MarketPlaceMessage type
        const normalizedMessage: MarketPlaceMessage = {
          id: message.messageId || message.id,
          senderId: message.senderId,
          senderName: message.senderName || '',
          senderProfileImage: message.senderProfileImage,
          receiverId: message.receiverId,
          receiverName: message.receiverName || '',
          receiverProfileImage: message.receiverProfileImage,
          content: message.content,
          timestamp: message.timestamp,
          isRead: message.isRead || false,
          propertyId: message.propertyId,
          propertyAddress: propertyAddress,
          replyedMessageId: message.replyedMessageId || 0,
        };

        // Check if this is replacing a temporary message
        const existingTempMessage = messages.find(msg => 
          msg.isTemporary && msg.content === message.content
        );

        if (existingTempMessage) {
          console.log('🔄 [MARKETPLACE] Replacing temporary message with real one');
          dispatch(replaceOptimisticMessage({ 
            propertyId, 
            userId, 
            tempId: existingTempMessage.id, 
            realMessage: normalizedMessage 
          }));
        } else {
          console.log('➕ [MARKETPLACE] Adding new message from SignalR');
          dispatch(addMessage({ propertyId, userId, message: normalizedMessage }));
        }

        // Auto-scroll to new message if user is near bottom
        if (shouldAutoScrollRef.current) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 300);
        }
      }
    });

    // Handle message read receipts
    connection.on('MarketplaceMessagesRead', (data: any) => {
      console.log('👁️ [SIGNALR MARKETPLACE] Messages read:', data);
      if (data.receiverId === currentUserId && data.senderId === userId) {
        dispatch(markMessagesAsRead({ propertyId, userId, messageIds: data.messageIds }));
      }
    });

  }, [connection, propertyId, userId, propertyAddress, currentUserId, messages, dispatch]);

  // ==================== ENHANCED SCROLL HANDLING ====================
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    scrollOffsetRef.current = contentOffset.y;
    
    // Calculate if user is near bottom (within 100px)
    const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
    shouldAutoScrollRef.current = isNearBottom;
    
    // Load older messages only when scrolling up near the top
    const isNearTop = contentOffset.y < 200;
    const hasScrolledUp = scrollOffsetRef.current < contentOffset.y;
    
    if (isNearTop && hasScrolledUp && hasMore && !loadingMore && !loadingMoreRef.current) {
      console.log('📜 User scrolled to top - loading older messages');
      loadOlderMessages();
    }
    
    // Track manual scrolling
    if (!isNearBottom) {
      isManuallyScrollingRef.current = true;
    } else {
      isManuallyScrollingRef.current = false;
    }
  };

  // ==================== MESSAGE LOADING ====================
  const loadRecentMessages = useCallback(async () => {
    if (isLoadingMessages || apiCallInProgressRef.current) return;

    try {
      apiCallInProgressRef.current = true;
      dispatch(setLoadingMessages(true));
      console.log('📜 [MARKETPLACE] Loading recent messages');

      const requestData: GetMarketPlaceMessageHistoryRequest = {
        reciverId: userId, // Note: API uses "reciverId" (typo)
        propertyId,
        receiverProfileType: userProfileType,
        pageNumber: 1,
        pageSize: PAGE_SIZE,
      };

      const response = await marketplaceAPI.getMarketPlaceMessageHistory(requestData);

      if (response.success && response.messages) {
        let recentMessages = response.messages;
        
        // Sort messages chronologically (oldest first for proper display)
        recentMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        console.log(`✅ [MARKETPLACE] Processed ${recentMessages.length} messages from API`);
        
        // Update Redux store
        dispatch(setMessages({ propertyId, userId, messages: recentMessages }));

        const hasNextPage = recentMessages.length === PAGE_SIZE;
        dispatch(setPagination({
          propertyId,
          userId,
          pageNumber: 1,
          pageSize: PAGE_SIZE,
          hasNextPage,
          totalCount: response.totalCount || recentMessages.length
        }));

        messageCountRef.current = recentMessages.length;

        console.log(`✅ [MARKETPLACE] Loaded ${recentMessages.length} messages, hasMore: ${hasNextPage}`);
        
        // Auto-scroll to bottom ONLY on initial load
        if (!initialLoadDoneRef.current) {
          setTimeout(() => {
            console.log('🎯 [MARKETPLACE] Auto-scrolling to bottom on initial load');
            flatListRef.current?.scrollToEnd({ animated: false });
            shouldAutoScrollRef.current = true;
          }, 500);
        }
      } else {
        console.log('⚠️ [MARKETPLACE] No messages found in response');
        dispatch(setMessages({ propertyId, userId, messages: [] }));
      }
    } catch (error: any) {
      console.error('❌ [MARKETPLACE] Error loading messages:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load messages',
      });
    } finally {
      dispatch(setLoadingMessages(false));
      apiCallInProgressRef.current = false;
    }
  }, [propertyId, userId, userProfileType, dispatch]);

  const loadOlderMessages = async () => {
    if (loadingMoreRef.current || !hasMore || isLoadingMessages) {
      return;
    }

    try {
      loadingMoreRef.current = true;
      setLoadingMore(true);

      console.log('📜 [MARKETPLACE] Loading older messages, page:', pageNumber + 1);

      const requestData: GetMarketPlaceMessageHistoryRequest = {
        reciverId: userId,
        propertyId,
        receiverProfileType: userProfileType,
        pageNumber: pageNumber + 1,
        pageSize: PAGE_SIZE,
      };

      const response = await marketplaceAPI.getMarketPlaceMessageHistory(requestData);

      if (response.success && response.messages) {
        let olderMessages = response.messages;
        olderMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Store current scroll position before prepending
        const currentScrollOffset = scrollOffsetRef.current;
        
        dispatch(prependMessages({ propertyId, userId, messages: olderMessages }));

        const hasNextPage = olderMessages.length === PAGE_SIZE;
        dispatch(setPagination({
          propertyId,
          userId,
          pageNumber: pageNumber + 1,
          pageSize: PAGE_SIZE,
          hasNextPage,
          totalCount: pagination?.totalCount || messages.length + olderMessages.length
        }));

        console.log(`✅ [MARKETPLACE] Loaded ${olderMessages.length} older messages, hasMore: ${hasNextPage}`);
        
        // Maintain scroll position after loading older messages
        setTimeout(() => {
          if (flatListRef.current) {
            // Calculate new scroll position (offset by the height of loaded messages)
            const estimatedMessageHeight = 80;
            const newOffset = currentScrollOffset + (olderMessages.length * estimatedMessageHeight);
            flatListRef.current.scrollToOffset({ offset: newOffset, animated: false });
          }
        }, 100);
      }
    } catch (error: any) {
      console.error('❌ [MARKETPLACE] Error loading older messages:', error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  // ==================== PROFILE & PROPERTY FETCHING ====================
  const getCurrentUserId = useCallback(async (): Promise<string | null> => {
    try {
      if (userInfo?.id) {
        setCurrentUserId(userInfo.id);
        
        // Fetch current user profile image
        try {
          const profileResponse = await profileAPI.getSellerProfile();
          if (profileResponse?.sellerProfile?.userProfileImage) {
            setCurrentUserImage(profileResponse.sellerProfile.userProfileImage);
          }
        } catch (profileError) {
          console.error('❌ Error fetching profile image:', profileError);
        }
        
        return userInfo.id;
      }
      return null;
    } catch (error) {
      console.error('❌ [MARKETPLACE USER ID] Error:', error);
      return null;
    }
  }, [userInfo]);

  const fetchPropertyDetails = async () => {
    try {
      console.log('🏠 [MARKETPLACE] Fetching property details for ID:', propertyId);
      const response = await marketplaceAPI.getPropertyDetails(propertyId);
      
      if (response.success && response.property) {
        console.log('✅ [MARKETPLACE] Property details loaded');
        setPropertyDetail(response.property);
      }
    } catch (error: any) {
      console.error('❌ [MARKETPLACE] Error fetching property details:', error.message);
    }
  };

  // ==================== MESSAGE SENDING ====================
// ==================== MESSAGE SENDING ====================
const handleSendMessage = useCallback(async (): Promise<void> => {
  if (inputText.trim() === '' || sending || !currentUserId) return;

  const messageContent = inputText.trim();
  const tempId = Date.now();
  
  // Create optimistic message
  const optimisticMessage: MarketPlaceMessage = {
    id: tempId,
    senderId: currentUserId,
    senderName: userInfo?.name || 'You',
    senderProfileImage: currentUserImage,
    receiverId: userId,
    receiverName: userName,
    receiverProfileImage: userImage,
    content: messageContent,
    timestamp: new Date().toISOString(),
    isRead: true,
    propertyId: propertyId,
    propertyAddress: propertyAddress,
  };

  // Update UI immediately
  dispatch(addMessage({ propertyId, userId, message: optimisticMessage }));
  setInputText('');
  setReplyingTo(null);
  setSending(true);

  // Auto-scroll to show new message
  setTimeout(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, 100);

  try {
    const sendMessageRequest: SendMarketPlaceMessageRequest = {
      receiverId: userId,
      propertyId,
      content: messageContent,
      ...(replyingTo?.id && { replyedMessageId: replyingTo.id }),
    };

    console.log('📤 [MARKETPLACE] Sending message:', sendMessageRequest);

    const response = await marketplaceAPI.sendMarketPlaceMessage(sendMessageRequest);

    console.log('📦 [MARKETPLACE] Send message response:', response);

    // FIX: Handle different response structures
    if (response.success) {
      console.log('✅ [MARKETPLACE] Message sent successfully');
      
      // The real message will come via SignalR, but we'll set a fallback
      const fallbackTimeout = setTimeout(() => {
        // If SignalR doesn't deliver within 3 seconds, check if we still have the temp message
        const stillHasTempMessage = messages.some(msg => msg.id === tempId);
        if (stillHasTempMessage) {
          console.log('🔄 [MARKETPLACE] SignalR fallback - reloading messages');
          loadRecentMessages(); // Reload to get the real message from server
        }
      }, 3000);

      // Clear timeout if SignalR delivers the message
      setTimeout(() => {
        clearTimeout(fallbackTimeout);
      }, 10000);
      
    } else {
      // If API returns success: false, throw the message
      throw new Error(response.message || 'Failed to send message');
    }
  } catch (error: any) {
    console.error('❌ [MARKETPLACE] Error sending message:', error);
    
    // Remove temporary message on error
    dispatch(deleteMarketplaceMessage({ propertyId, userId, messageId: tempId }));
    
    Toast.show({
      type: 'error',
      text1: 'Send Failed',
      text2: error.message || 'Failed to send message. Please try again.',
    });
  } finally {
    setSending(false);
  }
}, [inputText, sending, currentUserId, userInfo, currentUserImage, userId, userName, userImage, propertyId, propertyAddress, replyingTo, messages, dispatch, loadRecentMessages]);
  // ==================== MEDIA HANDLING ====================
  const handleSendImage = async () => {
    if (!currentUserId || imageUploading) return;
    
    try {
      console.log('🖼️ [MARKETPLACE] Starting image upload');
      const mediaResult = await pickAndUploadChatMedia(currentUserId);
      
      if (mediaResult && mediaResult.type === 'image') {
        // Create temporary message for immediate display
        const tempId = Date.now();
        const tempMessage: MarketPlaceMessage & { isTemporary?: boolean } = {
          id: tempId,
          senderId: currentUserId,
          senderName: userInfo?.name || 'You',
          senderProfileImage: currentUserImage,
          receiverId: userId,
          receiverName: userName,
          receiverProfileImage: userImage,
          content: `[IMAGE]${mediaResult.url}`,
          timestamp: new Date().toISOString(),
          isRead: true,
          propertyId: propertyId,
          propertyAddress: propertyAddress,
          isTemporary: true,
        };

        dispatch(addMessage({ propertyId, userId, message: tempMessage }));

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);

        const sendMessageRequest: SendMarketPlaceMessageRequest = {
          receiverId: userId,
          propertyId,
          content: `[IMAGE]${mediaResult.url}`,
        };

        const response = await marketplaceAPI.sendMarketPlaceMessage(sendMessageRequest);

        if (response.success) {
          console.log('✅ [MARKETPLACE] Image sent successfully');
        } else {
          throw new Error(response.message || 'Failed to send image');
        }
      }
    } catch (error: any) {
      console.error('❌ [MARKETPLACE] Error sending image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to send image',
      });
    }
  };

  const handleSendDocument = async () => {
    if (!currentUserId || docUploading) return;
    
    try {
      console.log('📄 [MARKETPLACE] Starting document upload');
      const documentUrl = await pickAndUploadChatDocument(currentUserId);
      
      if (documentUrl) {
        const documentContent = `[DOCUMENT]${documentUrl}`;

        const sendMessageRequest: SendMarketPlaceMessageRequest = {
          receiverId: userId,
          propertyId,
          content: documentContent,
        };

        const response = await marketplaceAPI.sendMarketPlaceMessage(sendMessageRequest);

        if (response.success) {
          console.log('✅ [MARKETPLACE] Document sent successfully');
          Toast.show({ type: 'success', text1: 'Sent', text2: 'Document sent successfully' });
          
          // Refresh messages to show the new document
          setTimeout(() => {
            loadRecentMessages();
          }, 1000);
        } else {
          throw new Error(response.message || 'Failed to send document');
        }
      }
    } catch (error: any) {
      console.error('❌ [MARKETPLACE] Error sending document:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to send document',
      });
    }
  };

  // ==================== MARK AS READ ====================
  const handleMarkAsRead = useCallback(async () => {
    const effectiveCurrentUserId = currentUserId || userInfo?.id;
    
    if (!effectiveCurrentUserId) {
      console.log('⏹️ [MARKETPLACE MARK READ] Skipping - no currentUserId');
      return;
    }
    
    if (markAsReadCalledRef.current) {
      console.log('⏹️ [MARKETPLACE MARK READ] Already called for this session');
      return;
    }
    
    console.log(`📖 [MARKETPLACE MARK READ] Starting for:`, { propertyId, userId });
    
    try {
      // Get unread messages from current user
      const unreadMessages = messages.filter(msg => 
        !msg.isRead && 
        msg.senderId === userId && 
        msg.receiverId === effectiveCurrentUserId
      );
      
      const messageIds = unreadMessages.map(msg => msg.id).filter(id => id > 0 && id < 1000000000000);
      
      console.log(`📖 [MARKETPLACE MARK READ] Found ${unreadMessages.length} unread messages, ${messageIds.length} valid IDs`);
      
      if (messageIds.length > 0) {
        console.log(`📤 [MARKETPLACE MARK READ] Calling API for ${messageIds.length} messages`);
        
        try {
          await marketplaceAPI.markMarketPlaceAsRead(messageIds);
          console.log(`✅ [MARKETPLACE MARK READ] API call successful`);
          
          // Update Redux state
          dispatch(markMessagesAsRead({ propertyId, userId, messageIds }));
          
        } catch (apiError: any) {
          console.error('❌ [MARKETPLACE MARK READ] API Error:', apiError.message);
          // Still update UI for better UX
          dispatch(markMessagesAsRead({ propertyId, userId, messageIds }));
        }
      } else {
        console.log('ℹ️ [MARKETPLACE MARK READ] No unread messages found via API');
        dispatch(markChatAsRead({ propertyId, userId }));
      }
      
      markAsReadCalledRef.current = true;
      
    } catch (error) {
      console.error('❌ [MARKETPLACE MARK READ] Error:', error);
      dispatch(markChatAsRead({ propertyId, userId }));
    }
  }, [dispatch, propertyId, userId, messages, currentUserId, userInfo?.id]);

  // ==================== INITIALIZATION ====================
const initializeChat = async () => {
  console.log('🚀 [MARKETPLACE INIT] Starting initialization');
  
  const userIdResult = await getCurrentUserId();
  
  if (!userIdResult) {
    console.error('❌ [MARKETPLACE INIT] Failed to get currentUserId');
    return;
  }
  
  console.log('✅ [MARKETPLACE INIT] currentUserId obtained:', userIdResult);
  
  // Load initial data
  await Promise.allSettled([
    loadRecentMessages(),
    fetchPropertyDetails()
  ]);
  
  // Wait for messages with timeout
  let retryCount = 0;
  const maxRetries = 10; // 5 seconds total
  const waitForMessages = () => {
    return new Promise((resolve) => {
      const checkMessages = () => {
        if (messages.length > 0 || retryCount >= maxRetries) {
          console.log(`✅ [MARKETPLACE INIT] Messages loaded: ${messages.length}, retries: ${retryCount}`);
          initialLoadDoneRef.current = true;
          resolve(true);
        } else {
          retryCount++;
          setTimeout(checkMessages, 500);
        }
      };
      checkMessages();
    });
  };
  
  await waitForMessages();
  
  // Start polling only if SignalR is not connected
  if (!signalRConnected) {
    console.log('🔄 [MARKETPLACE] SignalR not connected, starting polling');
    startPolling();
  } else {
    console.log('✅ [MARKETPLACE] SignalR connected, real-time updates active');
  }
  
  // Mark as read
  handleMarkAsRead();
};

const startPolling = useCallback(() => {
  if (pollingIntervalRef.current) {
    clearInterval(pollingIntervalRef.current);
  }
  
  // Only poll if SignalR is not connected
  if (!signalRConnected) {
    pollingIntervalRef.current = setInterval(() => {
      checkForNewMessages();
    }, 8000); // Reduced to 8 seconds for better responsiveness
    
    console.log('🔄 [MARKETPLACE] Started polling for new messages');
  }
}, [signalRConnected]);

// Stop polling when SignalR connects
useEffect(() => {
  if (signalRConnected && pollingIntervalRef.current) {
    console.log('✅ [MARKETPLACE] SignalR connected, stopping polling');
    clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = null;
  }
}, [signalRConnected]);

  const checkForNewMessages = useCallback(async () => {
    if (!currentUserId || isLoadingMessages || apiCallInProgressRef.current) return;

    try {
      console.log('🔄 [MARKETPLACE] Checking for new messages...');
      
      const requestData: GetMarketPlaceMessageHistoryRequest = {
        reciverId: userId,
        propertyId,
        receiverProfileType: userProfileType,
        pageNumber: 1,
        pageSize: 50,
      };

      const response = await marketplaceAPI.getMarketPlaceMessageHistory(requestData);

      if (response.success && response.messages && response.messages.length > 0) {
        const newMessages = response.messages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        const latestMessageId = newMessages[newMessages.length - 1]?.id;
        const currentLatestMessageId = messages[messages.length - 1]?.id;
        
        // Only update if we have genuinely new messages
        if (latestMessageId > currentLatestMessageId) {
          console.log('🆕 [MARKETPLACE] New messages found via polling, updating...');
          dispatch(setMessages({ propertyId, userId, messages: newMessages }));
        }
      }
    } catch (error) {
      console.error('❌ [MARKETPLACE] Error checking for new messages:', error);
    }
  }, [propertyId, userId, userProfileType, currentUserId, isLoadingMessages, messages, dispatch]);

  // ==================== MESSAGE MENU ====================
  const showMessageMenu = useCallback((message: MarketPlaceMessage, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedMessage(message);
    setMenuPosition({ x: pageX - 100, y: pageY - 50 });
    setMenuVisible(true);
  }, []);

  const handleReply = () => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
    }
    setMenuVisible(false);
    setSelectedMessage(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await marketplaceAPI.deleteMarketPlaceMessage(selectedMessage.id);
              dispatch(deleteMessage({ propertyId, userId, messageId: selectedMessage.id }));
              Toast.show({ type: 'success', text1: 'Deleted', text2: 'Message deleted' });
            } catch (error: any) {
              Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to delete' });
            }
          },
        },
      ]
    );
    setMenuVisible(false);
    setSelectedMessage(null);
  };

  // ==================== FORMATTERS ====================
  const formatTime = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  }, []);

  const formatDateHeader = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return '';
    }
  }, []);

  const shouldShowDateHeader = (currentMsg: MarketPlaceMessage, prevMsg: MarketPlaceMessage | null) => {
    if (!prevMsg) return true;
    try {
      const currentDate = new Date(currentMsg.timestamp).toDateString();
      const prevDate = new Date(prevMsg.timestamp).toDateString();
      return currentDate !== prevDate;
    } catch {
      return false;
    }
  };

  // ==================== RENDER MESSAGE ====================
  const renderMessage = React.useCallback(({ item, index }: { item: MarketPlaceMessage; index: number }) => {
    const isOwnMessage = item.senderId === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateHeader = shouldShowDateHeader(item, prevMessage);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <Text style={styles.dateHeaderText}>{formatDateHeader(item.timestamp)}</Text>
          </View>
        )}
        
        <MessageBubble
          message={{
            ...item,
            // Add image detection for MessageBubble
            ...(item.content.startsWith('[IMAGE]') && {
              isImage: true,
              imageUrl: item.content.substring(7),
            })
          }}
          isOwnMessage={isOwnMessage}
          investorName={userName}
          investorImage={userImage}
          currentUserImage={currentUserImage}
          onPressMenu={showMessageMenu}
          formatTime={formatTime}
        />
      </View>
    );
  }, [currentUserId, userName, userImage, currentUserImage, messages, showMessageMenu, formatTime, formatDateHeader]);

  // ==================== PROPERTY CARD COMPONENT ====================
  const PropertyCard = () => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={handlePropertyPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageSection}>
        {getPropertyDisplayImage() ? (
          <Image
            source={{ uri: getPropertyDisplayImage() }}
            style={styles.propertyImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>🏠</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.address} numberOfLines={1}>
          {getPropertyDisplayAddress()}
        </Text>
        <Text style={styles.price}>
          {formatPrice(propertyDetail?.price || 0)}
        </Text>
        <View style={styles.propertyInfoRow}>
          <Text style={styles.infoText}>{propertyDetail?.bedrooms || 0} beds</Text>
          <Text style={styles.infoText}>{propertyDetail?.bathrooms || 0} baths</Text>
          <Text style={styles.infoText}>{propertyDetail?.squareFoot || 0} sq ft</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getPropertyDisplayImage = () => {
    if (propertyDetail?.siteOrPropertyImages && propertyDetail.siteOrPropertyImages.length > 0) {
      return propertyDetail.siteOrPropertyImages[0];
    }
    return propertyImage;
  };

  const getPropertyDisplayAddress = () => {
    if (propertyDetail?.propertyAddress) {
      return propertyDetail.propertyAddress;
    }
    return propertyAddress;
  };

  const handlePropertyPress = () => {
    console.log('🏠 [MARKETPLACE] Navigating to property details:', propertyId);
    const propertyData = propertyDetail ? {
      ...propertyDetail,
      propertyListingId: propertyId,
      propertyAddress: propertyDetail.propertyAddress || propertyAddress,
      siteOrPropertyImages: propertyDetail.siteOrPropertyImages || (propertyImage ? [propertyImage] : [])
    } : {
      propertyListingId: propertyId,
      propertyAddress: propertyAddress,
      siteOrPropertyImages: propertyImage ? [propertyImage] : [],
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      squareFoot: 0,
      lotSize: '',
      soldStatus: 'Available',
      parking: [],
      views: 0,
      saves: 0,
      shares: 0,
      isDeleted: false
    };

    navigation.navigate('ListingDetail', { 
      listing: propertyData
    });
  };

  const formatPrice = (price: number) => {
    return `$${price?.toLocaleString() || '0'}`;
  };

  // ==================== TRIGGER MARK AS READ ====================
  useEffect(() => {
    if (currentUserId && messages.length > 0 && initialLoadDoneRef.current && !markAsReadCalledRef.current && signalRConnected) {
      console.log('🎯 [MARKETPLACE EFFECT] Conditions met, triggering mark-as-read');
      handleMarkAsRead();
    }
  }, [currentUserId, messages.length, handleMarkAsRead, signalRConnected]);

  // ==================== LOADING STATE ====================
  if (isLoadingMessages && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <View style={styles.container}>
      {/* Header */}
      <ChatHeader 
        userName={userName}
        userImage={userImage}
        status={signalRConnected ? "Real-time active" : "Connecting..."}
        connectionStatus={signalRConnected}
      />

      {/* Property Card */}
      {showingPropertyCard && <PropertyCard />}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => `marketplace-${item.id}-${item.timestamp}-${(item as any).isTemporary ? 'temp' : 'real'}`}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        inverted={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        ListEmptyComponent={
          !isLoadingMessages && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Start the conversation about this property!</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#FF4500" />
              <Text style={styles.loadingText}>Loading older messages...</Text>
            </View>
          ) : null
        }
        onEndReachedThreshold={0.1}
      />

      {/* Message Menu Modal */}
      <MessageMenuModal
        visible={menuVisible}
        position={menuPosition}
        selectedMessage={selectedMessage}
        isOwnMessage={selectedMessage?.senderId === currentUserId}
        onClose={() => setMenuVisible(false)}
        onReply={handleReply}
        onDelete={handleDeleteMessage}
      />

      {/* Input Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        style={styles.keyboardAvoidingView}
      >
        <ChatInput
          inputText={inputText}
          onInputChange={setInputText}
          onSendMessage={handleSendMessage}
          replyingTo={replyingTo}
          onCancelReply={cancelReply}
          onSendImage={handleSendImage}
          onSendDocument={handleSendDocument}
          sending={sending}
          imageUploading={imageUploading}
          docUploading={docUploading}
          placeholder="Write a message..."
          showAttachments={true}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 60,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  keyboardAvoidingView: {
    backgroundColor: '#fff',
  },
  // Property Card Styles
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    margin: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageSection: {
    marginRight: 12,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
  },
  detailsSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  address: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 8,
  },
  propertyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
});

export default MarketplaceConversationScreen;