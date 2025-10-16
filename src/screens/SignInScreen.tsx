import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/auth';
import { authAPI } from '../api/auth';
import { USER_PROFILE_TYPES, PLATFORMS } from '../utils/constants';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
type Props = StackScreenProps<AuthStackParamList, 'SignIn'>;

const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { signIn } = useAuth();

  const handleSignIn = async (): Promise<void> => {
  if (!email || !password) {
    Alert.alert('Error', 'Please enter both email and password');
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

    // ✅ Get the response and extract the token
    const response = await authAPI.signin(signInData);
    
    console.log('✅ Login successful - Token received:', response.token);
    
    // ✅ Save the token to AuthContext - THIS TRIGGERS THE NAVIGATION
    if (response.token) {
      await signIn(response.token);
      console.log('✅ Token saved to AuthContext - should navigate to Home automatically');
    } else {
      Alert.alert('Error', 'No token received from server');
    }
    
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.response?.data?.error || 'Sign in failed';
    Alert.alert('Sign In Failed', errorMessage);
  } finally {
    setLoading(false);
  }
};

  const toggleShowPassword = () => setShowPassword(prev => !prev);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top image / gradient area */}
      <Image
        source={require('../assets/images/auth-bg.png')}
        style={styles.topImage}
        resizeMode="cover"
      />

      {/* bottom white area that will visually merge with the card bottom */}
      {/* <View style={styles.whiteBackground} /> */}

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


  topImage: {
    position: 'absolute',
    flex:1,
    height: '70%',
    width: '100%'
    
  },

 
  whiteBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 520, 
    backgroundColor: '#FFFFFF',
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
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    // elevation: 8,
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
    tintColor: '#444', // makes it grayish, remove if your icon already has color
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
    marginTop: 6,
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
    marginTop: 22,
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
});

export default SignInScreen;
