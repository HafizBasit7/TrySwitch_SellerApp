import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { ChatsStackParamList } from './types';
import ChatsScreen from '../screens/Chat/ChatsScreen';
import ChatConversationScreen from '../screens/Chat/ChatConversationScreen';
import MarketplaceMessagesScreen from '../screens/Chat/MarketplaceMessagesScreen';
import MarketplaceConversationScreen from '../screens/Chat/MarketplaceConversationScreen';

const Stack = createStackNavigator<ChatsStackParamList>();

// ✅ Wrapper component to hide tab bar for Chat Conversation
const ChatConversationWithHiddenTabs: React.FC<any> = (props) => {
  useFocusEffect(
    React.useCallback(() => {
      // Hide tab bar when screen is focused
      const parent = props.navigation.getParent();
      parent?.setOptions({
        tabBarStyle: {
          display: 'none',
        },
      });

      return () => {
        // Show tab bar when screen is unfocused
        parent?.setOptions({
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
        });
      };
    }, [props.navigation])
  );

  return <ChatConversationScreen {...props} />;
};

// ✅ Wrapper component to hide tab bar for Marketplace Conversation
const MarketplaceConversationWithHiddenTabs: React.FC<any> = (props) => {
  useFocusEffect(
    React.useCallback(() => {
      // Hide tab bar when screen is focused
      const parent = props.navigation.getParent();
      parent?.setOptions({
        tabBarStyle: {
          display: 'none',
        },
      });

      return () => {
        // Show tab bar when screen is unfocused
        parent?.setOptions({
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
        });
      };
    }, [props.navigation])
  );

  return <MarketplaceConversationScreen {...props} />;
};

const ChatsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF4500',
          elevation: 0,
          shadowOpacity: 0,
          height: 80, // Consistent height across all navigators
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="ChatsMain" 
        component={ChatsScreen}
        options={{
          title: 'Inbox',
        }}
      />
      <Stack.Screen 
        name="ChatConversation" 
        component={ChatConversationWithHiddenTabs}
        options={{
          title: 'Inbox',
        }}
      />
      <Stack.Screen 
        name="MarketplaceMessages" 
        component={MarketplaceMessagesScreen}
        options={{
          title: 'Property Hub',
        }}
      />
      <Stack.Screen 
        name="MarketplaceConversationScreen" 
        component={MarketplaceConversationWithHiddenTabs}
        options={{
          title: 'Inbox',
        }}
      />
    </Stack.Navigator>
  );
};

export default ChatsStackNavigator;