import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext'

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  const { userInfo } = useAuth();

  const getDisplayName = () => {
    if (userInfo?.name) {
      return userInfo.name;
    } else if (userInfo?.email) {
      return userInfo.email;
    } else {
      return 'User'; // Fallback if no user info available
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image - Only under header */}
      <View style={styles.headerBackground}>
        {/* Image Wrapper - ONLY contains the image */}
        <View style={styles.imageWrapper}>
          <Image
            source={require('../../assets/images/auth-bg.png')}
            style={styles.topImage}
            resizeMode="cover"
          />
        </View>
        
        {/* Header - OUTSIDE imageWrapper */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Image
              source={require('../../assets/icons/bell.png')}
              style={styles.bellIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <View style={styles.hamburgerIcon}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>
        </View>
  
        {/* Profile Picture Section - OUTSIDE imageWrapper */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require('../../assets/icons/default.png')}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editIconContainer}>
              <Image
                source={require('../../assets/icons/edit.png')}
                style={styles.editIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
  
      {/* Rest of your code remains the same */}

      {/* Single White Card Container - Starts below header */}
      <View style={styles.whiteCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Name - Inside white card */}
          {/* <Text style={styles.userName}>Mark Anderson</Text> */}
          <Text style={styles.userName}>{getDisplayName()}</Text>

          {/* Horizontal Scrollable Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScrollContainer}
            contentContainerStyle={styles.tabsContentContainer}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
              onPress={() => setActiveTab('profile')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'profile' && styles.activeTabText,
                ]}
              >
                Profile Information
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'business' && styles.activeTab]}
              onPress={() => setActiveTab('business')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'business' && styles.activeTabText,
                ]}
              >
                Business Information
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'reviews' && styles.activeTabText,
                ]}
              >
                Reviews
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../../assets/icons/profile-illustration1.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Complete Profile Button */}
          <TouchableOpacity style={styles.completeProfileButton}>
            <Text style={styles.completeProfileButtonText}>
              COMPLETE PROFILE
            </Text>
          </TouchableOpacity>

          {/* Change Password Button */}
          <TouchableOpacity style={styles.changePasswordButton}>
            <Text style={styles.changePasswordButtonText}>
              CHANGE PASSWORD
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerBackground: {
    height: 160,
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
    overflow: 'visible', // Change from 'hidden' to 'visible'
    zIndex: 50, // Add this
  },
  imageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden', // Change back to 'hidden'
    zIndex: 1,
  },
  
  topImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
  hamburgerIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  // Profile Section - Positioned at bottom of header
  profileSection: {
    alignItems: 'center',
    position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
    zIndex: 100, // Increase this significantly
    elevation: 100, // Add this for Android
  },
  profileImageContainer: {
    position: 'relative',
    zIndex: 101,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: '#d0d0d0',
    borderWidth: 4,
    borderColor: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    top: 0,   
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  editIcon: {
    width: 16,
    height: 16,
    tintColor: '#6C63FF',
  },
  // White Card - Starts below header
  whiteCard: {
    backgroundColor: '#fff',
    marginTop: -10, 
    marginHorizontal: 10,
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
    borderRadius: 20,
    paddingTop: 60, // Space for the avatar overlap
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    flex: 1,
    maxHeight: 560,
    // zIndex: 100,      // ✅ Increase to stay above the header image
  position: 'relative',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 30, // Space between avatar and name
    marginBottom: 10,
  },
  // Horizontal Scrollable Tabs
  tabsScrollContainer: {
    marginBottom: 30,
  },
  tabsContentContainer: {
    paddingRight: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  illustration: {
    width: width - 100,
    height: 150,
  },
  completeProfileButton: {
    width: '100%',
    backgroundColor: '#5B21B6',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  completeProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  changePasswordButton: {
    width: '100%',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default ProfileScreen;