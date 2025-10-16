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

type Props = StackScreenProps<AuthStackParamList, 'CreatePassword'>;

const CreatePasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleCreatePassword = async (): Promise<void> => {
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.createPassword({
        email,
        password
      });
      
      Alert.alert('Success', 'Password created successfully');
      
      // Navigate to sign in screen
      navigation.navigate('SignIn');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Password creation failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(prev => !prev);

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
          <Text style={styles.title}>Create Password</Text>
          <Text style={styles.subtitle}>
            Create a secure password for your account
          </Text>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter Password"
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
            title="CREATE PASSWORD"
            onPress={handleCreatePassword}
            loading={loading}
            disabled={!password || !confirmPassword}
            style={styles.createButton}
          />
        </View>

        {/* Back to Sign In Link */}
        <View style={styles.signinContainer}>
          <Text style={styles.signinText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signinLink}>Sign in here</Text>
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
  iconButton: {
    position: 'absolute',
    right: 0,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
  },
  eyeIcon: {
    width: 22,
    height: 22,
    tintColor: '#444', // makes it grayish, remove if your icon already has color
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
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
    marginTop: 6,
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
  },
  signinLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default CreatePasswordScreen;