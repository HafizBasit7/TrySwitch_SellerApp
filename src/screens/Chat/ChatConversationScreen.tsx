// screens/Chat/ChatConversationScreen.tsx - UPDATED WITH REUSABLE COMPONENTS
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
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';

// Reusable Components
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageMenuModal } from '../../components/chat/MessageMenuModal';
import { ChatHeader } from '../../components/chat/ChatHeader';

// API & Types
import { chatAPI } from '../../api/chatAPI';
import { investorProfAPI } from '../../api/investorProfAPI';
import { Message } from '../../types/chat';
import { ChatsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../api/profileAPI';
import { useImagePicker } from '../../hooks/useImagePicker';
import { useSignalR } from '../../hooks/useSignalR';
import { RootState } from '../../store';
import {
  setActiveUserId,
  setMessages,
  addMessage,
  prependMessages,
  markChatAsRead,
  markMessagesAsRead,
  deleteMessage,
  setPagination,
  setLoadingMessages,
} from '../../store/slices/chatSlice';

type ChatConversationRouteProp = RouteProp<ChatsStackParamList, 'ChatConversation'>;
type ChatConversationNavigationProp = StackNavigationProp<ChatsStackParamList, 'ChatConversation'>;

const selectMessagesForUser = (state: RootState, userId: string) => 
  state.chat.messages[userId] || [];

const selectPaginationForUser = (state: RootState, userId: string) => 
  state.chat.pagination[userId];

// API call debouncing utility
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

const ChatConversationScreen: React.FC = () => {
  const route = useRoute<ChatConversationRouteProp>();
  const navigation = useNavigation<ChatConversationNavigationProp>();
  const dispatch = useDispatch();
  
  const { userId, userName: initialUserName, userProfileImage: initialProfileImage, userProfileType } = route.params;
  const { userInfo } = useAuth();

  // Redux state with memoized selectors
  const messages = useSelector((state: RootState) => selectMessagesForUser(state, userId));
  const isLoadingMessages = useSelector((state: RootState) => state.chat.isLoadingMessages);
  const pagination = useSelector((state: RootState) => selectPaginationForUser(state, userId));
  
  // Memoized derived state
  const hasMore = useMemo(() => pagination?.hasNextPage || false, [pagination]);
  const pageNumber = useMemo(() => pagination?.pageNumber || 1, [pagination]);

  // SignalR
  const { isConnected: signalRConnected } = useSignalR();

  // Local state
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [investorName, setInvestorName] = useState(initialUserName);
  const [investorImage, setInvestorImage] = useState(initialProfileImage);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [currentUserImage, setCurrentUserImage] = useState<string>('');
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const loadingMoreRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const markAsReadCalledRef = useRef(false);
  const isManuallyScrollingRef = useRef(false);
  const messageCountRef = useRef(0);
 const apiCallInProgressRef = useRef(false);

  const PAGE_SIZE = 20;

  // Image picker
  const { 
    pickAndUploadChatMedia, 
    pickAndUploadChatDocument, 
    uploading: imageUploading,
    uploadingDocument: docUploading 
  } = useImagePicker();

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    console.log('🎬 ChatConversation mounted for user:', userId);
    
    dispatch(setActiveUserId(userId));
    initializeChat();
    
    return () => {
      console.log('🔚 ChatConversation unmounting');
      dispatch(setActiveUserId(null));
      handleMarkAsRead(); // Always attempt to mark as read on unmount
    };
  }, [userId]);

