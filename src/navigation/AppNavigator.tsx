import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Image, StyleSheet, View, ImageBackground, Text } from 'react-native';
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
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ListingScreen from '../screens/Listings/ListingScreen';
import FollowersScreen from '../screens/Followers/FollowersScreen';
import ChatsScreen from '../screens/Chat/ChatsScreen';
import MyTasksScreen from '../screens/Tasks/MyTasksScreen';

// Import Sidebar
import CustomDrawer from '../components/CustomDrawer';

const Stack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
        },
        tabBarBackground: () => (
          <ImageBackground
            source={require('../assets/images/auth-bg.png')}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ),
        // Remove default label styling since we'll handle it in icon
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Listing" 
        component={ListingScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.tabItem}>
              <Image 
                source={require('../assets/icons/listing.png')}
                style={[styles.tabIcon, { tintColor: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }]}
              />
              <Text style={[
                styles.tabLabel, 
                { color: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }
              ]}>
                Listing
              </Text>
              {focused && <View style={styles.activeTabIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Followers" 
        component={FollowersScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.tabItem}>
              <Image 
                source={require('../assets/icons/followers.png')}
                style={[styles.tabIcon, { tintColor: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }]}
              />
              <Text style={[
                styles.tabLabel, 
                { color: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }
              ]}>
                Followers
              </Text>
              {focused && <View style={styles.activeTabIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.tabItem}>
              <Image 
                source={require('../assets/icons/chat.png')}
                style={[styles.tabIcon, { tintColor: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }]}
              />
              <Text style={[
                styles.tabLabel, 
                { color: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }
              ]}>
                Chats
              </Text>
              {focused && <View style={styles.activeTabIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="MyTasks" 
        component={MyTasksScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.tabItem}>
              <Image 
                source={require('../assets/icons/tasks.png')}
                style={[styles.tabIcon, { tintColor: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }]}
              />
              <Text style={[
                styles.tabLabel, 
                { color: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }
              ]}>
                My Tasks
              </Text>
              {focused && <View style={styles.activeTabIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.tabItem}>
              <Image 
                source={require('../assets/icons/profile.png')}
                style={[styles.tabIcon, { tintColor: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }]}
              />
              <Text style={[
                styles.tabLabel, 
                { color: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }
              ]}>
                Profile
              </Text>
              {focused && <View style={styles.activeTabIndicator} />}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  tabIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeTabIndicator: {
    width: 50,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});

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

// Drawer Navigator
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 280,
        },
        drawerPosition: 'right',
        overlayColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={BottomTabNavigator}
      />
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen}
      />
    </Drawer.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={DrawerNavigator} />
    </Stack.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { userToken, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {userToken ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;