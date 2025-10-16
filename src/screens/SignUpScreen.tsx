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
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/auth';
import { authAPI } from '../api/auth';
import { USER_PROFILE_TYPES } from '../utils/constants';
import Button from '../components/Button';

type Props = StackScreenProps<AuthStackParamList, 'SignUp'>;

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignUp = async (): Promise<void> => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.signup({
        email,
        userProfileType: USER_PROFILE_TYPES.SELLER
      });
      
      Alert.alert('Success', 'OTP sent to your email');
      
      navigation.navigate('Otp', { 
        email, 
        userProfileType: USER_PROFILE_TYPES.SELLER 
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top image */}
      <Image
        source={require('../assets/images/auth-bg.png')}
        style={styles.topImage}
        resizeMode="cover"
      />

      {/* Content (logo + card) */}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo/logo1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Card - only top corners rounded; bottom is flat */}
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

          {/* Sign Up Button */}
          <Button
            title="SEND OTP"
            onPress={handleSignUp}
            loading={loading}
            disabled={!email}
            style={styles.signupButton}
          />
        </View>

        {/* Sign In Link */}
        <View style={styles.signinContainer}>
          <Text style={styles.signinText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signinLink}>Login in here</Text>
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

  /* top decorative image (covering the top portion) */
  topImage: {
    position: 'absolute',
    height: '55%',
    width: '100%',
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
    maxWidth: 400,
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
    marginTop: 6,
  },

  signupButton: {
    marginTop: 22,
    marginBottom: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 26,
    height: 50,
  },

  signinContainer: {
    marginTop: 80,
    alignItems: 'center',
  },
  signinText: {
    color: '#666',
    textAlign: 'center',
  },
  signinLink: {
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 6,
  },
});

export default SignUpScreen;