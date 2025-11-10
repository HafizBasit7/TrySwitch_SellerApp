// screens/Chat/ChatsScreen.tsx - INBOX CHATS (FINAL)
import React, { useState, useEffect, useCallback } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { chatAPI } from '../../api/chatAPI';
import { ChatUser } from '../../types/chat';
import { ChatsStackParamList } from '../../navigation/types';

type ChatsScreenNavigationProp = StackNavigationProp<ChatsStackParamList, 'ChatsMain'>;

const ChatsScreen: React.FC = () => {
  const navigation = useNavigation<ChatsScreenNavigationProp>();
  const [chats, setChats] = useState<ChatUser[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    getUserId();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        console.log('🔄 [Inbox] Screen focused, loading chats');
        loadChats();
      }
    }, [userId])
  );

  const getUserId = async () => {
    try {
      console.log('🔍 [Inbox] Looking for userId');

      const userInfoString = await AsyncStorage.getItem('userInfo');

      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo.id) {
          console.log('✅ [Inbox] Found userId');
          setUserId(userInfo.id);
          return;
        }
      }

      // Fallback: try other possible keys
      const possibleKeys = ['userId', 'userID', 'user_id', 'id'];
      for (const key of possibleKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          console.log('✅ [Inbox] Found userId from fallback');
          setUserId(value);
          return;
        }
      }

      console.error('❌ [Inbox] No userId found');
      Toast.show({
        type: 'error',
        text1: 'Login Required',
        text2: 'Please login again to continue',
      });
    } catch (error) {
      console.error('❌ [Inbox] Error getting userId:', error);
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      console.log('💬 [Inbox] Loading chats');

      const response = await chatAPI.getUserChats(userId);

      if (response.success && response.chats?.length) {
        console.log(`✅ [Inbox] Loaded ${response.chats.length} chats`);
        setChats(response.chats);
        setFilteredChats(response.chats);
      } else {
        console.log('⚠️ [Inbox] No chats found');
        setChats([]);
        setFilteredChats([]);
      }
    } catch (error: any) {
      console.error('❌ [Inbox] Error loading chats:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load chats',
      });
      setChats([]);
      setFilteredChats([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter((chat) =>
        chat.userName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  };

  const formatTime = (timestamp: string) => {
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
  };

  const renderChatItem = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => {
        console.log('📱 [Inbox] Opening chat with:', item.userName);
        navigation.navigate('ChatConversation', {
          userId: item.userId,
          userName: item.userName || 'User',
          userProfileImage: item.userProfileImage,
          userProfileType: item.userProfileType || 1,
        });
      }}
    >
      <View style={styles.avatarContainer}>
        {item.userProfileImage ? (
          <Image source={{ uri: item.userProfileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.userName?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
        )}
       
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.userName || `User ${item.userId.substring(0, 8)}`}
          </Text>
          <Text style={styles.timestamp}>{formatTime(item.lastMessageTime)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.lastMessage || 'Start a conversation'}
        </Text>

         {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={styles.loadingText}>Loading chats...</Text>
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
          // console.log('🏠 [Inbox] Navigating to Property Hub');
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

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF4500']}
            tintColor="#FF4500"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySubtitle}>
              {userId
                ? 'Start a conversation or wait for others to message you'
                : 'Unable to load user information'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadChats}>
              <Text style={styles.retryButtonText}>{userId ? 'Refresh' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 25,
    paddingHorizontal: 12,
    elevation: 5
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
    // paddingBottom: 16,
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
    // paddingBottom: 16,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatarContainer: {
    marginRight: 12,
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
    top: -10,
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
    // marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
    top: 10
  },
  lastMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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

export default ChatsScreen;