// src/navigation/FollowersStackNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import InviteClientsScreen from '../screens/Followers/InviteClientsScreen'
import FollowersListScreen from '../screens/Followers/FollowersListScreen';
import InvestorProfileScreen from '../screens/Followers/InvestorProfileScreen';

import { FollowersStackParamList } from './types';

const Stack = createStackNavigator<FollowersStackParamList>();

const FollowersStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF4500',
          height: 80,
          
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',

        },
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',

      }}
    >
 
       <Stack.Screen 
        name="FollowersList" 
        component={FollowersListScreen}
        options={{
          title: 'FollowersList',
          headerShown: true,
          
        }}
      />

      <Stack.Screen 
        name="InviteClients" 
        component={InviteClientsScreen}
        options={{
          title: 'Invite Clients',
          headerShown: true,
        }}
      />

       <Stack.Screen 
        name="InvestorProfile" 
        component={InvestorProfileScreen}
        options={{
          title: 'Followers',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default FollowersStackNavigator;