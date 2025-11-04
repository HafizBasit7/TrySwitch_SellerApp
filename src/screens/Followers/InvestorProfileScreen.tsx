// Updated InvestorProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { investorAPI } from '../../api/investorAPI';

const { width } = Dimensions.get('window');

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
  phoneNumber?: string;
  geographicalAreas?: string;
  status?: string;
  profileStatus?: string;
}

interface InvestorProfileScreenProps {
  route: any;
  navigation: any;
}

export const InvestorProfileScreen: React.FC<InvestorProfileScreenProps> = ({ route, navigation }) => {
  const { investor } = route.params;
  const [investorData, setInvestorData] = useState<ActualInvestorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullProfileData, setFullProfileData] = useState<any>(null);

  useEffect(() => {
    fetchInvestorProfile();
  }, []);

  const fetchInvestorProfile = async () => {
    try {
      setLoading(true);
      
      // Use the passed investor data immediately
      setInvestorData(investor);
      
      // Get investor ID from the passed investor object - use investorId
      const investorId = investor?.investorId || investor?.userId;
      
      if (!investorId) {
        console.log('⚠️ No investor ID available, using basic data');
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching full investor profile for ID:', investorId);
      
      try {
        // Fetch full profile details using the correct API with investorId
        const fullProfile = await investorAPI.getInvestorProfileById(investorId);
        console.log('✅ Received full investor data:', fullProfile);
        setFullProfileData(fullProfile);
      } catch (apiError) {
        console.log('⚠️ Full profile API failed, using basic data:', apiError);
        // We'll use the basic data we already have
      }
    } catch (error) {
      console.error('❌ Error in investor profile flow:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse market data
  const parseMarkets = (marketData: string[]): string[] => {
    if (!marketData || marketData.length === 0) return [];
    
    try {
      const marketString = marketData[0];
      if (marketString && marketString.startsWith('[')) {
        const parsed = JSON.parse(marketString);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      return marketData;
    } catch (error) {
      console.log('Error parsing markets, returning raw data:', error);
      return marketData;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF4500" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!investorData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load investor profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInvestorProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Use full profile data if available, otherwise use basic data
  const displayData = fullProfileData || investorData;
  
  // Extract and parse data
  const displayName = displayData.name || 'Unknown User';
  const companyName = displayData.companyName || 'No Company';
  const geographicalAreas = displayData.geographicalAreas || 'Not specified';
  const markets = parseMarkets(displayData.market || []);
  const displayMarkets = markets.length > 0 ? markets.join(', ') : 'Not specified';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
     

      {/* Profile Image positioned half outside the white card */}
      <View style={styles.profileImageContainer}>
        <Image
          source={{ 
            uri: displayData.profileImage || displayData.userProfileImage || 'https://via.placeholder.com/100x100?text=No+Image'
          }}
          style={styles.profileImage}
          onError={(e) => console.log('Image load error')}
        />
      </View>

      <View style={styles.whiteCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Name below the profile image */}
          <Text style={styles.userName}>{displayName}</Text>

          {/* Information Container */}
          <View style={styles.infoContainer}>
            
            {/* Preferred State Section */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabelBlue}>Preferred State</Text>
              <View style={styles.fieldContentBox}>
                <Text style={styles.fieldText}>
                  {geographicalAreas}
                </Text>
              </View>
            </View>

            {/* Preferred City Section */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabelOrange}>Preferred City</Text>
              <View style={styles.fieldContentBox}>
                <Text style={styles.fieldText}>
                  {displayMarkets}
                </Text>
              </View>
            </View>

            {/* Company Name Section */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabelBlue}>Company Name</Text>
              <View style={styles.fieldContentBox}>
                <Text style={styles.fieldText}>{companyName}</Text>
              </View>
            </View>

          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#000',
    fontWeight: 'normal',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  // Profile image container positioned absolutely to overlap the white card
  profileImageContainer: {
    position: 'relative',
    top: 20, // Position below header
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    elevation: 100,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  whiteCard: {
    backgroundColor: '#fff',
    marginTop: -14, // Reduced margin to allow image overlap
    marginHorizontal: 12,
    borderRadius: 20,
    paddingTop: 30, // Increased padding to accommodate the overlapping image
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    flex: 1,
    maxHeight: 500,
    position: 'relative',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 10, // Reduced margin since image is above
    marginBottom: 30,
  },
  infoContainer: {
    paddingVertical: 10,
  },
  // CONSISTENT FIELD STYLES
  fieldWrapper: {
    marginBottom: 44,
    alignItems: 'center',
    position: 'relative',
  },
  fieldLabelBlue: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    position: 'absolute',
    top: -22,
    zIndex: 2,
    elevation: 2,
    borderBottomWidth: 3,
    borderBottomColor: '#6366F1',
  },
  fieldLabelOrange: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
    backgroundColor: '#FFF4ED',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    position: 'absolute',
    top: -22,
    zIndex: 2,
    elevation: 2,
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B35',
  },
  fieldContentBox: {
    width: width - 100,
    minHeight: 56,
    backgroundColor: '#ffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 16,
    paddingTop: 20,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fieldText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default InvestorProfileScreen;