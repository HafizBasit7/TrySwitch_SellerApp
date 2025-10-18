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
import { USER_PROFILE_TYPES } from '../utils/constants';
import Button from '../components/Button';

type Props = StackScreenProps<AuthStackParamList, 'SignUp'>;

const { height } = Dimensions.get('window');

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
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

  const handleSignUp = async (): Promise<void> => {
    if (!email) {
      showToastMessage('Please enter your email address', 'error');
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
      const response = await authAPI.signup({
        email: email.trim().toLowerCase(),
        userProfileType: USER_PROFILE_TYPES.SELLER
      });
      
      showToastMessage('OTP sent to your email successfully!', 'success');
      
      // Navigate to OTP screen after a short delay to show the success message
      setTimeout(() => {
        navigation.navigate('Otp', { 
          email: email.trim().toLowerCase(), 
          userProfileType: USER_PROFILE_TYPES.SELLER, 
        });
      }, 1500);
      
    } catch (error: any) {
      console.log('SignUp error:', error.response?.data);
      
      // Handle specific error cases with appropriate messages
      let errorMessage = 'Sign up failed. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle string error messages
        if (typeof errorData === 'string') {
          if (errorData.includes('already exists') || errorData.includes('already registered')) {
            errorMessage = 'This email is already registered. Please try logging in.';
          } else if (errorData.includes('invalid') || errorData.includes('Invalid')) {
            errorMessage = 'Please enter a valid email address.';
          } else if (errorData.includes('not found') || errorData.includes('Not found')) {
            errorMessage = 'Email not found. Please check and try again.';
          } else {
            errorMessage = errorData;
          }
        } 
        // Handle object error messages
        else if (errorData.message) {
          const message = errorData.message.toLowerCase();
          if (message.includes('already exists') || message.includes('already registered') || message.includes('duplicate')) {
            errorMessage = 'This email is already registered. Please try logging in.';
          } else if (message.includes('invalid') || message.includes('valid')) {
            errorMessage = 'Please enter a valid email address.';
          } else if (message.includes('not found')) {
            errorMessage = 'Email not found. Please check and try again.';
          } else {
            errorMessage = errorData.message;
          }
        }
        // Handle array error messages (common in ASP.NET)
        else if (Array.isArray(errorData)) {
          const firstError = errorData[0]?.toLowerCase() || '';
          if (firstError.includes('already exists') || firstError.includes('already registered')) {
            errorMessage = 'This email is already registered. Please try logging in.';
          } else if (firstError.includes('invalid email')) {
            errorMessage = 'Please enter a valid email address.';
          } else {
            errorMessage = errorData[0] || errorMessage;
          }
        }
      }
      
      // Network or server errors
      if (error.message?.includes('Network Error') || error.message?.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Service unavailable. Please try again later.';
      }
      
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
          <Text style={styles.title}>Sign Up</Text>

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

          {/* Next Button */}
          <Button
            title="NEXT"
            onPress={handleSignUp}
            loading={loading}
            disabled={!email}
            style={styles.nextButton}
          />
        </View>

        {/* Small bottom copy / sign in area */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Already a member?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signupLink}>Login here</Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 28,
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
  nextButton: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 26,
    height: 50,
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

export default SignUpScreen;