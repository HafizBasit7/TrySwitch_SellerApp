import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../api/profileAPI';
import Toast from 'react-native-toast-message';

// Simple JWT decode function that works in React Native
const decodeJWT = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // For React Native, we can use this approach
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
};

// Polyfill for atob in React Native
const atob = (input: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }

  for (let bc = 0, bs = 0, buffer, i = 0;
      buffer = str.charAt(i++);
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ?
      output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
};

const CustomDrawer = (props: any) => {
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { signOut, userToken, userInfo } = useAuth();

  const showToast = (type: string, text1: string, text2?: string) => {
    Toast.show({
      type: type,
      text1: text1,
      text2: text2,
      position: 'bottom',
      visibilityTime: 4000,
    });
  };

  // Function to get user info from token
  const getUserInfo = () => {
    if (!userToken) return { profileType: 'Unknown', email: '', name: '' };
    
    try {
      const decoded = decodeJWT(userToken);
      
      if (!decoded) {
        return { profileType: 'Unknown', email: '', name: '' };
      }
      
      // console.log('🔍 JWT Token Contents:', decoded);
      
      // Get profile type - handle both string and number
      const profileType = decoded.UserProfileType;
      const email = decoded.email || decoded.unique_name || '';
      const name = decoded.name || email.split('@')[0] || 'User';
      
      return { profileType, email, name };
    } catch (error) {
      console.error('Error decoding token:', error);
      return { profileType: 'Unknown', email: '', name: '' };
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
    props.navigation.closeDrawer();
    showToast('success', 'Logged out', 'You have been successfully logged out');
  };

  const handleDeleteProfile = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteProfile = async () => {
    setShowDeleteModal(false);
  
    if (!userToken) {
      showToast('error', 'Error', 'You must be logged in to delete your profile.');
      return;
    }
  
    const { profileType } = getUserInfo();
    setIsDeleting(true);
  
    try {
      console.log('🗑️ Deleting profile for type:', profileType);
  
      // Add Authorization header dynamically to API call
      const response = await profileAPI.deleteProfile(
        profileType === '2' || profileType === 'Seller' ? 'Seller' : 'Investor'
      );
  
      console.log('✅ Delete Profile Response:', response);
  
      showToast('success', 'Profile Deleted', 'Your profile has been successfully deleted.');
  
      // Log out the user after deletion
      setTimeout(async () => {
        await signOut();
        props.navigation.closeDrawer();
      }, 2000);
  
    } catch (error: any) {
      console.error('❌ Delete profile error:', error);
  
      let errorMessage = 'Failed to delete profile. Please try again.';
      const responseData = error.response?.data;
  
      try {
        // Parse error response if it's a JSON string
        const parsedError =
          typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
  
        if (parsedError?.details?.toLowerCase().includes('already deleted')) {
          errorMessage = 'Your profile has already been deleted.';
        } else if (parsedError?.details?.toLowerCase().includes('not exist')) {
          errorMessage = 'Profile not found or already deleted.';
        } else if (parsedError?.message) {
          errorMessage = parsedError.message;
        }
      } catch {
        // If not JSON, fallback to plain text or default message
        if (typeof responseData === 'string' && responseData.includes('already deleted')) {
          errorMessage = 'Your profile has already been deleted.';
        } else if (typeof responseData === 'string' && responseData.includes('not exist')) {
          errorMessage = 'Profile not found or already deleted.';
        }
      }
  
      // Handle status-based errors gracefully
      if (error.response?.status === 404) {
        errorMessage = 'Profile not found. You may need to complete your profile setup first.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please login again.';
      }
  
      showToast('error', 'Deletion Failed', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };
  
  

  const handleCloseDrawer = () => {
    props.navigation.closeDrawer();
  };

  // Get current user info for display
  const { profileType, email, name } = getUserInfo();

  // Confirmation Modal Component
  const ConfirmationModal = ({ visible, title, message, confirmText, onConfirm, onCancel, isDestructive = false }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, isDestructive ? styles.deleteButton : styles.confirmButton]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Close Button with Image */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleCloseDrawer}
        >
          <Image
            source={require('../assets/icons/cross.png')} // Make sure you have close.png in your icons folder
            style={styles.closeIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Logo Header */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo/logo1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Logout Section */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleLogout}
          disabled={isDeleting}
        >
          <View style={styles.iconContainer}>
            <Image
              source={require('../assets/icons/logout.png')}
              style={styles.logoutIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>

        {/* Delete Profile */}
        <TouchableOpacity 
          style={[styles.menuItem, isDeleting && styles.disabledItem]}
          onPress={handleDeleteProfile}
          disabled={isDeleting}
        >
          <View style={styles.iconContainer}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Image
                source={require('../assets/icons/delete.png')}
                style={styles.deleteIcon}
                resizeMode="contain"
              />
            )}
          </View>
          <Text style={[styles.menuText, styles.deleteText]}>
            {isDeleting ? 'Deleting...' : 'Delete Profile'}
          </Text>
        </TouchableOpacity>

        <View style={styles.tabDivider} />

        {/* 2FA Section */}
        <View style={styles.twoFASection}>
          <View style={styles.twoFAContent}>
            <View style={styles.twoFAHeader}>
              <View style={styles.shieldIconContainer}>
                <Image
                  source={require('../assets/icons/shield.png')}
                  style={styles.shieldIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.twoFATitle}>2 Factor Authentication</Text>
            </View>
            
            <Text style={styles.twoFADescription}>
              Enable this feature to activate 2-factor authentication and enhance the security of your account.
            </Text>
          </View>
          
          <View style={styles.twoFAToggleSection}>
            <Text style={styles.twoFAStatusText}>
              {isTwoFAEnabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Switch
              value={isTwoFAEnabled}
              onValueChange={setIsTwoFAEnabled}
              trackColor={{ false: '#FFB299', true: '#fff' }}
              thumbColor={isTwoFAEnabled ? '#fff' : '#FF6B35'}
              ios_backgroundColor="#FFB299"
              disabled={isDeleting}
            />
          </View>
        </View>
      </DrawerContentScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Delete Profile Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Profile"
        message="Are you sure you want to delete your profile? This action cannot be undone and all your data will be permanently lost."
        confirmText="Delete Permanently"
        onConfirm={confirmDeleteProfile}
        onCancel={() => setShowDeleteModal(false)}
        isDestructive={true}
      />

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    padding: 15,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 10,
  },
  logo: {
    width: 200,
    height: 70,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  disabledItem: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20
  },
  logoutIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
  deleteIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
  menuText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  deleteText: {
    color: '#fff',
  },
  tabDivider: {
    height: 1, 
    backgroundColor: '#fff', 
    marginVertical: 10,
  },
  twoFASection: {
    padding: 15,
    borderRadius: 12,
    marginTop: 5,
  },
  twoFAContent: {
    marginBottom: 15,
  },
  twoFAHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  shieldIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    marginTop: 2,
    marginLeft: 8
  },
  shieldIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  twoFATitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    lineHeight: 24,
  },
  twoFADescription: {
    fontSize: 12,
    color: '#fff',
    lineHeight: 18,
    opacity: 0.9,
    marginLeft: 35,
    padding:10 
    
  },
  twoFAToggleSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  twoFAStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    paddingRight: 10
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#FF6B35',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CustomDrawer;