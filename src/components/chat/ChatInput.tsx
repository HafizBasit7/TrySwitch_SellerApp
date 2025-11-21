// components/chat/ChatInput.tsx
import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

interface ChatInputProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  replyingTo?: any | null;
  onCancelReply?: () => void;
  onSendImage?: () => void;
  onSendDocument?: () => void;
  sending?: boolean;
  imageUploading?: boolean;
  docUploading?: boolean;
  placeholder?: string;
  showAttachments?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  onInputChange,
  onSendMessage,
  replyingTo,
  onCancelReply,
  onSendImage,
  onSendDocument,
  sending = false,
  imageUploading = false,
  docUploading = false,
  placeholder = "Write a message",
  showAttachments = true,
}) => {
  return (
    <View style={styles.container}>
      {replyingTo && onCancelReply && (
        <View style={styles.replyPreview}>
          <View style={styles.replyPreviewContent}>
            <Text style={styles.replyPreviewLabel}>Replying to:</Text>
            <Text style={styles.replyPreviewText} numberOfLines={1}>
              {replyingTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.replyPreviewClose}>
            <Text style={styles.replyPreviewCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        {showAttachments && (
          <View style={styles.attachmentButtonsContainer}>
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={onSendImage}
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
              onPress={onSendDocument}
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
        )}

        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={onInputChange}
          multiline
          maxLength={1000}
          returnKeyType="send"
          editable={!sending}
          onSubmitEditing={onSendMessage}
        />
        
        {/* <TouchableOpacity
          style={[
            styles.sendButton,
            (inputText.trim() === '' || sending) && styles.sendButtonDisabled
          ]}
          onPress={onSendMessage}
          disabled={inputText.trim() === '' || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </TouchableOpacity> */}
        <TouchableOpacity
  style={styles.sendButton}
  onPress={onSendMessage}
>
  {sending ? (
    <ActivityIndicator size="small" color="#fff" />
  ) : (
    <Text style={styles.sendIcon}>➤</Text>
  )}
</TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    // FIXED: Add bottom padding to account for tab bar
    // paddingBottom: Platform.OS === 'ios' ? 15 : 5, // Extra padding for bottom tab bar
  },
  replyPreview: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff', // Changed to white for better visibility
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Enhanced shadow
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8, // Increased elevation
    // marginBottom: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});