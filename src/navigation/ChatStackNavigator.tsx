import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ChatsScreen from '../screens/Chat/ChatsScreen';
import ChatConversationScreen from '../screens/Chat/ChatConversationScreen';
import { investorAPI } from '../api/investorAPI';
import { ChatsStackParamList } from './types';
import MarketplaceMessagesScreen from '../screens/Chat/MarketplaceMessagesScreen';
import MarketplaceConversationScreen from '../screens/Chat/MarketplaceConversationScreen';

const Stack = createStackNavigator<ChatsStackParamList>();

// Custom header left component
const ChatConversationHeaderLeft: React.FC<{
  userId: string;
  userName: string;
  userProfileImage?: string;
  onPress: () => void;
}> = ({ userId, userName, userProfileImage, onPress }) => {
  const [investorImage, setInvestorImage] = useState(userProfileImage);
  const [investorName, setInvestorName] = useState(userName);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await investorAPI.getInvestorProfileById(userId);
        if (response.success && response.investorProfile) {
          setInvestorImage(response.investorProfile.userProfileImage);
          setInvestorName(response.investorProfile.name);
        }
      } catch (error) {
        console.error('Error fetching investor profile for header:', error);
      }
    };
    fetchProfile();
  }, [userId]);

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={{ 
        marginLeft: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Back Arrow */}
      <View style={{
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
      }}>
        <View style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderTopWidth: 6,
          borderRightWidth: 10,
          borderBottomWidth: 6,
          borderLeftWidth: 0,
          borderTopColor: 'transparent',
          borderRightColor: '#fff',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
        }} />
      </View>

      {/* Avatar */}
      {investorImage ? (
        <Image
          source={{ uri: investorImage }}
          style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 16,
            borderWidth: 2,
            borderColor: '#fff',
          }}
        />
      ) : (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#fff',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#FFE5DC',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              color: '#FF4500',
              fontSize: 14,
              fontWeight: 'bold',
            }}>
              {investorName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ✅ Wrapper component to hide tab bar for Chat Conversation
const ChatConversationScreenWithHiddenTabs = (props: any) => {
  const navigation = props.navigation;

  useFocusEffect(
    React.useCallback(() => {
      // Hide tab bar on focus
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        // Show tab bar again when leaving
        parent?.setOptions({
          tabBarStyle: { display: 'flex' },
        });
      };
    }, [navigation])
  );

  return <ChatConversationScreen {...props} />;
};

// ✅ Wrapper component to hide tab bar for Marketplace Conversation
const MarketplaceConversationScreenWithHiddenTabs = (props: any) => {
  const navigation = props.navigation;

  useFocusEffect(
    React.useCallback(() => {
      // Hide tab bar on focus
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        // Show tab bar again when leaving
        parent?.setOptions({
          tabBarStyle: { display: 'flex' },
        });
      };
    }, [navigation])
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
          height: 80,
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
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="ChatConversation" 
        component={ChatConversationScreenWithHiddenTabs}
        options={({ route, navigation }) => ({
          title: 'Inbox',
          headerShown: true,
       
        })}
      />
      <Stack.Screen 
        name="MarketplaceMessages" 
        component={MarketplaceMessagesScreen}
        options={{
          title: 'Property Hub',
          headerShown: true,
           headerStyle: {
            backgroundColor: '#FF4500',
            elevation: 0,
            shadowOpacity: 0,
            height:80
          },
        }}
      />
      <Stack.Screen 
        name="MarketplaceConversationScreen" 
        component={MarketplaceConversationScreenWithHiddenTabs}
        options={({ route, navigation }) => ({
          title:  'Inbox',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#FF4500',
            elevation: 0,
            shadowOpacity: 0,
            height:80
          },
          headerTintColor: '#fff',
         
        })}
      />
    </Stack.Navigator>
  );
};

export default ChatsStackNavigator;