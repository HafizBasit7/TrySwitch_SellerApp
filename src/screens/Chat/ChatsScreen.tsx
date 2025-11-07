// screens/Chat/ChatsScreen.tsx - UPDATED WITH BETTER DEBUGGING
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
        console.log('🔄 Screen focused, loading chats for userId:', userId);
        loadChats();
      }
    }, [userId])
  );


  // screens/Chat/ChatsScreen.tsx - Add this function
const debugAsyncStorage = async () => {
  try {
    console.log('🔍 Debugging AsyncStorage...');
    
    // Get all keys from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 All AsyncStorage keys:', keys);
    
    // Get all items
    const items = await AsyncStorage.multiGet(keys);
    console.log('📦 All AsyncStorage items:');
    items.forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // Try different possible keys for userId
    const possibleKeys = ['userId', 'userID', 'user_id', 'id', 'user.id', 'UserID'];
    for (const key of possibleKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        console.log(`✅ Found userId with key: "${key}" = ${value}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging AsyncStorage:', error);
  }
};

  // screens/Chat/ChatsScreen.tsx - Update getUserId function
const getUserId = async () => {
  try {
    console.log('🔍 Looking for userId in AsyncStorage...');
    
    // First, try to get from userInfo object
    const userInfoString = await AsyncStorage.getItem('userInfo');
    console.log('📦 userInfo from storage:', userInfoString);
    
    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        console.log('🔍 Parsed userInfo:', userInfo);
        
        if (userInfo.id) {
          console.log(`✅ Found userId in userInfo: ${userInfo.id}`);
          setUserId(userInfo.id);
          return;
        } else {
          console.log('❌ userInfo exists but no id field:', Object.keys(userInfo));
        }
      } catch (parseError) {
        console.error('❌ Error parsing userInfo:', parseError);
      }
    }
    
    // Fallback: try direct keys
    const possibleKeys = ['userId', 'userID', 'user_id', 'id', 'user.id', 'UserID'];
    for (const key of possibleKeys) {
      const storedValue = await AsyncStorage.getItem(key);
      console.log(`   Checking key "${key}":`, storedValue);
      
      if (storedValue) {
        console.log(`✅ Found userId with key: "${key}" = ${storedValue}`);
        setUserId(storedValue);
        return;
      }
    }
    
    console.log('❌ No userId found anywhere');
    Toast.show({
      type: 'error',
      text1: 'Login Required',
      text2: 'Please login again to continue',
    });
    
  } catch (error) {
    console.error('❌ Error getting userId:', error);
  }
};
// screens/Chat/ChatsScreen.tsx - Update loadChats function
const loadChats = async () => {
  try {
    setLoading(true);
    console.log('💬 API Call: Getting user chats for:', userId);
    
    const response = await chatAPI.getUserChats(userId);
    console.log('📥 PROCESSED API RESPONSE:', JSON.stringify(response, null, 2));
    
    if (response.success) {
      if (response.chats && Array.isArray(response.chats)) {
        console.log(`✅ SUCCESS: Received ${response.chats.length} chats`);
        
        // Log each chat for debugging
        response.chats.forEach((chat, index) => {
          console.log(`💬 Chat ${index + 1}:`, {
            userId: chat.userId,
            userName: chat.userName,
            profileImage: chat.userProfileImage,
            lastMessage: chat.lastMessage,
            lastMessageTime: chat.lastMessageTime,
            unreadCount: chat.unreadCount,
            profileType: chat.userProfileType
          });
        });
        
        setChats(response.chats);
        setFilteredChats(response.chats);
      } else {
        console.log('⚠️ No chats array found in processed response');
        setChats([]);
        setFilteredChats([]);
      }
    } else {
      console.log('❌ API returned success: false');
      console.log('📝 API message:', response.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: response.message || 'Failed to load chats',
      });
      setChats([]);
      setFilteredChats([]);
    }
  } catch (error: any) {
    console.error('❌ NETWORK ERROR loading chats:', error);
    Toast.show({
      type: 'error',
      text1: 'Network Error',
      text2: error.message || 'Failed to connect to server',
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
      const filtered = chats.filter(chat =>
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
    } catch (error) {
      return 'Unknown';
    }
  };

 // screens/Chat/ChatsScreen.tsx - Update renderChatItem
const renderChatItem = ({ item }: { item: ChatUser }) => (
  <TouchableOpacity
    style={styles.chatItem}
    onPress={() => {
      console.log('📱 Navigating to conversation with:', {
        userId: item.userId,
        userName: item.userName,
        userProfileImage: item.userProfileImage,
        userProfileType: item.userProfileType
      });
      navigation.navigate('ChatConversation', {
        userId: item.userId,
        userName: item.userName || 'User',
        userProfileImage: item.userProfileImage,
        userProfileType: item.userProfileType || 1, // Default to investor type
      });
    }}
  >
    <View style={styles.avatarContainer}>
      {item.userProfileImage ? (
        <Image
          source={{ uri: item.userProfileImage }}
          style={styles.avatar}
          onError={(e) => console.log('❌ Image load error:', e.nativeEvent.error)}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {item.userName?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
      )}
      {item.unreadCount > 0 && (
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarBadgeText}>
            {item.unreadCount > 9 ? '9+' : item.unreadCount}
          </Text>
        </View>
      )}
    </View>

    <View style={styles.chatContent}>
      <View style={styles.chatHeader}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.userName || `User ${item.userId.substring(0, 8)}`}
        </Text>
        <Text style={styles.timestamp}>
          {formatTime(item.lastMessageTime)}
        </Text>
      </View>
      <View style={styles.messageRow}>
        <Text
          style={styles.lastMessage}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.lastMessage || 'Start a conversation'}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={styles.loadingText}>Loading chats...</Text>
        <Text style={styles.debugText}>User ID: {userId}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Debug Header */}
      {/* <View style={styles.debugHeader}>
        <Text style={styles.debugText}>
          User: {userId ? userId.substring(0, 8) + '...' : 'Not found'} | 
          Chats: {chats.length}
        </Text>
      </View> */}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={item => item.userId}
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
              {userId ? 
                "Start a conversation or wait for others to message you" : 
                "Unable to load user information"
              }
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadChats}
            >
              <Text style={styles.retryButtonText}>
                {userId ? 'Refresh' : 'Retry'}
              </Text>
            </TouchableOpacity>
            
            {/* Debug Info */}
            <View style={styles.debugBox}>
              <Text style={styles.debugInfoText}>
                Debug Info:{'\n'}
                • User ID: {userId || 'Not found'}{'\n'}
                • API Called: Yes{'\n'}
                • Chats Found: {chats.length}
              </Text>
            </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  debugInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 25,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#FF4500',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
   debugHeader: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  // debugText: {
  //   fontSize: 12,
  //   color: '#6c757d',
  //   textAlign: 'center',
  // },
  avatarBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4500',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  debugBox: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  debugInfoText: {
    fontSize: 12,
    color: '#495057',
    // fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default ChatsScreen;