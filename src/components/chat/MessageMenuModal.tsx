// components/chat/MessageMenuModal.tsx
import React from 'react';
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { Message } from '../../types/chat';

interface MessageMenuModalProps {
  visible: boolean;
  position: { x: number; y: number };
  selectedMessage: Message | null;
  isOwnMessage: boolean;
  onClose: () => void;
  onReply: () => void;
  onDelete: () => void;
}

export const MessageMenuModal: React.FC<MessageMenuModalProps> = ({
  visible,
  position,
  selectedMessage,
  isOwnMessage,
  onClose,
  onReply,
  onDelete,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.menuContainer, { top: position.y, left: position.x }]}>
          <TouchableOpacity 
            style={[styles.menuItem, styles.menuButtonContainer]}
            onPress={onReply}
          >
            <Image
              source={require('../../assets/icons/reply.png')}
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Reply</Text>
          </TouchableOpacity>
          
          {isOwnMessage && (
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemDanger, styles.menuButtonContainer]}
              onPress={onDelete}
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
  );
};

const styles = StyleSheet.create({
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
});