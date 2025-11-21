// components/chat/ChatHeader.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';

interface ChatHeaderProps {
  userName: string;
  userImage?: string;
  status?: string;
  connectionStatus?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  userName,
  userImage,
  status,
  connectionStatus = true,
  showBackButton = false,
  onBackPress,
}) => {
  return (
    <View style={styles.customHeader}>
      <View style={styles.headerUserInfo}>
        {userImage ? (
          <Image source={{ uri: userImage }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {userName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View>
          <Text style={styles.headerUserName}>{userName}</Text>
          {status && (
            <Text style={[styles.connectionStatus, { 
              color: connectionStatus ? 'green' : 'orange' 
            }]}>
              ● {connectionStatus ? 'Online' : 'Offline'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  connectionStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});