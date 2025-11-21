import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet, View, ImageBackground, Text, Keyboard } from 'react-native';
import { BottomTabParamList } from './types';
import ListingStackNavigator from './ListingStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import TasksStackNavigator from './TasksStackNavigator';
import ChatsStackNavigator from './ChatStackNavigator';
import FollowersStackNavigator from './FollowersStackNavigator';

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
    <Text style={[styles.tabLabel, { color: focused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }]}>
      {label}
    </Text>
    {focused && <View style={styles.activeTabIndicator} />}
  </View>
);

// Custom curved background component
const CurvedTabBarBackground: React.FC = () => (
  <View style={styles.curvedBackground}>
    <ImageBackground
      source={require('../assets/images/auth-bg.png')}
      style={StyleSheet.absoluteFillObject}
      resizeMode="cover"
    />
  </View>
);

const TabNavigator: React.FC = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: isKeyboardVisible ? styles.tabBarHidden : styles.tabBarVisible,
        tabBarBackground: () => <CurvedTabBarBackground />,
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
        component={FollowersStackNavigator}
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
        component={ChatsStackNavigator}
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
        component={TasksStackNavigator}
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
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  activeTabIndicator: {
    width: 80,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  tabBarVisible: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 65, // Slightly increased height for better curve visibility
  },
  tabBarHidden: {
    display: 'none',
  },
  curvedBackground: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 25, // Adjust this value for more/less curve
    borderTopRightRadius: 25, // Adjust this value for more/less curve
    overflow: 'hidden',
  },
});

export default TabNavigator;