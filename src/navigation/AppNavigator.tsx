import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../types/auth';

// Auth Screens
import SplashScreen from '../screens/SplashScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import OtpScreen from '../screens/OtpScreen';
import CreatePasswordScreen from '../screens/CreatePasswordScreen';

// App Screens
import HomeScreen from '../screens/HomeScreen';
import OtpResetPasswordScreen from '../screens/OtpResetPasswordScreen';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="OtpResetPassword" component={OtpResetPasswordScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="CreatePassword" component={CreatePasswordScreen} />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      
    </Stack.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { userToken, isLoading } = useAuth();

  if (isLoading) {
    // We haven't finished checking for the token yet
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {userToken ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;