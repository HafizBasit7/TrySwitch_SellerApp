// components/chat/MessageBubble.tsx
import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MessageBubbleProps } from '../../types/chat';

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  onLongPress,
}) => {
  const handleLongPress = () => {
    onLongPress?.(message.id);
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
      ]}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      {/* Reply indicator if this is a reply */}
      {message.replyedMessage && (
        <View style={[
          styles.replyContainer,
          isOwnMessage ? styles.ownReplyContainer : styles.otherReplyContainer,
        ]}>
          <Text style={styles.replyLabel}>Replying to:</Text>
          <Text style={styles.replyContent} numberOfLines={1}>
            {message.replyedMessage.content}
          </Text>
        </View>
      )}

      {/* Message content */}
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble,
      ]}>
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
        ]}>
          {message.content}
        </Text>
      </View>

      {/* Message status and time */}
      <View style={[
        styles.footer,
        isOwnMessage ? styles.ownFooter : styles.otherFooter,
      ]}>
        <Text style={styles.timestamp}>
          {formatTime(message.timestamp)}
        </Text>
        
        {/* {isOwnMessage && (
          <View style={styles.statusContainer}>
            {message.isRead ? (
              <Image 
                source={require('../../assets/icons/read-receipt.png')}
                style={styles.statusIcon}
              />
            ) : (
              <Image 
                source={require('../../assets/icons/sent-receipt.png')}
                style={styles.statusIcon}
              />
            )}
          </View>
        )} */}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  replyContainer: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
    borderLeftWidth: 3,
  },
  ownReplyContainer: {
    backgroundColor: 'rgba(255, 69, 0, 0.1)',
    borderLeftColor: '#FF4500',
  },
  otherReplyContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderLeftColor: '#666',
  },
  replyLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  replyContent: {
    fontSize: 12,
    color: '#333',
    fontStyle: 'italic',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  ownBubble: {
    backgroundColor: '#FF4500',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ownFooter: {
    justifyContent: 'flex-end',
  },
  otherFooter: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginRight: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 12,
    height: 12,
    tintColor: '#999',
  },
});

export default memo(MessageBubble);