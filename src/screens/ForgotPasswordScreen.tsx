import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/auth';
import { authAPI } from '../api/auth';
import Button from '../components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const { height } = Dimensions.get('window');

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleForgotPassword = async (): Promise<void> => {
    if (!email) {
      showToastMessage('Please enter your email', 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToastMessage('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword({
        email: email.trim().toLowerCase(),
      });
      
      showToastMessage('Verification code sent to your email', 'success');
      
      // Navigate to Reset Password screen with email and OTP after a short delay
      setTimeout(() => {
        navigation.navigate('OtpResetPassword', { 
          email: email.trim().toLowerCase(),
        });
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send verification code. Please try again.';
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
            <Text style={styles.title}>Forgot Password</Text>
            <View style={styles.placeholder} />
          </View>
          
          <Text style={styles.subtitle}>Enter your registered email</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter Email"
              placeholderTextColor="#9A9A9A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.inputLine}
              importantForAutofill="yes"
            />
            <View style={styles.line} />
          </View>

          {/* Send Code Button */}
          <Button
            title="NEXT"
            onPress={handleForgotPassword}
            loading={loading}
            disabled={!email}
            style={styles.sendButton}
          />
        </View>

        {/* Back to Login Link */}
        {/* <View style={styles.backContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.backLink}>Back to Login</Text>
          </TouchableOpacity>
        </View> */}
         {/* Small bottom copy / sign up area */}
         <View style={styles.signupContainer}>
          <Text style={styles.signupText}>New to our platform ? Let's get you set up.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}>Click to join</Text>
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
    minHeight: height * 0.41,
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
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 14,
    height: 14,
    tintColor: '#000',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  placeholder: {
    width: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    // marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#9A9A9A',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 18,
    width: '100%',
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
  sendButton: {
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
  signupContainer: {
    marginTop: 80,
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    textAlign: 'center',
  },
  signupLink: {
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 6,
  },
});

export default ForgotPasswordScreen;