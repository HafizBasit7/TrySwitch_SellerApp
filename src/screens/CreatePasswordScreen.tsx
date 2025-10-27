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

type Props = StackScreenProps<AuthStackParamList, 'CreatePassword'>;

const { height } = Dimensions.get('window');

const CreatePasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
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

  const handleCreatePassword = async (): Promise<void> => {
    if (!password) {
      showToastMessage('Please enter a password', 'error');
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
      await authAPI.createPassword({
        email,
        password
      });
      
      showToastMessage('Password created successfully', 'success');
      
      // Navigate to sign in screen after a short delay
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Password creation failed';
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
            <Text style={styles.title}>Sign up</Text>
            <View style={styles.placeholder} />
          </View>
          
          {/* <Text style={styles.subtitle}>Create a secure password for your account</Text> */}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Create Password"
              placeholderTextColor="#9A9A9A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.inputLine}
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
            <View style={styles.line} />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#9A9A9A"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              style={styles.inputLine}
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
            <View style={styles.line} />
          </View>

          {/* Create Password Button */}
          <Button
            title="SUBMIT"
            onPress={handleCreatePassword}
            loading={loading}
            disabled={!password || !confirmPassword}
            style={styles.createButton}
          />
        </View>

        {/* Back to Sign In Link */}
        <View style={styles.signinContainer}>
          <Text style={styles.signinText}>Already a member?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signinLink}>Login here</Text>
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
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderBottomLeftRadius: 0,
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
    marginTop: 50,
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
    paddingRight: 44,
  },
  line: {
    height: 1,
    backgroundColor: '#E6E6E6',
    marginTop: 0,
  },
  iconButton: {
    position: 'absolute',
    right: 0,
    top: 10,
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
  createButton: {
    marginTop: 22,
    marginBottom: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 26,
    height: 50,
  },
  signinContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  signinText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 15,
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

export default CreatePasswordScreen;