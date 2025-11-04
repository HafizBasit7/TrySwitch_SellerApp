// src/navigation/ChatsStackNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChatsScreen from '../screens/Chat/ChatsScreen';
// import ChatConversationScreen from '../screens/Chat/ChatConversationScreen'; // If you have this
import { ChatsStackParamList } from './types';

const Stack = createStackNavigator<ChatsStackParamList>();

const ChatsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF4500',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="ChatsMain" 
        component={ChatsScreen}
        options={{
          title: 'Messages',
          headerShown: true,
        }}
      />
      {/* <Stack.Screen 
        name="ChatConversation" 
        component={ChatConversationScreen}
        options={({ route }) => ({
          title: route.params?.userName || 'Chat',
          headerShown: true,
        })}
      /> */}
    </Stack.Navigator>
  );
};

export default ChatsStackNavigator;