// components/chat/MessageBubble.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Message } from '../../types/chat';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  investorName: string;
  investorImage?: string;
  currentUserImage?: string;
  onPressMenu: (message: Message, event: any) => void;
  formatTime: (timestamp: string) => string;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  investorName,
  investorImage,
  currentUserImage,
  onPressMenu,
  formatTime,
  showAvatar = true,
}) => {
  const isImage = message.content.startsWith('https://tryswitch.s3.us-east-2.amazonaws.com/chat/Images/');
  const isDocument = message.content.startsWith('[DOCUMENT]');
  const mediaUrl = isImage || isDocument ? 
    message.content.replace('[IMAGE]', '').replace('[DOCUMENT]', '') : null;

  return (
    <View style={[
      styles.messageRow,
      isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow,
    ]}>
      {!isOwnMessage && showAvatar && (
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
        {message.replyedMessage && (
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
              {message.replyedMessage?.content || ''}
            </Text>
          </View>
        )}
        
        <View style={styles.messageBubbleRow}>
          {isOwnMessage && (
            <TouchableOpacity
              style={[styles.menuButton, styles.menuButtonLeft]}
              onPress={(event) => onPressMenu(message, event)}
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
                {message.replyedMessage ? message.content : 
                 message.content.startsWith('Replying to:') ? 
                   message.content.split('\n').slice(1).join('\n') : 
                   message.content
                }
              </Text>
            )}
          </View>

          {!isOwnMessage && (
            <TouchableOpacity
              style={[styles.menuButton, styles.menuButtonRight]}
              onPress={(event) => onPressMenu(message, event)}
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
            {formatTime(message.timestamp)}
            {!message.isRead && isOwnMessage && ' ○'}
            {message.isRead && isOwnMessage && ' ✓'}
          </Text>
        </View>
      </View>

      {isOwnMessage && showAvatar && (
        <View style={styles.avatarContainer}>
          {currentUserImage ? (
            <Image source={{ uri: currentUserImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {'Y'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
});