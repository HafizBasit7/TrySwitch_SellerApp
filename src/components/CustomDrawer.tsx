import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';

const CustomDrawer = (props: any) => {
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(true);
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            props.navigation.closeDrawer();
          },
        },
      ]
    );
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Delete Profile',
      'This feature will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleCloseDrawer = () => {
    props.navigation.closeDrawer();
  };

  return (
    <SafeAreaView style={styles.container}>
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Close Button */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleCloseDrawer}
        >
          <View style={styles.closeIcon}>
            <View style={styles.closeLine1} />
            <View style={styles.closeLine2} />
          </View>
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
        >
          <View style={styles.iconContainer}>
            <View style={styles.logoutIconWrapper}>
              <Image
              source={require('../assets/icons/logout.png')}
              style={styles.logoutIconWrapper}
              resizeMode="contain"
            />
            </View>
          </View>
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>

        {/* Delete Profile */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleDeleteProfile}
        >
          <View style={styles.iconContainer}>
            <View style={styles.trashIcon}>
              <View style={styles.trashLid} />
              <View style={styles.trashBody} />
            </View>
          </View>
          <Text style={styles.menuText}>Delete Profile</Text>
        </TouchableOpacity>

        {/* 2FA Section */}
        <View style={styles.twoFASection}>
          <View style={styles.twoFAHeader}>
            <View style={styles.shieldIconContainer}>
              <View style={styles.shieldIcon}>
                <View style={styles.shieldCross1} />
                <View style={styles.shieldCross2} />
              </View>
            </View>
            <Text style={styles.twoFATitle}>2 Factor Authentication</Text>
          </View>
          
          <Text style={styles.twoFADescription}>
            Enable this feature to activate 2-factor authentication and enhance the security of your account.
          </Text>
          
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
            />
          </View>
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7400b',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 10,
    marginBottom: 10,
  },
  closeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLine1: {
    position: 'absolute',
    width: 20,
    height: 2.5,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
  },
  closeLine2: {
    position: 'absolute',
    width: 20,
    height: 2.5,
    backgroundColor: '#fff',
    transform: [{ rotate: '-45deg' }],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  logo: {
    width: 200,
    height: 70,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20
  },
  logoutIconWrapper: {
    width: 22,
    height: 22,
    position: 'relative',
    tintColor: '#fff', 
  },
  logoutArrow: {
    position: 'absolute',
    left: 0,
    top: 8,
    width: 10,
    height: 10,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#fff',
  },
  logoutLine: {
    position: 'absolute',
    right: 0,
    top: 9,
    width: 14,
    height: 2.5,
    backgroundColor: '#fff',
  },
  trashIcon: {
    width: 18,
    height: 20,
    position: 'relative',
  },
  trashLid: {
    position: 'absolute',
    top: 0,
    left: -2,
    width: 22,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  trashBody: {
    position: 'absolute',
    top: 5,
    left: 0,
    width: 18,
    height: 15,
    backgroundColor: 'transparent',
    borderWidth: 2.5,
    borderColor: '#fff',
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  menuText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  twoFASection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  twoFAHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shieldIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldIcon: {
    width: 20,
    height: 22,
    borderWidth: 2.5,
    borderColor: '#fff',
    borderRadius: 4,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldCross1: {
    position: 'absolute',
    width: 2,
    height: 10,
    backgroundColor: '#fff',
  },
  shieldCross2: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: '#fff',
  },
  twoFATitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  twoFADescription: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 19,
    marginBottom: 20,
    opacity: 0.9,
  },
  twoFAToggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  twoFAStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CustomDrawer;