import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView
} from 'react-native';
import { authAPI } from '../api/auth';
import Toast from 'react-native-toast-message';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onPasswordChanged: () => void;
  userEmail: string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onPasswordChanged,
  userEmail
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showToast = (type: string, text1: string, text2?: string) => {
    Toast.show({
      type: type,
      text1: text1,
      text2: text2,
      position: 'bottom',
      visibilityTime: 4000,
    });
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('error', 'Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showToast('error', 'Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const resetData = {
        email: userEmail,
        password: newPassword
      };

      console.log('📤 Reset Password Data:', resetData);

      // Call the reset password API
      const response = await authAPI.resetPassword(resetData);
      
      showToast('success', 'Success', 'Password changed successfully');
      
      // Reset form and close modal
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onPasswordChanged();
      onClose();
      
    } catch (error: any) {
      console.log('❌ API Error:', error.response || error);
      const errorMessage = error.response?.data || 'Failed to change password. Please check your current password.';
      showToast('error', 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          {/* Close Button - Outside the modal content */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {/* Modal Content */}
          <View style={styles.modalContent}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Change Password</Text>
              </View>

              {/* Current Password */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>CURRENT PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                   placeholder="***********"
                    placeholderTextColor="#999"
                    editable={!loading}
                  />
                  <View style={styles.underline} />
                </View>
              </View>

              {/* New Password */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>NEW PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                   placeholder="***********"
                    placeholderTextColor="#999"
                    editable={!loading}
                  />
                  <View style={styles.underline} />
                </View>
              </View>

              {/* Confirm New Password */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>CONFIRM NEW PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="***********"
                    placeholderTextColor="#999"
                    editable={!loading}
                  />
                  <View style={styles.underline} />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'CHANGING PASSWORD...' : 'SUBMIT'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '93%',
    maxWidth: 400,
    maxHeight: '80%',
    // shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    color: '#6f4b96',
  },
  closeButton: {
    position: 'absolute',
    top: '26%', // Position relative to modal container
    right: '2%', // Position relative to modal container
    transform: [{ translateY: -20 }], // Adjust to be perfectly half outside
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  closeButtonText: {
    fontSize: 22,
    color: '#333',
    fontWeight: '600',
    lineHeight: 22,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    fontSize: 16,
    paddingVertical: 4,
    paddingHorizontal: 0,
    color: '#000',
  },
  underline: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#401073',
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default ChangePasswordModal;