import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/auth';
import { authAPI } from '../api/auth';
import Button from '../components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleForgotPassword = async (): Promise<void> => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword({
        email: email.trim().toLowerCase(),
      });
      
      Alert.alert('Success', 'Verification code sent to your email');
      
      // Navigate to Reset Password screen with email and OTP
      navigation.navigate('ResetPassword', { 
        email: email.trim().toLowerCase(),
        otp: response.otp
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send verification code');
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
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive a verification code</Text>

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
            title="SEND CODE"
            onPress={handleForgotPassword}
            loading={loading}
            disabled={!email}
            style={styles.sendButton}
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
  topImage: {
    position: 'absolute',
    height: '60%',
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
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderBottomLeftRadius: 0,
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
    marginTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
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
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;