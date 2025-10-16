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
import Button from '../components/Button';

type Props = StackScreenProps<AuthStackParamList, 'Otp'>;

const OtpScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email, userProfileType } = route.params;
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleVerifyOtp = async (): Promise<void> => {
    if (!otp || otp.length !== 5) {
      Alert.alert('Error', 'Please enter a valid 5-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await authAPI.verifyOtp({
        email,
        otp: parseInt(otp, 10)
      });
      
      Alert.alert('Success', 'OTP verified successfully');
      
      // Navigate to create password screen
      navigation.navigate('CreatePassword', { email });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'OTP verification failed');
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
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 5-digit code sent to{"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* OTP Input */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter OTP"
              placeholderTextColor="#9A9A9A"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={5}
              style={styles.inputLine}
              textAlign="center"
              autoFocus
            />
            <View style={styles.line} />
          </View>

          {/* Verify Button */}
          <Button
            title="VERIFY OTP"
            onPress={handleVerifyOtp}
            loading={loading}
            disabled={!otp || otp.length !== 5}
            style={styles.verifyButton}
          />
        </View>

        {/* Resend OTP Link */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity>
            <Text style={styles.resendLink}>Resend OTP</Text>
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
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },

  emailText: {
    fontWeight: '600',
    color: '#333',
  },

  inputContainer: {
    marginBottom: 18,
    width: '100%',
  },

  inputLine: {
    fontSize: 18,
    color: '#000',
    paddingVertical: 10,
    flex: 1,
    includeFontPadding: false,
    letterSpacing: 8,
    fontWeight: '600',
  },

  line: {
    height: 1,
    backgroundColor: '#E6E6E6',
    marginTop: 6,
  },

  verifyButton: {
    marginTop: 22,
    marginBottom: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 26,
    height: 50,
  },

  resendContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  resendText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  resendLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default OtpScreen;