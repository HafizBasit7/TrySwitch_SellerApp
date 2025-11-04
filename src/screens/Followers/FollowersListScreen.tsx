// Updated FollowersListScreen.tsx
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native';
import { investorAPI } from '../../api/investorAPI';
import { InvestorProfile, FollowerData } from '../../types/investorTypes';

// Define the actual response interface based on your logs
interface ActualInvestorData {
  id?: number;
  investorId: string;
  name: string;
  profileImage: string;
  profileVerificationStatus: boolean;
  userId?: string;
  email?: string;
  companyName?: string;
  market?: string[];
}

export const FollowersListScreen = ({ navigation }: any) => {
  const [followers, setFollowers] = useState<ActualInvestorData[]>([]);
  const [filteredFollowers, setFilteredFollowers] = useState<ActualInvestorData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
  }, []);

  // Fetch followers whenever the screen becomes active
useFocusEffect(
  useCallback(() => {
    fetchFollowers();
  }, [])
);


  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, followers]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const response = await investorAPI.getInvestorsFollowingSeller();
      
      // console.log('📊 Raw API response:', JSON.stringify(response, null, 2));
      
      // Extract investors from response with proper error handling
      let allInvestors: ActualInvestorData[] = [];
      
      if (Array.isArray(response)) {
        allInvestors = response.flatMap((data: any) => {
          // Check if data exists and has investors array
          if (data && Array.isArray(data.investors)) {
            return data.investors
              .filter((investor: any) => investor != null)
              .map((investor: any) => ({
                investorId: investor.investorId,
                name: investor.name,
                profileImage: investor.profileImage,
                profileVerificationStatus: investor.profileVerificationStatus,
                id: investor.id,
                userId: investor.userId,
                email: investor.email,
                companyName: investor.companyName,
                market: investor.market
              }));
          }
          return [];
        });
      }
      
      console.log('👥 Processed investors:', allInvestors);
      setFollowers(allInvestors);
      setFilteredFollowers(allInvestors);
    } catch (error) {
      console.error('❌ Error fetching followers:', error);
      Alert.alert('Error', 'Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    if (!text.trim()) {
      setFilteredFollowers(followers);
      return;
    }
    
    const term = text.toLowerCase();
    const filtered = followers.filter(investor => 
      investor.name.toLowerCase().includes(term) ||
      investor.email?.toLowerCase().includes(term) ||
      investor.companyName?.toLowerCase().includes(term)
    );
    setFilteredFollowers(filtered);
  };

  const handleRemoveFollower = async (investorId: string, investorName: string) => {
    if (!investorId) {
      Alert.alert('Error', 'Cannot remove follower: Missing investor ID');
      return;
    }

    Alert.alert(
      'Remove Follower',
      `Are you sure you want to remove ${investorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await investorAPI.removeInvestorFromFollowing(investorId);
              Alert.alert('Success', 'Follower removed successfully');
              fetchFollowers(); // Refresh list
            } catch (error) {
              console.error('❌ Error removing follower:', error);
              Alert.alert('Error', 'Failed to remove follower');
            }
          }
        }
      ]
    );
  };

  const handleInvestorPress = (investor: ActualInvestorData) => {
    console.log('🔄 Navigating to investor profile with data:', investor);
    
    // Check if we have investorId to fetch profile
    if (!investor.investorId) {
      Alert.alert('Error', 'Cannot view profile: Missing investor ID');
      return;
    }
    
    navigation.navigate('InvestorProfile', { investor });
  };

  // Safe key extractor
  const keyExtractor = (item: ActualInvestorData, index: number) => {
    return item.investorId || `follower-${index}`;
  };

  // Improved image source handling
  const getImageSource = (item: ActualInvestorData) => {
    if (item.profileImage && item.profileImage.startsWith('http')) {
      return { uri: item.profileImage };
    }
    // Use local placeholder if no valid image
    // return require('../../assets/images/placeholder-avatar.png');
  };

  const renderFollowerItem = ({ item }: { item: ActualInvestorData }) => (
    <TouchableOpacity 
      style={styles.followerCard}
      onPress={() => handleInvestorPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={getImageSource(item)}
        style={styles.profileImage}
        onError={(e) => {
          console.log('Image load error, using placeholder');
        }}
      />
      <View style={styles.followerInfo}>
        <Text style={styles.followerName}>
          {item.name || 'Unknown User'}
        </Text>
        {item.companyName && (
          <Text style={styles.followerCompany}>{item.companyName}</Text>
        )}
        {item.email && (
          <Text style={styles.followerEmail}>{item.email}</Text>
        )}
        {item.market && item.market.length > 0 && (
          <Text style={styles.followerMarket}>
            {Array.isArray(item.market) ? item.market.join(', ') : item.market}
          </Text>
        )}
       
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={(e) => {
          e.stopPropagation();
          if (item.investorId) {
            handleRemoveFollower(item.investorId, item.name || 'this follower');
          } else {
            Alert.alert('Error', 'Cannot remove: Missing investor ID');
          }
        }}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Safe data check for FlatList
  const safeData = Array.isArray(filteredFollowers) ? filteredFollowers : [];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name"
          placeholderTextColor="#999"
          value={searchTerm}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        <Image 
          source={require('../../assets/icons/search.png')}
          style={styles.searchIcon}
        />
      </View>

      {/* Invite Clients Button */}
      <TouchableOpacity
        style={styles.inviteButton}
        onPress={() => navigation.navigate('InviteClients', { refresh: true })}
      >
        <Text style={styles.inviteButtonText}>Invite Clients</Text>
      </TouchableOpacity>

     

      {/* Followers List */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF4500" style={styles.loader} />
      ) : safeData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchTerm.trim() ? 'No matching followers found' : 'No followers available'}
          </Text>
          {/* <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchFollowers}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity> */}
        </View>
      ) : (
        <FlatList
          data={safeData}
          renderItem={renderFollowerItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#FF4500',
  },
  inviteButton: {
    backgroundColor: '#FF4500',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsText: {
    paddingHorizontal: 16,
    marginBottom: 8,
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  followerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  followerInfo: {
    flex: 1,
    marginRight: 12,
  },
  followerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  followerCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  followerEmail: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  followerMarket: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  verificationStatus: {
    fontSize: 11,
    color: '#FF4500',
    marginTop: 2,
    fontStyle: 'italic',
  },
  removeButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default FollowersListScreen;