// FIXED: initializeChat with proper message loading wait
const initializeChat = async () => {
  console.log('🚀 [INIT] Starting chat initialization');
  
  const userIdResult = await getCurrentUserId();
  
  if (!userIdResult) {
    console.error('❌ [INIT] Failed to get currentUserId, cannot proceed');
    return;
  }
  
  console.log('✅ [INIT] currentUserId obtained:', userIdResult);
  
  // Load messages first and WAIT for them to be processed
     await Promise.allSettled([
        loadRecentMessages(),
        fetchInvestorProfile()
      ]);
  
  // Wait for Redux state to update with messages
  let retryCount = 0;
  const waitForMessages = () => {
    return new Promise((resolve) => {
      const checkMessages = () => {
        if (messages.length > 0 || retryCount >= 10) {
          console.log(`✅ [INIT] Messages loaded in state: ${messages.length}`);
          resolve(true);
        } else {
          retryCount++;
          console.log(`⏳ [INIT] Waiting for messages... (attempt ${retryCount})`);
          setTimeout(checkMessages, 300);
        }
      };
      checkMessages();
    });
  };
  
  await waitForMessages();
  
  // Then fetch profile (less critical)
  await fetchInvestorProfile();
  
  // Now mark as read when messages are definitely loaded
  console.log('✅ [INIT] All data loaded, calling handleMarkAsRead');
  // await handleMarkAsRead();
};

  // ==================== SMART SCROLL ====================
  useEffect(() => {
    const messageCount = messages.length;
    const previousCount = messageCountRef.current;
    
    const receivedOneNewMessage = messageCount === previousCount + 1;
    
    if (initialLoadDoneRef.current && receivedOneNewMessage && !isManuallyScrollingRef.current) {
      console.log('📨 New message arrived - scrolling to bottom');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    
    messageCountRef.current = messageCount;
  }, [messages.length]);




 // ==================== SMART MESSAGE LOADING ====================
  const loadRecentMessages = useCallback(async () => {
    if (isLoadingMessages || apiCallInProgressRef.current) return;

    try {
      dispatch(setLoadingMessages(true));
      console.log('📜 Loading RECENT messages');

      const response = await chatAPI.getMessageHistory({
        reciverId: userId,
        receiverProfileType: userProfileType,
        pageNumber: 1,
        pageSize: PAGE_SIZE,
      });

      if (response.success && response.messages) {
        let recentMessages = response.messages;
        
        // Log debug info
        console.log('🔍 [DEBUG] Raw messages from API:');
        recentMessages.forEach((msg, index) => {
          console.log(`   Message ${index}: ID=${msg.messageId}, isRead=${msg.isRead}`);
        });
        
        // Sort messages
        recentMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Update Redux store
        dispatch(setMessages({ userId, messages: recentMessages }));

        const hasNextPage = recentMessages.length === PAGE_SIZE;
        dispatch(setPagination({
          userId,
          pageNumber: 1,
          pageSize: PAGE_SIZE,
          hasNextPage,
          totalCount: response.totalCount || recentMessages.length
        }));

        initialLoadDoneRef.current = true;
        messageCountRef.current = recentMessages.length;

        console.log(`✅ Loaded ${recentMessages.length} recent messages, hasMore: ${hasNextPage}`);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 200);
      }
    } catch (error: any) {
      console.error('❌ Error loading messages:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load messages',
      });
    } finally {
      dispatch(setLoadingMessages(false));
    }
  }, [userId, userProfileType, dispatch]);


  const loadOlderMessages = async () => {
    if (loadingMoreRef.current || !hasMore || isLoadingMessages) {
      return;
    }

    try {
      loadingMoreRef.current = true;
      setLoadingMore(true);

      console.log('📜 Loading OLDER messages (on-demand), page:', pageNumber + 1);

      const response = await chatAPI.getMessageHistory({
        reciverId: userId,
        receiverProfileType: userProfileType,
        pageNumber: pageNumber + 1,
        pageSize: PAGE_SIZE,
      });

      if (response.success && response.messages) {
        let olderMessages = response.messages;
        olderMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        dispatch(prependMessages({ userId, messages: olderMessages }));

        const hasNextPage = olderMessages.length === PAGE_SIZE;
        dispatch(setPagination({
          userId,
          pageNumber: pageNumber + 1,
          pageSize: PAGE_SIZE,
          hasNextPage,
          totalCount: pagination?.totalCount || messages.length + olderMessages.length
        }));

        console.log(`✅ Loaded ${olderMessages.length} older messages, hasMore: ${hasNextPage}`);
      }
    } catch (error: any) {
      console.error('❌ Error loading older messages:', error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  // ==================== PROFILE FETCHING ====================
const getCurrentUserId = useCallback(async (): Promise<string | null> => {
  try {
    if (userInfo?.id) {
      setCurrentUserId(userInfo.id);
      
      // Fetch profile image in parallel or after setting user ID
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
    console.error('❌ [USER ID] No userInfo available');
    return null;
  } catch (error) {
    console.error('❌ [USER ID] Error getting userId:', error);
    return null;
  }
}, [userInfo]);

const fetchInvestorProfile = useCallback(async () => {
    try {
      // Only fetch if we don't have proper initial data
      if (!initialUserName || !initialProfileImage) {
        const response = await investorProfAPI.getInvestorProfileById(userId);
        if (response.success && response.investorProfile) {
          setInvestorName(response.investorProfile.name);
          setInvestorImage(response.investorProfile.profileImage);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching investor profile:', error);
    }
  }, [userId, initialUserName, initialProfileImage]);


// ==================== FIXED MARK AS READ WITH API CALL ====================
// FIXED: handleMarkAsRead with proper message ID extraction
const handleMarkAsRead = useCallback(async () => {
  const effectiveCurrentUserId = currentUserId || userInfo?.id;
  
  if (!effectiveCurrentUserId) {
    console.log('⏹️ [MARK READ] Skipping - no currentUserId available');
    return;
  }
  
  console.log(`📖 [MARK READ] Starting for user: ${userId}, currentUserId: ${effectiveCurrentUserId}`);
  console.log(`📖 [MARK READ] Total messages in state: ${messages.length}`);
  
  try {
    let messageIds: number[] = [];
    
    // Only try to find unread messages if we have messages loaded
    if (messages.length > 0) {
      const unreadMessages = messages.filter(msg => {
        const isUnread = msg.isRead === false;
        const isFromOtherUser = msg.senderId === userId;
        const isToCurrentUser = msg.receiverId === effectiveCurrentUserId;
        
        const shouldMark = isUnread && isFromOtherUser && isToCurrentUser;
        
        if (shouldMark) {
          // FIX: Use messageId (from API) or id (from SignalR/optimistic)
          const messageId = msg.messageId || msg.id;
          console.log(`📖 [MARK READ] Unread message found: ${messageId} - "${msg.content}"`);
        }
        
        return shouldMark;
      });
      
      console.log(`📖 [MARK READ] Found ${unreadMessages.length} unread messages from user: ${userId}`);
      
      // FIX: Properly extract message IDs
      messageIds = unreadMessages
        .map(msg => msg.messageId || msg.id) // Use messageId first, fallback to id
        .filter(id => id !== undefined && id !== null && id > 0 && id < 1000000000000) as number[]; // Filter out temporary IDs
      
      console.log(`📖 [MARK READ] Extracted message IDs:`, messageIds);
    }
    
    // Only call API if we have actual message IDs
    if (messageIds.length > 0) {
      console.log(`📤 [MARK READ] Calling API to mark ${messageIds.length} messages as read`);
      
      try {
        await chatAPI.markAsRead(messageIds); // Send raw array
        
        console.log(`✅ [MARK READ] API call successful - messages marked as read on server`);
        
        // Update Redux state after successful API call
        dispatch(markMessagesAsRead({ userId, messageIds }));
        
      } catch (apiError: any) {
        console.error('❌ [MARK READ] API Error:', apiError.message);
        // Even if API fails, update UI for better UX
        dispatch(markMessagesAsRead({ userId, messageIds }));
      }
    } else {
      console.log('ℹ️ [MARK READ] No unread messages found to mark via API');
      // Still update Redux UI state for consistency
      dispatch(markChatAsRead({ userId }));
    }
    
    console.log('✅ [MARK READ] Completed successfully');
    
  } catch (error) {
    console.error('❌ [MARK READ] Error:', error);
    // Still mark as read in Redux for UI consistency
    dispatch(markChatAsRead({ userId }));
  }
}, [dispatch, userId, messages, currentUserId, userInfo?.id]);
// ==================== SIMPLE MARK AS READ TRIGGER ====================
useEffect(() => {
  // Trigger mark as read when all conditions are met
  if (currentUserId && messages.length > 0 && initialLoadDoneRef.current && !markAsReadCalledRef.current) {
    console.log('🎯 [EFFECT] Conditions met, triggering mark-as-read');
    markAsReadCalledRef.current = true;
    handleMarkAsRead();
  }
}, [currentUserId, messages.length, handleMarkAsRead]);
  // ==================== SEND MESSAGE ====================
// ==================== OPTIMIZED SEND MESSAGE ====================
  const handleSendMessage = useCallback(async (): Promise<void> => {
    if (inputText.trim() === '' || sending || !currentUserId) return;

    const messageContent = inputText.trim();
    
    // Create optimistic message
    const tempId = Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      messageId: tempId,
      senderId: currentUserId,
      senderName: userInfo?.name || 'You',
      senderProfileImage: currentUserImage,
      receiverId: userId,
      receiverName: investorName,
      receiverProfileImage: investorImage,
      content: messageContent,
      timestamp: new Date().toISOString(),
      isRead: true,
      replyedMessageId: replyingTo?.id || 0,
      replyedMessage: replyingTo || undefined,
    };

    // Update UI immediately
    dispatch(addMessage({ userId, message: optimisticMessage }));
    setInputText('');
    setReplyingTo(null);
    setSending(true);

    // Auto-scroll
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const response = await chatAPI.sendMessage({
        receiverId: userId,
        content: messageContent,
        ...(replyingTo?.id && { replyedMessageId: replyingTo.id }),
      });

      if (response && (response.success !== false || response.messageId)) {
        console.log('✅ Message sent successfully');
      } else {
        throw new Error(response?.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      Toast.show({
        type: 'error',
        text1: 'Send Failed',
        text2: error.message || 'Failed to send message',
      });
    } finally {
      setSending(false);
    }
  }, [inputText, sending, currentUserId, userInfo, currentUserImage, userId, investorName, investorImage, replyingTo, dispatch]);


  // ==================== MEDIA HANDLING ====================
  const handleSendImage = async () => {
    if (!currentUserId || imageUploading) return;
    
    try {
      const mediaResult = await pickAndUploadChatMedia(currentUserId, 'chatMedia');
      
      if (mediaResult && mediaResult.type === 'image') {
        const mediaContent = `[IMAGE]${mediaResult.url}`;

        await chatAPI.sendMessage({
          receiverId: userId,
          content: mediaContent,
        });

        Toast.show({ type: 'success', text1: 'Sent', text2: 'Image sent successfully' });
      }
    } catch (error) {
      console.error('❌ Error sending image:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send image' });
    }
  };

  const handleSendDocument = async () => {
    if (!currentUserId || docUploading) return;
    
    try {
      const documentUrl = await pickAndUploadChatDocument(currentUserId, 'chatDocuments');
      
      if (documentUrl) {
        const documentContent = `[DOCUMENT]${documentUrl}`;

        await chatAPI.sendMessage({
          receiverId: userId,
          content: documentContent,
        });

        Toast.show({ type: 'success', text1: 'Sent', text2: 'Document sent successfully' });
      }
    } catch (error) {
      console.error('❌ Error sending document:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send document' });
    }
  };

  // ==================== SCROLL HANDLERS ====================
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    if (contentOffset.y < 100 && hasMore && !loadingMore) {
      console.log('📜 User scrolled to top - loading older messages');
      loadOlderMessages();
    }
    
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    
    if (!isAtBottom) {
      isManuallyScrollingRef.current = true;
    } else {
      isManuallyScrollingRef.current = false;
    }
  };

  // ==================== MESSAGE MENU ====================
  const showMessageMenu = useCallback((message: Message, event: any) => {
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
              await chatAPI.deleteMessage(selectedMessage.id);
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

  const shouldShowDateHeader = (currentMsg: Message, prevMsg: Message | null) => {
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
  const renderMessage = React.useCallback(({ item, index }: { item: Message; index: number }) => {
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
          message={item}
          isOwnMessage={isOwnMessage}
          investorName={investorName}
          investorImage={investorImage}
          currentUserImage={currentUserImage}
          onPressMenu={showMessageMenu}
          formatTime={formatTime}
        />
      </View>
    );
  }, [currentUserId, investorName, investorImage, currentUserImage, messages, showMessageMenu, formatDateHeader]);

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
        userName={investorName}
        userImage={investorImage}
        status="Real-time active"
        connectionStatus={signalRConnected}
      />

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => `message-${item.messageId || item.id}-${item.timestamp}`}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        inverted={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Start the conversation!</Text>
          </View>
        }
        ListHeaderComponent={
          loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#FF4500" />
              <Text style={styles.loadingText}>Loading older messages...</Text>
            </View>
          ) : null
        }
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
          placeholder="Write a message"
          showAttachments={true}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

// Styles remain the same as your original, just keeping the essential ones
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#666',
//     fontWeight: '500',
//   },
//   messagesList: {
//     paddingVertical: 16,
//     paddingHorizontal: 8,
//     paddingBottom: 80,
//   },
//   dateHeaderContainer: {
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   dateHeaderText: {
//     fontSize: 12,
//     color: '#999',
//     backgroundColor: '#f0f0f0',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//     fontWeight: '500',
//   },
//   keyboardAvoidingView: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingTop: 100,
//     paddingHorizontal: 40,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#666',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   loadMoreContainer: {
//     padding: 10,
//     alignItems: 'center',
//   },
// });



// Your existing styles remain exactly the same...
const styles = StyleSheet.create({
  connectionStatus: {
    fontSize: 11,
    color: '#22c55e',
    marginTop: 2,
  },
  loadMoreContainer: {
    padding: 10,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  headerUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 8,
    marginTop: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContent: {
    maxWidth: '75%',
    flex: 1,
  },
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  otherMessageContent: {
    alignItems: 'flex-start',
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  messageBubble: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
    maxWidth: '95%',
    flexShrink: 1,
  },
  ownBubble: {
    backgroundColor: '#FF4500',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  mediaBubble: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 14,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  imageOverlayIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minWidth: 150,
  },
  documentIcon: {
    width: 32,
    height: 32,
    tintColor: '#666',
    marginRight: 12,
  },
  documentTextContainer: {
    flex: 1,
  },
  documentText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  ownDocumentText: {
    color: '#333',
  },
  otherDocumentText: {
    color: '#333',
  },
  documentSubtext: {
    fontSize: 12,
    opacity: 0.7,
  },
  ownDocumentSubtext: {
    color: '#666',
  },
  otherDocumentSubtext: {
    color: '#666',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#000',
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  menuButtonRight: {
    marginLeft: 4,
  },
  menuButtonLeft: {
    marginRight: 4,
  },
  menuButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  replyPreviewContainer: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    maxWidth: '95%',
  },
  ownReplyPreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderLeftColor: '#FF4500',
    alignSelf: 'flex-end',
  },
  otherReplyPreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderLeftColor:'#FF4500',
    alignSelf: 'flex-start',
  },
  replyPreviewLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 13,
    color: '#666',
    opacity: 0.8,
  },
  ownReplyPreviewText: {
    fontSize: 13,
    color: '#666',
    opacity: 0.8,
  },
  otherReplyPreviewText: {
    fontSize: 13,
    color: '#666',
    opacity: 0.8,
  },
  timeContainer: {
    marginHorizontal: 4,
    marginTop: 2,
  },
  ownTimeContainer: {
    alignItems: 'flex-end',
  },
  otherTimeContainer: {
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  ownTimeText: {
    color: '#999',
  },
  otherTimeText: {
    color: '#999',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 150,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 12,
  },
  menuItemTextDanger: {
    color: '#FF3B30',
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: '#FF3B30',
  },
  menuIcon: {
    width: 20,
    height: 20,
    tintColor: '#333',
  },
  replyPreview: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 14,
    color: '#666',
  },
  replyPreviewClose: {
    padding: 8,
  },
  replyPreviewCloseText: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
     backgroundColor: '#f8f9fa', // Add background color
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Add safe area padding
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  attachmentButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentButton: {
    padding: 6,
    marginRight: 4,
  },
  attachmentIcon: {
    width: 20,
    height: 20,
    tintColor: "#054274ff"
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    marginHorizontal: 8,
    paddingVertical: 8,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#FF4500',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChatConversationScreen;