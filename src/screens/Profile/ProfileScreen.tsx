import React,{useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { DrawerActions, useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { profileAPI } from '../../api/profileAPI';
import { SellerProfile, AppStackParamList } from '../../types/auth';
const { width } = Dimensions.get('window');

type profileScreenNavigationProp = NavigationProp<AppStackParamList, 'Profile'>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<profileScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('profile');
  const { userInfo } = useAuth();
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [profileDeleted, setProfileDeleted] = useState<boolean>(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(false);

  const userEmail = userInfo?.email;

  useFocusEffect(
    useCallback(() => {
      fetchSellerProfile();
    }, [])
  );

  useEffect(() => {
    fetchSellerProfile();
  }, []);

  const fetchSellerProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setProfileExists(false);
      setProfileDeleted(false);
      setIsFirstTimeUser(false);

      console.log('🔄 Fetching seller profile...');
      const response = await profileAPI.getSellerProfile();

      console.log('📦 API Response:', response);

      if (response.sellerProfile) {
        console.log('✅ Profile data found:', response.sellerProfile);
        setSellerProfile(response.sellerProfile);
        setProfileExists(true);
        
        // Check if profile is deleted
        if (response.sellerProfile.status === 'Deleted') {
          setProfileDeleted(true);
        }
      } else if (response.data) {
        console.log('✅ Profile data found in response.data:', response.data);
        setSellerProfile(response.data);
        setProfileExists(true);
      } else {
        console.log('❌ No profile data in response:', response);
        setProfileExists(false);
        setIsFirstTimeUser(true); // This is a first-time user
        setError('No profile found. Please create your profile.');
      }
    } catch (error: any) {
      console.log('❌ Error fetching profile:', error);
      
      // Check specific error cases
      if (error.response?.data?.details === 'This profile is deleted.') {
        setProfileDeleted(true);
        setProfileExists(false);
        setError('Your profile has been deleted. Please create a new profile.');
      } else if (error.response?.status === 404) {
        setProfileExists(false);
        setIsFirstTimeUser(true); // This is a first-time user
        setError('No profile found. Please create your profile.');
      } else {
        setProfileExists(false);
        setIsFirstTimeUser(true); // Assume first-time user on other errors
        setError(`Failed to load profile: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChanged = () => {
    console.log('Password changed successfully');
    fetchSellerProfile();
  };

  // Check if profile exists and has real data
  const hasCompletedProfile = () => {
    if (!sellerProfile || !profileExists || profileDeleted) return false;

    const hasRealData =
      (sellerProfile.name && sellerProfile.name !== '' && sellerProfile.name !== 'string') ||
      (sellerProfile.phoneNumber && sellerProfile.phoneNumber !== '' && sellerProfile.phoneNumber !== 'string') ||
      (sellerProfile.businessName && sellerProfile.businessName !== '' && sellerProfile.businessName !== 'string') ||
      (sellerProfile.servingStates && sellerProfile.servingStates !== '' && sellerProfile.servingStates !== 'string') ||
      (sellerProfile.noOfYears && sellerProfile.noOfYears > 0);

    return sellerProfile.profileStatus === 'Completed' || hasRealData;
  };

  const getDisplayName = () => {
    if (sellerProfile?.name && sellerProfile.name !== '' && sellerProfile.name !== 'string') {
      return sellerProfile.name;
    } else if (userInfo?.email) {
      return userInfo.email;
    }
    return 'User';
  };

  const handleCreateProfile = () => {
    navigation.navigate('EditProfile', { isEditMode: false });
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { isEditMode: true });
  };

  const handleSocialLink = (url: string) => {
    if (url && url !== '' && url !== 'string') {
      let formattedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = 'https://' + url;
      }
      Linking.openURL(formattedUrl).catch(err =>
        console.log('Error opening URL:', err)
      );
    }
  };

  // Helper function to check if a field has real data
  const hasRealData = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') {
      return value.trim() !== '' && value !== 'string';
    }
    if (typeof value === 'number') {
      return value > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0 && value.some(item => item !== '' && item !== 'string');
    }
    return false;
  };

  // Helper function to format array data for display
  const formatArrayData = (data: any): string => {
    if (!data || !hasRealData(data)) return '';

    if (Array.isArray(data)) {
      const filteredData = data.filter(item => item !== '' && item !== 'string');
      return filteredData.join(', ');
    }
    if (typeof data === 'string') {
      return data;
    }
    return '';
  };

  // Render when no profile exists or profile is deleted or first time user
  const renderNoProfileState = () => {
    return (
      <View style={styles.noProfileContainer}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../../assets/icons/profile-illustration1.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
        
        {/* <Text style={styles.noProfileTitle}>
          {profileDeleted ? 'Profile Deleted' : 'Welcome!'}
        </Text> */}
        
        {/* <Text style={styles.noProfileText}>
          {profileDeleted 
            ? 'Your profile has been deleted. Create a new profile to get started.'
            : 'Create your profile to get started and showcase your real estate services.'}
        </Text> */}

        <TouchableOpacity
          style={styles.createProfileButton}
          onPress={handleCreateProfile}
        >
          <Text style={styles.createProfileButtonText}>
            {profileDeleted ? 'CREATE NEW PROFILE' : 'COMPLETE PROFILE'}
          </Text>
        </TouchableOpacity>

        {/* Change Password Button - Always show regardless of profile state */}
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => setIsChangePasswordModalVisible(true)}
        >
          <Text style={styles.changePasswordButtonText}>CHANGE PASSWORD</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProfileInformation = () => {
    // If no profile exists, profile is deleted, or first time user
    if (!profileExists || profileDeleted || isFirstTimeUser) {
      return renderNoProfileState();
    }

    // If profile exists but is not completed
    if (!hasCompletedProfile()) {
      return (
        <View style={styles.incompleteProfileContainer}>
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../../assets/icons/profile-illustration1.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.incompleteProfileTitle}>Complete Your Profile</Text>
          
          <Text style={styles.incompleteProfileText}>
            Your profile is incomplete. Please complete all required information to activate your account.
          </Text>

          <TouchableOpacity
            style={styles.completeProfileButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.completeProfileButtonText}>
              COMPLETE PROFILE
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => setIsChangePasswordModalVisible(true)}
          >
            <Text style={styles.changePasswordButtonText}>CHANGE PASSWORD</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Profile exists and is completed - show profile data
    return (
      <View style={styles.infoContainer}>
        {/* Email Info */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelBlue}>Email Info</Text>
          <View style={styles.fieldContentBox}>
            <Text style={styles.fieldText}>{userEmail || 'No email provided'}</Text>
          </View>
        </View>

        {/* Phone - Only show if not empty */}
        {hasRealData(sellerProfile?.phoneNumber) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelOrange}>Phone</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>{sellerProfile!.phoneNumber}</Text>
            </View>
          </View>
        )}

        {/* About Me - Only show if not empty */}
        {hasRealData(sellerProfile?.aboutMe) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelBlue}>About Me</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>{sellerProfile!.aboutMe}</Text>
            </View>
          </View>
        )}

        {/* Social Media Links - Only show if any exist */}
{(hasRealData(sellerProfile?.facebook) || 
  hasRealData(sellerProfile?.twitter) || 
  hasRealData(sellerProfile?.linkedIn) || 
  hasRealData(sellerProfile?.youtube) || 
  hasRealData(sellerProfile?.tikTok) || 
  hasRealData(sellerProfile?.instagram)) && (
  <View style={styles.fieldWrapper}>
    {/* <Text style={styles.fieldLabelBlue}>Social Media</Text> */}
    {/* <View style={styles.fieldContentBox}> */}
      <View style={styles.socialMediaContainer}>
        {hasRealData(sellerProfile?.facebook) && (
          <TouchableOpacity 
            style={styles.socialMediaButton}
            onPress={() => handleSocialLink(sellerProfile!.facebook)}
          >
            {/* <Text style={styles.socialMediaIcon}>📘</Text> */}
            <Image
              source={require('../../assets/icons/facebook.png')}
              style={styles.socialMediaIcon}
              resizeMode="contain"
            />
            {/* <Text style={styles.socialMediaText}>Facebook</Text> */}
          </TouchableOpacity>
        )}
        
        {hasRealData(sellerProfile?.twitter) && (
          <TouchableOpacity 
            style={styles.socialMediaButton}
            onPress={() => handleSocialLink(sellerProfile!.twitter)}
          >
            <Image
              source={require('../../assets/icons/twitter.png')}
              style={styles.socialMediaIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
        
        {hasRealData(sellerProfile?.linkedIn) && (
          <TouchableOpacity 
            style={styles.socialMediaButton}
            onPress={() => handleSocialLink(sellerProfile!.linkedIn)}
          >
            <Text style={styles.socialMediaIcon}>💼</Text>
            <Text style={styles.socialMediaText}>LinkedIn</Text>
          </TouchableOpacity>
        )}
        
        {hasRealData(sellerProfile?.youtube) && (
          <TouchableOpacity 
            style={styles.socialMediaButton}
            onPress={() => handleSocialLink(sellerProfile!.youtube)}
          >
            <Text style={styles.socialMediaIcon}>▶️</Text>
            <Text style={styles.socialMediaText}>YouTube</Text>
          </TouchableOpacity>
        )}
        
        {hasRealData(sellerProfile?.tikTok) && (
          <TouchableOpacity 
            style={styles.socialMediaButton}
            onPress={() => handleSocialLink(sellerProfile!.tikTok)}
          >
            <Text style={styles.socialMediaIcon}>🎵</Text>
            <Text style={styles.socialMediaText}>TikTok</Text>
          </TouchableOpacity>
        )}
        
        {hasRealData(sellerProfile?.instagram) && (
          <TouchableOpacity 
            style={styles.socialMediaButton}
            onPress={() => handleSocialLink(sellerProfile!.instagram)}
          >
            <Text style={styles.socialMediaIcon}>📷</Text>
            <Text style={styles.socialMediaText}>Instagram</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  // </View>
)}

        {/* Location - Only show if not empty */}
        {hasRealData(sellerProfile?.geographicalAreas) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelOrange}>Location</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>{sellerProfile!.geographicalAreas}</Text>
            </View>
          </View>
        )}

        {/* Serving States - Only show if not empty */}
        {hasRealData(sellerProfile?.servingStates) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelBlue}>Serving States</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>
                {formatArrayData(sellerProfile!.servingStates)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.editProfileButtonText}>EDIT PROFILE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => setIsChangePasswordModalVisible(true)}
        >
          <Text style={styles.changePasswordButtonText}>CHANGE PASSWORD</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBusinessInformation = () => {
    // If no profile exists, profile is deleted, or first time user
    if (!profileExists || profileDeleted || isFirstTimeUser) {
      return renderNoProfileState();
    }

    // If profile exists but is not completed
    if (!hasCompletedProfile()) {
      return (
        <View style={styles.incompleteProfileContainer}>
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../../assets/icons/profile-illustration1.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.incompleteProfileTitle}>Complete Your Profile</Text>
          
          <Text style={styles.incompleteProfileText}>
            Your profile is incomplete. Please complete all required information to activate your account.
          </Text>

          <TouchableOpacity
            style={styles.completeProfileButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.completeProfileButtonText}>
              COMPLETE PROFILE
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => setIsChangePasswordModalVisible(true)}
          >
            <Text style={styles.changePasswordButtonText}>CHANGE PASSWORD</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Profile exists and is completed - show business data
    return (
      <View style={styles.infoContainer}>
        {/* Business Name - Only show if not empty */}
        {hasRealData(sellerProfile?.businessName) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelBlue}>Business Name</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>{sellerProfile!.businessName}</Text>
            </View>
          </View>
        )}

        {/* Website - Only show if not empty */}
        {hasRealData(sellerProfile?.personalWebsite) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelOrange}>Website</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>{sellerProfile!.personalWebsite}</Text>
            </View>
          </View>
        )}

        {/* Years in Real Estate - Only show if greater than 0 */}
        {hasRealData(sellerProfile?.noOfYears) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelBlue}>Years in Real Estate</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>{sellerProfile!.noOfYears}</Text>
            </View>
          </View>
        )}

        {/* Language Spoken - Only show if not empty */}
        {hasRealData(sellerProfile?.language) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelOrange}>Language Spoken</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>
                {formatArrayData(sellerProfile!.language)}
              </Text>
            </View>
          </View>
        )}

        {/* Market Specialties - Only show if not empty */}
        {hasRealData(sellerProfile?.market) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelBlue}>Market Specialties</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>
                {formatArrayData(sellerProfile!.market)}
              </Text>
            </View>
          </View>
        )}

        {/* Brokerage Name - Only show if not empty */}
        {hasRealData(sellerProfile?.brokerName) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelOrange}>Brokerage Name</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>{sellerProfile!.brokerName}</Text>
            </View>
          </View>
        )}

        {/* Brokerage Contact - Only show if not empty */}
        {hasRealData(sellerProfile?.brokerContact) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelBlue}>Brokerage Contact</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>{sellerProfile!.brokerContact}</Text>
            </View>
          </View>
        )}

        {/* Real Estate ID - Only show if not empty */}
        {hasRealData(sellerProfile?.realStateIdNo) && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelOrange}>Real Estate ID</Text>
            <View style={styles.fieldContentBox}>
              <Text style={styles.fieldText}>{sellerProfile!.realStateIdNo}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderReviews = () => {
    // If no profile exists, profile is deleted, or first time user
    if (!profileExists || profileDeleted || isFirstTimeUser) {
      return renderNoProfileState();
    }

    return (
      <View style={styles.reviewsContainer}>
        <Text style={styles.noReviewsText}>No reviews yet</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error && !profileExists && !profileDeleted && !isFirstTimeUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSellerProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerBackground}>
        <View style={styles.imageWrapper}>
          <Image
            source={require('../../assets/images/auth-bg.png')}
            style={styles.topImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Image
              source={require('../../assets/icons/bell.png')}
              style={styles.bellIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <View style={styles.hamburgerIcon}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                sellerProfile?.userProfileImage && hasRealData(sellerProfile.userProfileImage) && profileExists && !profileDeleted && !isFirstTimeUser
                  ? { uri: sellerProfile.userProfileImage }
                  : require('../../assets/icons/default.png')
              }
              style={styles.profileImage}
            />
            {(profileExists && !profileDeleted && !isFirstTimeUser) && (
              <TouchableOpacity
                style={styles.editIconContainer}
                onPress={handleEditProfile}
              >
                <Image
                  source={require('../../assets/icons/edit.png')}
                  style={styles.editIcon}
                />
              </TouchableOpacity>
            )}
          </View>
          {(profileExists && !profileDeleted && !isFirstTimeUser && hasCompletedProfile()) && (
            <View style={styles.verifiedBadge}>
              <Image
                source={require('../../assets/icons/verified.png')}
                style={styles.verifiedIcon}
              />
            </View>
          )}
        </View>
      </View>

      <View style={styles.whiteCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.userName}>{getDisplayName()}</Text>

         
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScrollContainer}
                contentContainerStyle={styles.tabsContentContainer}
              >
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
                  onPress={() => setActiveTab('profile')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === 'profile' && styles.activeTabText,
                    ]}
                  >
                    Profile Information
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'business' && styles.activeTab]}
                  onPress={() => setActiveTab('business')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === 'business' && styles.activeTabText,
                    ]}
                  >
                    Business Information
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
                  onPress={() => setActiveTab('reviews')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === 'reviews' && styles.activeTabText,
                    ]}
                  >
                    Reviews
                  </Text>
                </TouchableOpacity>
              </ScrollView>
              <View style={styles.tabDivider} />
            </>
         

          {/* Tab Content */}
          {activeTab === 'profile' && renderProfileInformation()}
          {activeTab === 'business' && renderBusinessInformation()}
          {activeTab === 'reviews' && renderReviews()}

          <ChangePasswordModal
            visible={isChangePasswordModalVisible}
            onClose={() => setIsChangePasswordModalVisible(false)}
            onPasswordChanged={handlePasswordChanged}
            userEmail={userEmail}
          />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  noProfileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  incompleteProfileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noProfileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  incompleteProfileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  noProfileText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  incompleteProfileText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  createProfileButton: {
    width: '100%',
    backgroundColor: '#5B21B6',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#5B21B6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  createProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerBackground: {
    height: 160,
    overflow: 'visible',
    zIndex: 50,
  },
  imageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    zIndex: 1,
  },
  topImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
  hamburgerIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  profileSection: {
    alignItems: 'center',
    position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
  },
  profileImageContainer: {
    position: 'relative',
    zIndex: 101,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: '#d0d0d0',
    borderWidth: 4,
    borderColor: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  editIcon: {
    width: 16,
    height: 16,
    tintColor: '#6C63FF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: width / 2 - 60,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    width: 20,
    height: 20,
  },
  whiteCard: {
    backgroundColor: '#fff',
    marginTop: -10,
    marginHorizontal: 8,
    borderRadius: 20,
    paddingTop: 60,
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
    maxHeight: 560,
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
    marginTop: 20,
    marginBottom: 10,
  },
  deletedProfileContainer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  deletedProfileText: {
    fontSize: 14,
    color: '#FF6B35',
    textAlign: 'center',
    fontWeight: '500',
  },
  tabDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
  },
  tabsScrollContainer: {
    marginBottom: 20,
  },
  tabsContentContainer: {
    paddingRight: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  infoContainer: {
    paddingVertical: 10,
  },
  // CONSISTENT FIELD STYLES
  fieldWrapper: {
    marginBottom: 24,
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
    width: width - 90,
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
  verificationContainer: {
    gap: 8,
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  illustration: {
    width: width - 100,
    height: 150,
  },
  editProfileButton: {
    width: '100%',
    backgroundColor: '#5B21B6',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    shadowColor: '#5B21B6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  completeProfileButton: {
    width: '100%',
    backgroundColor: '#5B21B6',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#5B21B6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  completeProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  changePasswordButton: {
    width: '100%',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  reviewsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#999',
  },
  socialMediaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14, // Consistent spacing between icons
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  socialMediaButton: {
    width: 44, // Fixed size for consistent touch area
    height: 44,
    borderRadius: 22, // Perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  socialMediaIcon: {
    width: 34, // Consistent icon size
    height: 34,
    resizeMode: 'contain', // Ensure icons maintain aspect ratio
  },
  socialMediaText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
});

export default ProfileScreen;