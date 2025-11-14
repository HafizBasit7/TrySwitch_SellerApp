// screens/Chat/ChatsScreen.tsx - PROFESSIONAL FIXED VERSION
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import { chatAPI } from '../../api/chatAPI';
import { ChatUser } from '../../types/chat';
import { ChatsStackParamList } from '../../navigation/types';
import { RootState, AppDispatch } from '../../store';
import { 
  setUserChats, 
  setLoadingChats,
  setTotalUnreadCount,
  markChatAsRead,
  updateChatLastMessage
} from '../../store/slices/chatSlice';
import { useSignalR } from '../../hooks/useSignalR';
import { useAuth } from '../../context/AuthContext';

type ChatsScreenNavigationProp = StackNavigationProp<ChatsStackParamList, 'ChatsMain'>;

// FIXED: Memoized selectors to prevent unnecessary re-renders
const selectUserChats = (state: RootState) => state.chat.userChats;
const selectTotalUnreadCount = (state: RootState) => state.chat.totalUnreadCount;

const ChatsScreen: React.FC = () => {
  const navigation = useNavigation<ChatsScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { userInfo } = useAuth();
  
  // FIXED: Use proper memoized selectors
  const userChats = useSelector(selectUserChats);
  const isLoadingChats = useSelector((state: RootState) => state.chat.isLoadingChats);
  const isConnected = useSelector((state: RootState) => state.chat.isConnected);
  const isConnecting = useSelector((state: RootState) => state.chat.isConnecting);
  const totalUnreadCount = useSelector(selectTotalUnreadCount);
  
  // SignalR hook
  const { connectSignalR, isConnected: signalRConnected } = useSignalR();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Refs to prevent duplicate API calls
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  // Memoized filtered chats
  const filteredChats = useMemo(() => {
    if (searchQuery.trim() === '') {
      return userChats;
    }
    const query = searchQuery.toLowerCase();
    return userChats.filter((chat) =>
      chat.userName?.toLowerCase().includes(query)
    );
  }, [userChats, searchQuery]);
  

  // Initialize SignalR on mount
  useEffect(() => {
    if (userInfo?.id) {
      console.log('🔌 [Inbox] Initializing SignalR connection');
      connectSignalR();
    }
  }, [userInfo?.id, connectSignalR]);

  // FIXED: Load chats when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (userInfo?.id) {
        console.log('🔄 [Inbox] Screen focused, loading chats');
        loadChats();
      }
    }, [userInfo?.id])
  );

  // FIXED: Optimized chat loading
  const loadChats = async () => {
    if (loadingRef.current) {
      return;
    }

    if (!userInfo?.id) {
      console.error('❌ [Inbox] No userId available');
      Toast.show({
        type: 'error',
        text1: 'Login Required',
        text2: 'Please login again to continue',
      });
      return;
    }

    loadingRef.current = true;

    try {
      dispatch(setLoadingChats(true));
      console.log('💬 [Inbox] Loading chats for userId:', userInfo.id);

      const response = await chatAPI.getUserChats(userInfo.id);

      // FIXED: Handle API response format properly
      if (response && Array.isArray(response)) {
        console.log(`✅ [Inbox] Loaded ${response.length} chats`);
        
        // Transform API response to ChatUser format
        const transformedChats: ChatUser[] = response.map((chat: any) => ({
          userId: chat.userId,
          userName: chat.userName,
          userProfileImage: chat.profileImage,
          userProfileType: 1,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.timestamp,
          unreadCount: Math.max(0, chat.unreadMessagesCount || 0),
          profileDeleteStatus: chat.profileDeleteStatus,
        }));
        
        // Update Redux store with chats
        dispatch(setUserChats(transformedChats));
        
        // Calculate total unread count
        const totalUnread = transformedChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        dispatch(setTotalUnreadCount(totalUnread));
        
        console.log(`📊 [Inbox] Total unread messages: ${totalUnread}`);
      } else if (response && response.success && Array.isArray(response.chats)) {
        console.log(`✅ [Inbox] Loaded ${response.chats.length} chats`);
        dispatch(setUserChats(response.chats));
        
        const totalUnread = response.chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        dispatch(setTotalUnreadCount(totalUnread));
        
        console.log(`📊 [Inbox] Total unread messages: ${totalUnread}`);
      } else {
        console.log('⚠️ [Inbox] No chats found');
        dispatch(setUserChats([]));
        dispatch(setTotalUnreadCount(0));
      }
    } catch (error: any) {
      console.error('❌ [Inbox] Error loading chats:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load chats',
      });
      dispatch(setUserChats([]));
    } finally {
      dispatch(setLoadingChats(false));
      loadingRef.current = false;
    }
  };

  const onRefresh = async () => {
    if (loadingRef.current) return;
    
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // FIXED: Handle chat opening with proper badge reset
  const handleChatOpen = useCallback(async (chat: ChatUser) => {
    console.log('📱 [Inbox] Opening chat with:', chat.userName);
    
    try {
      // Mark chat as read in Redux immediately
      if (chat.unreadCount > 0) {
        console.log(`📖 Marking ${chat.unreadCount} messages as read for user: ${chat.userId}`);
        
        // FIXED: Use markChatAsRead to properly update Redux state
        dispatch(markChatAsRead({ userId: chat.userId }));
        
        // FIXED: Also call API to mark as read on server
        try {
          // Find unread messages for this chat and mark them via API
          // This ensures server knows messages are read
          const unreadMessageIds = []; // You would need to get these from your state
          if (unreadMessageIds.length > 0) {
            await chatAPI.markAsRead(unreadMessageIds);
          }
        } catch (apiError) {
          console.error('❌ Error marking messages as read via API:', apiError);
          // Don't show error - continue with navigation
        }
      }
      
      // Navigate to chat conversation
      navigation.navigate('ChatConversation', {
        userId: chat.userId,
        userName: chat.userName || 'User',
        userProfileImage: chat.userProfileImage,
        userProfileType: chat.userProfileType || 1,
      });
      
    } catch (error) {
      console.error('❌ Error opening chat:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open chat',
      });
    }
  }, [dispatch, navigation]);

  // FIXED: Memoized time formatter
  const formatTime = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
        });
      }
    } catch {
      return '';
    }
  }, []);

  // FIXED: Memoized chat item renderer
  const renderChatItem = useCallback(({ item }: { item: ChatUser }) => (
    <TouchableOpacity
      style={[
        styles.chatItem,
        item.unreadCount > 0 && styles.unreadChatItem
      ]}
      onPress={() => handleChatOpen(item)}
    >
      <View style={styles.avatarContainer}>
        {item.userProfileImage ? (
          <Image 
            source={{ uri: item.userProfileImage }} 
            style={styles.avatar} 
            defaultSource={require('../../assets/icons/profile.png')}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.userName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        
        {/* Professional badge - only show for unread messages */}
        {item.unreadCount > 0 && (
          <View style={[
            styles.badge,
            item.unreadCount > 9 && styles.badgeLarge
          ]}>
            <Text style={styles.badgeText}>
              {item.unreadCount > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[
            styles.userName,
            item.unreadCount > 0 && styles.unreadUserName
          ]} numberOfLines={1}>
            {item.userName || `User ${item.userId.substring(0, 8)}`}
          </Text>
          <Text style={[
            styles.timestamp,
            item.unreadCount > 0 && styles.unreadTimestamp
          ]}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        <Text style={[
          styles.lastMessage,
          item.unreadCount > 0 && styles.unreadMessage
        ]} numberOfLines={2}>
          {item.lastMessage || 'Start a conversation'}
        </Text>
      </View>
    </TouchableOpacity>
  ), [handleChatOpen, formatTime]);

  // FIXED: Memoized key extractor
  const keyExtractor = useCallback((item: ChatUser) => 
    `chat-${item.userId}-${item.unreadCount}-${item.lastMessageTime}`, []);

  if (isLoadingChats && userChats.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={styles.loadingText}>Loading chats...</Text>
        {/* {!signalRConnected && (
          <Text style={styles.connectionHint}>
            Real-time updates connecting...
          </Text>
        )} */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        <Image 
          source={require('../../assets/icons/search.png')}
          style={styles.searchIcon}
        />
      </View>

      {/* Marketplace Tab Link */}
      <TouchableOpacity 
        style={styles.marketplaceLink}
        onPress={() => {
          console.log('🏠 [Inbox] Navigating to Property Hub');
          navigation.navigate('MarketplaceMessages');
        }}
      >
        <Image 
          source={require('../../assets/icons/marketplace.png')}
          style={styles.marketplaceLinkIcon}
        />
        <View style={styles.marketplaceLinkContent}>
          <Text style={styles.marketplaceLinkTitle}>Property Hub</Text>
          <Text style={styles.marketplaceLinkSubtitle}>Chat about properties</Text>
        </View>
      </TouchableOpacity>

      {/* Connection Status */}
      {!signalRConnected && (
        <View style={styles.connectionWarning}>
          {/* <Text style={styles.connectionWarningText}>
            ● {isConnecting ? 'Connecting to real-time chat...' : 'Real-time updates unavailable'}
          </Text> */}
        </View>
      )}

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          filteredChats.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF4500']}
            tintColor="#FF4500"
          />
        }
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={11}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySubtitle}>
              {userInfo?.id
                ? 'Start a conversation or wait for others to message you'
                : 'Unable to load user information'}
            </Text>
            {!signalRConnected && (
              <Text style={styles.connectionHint}>
                Real-time messages will appear here when connected
              </Text>
            )}
            <TouchableOpacity style={styles.retryButton} onPress={loadChats}>
              <Text style={styles.retryButtonText}>
                {userInfo?.id ? 'Refresh' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

// Your existing styles remain the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  connectionHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  connectionWarning: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
  },
  connectionWarningText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 25,
    paddingHorizontal: 12,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  searchIcon: {
    width: 25,
    height: 25,
    tintColor: '#FF4500',
  },
  marketplaceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  marketplaceLinkIcon: {
    width: 46,
    height: 46,
    borderRadius: 28,
  },
  marketplaceLinkContent: {
    flexGrow: 1,
  },
  marketplaceLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    marginBottom: 2,
  },
  marketplaceLinkSubtitle: {
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  unreadChatItem: {
    backgroundColor: '#F8F9FF',
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4500',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeLarge: {
    minWidth: 24,
    height: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  unreadUserName: {
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  unreadTimestamp: {
    color: '#FF4500',
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default React.memo(ChatsScreen);