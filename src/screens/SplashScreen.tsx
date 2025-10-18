import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/auth';

type Props = StackScreenProps<AuthStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('SignIn'); // navigate to SignIn after splash
    }, 3000); 

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <Image
        source={require('../assets/logo/Logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 150,
  },
});

export default SplashScreen;
