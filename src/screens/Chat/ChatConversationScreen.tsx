// screens/Chat/ChatConversationScreen.tsx - PROFESSIONAL OPTIMIZED VERSION
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
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

// Memoized selectors
const selectMessagesForUser = (state: RootState, userId: string) => 
  state.chat.messages[userId] || [];

const selectPaginationForUser = (state: RootState, userId: string) => 
  state.chat.pagination[userId];

const ChatConversationScreen: React.FC = () => {
  const route = useRoute<ChatConversationRouteProp>();
  const navigation = useNavigation<ChatConversationNavigationProp>();
  const dispatch = useDispatch();
  
  const { userId, userName: initialUserName, userProfileImage: initialProfileImage, userProfileType } = route.params;
  const { userInfo } = useAuth();

  // Redux state
  const messages = useSelector((state: RootState) => selectMessagesForUser(state, userId));
  const isLoadingMessages = useSelector((state: RootState) => state.chat.isLoadingMessages);
  const pagination = useSelector((state: RootState) => selectPaginationForUser(state, userId));
  const hasMore = pagination?.hasNextPage || false;
  const pageNumber = pagination?.pageNumber || 1;

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
  
  // Refs - CRITICAL FOR PROPER BEHAVIOR
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const loadingMoreRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const markAsReadCalledRef = useRef(false);
  const isManuallyScrollingRef = useRef(false);
  const messageCountRef = useRef(0);

  const PAGE_SIZE = 20;

  // Image picker
  const { 
    pickAndUploadMedia, 
    pickAndUploadDocument, 
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
      if (!markAsReadCalledRef.current) {
        handleMarkAsRead();
      }
    };
  }, [userId]);

  const initializeChat = async () => {
    await getCurrentUserId();
    await fetchInvestorProfile();
    
    // FIXED: Always load recent messages on mount
    await loadRecentMessages();
    
    // Mark as read after loading
    setTimeout(() => {
      handleMarkAsRead();
    }, 500);
  };

  // ==================== SMART SCROLL - ONLY FOR NEW MESSAGES ====================
  useEffect(() => {
    const messageCount = messages.length;
    const previousCount = messageCountRef.current;
    
    // FIXED: Only auto-scroll when:
    // 1. Initial load is complete AND
    // 2. We received exactly 1 new message (not bulk loading) AND
    // 3. User is not manually scrolling
    const receivedOneNewMessage = messageCount === previousCount + 1;
    
    if (initialLoadDoneRef.current && receivedOneNewMessage && !isManuallyScrollingRef.current) {
      console.log('📨 New message arrived - scrolling to bottom');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    
    messageCountRef.current = messageCount;
  }, [messages.length]);

  // ==================== LOAD RECENT MESSAGES ====================
  const loadRecentMessages = async () => {
    if (isLoadingMessages) return;

    try {
      dispatch(setLoadingMessages(true));
      console.log('📜 Loading RECENT messages (first page only)');

      const response = await chatAPI.getMessageHistory({
        reciverId: userId,
        receiverProfileType: userProfileType,
        pageNumber: 1,
        pageSize: PAGE_SIZE,
      });

      if (response.success && response.messages) {
        let recentMessages = response.messages;
        
        // Sort by timestamp (oldest to newest)
        recentMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Set messages in Redux
        dispatch(setMessages({ userId, messages: recentMessages }));

        const hasNextPage = recentMessages.length === PAGE_SIZE;
        
        dispatch(setPagination({
          userId,
          pageNumber: 1,
          pageSize: PAGE_SIZE,
          hasNextPage,
          totalCount: response.totalCount || recentMessages.length
        }));

        // Mark initial load as complete
        initialLoadDoneRef.current = true;
        messageCountRef.current = recentMessages.length;

        // FIXED: Scroll to bottom ONCE after initial load, then never again
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
          console.log('✅ Scrolled to latest message');
        }, 150);

        console.log(`✅ Loaded ${recentMessages.length} recent messages, hasMore: ${hasNextPage}`);
      }
    } catch (error: any) {
      console.error('❌ Error loading recent messages:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load messages',
      });
    } finally {
      dispatch(setLoadingMessages(false));
    }
  };

  // ==================== LOAD OLDER MESSAGES (ON DEMAND) ====================
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
        
        // Sort older messages
        olderMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Prepend to beginning
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
  const getCurrentUserId = async () => {
    try {
      if (userInfo?.id) {
        setCurrentUserId(userInfo.id);
        
        try {
          const profileResponse = await profileAPI.getSellerProfile();
          if (profileResponse?.sellerProfile?.userProfileImage) {
            setCurrentUserImage(profileResponse.sellerProfile.userProfileImage);
          }
        } catch (profileError) {
          console.error('❌ Error fetching profile image:', profileError);
        }
      }
    } catch (error) {
      console.error('❌ Error getting userId:', error);
    }
  };

  const fetchInvestorProfile = async () => {
    try {
      const response = await investorProfAPI.getInvestorProfileById(userId);
      if (response.success && response.investorProfile) {
        setInvestorName(response.investorProfile.name);
        setInvestorImage(response.investorProfile.profileImage);
      }
    } catch (error) {
      console.error('❌ Error fetching investor profile:', error);
    }
  };

  // ==================== MARK AS READ ====================
  const handleMarkAsRead = useCallback(async () => {
    if (markAsReadCalledRef.current) return;
    
    try {
      console.log(`📖 Marking chat as read for user: ${userId}`);
      
      // Mark in Redux immediately
      dispatch(markChatAsRead({ userId }));
      markAsReadCalledRef.current = true;
      
      // Find unread messages
      const unreadMessages = messages.filter(
        msg => !msg.isRead && msg.senderId !== userInfo?.id
      );
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.messageId).filter(id => id) as number[];
        
        if (messageIds.length > 0) {
          try {
            await chatAPI.markAsRead(messageIds);
            dispatch(markMessagesAsRead({ userId, messageIds }));
            console.log(`✅ Marked ${messageIds.length} messages as read`);
          } catch (apiError) {
            console.error('❌ Error marking messages as read via API:', apiError);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in handleMarkAsRead:', error);
    }
  }, [dispatch, userId, messages, userInfo?.id]);

  // ==================== SEND MESSAGE ====================
  const handleSendMessage = async (): Promise<void> => {
    if (inputText.trim() === '' || sending || !currentUserId) return;

    const messageContent = inputText.trim();
    
    // Optimistic message
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

    // Add optimistic message
    dispatch(addMessage({ userId, message: optimisticMessage }));
    
    setInputText('');
    setReplyingTo(null);
    setSending(true);

    // Scroll to bottom immediately
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
  };

  // ==================== MEDIA HANDLING ====================
  const handleSendImage = async () => {
    if (!currentUserId || imageUploading) return;
    
    try {
      const mediaResult = await pickAndUploadMedia(currentUserId, 'chatMedia');
      
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
      const documentUrl = await pickAndUploadDocument(currentUserId, 'chatDocuments');
      
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
    
    // FIXED: Load older messages when scrolling near top
    if (contentOffset.y < 100 && hasMore && !loadingMore) {
      console.log('📜 User scrolled to top - loading older messages');
      loadOlderMessages();
    }
    
    // Detect if user is manually scrolling (not at bottom)
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    
    if (!isAtBottom) {
      isManuallyScrollingRef.current = true;
    } else {
      // User scrolled back to bottom - reset manual scroll flag
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
      textInputRef.current?.focus();
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
    const isReply = item.replyedMessageId || item.content.startsWith('Replying to:');
    const isImage = item.content.startsWith('[IMAGE]');
    const isDocument = item.content.startsWith('[DOCUMENT]');
    const mediaUrl = isImage || isDocument ? 
      item.content.replace('[IMAGE]', '').replace('[DOCUMENT]', '') : null;

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <Text style={styles.dateHeaderText}>{formatDateHeader(item.timestamp)}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageRow,
          isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow,
        ]}>
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              {investorImage ? (
                <Image source={{ uri: investorImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {investorName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={[
            styles.messageContent,
            isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent,
          ]}>
            {isReply && (
              <View style={[
                styles.replyPreviewContainer,
                isOwnMessage ? styles.ownReplyPreview : styles.otherReplyPreview,
              ]}>
                <Text style={styles.replyPreviewLabel}>
                  Replying to {isOwnMessage ? investorName : 'you'}
                </Text>
                <Text style={[
                  styles.replyPreviewText,
                  isOwnMessage ? styles.ownReplyPreviewText : styles.otherReplyPreviewText,
                ]} numberOfLines={2}>
                  {item.replyedMessage?.content || ''}
                </Text>
              </View>
            )}
            
            <View style={styles.messageBubbleRow}>
              {isOwnMessage && (
                <TouchableOpacity
                  style={[styles.menuButton, styles.menuButtonLeft]}
                  onPress={(event) => showMessageMenu(item, event)}
                >
                  <Text style={styles.menuButtonText}>⋮</Text>
                </TouchableOpacity>
              )}

              <View style={[
                styles.messageBubble,
                isOwnMessage ? styles.ownBubble : styles.otherBubble,
                (isImage || isDocument) && styles.mediaBubble,
              ]}>
                {isImage ? (
                  <TouchableOpacity activeOpacity={0.7}>
                    <Image 
                      source={{ uri: mediaUrl }} 
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                      <Image 
                        source={require('../../assets/icons/media.png')}
                        style={styles.imageOverlayIcon}
                      />
                    </View>
                  </TouchableOpacity>
                ) : isDocument ? (
                  <TouchableOpacity style={styles.documentContainer} activeOpacity={0.7}>
                    <Image 
                      source={require('../../assets/icons/document.png')}
                      style={styles.documentIcon}
                    />
                    <View style={styles.documentTextContainer}>
                      <Text style={[
                        styles.documentText,
                        isOwnMessage ? styles.ownDocumentText : styles.otherDocumentText,
                      ]}>
                        Document
                      </Text>
                      <Text style={[
                        styles.documentSubtext,
                        isOwnMessage ? styles.ownDocumentSubtext : styles.otherDocumentSubtext,
                      ]}>
                        Tap to open
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={[
                    styles.messageText,
                    isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                  ]}>
                    {item.replyedMessage ? item.content : 
                     item.content.startsWith('Replying to:') ? 
                       item.content.split('\n').slice(1).join('\n') : 
                       item.content
                    }
                  </Text>
                )}
              </View>

              {!isOwnMessage && (
                <TouchableOpacity
                  style={[styles.menuButton, styles.menuButtonRight]}
                  onPress={(event) => showMessageMenu(item, event)}
                >
                  <Text style={styles.menuButtonText}>⋮</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={[
              styles.timeContainer,
              isOwnMessage ? styles.ownTimeContainer : styles.otherTimeContainer,
            ]}>
              <Text style={[
                styles.timeText,
                isOwnMessage ? styles.ownTimeText : styles.otherTimeText,
              ]}>
                {formatTime(item.timestamp)}
                {!item.isRead && isOwnMessage && ' ○'}
                {item.isRead && isOwnMessage && ' ✓'}
              </Text>
            </View>
          </View>

          {isOwnMessage && (
            <View style={styles.avatarContainer}>
              {currentUserImage ? (
                <Image source={{ uri: currentUserImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {userInfo?.name?.charAt(0)?.toUpperCase() || 'Y'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }, [currentUserId, investorName, investorImage, userInfo?.name, currentUserImage, messages, showMessageMenu, formatDateHeader, formatTime]);

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
      <View style={styles.customHeader}>
        <View style={styles.headerUserInfo}>
          {investorImage ? (
            <Image source={{ uri: investorImage }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {investorName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerUserName}>{investorName}</Text>
            {/* <Text style={[styles.connectionStatus, { 
              color: signalRConnected ? 'green' : 'orange' 
            }]}>
              ● {signalRConnected ? 'Real-time active' : 'Standard mode'}
            </Text> */}
          </View>
        </View>
      </View>

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

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { top: menuPosition.y, left: menuPosition.x }]}>
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuButtonContainer]}
              onPress={handleReply}
            >
              <Image
                source={require('../../assets/icons/reply.png')}
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>Reply</Text>
            </TouchableOpacity>
            
            {selectedMessage?.senderId === currentUserId && (
              <TouchableOpacity 
                style={[styles.menuItem, styles.menuItemDanger, styles.menuButtonContainer]}
                onPress={handleDeleteMessage}
              >
                <Image
                  source={require('../../assets/icons/delete.png')}
                  style={styles.deleteIcon}
                />
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Input Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardAvoidingView}
      >
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewContent}>
              <Text style={styles.replyPreviewLabel}>Replying to:</Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={cancelReply} style={styles.replyPreviewClose}>
              <Text style={styles.replyPreviewCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.attachmentButtonsContainer}>
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={handleSendImage}
              disabled={imageUploading}
            >
              {imageUploading ? (
                <ActivityIndicator size="small" color="#054274ff" />
              ) : (
                <Image 
                  source={require('../../assets/icons/media.png')}
                  style={styles.attachmentIcon}
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={handleSendDocument}
              disabled={docUploading}
            >
              {docUploading ? (
                <ActivityIndicator size="small" color="#054274ff" />
              ) : (
                <Image 
                  source={require('../../assets/icons/document.png')}
                  style={styles.attachmentIcon}
                />
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder="Write a message"
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            editable={!sending}
            onSubmitEditing={handleSendMessage}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (inputText.trim() === '' || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={inputText.trim() === '' || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

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
    paddingBottom: 80,
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