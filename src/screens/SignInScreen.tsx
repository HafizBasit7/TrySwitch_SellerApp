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
  Dimensions
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/auth';
import { authAPI } from '../api/auth';
import { USER_PROFILE_TYPES, PLATFORMS } from '../utils/constants';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

type Props = StackScreenProps<AuthStackParamList, 'SignIn'>;
const { height } = Dimensions.get('window');

const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const { signIn } = useAuth();

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleSignIn = async (): Promise<void> => {
    if (!email || !password) {
      showToastMessage('Please enter both email and password', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToastMessage('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const signInData = {
        email: email.trim().toLowerCase(),
        password,
        deviceToken: 'android_device_token_123',
        userProfileType: USER_PROFILE_TYPES.SELLER,
        platform: PLATFORMS.ANDROID,
      };

      const response = await authAPI.signin(signInData);
      
      console.log('✅ Login successful - Token received:', response.token);
      
      if (response.token) {
        await signIn(response.token);
        console.log('✅ Token saved to AuthContext - should navigate to Home automatically');
      } else {
        showToastMessage('No token received from server. Please try again.', 'error');
      }
      
    } catch (error: any) {
      console.log('SignIn error:', error.response?.data);
      
      // Handle specific error cases with appropriate messages
      let errorMessage = 'Sign in failed. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle string error messages
        if (typeof errorData === 'string') {
          const lowerError = errorData.toLowerCase();
          if (lowerError.includes('invalid credentials') || lowerError.includes('wrong password') || lowerError.includes('incorrect password')) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (lowerError.includes('user not found') || lowerError.includes('account not found')) {
            errorMessage = 'No account found with this email. Please sign up.';
          } else if (lowerError.includes('inactive') || lowerError.includes('disabled')) {
            errorMessage = 'Your account is inactive. Please contact support.';
          } else if (lowerError.includes('email') && lowerError.includes('verify')) {
            errorMessage = 'Please verify your email address before signing in.';
          } else {
            errorMessage = errorData;
          }
        } 
        // Handle object error messages
        else if (errorData.message) {
          const message = errorData.message.toLowerCase();
          if (message.includes('invalid credentials') || message.includes('wrong password') || message.includes('incorrect password')) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (message.includes('user not found') || message.includes('account not found')) {
            errorMessage = 'No account found with this email. Please sign up.';
          } else if (message.includes('inactive') || message.includes('disabled')) {
            errorMessage = 'Your account is inactive. Please contact support.';
          } else if (message.includes('email') && message.includes('verify')) {
            errorMessage = 'Please verify your email address before signing in.';
          } else {
            errorMessage = errorData.message;
          }
        }
        // Handle array error messages (common in ASP.NET)
        else if (Array.isArray(errorData)) {
          const firstError = errorData[0]?.toLowerCase() || '';
          if (firstError.includes('invalid credentials') || firstError.includes('wrong password')) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (firstError.includes('user not found')) {
            errorMessage = 'No account found with this email. Please sign up.';
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
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Service unavailable. Please try again later.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Password is incorrect';
      }
      
      showToastMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(prev => !prev);

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

        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>

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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="Password"
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
            <View>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotLink}>Forgot your log in details?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <Button
            title="LOGIN"
            onPress={handleSignIn}
            loading={loading}
            disabled={!email || !password}
            style={styles.loginButton}
          />
        </View>

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
  safe: { flex: 1, backgroundColor: '#fff' },
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
  logo: { width: 250, height: 100 },
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeIcon: {
    width: 22,
    height: 22,
    tintColor: '#444',
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
  loginButton: {
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
  forgotLink: {
    color: '#9A9A9A',
    fontWeight: '600',
    marginTop: 6,
    textAlign: "right"
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

export default SignInScreen;