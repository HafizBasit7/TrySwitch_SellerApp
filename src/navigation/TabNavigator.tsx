// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet, View, ImageBackground, Text } from 'react-native';
import { BottomTabParamList } from './types';
import ListingStackNavigator from './ListingStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import FollowersScreen from '../screens/Followers/FollowersScreen';
import ChatsScreen from '../screens/Chat/ChatsScreen';
import MyTasksScreen from '../screens/Tasks/MyTasksScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

interface TabIconProps {
  focused: boolean;
  iconSource: any;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, iconSource, label }) => (
  <View style={styles.tabItem}>
    <Image 
      source={iconSource}
      style={[styles.tabIcon, { tintColor: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }]}
    />
    <Text style={[
      styles.tabLabel, 
      { color: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }
    ]}>
      {label}
    </Text>
    {focused && <View style={styles.activeTabIndicator} />}
  </View>
);

const TabNavigator: React.FC = () => {
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
        tabBarShowLabel: false,
      }}
    >
   <Tab.Screen 
  name="Listing" 
  component={ListingStackNavigator}
  options={{
    tabBarIcon: ({ focused }) => (
      <TabIcon 
        focused={focused}
        iconSource={require('../assets/icons/listing.png')}
        label="Listing"
      />
    ),
  }}
/>
      <Tab.Screen 
        name="Followers" 
        component={FollowersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused}
              iconSource={require('../assets/icons/followers.png')}
              label="Followers"
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused}
              iconSource={require('../assets/icons/chat.png')}
              label="Chats"
            />
          ),
        }}
      />
      <Tab.Screen 
        name="MyTasks" 
        component={MyTasksScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused}
              iconSource={require('../assets/icons/tasks.png')}
              label="My Tasks"
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused}
              iconSource={require('../assets/icons/profile.png')}
              label="Profile"
            />
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

export default TabNavigator;