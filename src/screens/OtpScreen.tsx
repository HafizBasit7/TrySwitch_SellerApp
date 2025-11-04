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
import { useAuth } from '../context/AuthContext';

type Props = StackScreenProps<AuthStackParamList, 'Otp'>;

const { height } = Dimensions.get('window');

const OtpScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email, userProfileType, is2FA, signInData } = route.params;
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [timer, setTimer] = useState<number>(75);
  const otpInputRef = useRef<any>(null);
  const { signIn } = useAuth();

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
      showToastMessage('Please enter a valid 5-digit verification code', 'error');
      return;
    }

    setLoading(true);
    try {
      if (is2FA) {
        // Handle 2FA verification
        const verifyData = {
          email: email,
          otp: parseInt(otp, 10),
          userProfileType: userProfileType,
        };

        console.log('🔐 Verifying 2FA with:', verifyData);
        
        const result = await authAPI.verify2FA(verifyData);
        
        if (result.token) {
          console.log('✅ 2FA Verification successful - Token received');
          await signIn(result.token);
          showToastMessage('Login successful!', 'success');
        } else {
          showToastMessage(result.message || 'Verification failed', 'error');
        }
      } else {
        // Handle regular OTP verification (for signup)
        await authAPI.verifyOtp({
          email,
          otp: parseInt(otp, 10)
        });
        
        showToastMessage('OTP verified successfully!', 'success');
        
        setTimeout(() => {
          navigation.navigate('CreatePassword', { email });
        }, 1500);
      }
      
    } catch (error: any) {
      let errorMessage = is2FA 
        ? 'Invalid verification code. Please try again.'
        : 'OTP verification failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToastMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (): Promise<void> => {
    try {
      if (is2FA) {
        // Resend 2FA code by calling signin again
        await authAPI.signin(signInData);
        showToastMessage('Verification code resent successfully!', 'success');
      } else {
        // Resend regular OTP
        await authAPI.forgotPassword({ 
          email: email.trim().toLowerCase(),
        });
        showToastMessage('OTP resent successfully!', 'success');
      }
      
      setOtp('');
      setTimer(75);
      
      // Focus back on OTP input after resend
      if (otpInputRef.current) {
        setTimeout(() => {
          otpInputRef.current?.setValue('');
        }, 100);
      }
    } catch (error: any) {
      console.log('Resend error:', error);
      
      let errorMessage = 'Failed to resend code. Please try again.';
      
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

  const getScreenTitle = () => {
    return is2FA ? 'Authentication' : 'Sign up';
  };

  const getSubtitle = () => {
    return is2FA 
      ? 'Enter the verification code sent to your email to complete sign in.'
      : 'Enter the code sent to your email to continue';
  };

  const getButtonTitle = () => {
    return is2FA ? 'VERIFY & SIGN IN' : 'NEXT';
  };

  const getOtpLength = () => {
    return is2FA ? 5 : 5;
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
            <Text style={styles.title}>{getScreenTitle()}</Text>
            <View style={styles.placeholder} />
          </View>
          
          <Text style={styles.subtitle}>
            {getSubtitle()}
          </Text>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            <OTPTextInput
              ref={otpInputRef}
              inputCount={getOtpLength()}
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
              Code will expire in {formatTime(timer)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOtp} style={styles.resendContainer}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          )}

          {/* Verify Button */}
          <Button
            title={getButtonTitle()}
            onPress={handleVerifyOtp}
            loading={loading}
            disabled={!otp || otp.length !== getOtpLength()}
            style={styles.nextButton}
          />
        </View>

        {/* Only show sign in link for non-2FA flow */}
        {!is2FA && (
          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already a member?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.signinLink}>Login here</Text>
            </TouchableOpacity>
          </View>
        )}
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
  signinText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 4,
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

export default OtpScreen;