import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/auth';
import { authAPI } from '../api/auth';
import Button from '../components/Button';

type Props = StackScreenProps<AuthStackParamList, 'ResetPassword'>;

const { height } = Dimensions.get('window');

const ResetPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email, otp } = route.params;
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const toggleShowPassword = () => setShowPassword(prev => !prev);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(prev => !prev);

  const handleResetPassword = async (): Promise<void> => {
    if (!password || !confirmPassword) {
      showToastMessage('Please enter both password fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToastMessage('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToastMessage('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      showToastMessage('Password reset successfully!', 'success');
      
      // Navigate back to Sign In screen after success message
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      showToastMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top image / gradient area */}
      <View style={styles.gradientBackground}>
        <Image
          source={require('../assets/images/auth-bg.png')}
          style={styles.topImage}
          resizeMode="cover"
        />
      </View>

      {/* Toast Message */}
      {showToast && (
        <View style={[
          styles.toastContainer,
          toastType === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Content (logo + card) placed absolutely so it overlaps the boundary */}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo/logo1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Card - only top corners rounded; bottom is flat to merge with whiteBackground */}
        <View style={styles.card}>
          {/* Header with Back Button and Title */}
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={require('../assets/icons/back.png')}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.title}>Reset Password</Text>
            <View style={styles.placeholder} />
          </View>
          
          <Text style={styles.subtitle}>Create your new password</Text>

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="New Password"
                placeholderTextColor="#9A9A9A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={[styles.inputLine, { paddingRight: 44 }]} // space for icon
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={toggleShowPassword}
                style={styles.iconButton}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Image
                  source={
                    showPassword
                      ? require('../assets/icons/hide.png')
                      : require('../assets/icons/show.png')
                  }
                  style={styles.eyeIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.line} />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="#9A9A9A"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={[styles.inputLine, { paddingRight: 44 }]} // space for icon
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={toggleShowConfirmPassword}
                style={styles.iconButton}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Image
                  source={
                    showConfirmPassword
                      ? require('../assets/icons/hide.png')
                      : require('../assets/icons/show.png')
                  }
                  style={styles.eyeIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.line} />
          </View>

          {/* Reset Password Button */}
          <Button
            title="SUBMIT"
            onPress={handleResetPassword}
            loading={loading}
            disabled={!password || !confirmPassword}
            style={styles.resetButton}
          />
        </View>

        {/* Back to Login Link */}
        <View style={styles.backContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.backLink}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
  },
  topImage: {
    width: '100%',
    height: '100%',
  },
  container: {
    paddingTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    marginTop: 14,
    marginBottom: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  logo: { 
    width: 250, 
    height: 100 
  },
  card: {
    backgroundColor: 'white',
    borderTopLeftRadius: 50,   // Curve only top left
    borderTopRightRadius: 50,  // Curve only top right
    borderBottomLeftRadius: 0, // Keep bottom flat
    borderBottomRightRadius: 0,
    padding: 32,
    width: '100%',
    maxWidth: 330,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    marginTop: 50, // Add space for the logo
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 14,
    height: 14,
    tintColor: '#000',
  },
  placeholder: {
    width: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 18,
    width: '100%',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputLine: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 10,
    flex: 1,
    includeFontPadding: false,
  },
  line: {
    height: 1,
    backgroundColor: '#E6E6E6',
    marginTop: 0,
  },
  iconButton: {
    position: 'absolute',
    right: 0,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
  },
  eyeIcon: {
    width: 22,
    height: 22,
    tintColor: '#444',
  },
  resetButton: {
    marginTop: 22,
    marginBottom: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 26,
    height: 50,
  },
  backContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  backLink: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toastSuccess: {
    backgroundColor: '#4CAF50',
  },
  toastError: {
    backgroundColor: '#F44336',
  },
  toastText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;