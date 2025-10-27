// src/navigation/ListingStackNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ListingStackParamList } from './types';
import ListingScreen from '../screens/Listings/ListingScreen';
import CreateListingScreen from '../screens/Listings/CreateListingScreen';
import PreviewListingScreen from '../screens/Listings/PreviewListingScreen';
import ListingDetailScreen from '../screens/Listings/ListingDetailScreen';
import EditListingScreen from '../screens/Listings/EditListingScreen';

const Stack = createStackNavigator<ListingStackParamList>();

const ListingStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListingMain" component={ListingScreen} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} />
      <Stack.Screen name="PreviewListing" component={PreviewListingScreen} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="EditListing" component={EditListingScreen} />
    </Stack.Navigator>
  );
};

export default ListingStackNavigator;