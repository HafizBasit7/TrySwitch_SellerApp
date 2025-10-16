import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ImageBackground,
  Image,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/auth';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

type Props = StackScreenProps<AuthStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top image */}
      <ImageBackground
        source={require('../assets/images/auth-bg.png')}
        style={styles.topImage}
        resizeMode="cover"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo/logo1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </ImageBackground>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* White Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>
            You are successfully logged in to{'\n'}
            <Text style={styles.sellerText}>Seller Account</Text>
          </Text>



          {/* Logout Button */}
          <Button
            title="LOGOUT"
            onPress={handleLogout}
            style={styles.logoutButton}
          />

          {/* Secondary Action Button */}
          {/* <Button
            title="BACK TO SIGN IN"
            onPress={() => navigation.navigate('SignIn')}
            variant="secondary"
            style={styles.secondaryButton}
          /> */}
        </View>

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Your session is active and secure</Text>
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
    height: '50%',
    width: '100%',
    justifyContent: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 250,
    height: 100
  },
  container: {
    paddingTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    marginTop: -30, // Overlap with background image
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  // subtitle: {
  //   fontSize: 16,
  //   color: '#666',
  //   textAlign: 'center',
  //   marginBottom: 32,
  //   lineHeight: 22,
  // },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },

  sellerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },

  logoutButton: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 26,
    height: 50,
  },
  secondaryButton: {
    marginBottom: 8,
    borderRadius: 26,
    height: 50,
    borderColor: '#007AFF',
  },
  infoContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default HomeScreen;