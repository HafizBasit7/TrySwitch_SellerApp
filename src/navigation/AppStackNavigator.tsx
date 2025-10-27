// src/navigation/AppStackNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppStackParamList } from '../types/auth';
import DrawerNavigator from './DrawerNavigator';

const Stack = createStackNavigator<AppStackParamList>();

const AppStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={DrawerNavigator} />
    </Stack.Navigator>
  );
};

export default AppStackNavigator;