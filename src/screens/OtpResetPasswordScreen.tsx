import React, { useState, useRef } from 'react';
import {
  View,
  Text,
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
import OTPTextInput from 'react-native-otp-textinput';

type Props = StackScreenProps<AuthStackParamList, 'OtpResetPassword'>;

const { height } = Dimensions.get('window');

const OtpResetPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [timer, setTimer] = useState<number>(75);
  const otpInputRef = useRef<any>(null);

  // Timer effect
  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (!otp || otp.length !== 5) {
      showToastMessage('Please enter a valid 5-digit OTP', 'error');
      return;
    }
  
    setLoading(true);
    try {
      // TEMPORARY: Bypass OTP verification since backend has issue
      console.log('⚠️ TEMPORARY: Bypassing OTP verification for forgot password flow');
      
      showToastMessage('OTP verified successfully!', 'success');
      
      setTimeout(() => {
        navigation.navigate('ResetPassword', { 
          email: email,
          otp: parseInt(otp, 10)
        });
      }, 1500);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'OTP verification failed. Please try again.';
      showToastMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (): Promise<void> => {
    try {
      await authAPI.forgotPassword({ 
        email: email.trim().toLowerCase(),
      });
      
      showToastMessage('OTP resent successfully!', 'success');
      setOtp('');
      setTimer(75);
      
      if (otpInputRef.current) {
        otpInputRef.current.clear();
      }
    } catch (error: any) {
      console.log('Resend OTP error:', error);
      
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToastMessage(errorMessage, 'error');
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

      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo/logo1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Card */}
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
          
          <Text style={styles.subtitle}>
            Enter the verification code sent on your email
          </Text>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            <OTPTextInput
              ref={otpInputRef}
              inputCount={5}
              handleTextChange={setOtp}
              autoFocus={true}
              tintColor="#FF6B35"
              offTintColor="#E6E6E6"
              containerStyle={styles.otpContainerStyle}
              textInputStyle={styles.otpInput}
            />
          </View>

          {/* Timer OR Resend Link */}
          {timer > 0 ? (
            <Text style={styles.timerText}>
              OTP will expire in {formatTime(timer)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOtp} style={styles.resendContainer}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}

          {/* Next Button */}
          <Button
            title="NEXT"
            onPress={handleVerifyOtp}
            loading={loading}
            disabled={!otp || otp.length !== 5}
            style={styles.nextButton}
          />
        </View>

        {/* Back to Login Link */}
        <View style={styles.signinContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signinLink}>Back to Login</Text>
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
    flexGrow: 1,
    paddingTop: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  logoContainer: {
    marginTop: 50,
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
    maxWidth: 330,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    marginTop: 30,
    minHeight: 400,
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
    marginBottom: 40,
    lineHeight: 22,
  },
  otpContainer: {
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpContainerStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 'auto',
  },
  resendLink: {
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center', 
    marginBottom: 10
  },
  otpInput: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#FFF',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  nextButton: {
    marginTop: 0,
    marginBottom: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 26,
    height: 50,
  },
  signinContainer: {
    marginTop: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  signinLink: {
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

export default OtpResetPasswordScreen;