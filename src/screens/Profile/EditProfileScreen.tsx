import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, DrawerActions, } from '@react-navigation/native';

import { useAuth } from '../../context/AuthContext';
import { profileAPI, smsAPI  } from '../../api/profileAPI';
import { useImagePicker } from '../../hooks/useImagePicker';

const { width } = Dimensions.get('window');

interface FormData {
  name: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  personalWebsite: string;
  servingStates: string[];
  numberOfYears: number;
  languages: string[];
  userProfileImage: string;
  passportUploads: string[];
  driversLicenseUploads: string[];
  stateIDUploads: string[];
  militaryIdUploads: string[];
  greenCardUploads: string[];
  votersCardUploads: string[];
  realStateIdNo: string;
  realStateId: string;
  companyLogo: string;
  brokerName: string;
  brokerContact: string;
  market: string[];
  geographicalAreas: string;
  aboutMe: string;
  facebook: string;
  twitter: string;
  linkedIn: string;
  youtube: string;
  tikTok: string;
  instagram: string;
}

interface RouteParams {
  isEditMode?: boolean;
  existingProfile?: any;
}

const MARKET_OPTIONS = ['Residential', 'Commercial', 'Industrial', 'Land', 'Luxury'];
const LANGUAGE_OPTIONS = ['English', 'Urdu', 'German', 'Swedish', 'French', 'Spanish', 'Arabic'];
const GOVT_ID_OPTIONS = ['Passport', "Driver's License", 'State ID Card', 'Military ID Card', 'Green Card', "Voter's Registration Card"];
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

// Helper function to check if value is valid (not empty, null, undefined, or 'string')
const isValidValue = (value: any): boolean => {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'string' && (value.toLowerCase() === 'string' || value.trim() === '')) return false;
  if (typeof value === 'number' && value === 0) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
};

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profileDeleted, setProfileDeleted] = useState(false);

  // Dropdown states
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showGovtIdDropdown, setShowGovtIdDropdown] = useState(false);
  const [showStatesDropdown, setShowStatesDropdown] = useState(false);

  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const { pickAndUploadMedia, pickAndUploadDocument, uploading, uploadingDocument } = useImagePicker();
  const [currentlyUploading, setCurrentlyUploading] = useState<String | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    phoneNumber: '',
    businessName: '',
    personalWebsite: '',
    servingStates: [],
    numberOfYears: 0,
    languages: [],
    userProfileImage: '',
    passportUploads: [],
    driversLicenseUploads: [],
    stateIDUploads: [],
    militaryIdUploads: [],
    greenCardUploads: [],
    votersCardUploads: [],
    realStateIdNo: '',
    realStateId: '',
    companyLogo: '',
    brokerName: '',
    brokerContact: '',
    market: [],
    geographicalAreas: '',
    aboutMe: '',
    facebook: '',
    twitter: '',
    linkedIn: '',
    youtube: '',
    tikTok: '',
    instagram: '',
  });

  useEffect(() => {
    const params = route.params as RouteParams;
    if (params?.isEditMode) {
      setIsEditMode(true);
      loadExistingProfile();
    } else {
      // For new profile creation, check if profile exists
      checkProfileExists();
    }
  }, [route.params]);


  const handleSendOTP = async () => {
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number first');
      return;
    }
  
    // Basic validation - ensure it's a Pakistani mobile number
    const cleanNumber = formData.phoneNumber.replace(/\D/g, '');
    
    // Pakistani mobile numbers: 03XXXXXXXXX or 3XXXXXXXXX
    if (cleanNumber.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 11-digit mobile number (e.g., 03001234567)');
      return;
    }
  
    // Check if it's a valid Pakistani mobile format
    const isValidPakistaniNumber = 
      (cleanNumber.startsWith('03') && cleanNumber.length === 11) ||
      (cleanNumber.startsWith('3') && cleanNumber.length === 10) ||
      (cleanNumber.startsWith('923') && cleanNumber.length === 12);
  
    if (!isValidPakistaniNumber) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid Pakistani mobile number (e.g., 03001234567)');
      return;
    }
  
    setIsSendingOTP(true);
    setVerificationError('');
  
    try {
      console.log('📱 Starting OTP send for:', formData.phoneNumber);
      const response = await smsAPI.sendOTP(formData.phoneNumber);
      
      console.log('✅ OTP sent successfully');
      setIsVerificationModalVisible(true);
      Alert.alert('Success', response.message || 'Verification code sent to your phone');
      
    } catch (error: any) {
      console.error('❌ Failed to send OTP:', error);
      const errorMessage = error.message || 'Failed to send verification code';
      setVerificationError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Verify OTP Function
  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      setVerificationError('Please enter the verification code');
      return;
    }

    setIsVerifyingOTP(true);
    setVerificationError('');

    try {
      console.log('🔍 Verifying OTP:', otpCode);
      const response = await smsAPI.verifyOTP(formData.phoneNumber, otpCode);
      
      console.log('✅ OTP verified:', response);
      
      if (response.success && response.verified) {
        setIsPhoneVerified(true);
        setIsVerificationModalVisible(false);
        setOtpCode('');
        Alert.alert('Success', 'Phone number verified successfully!');
      } else {
        setVerificationError('Verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Failed to verify OTP:', error);
      const errorMessage = error.response?.data?.message || 'Invalid verification code';
      setVerificationError(errorMessage);
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Close verification modal
  const handleCloseVerificationModal = () => {
    setIsVerificationModalVisible(false);
    setOtpCode('');
    setVerificationError('');
  };


  const checkProfileExists = async () => {
    try {
      const response = await profileAPI.getSellerProfile();
      if (response.sellerProfile) {
        setProfileExists(true);
        // If profile exists but we're in create mode, it might be deleted
        if (response.sellerProfile.status === 'Deleted') {
          setProfileDeleted(true);
        }
      }
    } catch (error: any) {
      // If we get a "profile deleted" error, mark it as deleted
      if (error.response?.data?.details === 'This profile is deleted.') {
        setProfileDeleted(true);
      }
      // For other errors, assume no profile exists
      setProfileExists(false);
    }
  };

  const loadExistingProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getSellerProfile();

      if (response.sellerProfile) {
        const profile = response.sellerProfile;
        console.log('Loading existing profile:', profile);

        // Check if profile is deleted
        if (profile.status === 'Deleted') {
          setProfileDeleted(true);
          Alert.alert('Profile Deleted', 'Your profile has been deleted. Please create a new profile.');
          return;
        }

        setProfileExists(true);

        const safeValue = (value: any, defaultValue: any = '') => {
          if (!isValidValue(value)) return defaultValue;
          return value;
        };

        const servingStatesArray = isValidValue(profile.servingStates)
          ? (typeof profile.servingStates === 'string' ? profile.servingStates.split(',').map((s: string) => s.trim()) : profile.servingStates)
          : [];

        const languagesArray = isValidValue(profile.language)
          ? (typeof profile.language === 'string' ? profile.language.split(',').map((l: string) => l.trim()) : profile.language)
          : [];

        const marketArray = isValidValue(profile.market)
          ? (typeof profile.market === 'string' ? profile.market.split(',').map((m: string) => m.trim()) : profile.market)
          : [];

        setFormData({
          name: safeValue(profile.name),
          email: safeValue(profile.email, userInfo?.email || ''),
          phoneNumber: safeValue(profile.phoneNumber),
          businessName: safeValue(profile.businessName),
          personalWebsite: safeValue(profile.personalWebsite),
          servingStates: servingStatesArray,
          numberOfYears: isValidValue(profile.noOfYears) ? profile.noOfYears : 0,
          languages: languagesArray,
          userProfileImage: safeValue(profile.userProfileImage),
          passportUploads: Array.isArray(profile.passports) ? profile.passports : [],
          driversLicenseUploads: Array.isArray(profile.driversLicenses) ? profile.driversLicenses : [],
          stateIDUploads: Array.isArray(profile.stateIDs) ? profile.stateIDs : [],
          militaryIdUploads: Array.isArray(profile.militaryIds) ? profile.militaryIds : [],
          greenCardUploads: Array.isArray(profile.greenCards) ? profile.greenCards : [],
          votersCardUploads: Array.isArray(profile.votersCards) ? profile.votersCards : [],
          realStateIdNo: safeValue(profile.realStateIdNo),
          realStateId: safeValue(profile.realStateId),
          companyLogo: safeValue(profile.companyLogo),
          brokerName: safeValue(profile.brokerName),
          brokerContact: safeValue(profile.brokerContact),
          market: marketArray,
          geographicalAreas: safeValue(profile.geographicalAreas),
          aboutMe: safeValue(profile.aboutMe),
          facebook: safeValue(profile.facebook),
          twitter: safeValue(profile.twitter),
          linkedIn: safeValue(profile.linkedIn),
          youtube: safeValue(profile.youtube),
          tikTok: safeValue(profile.tikTok),
          instagram: safeValue(profile.instagram),
        });
      }
    } catch (error: any) {
      console.error('Error loading existing profile:', error);
      if (error.response?.data?.details === 'This profile is deleted.') {
        setProfileDeleted(true);
        Alert.alert('Profile Deleted', 'Your profile has been deleted. Please create a new profile.');
      } else {
        Alert.alert('Error', 'Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'profile' | 'logo' | 'realEstateId') => {
    console.log(`Picking image for: ${type}`);
    setCurrentlyUploading(type);
    
    try {
      const result = await pickAndUploadMedia();
      
      if (result && result.url) {
        console.log(`Setting ${type} image URL:`, result.url);
        
        if (type === 'profile') {
          setFormData(prev => ({ ...prev, userProfileImage: result.url }));
        } else if (type === 'logo') {
          setFormData(prev => ({ ...prev, companyLogo: result.url }));
        } else if (type === 'realEstateId') {
          setFormData(prev => ({ ...prev, realStateId: result.url }));
        }
        
        Alert.alert('Success', 'Image uploaded successfully!');
      } else {
        console.log('Image pick cancelled or failed');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally{
      setCurrentlyUploading(null);
    }
  };

  const pickGovtIdImage = async (idType: string) => {
    console.log(`Picking government ID image for: ${idType}`);
    setCurrentlyUploading(idType);
    
    try {
      const result = await pickAndUploadMedia();
      
      if (result && result.url) {
        console.log(`Setting ${idType} image URL:`, result.url);
        handleGovtIdUpload(idType, result.url);
        Alert.alert('Success', `${idType} uploaded successfully!`);
      } else {
        console.log('Government ID image pick cancelled or failed');
      }
    } catch (error) {
      console.error('Error picking government ID image:', error);
      Alert.alert('Error', `Failed to pick ${idType}. Please try again.`);
    } finally {
      setCurrentlyUploading(null);
    }
  };
  const pickDocumentFile = async () => {
    console.log('Picking document file');
    
    try {
      const documentUrl = await pickAndUploadDocument();
      
      if (documentUrl) {
        console.log('Document uploaded successfully:', documentUrl);
        Alert.alert('Success', 'Document uploaded successfully!');
        // You can handle the document URL as needed
        return documentUrl;
      } else {
        console.log('Document pick cancelled or failed');
        return null;
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
      return null;
    }
  };

  const handleGovtIdUpload = (idType: string, imageUrl: string) => {
    setFormData(prev => {
      switch (idType) {
        case 'Passport':
          return { ...prev, passportUploads: [...prev.passportUploads, imageUrl] };
        case "Driver's License":
          return { ...prev, driversLicenseUploads: [...prev.driversLicenseUploads, imageUrl] };
        case 'State ID Card':
          return { ...prev, stateIDUploads: [...prev.stateIDUploads, imageUrl] };
        case 'Military ID Card':
          return { ...prev, militaryIdUploads: [...prev.militaryIdUploads, imageUrl] };
        case 'Green Card':
          return { ...prev, greenCardUploads: [...prev.greenCardUploads, imageUrl] };
        case "Voter's Registration Card":
          return { ...prev, votersCardUploads: [...prev.votersCardUploads, imageUrl] };
        default:
          return prev;
      }
    });
  };
  const hasUploadedImages = (idType: string): boolean => {
    switch (idType) {
      case 'Passport':
        return formData.passportUploads.length > 0 && formData.passportUploads.every(url => isValidValue(url));
      case "Driver's License":
        return formData.driversLicenseUploads.length > 0 && formData.driversLicenseUploads.every(url => isValidValue(url));
      case 'State ID Card':
        return formData.stateIDUploads.length > 0 && formData.stateIDUploads.every(url => isValidValue(url));
      case 'Military ID Card':
        return formData.militaryIdUploads.length > 0 && formData.militaryIdUploads.every(url => isValidValue(url));
      case 'Green Card':
        return formData.greenCardUploads.length > 0 && formData.greenCardUploads.every(url => isValidValue(url));
      case "Voter's Registration Card":
        return formData.votersCardUploads.length > 0 && formData.votersCardUploads.every(url => isValidValue(url));
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
  
    // Validate required fields for government ID
    const totalGovtIds = 
      formData.passportUploads.length +
      formData.driversLicenseUploads.length +
      formData.stateIDUploads.length +
      formData.militaryIdUploads.length +
      formData.greenCardUploads.length +
      formData.votersCardUploads.length;
  
    if (totalGovtIds === 0) {
      Alert.alert('Error', 'Please upload at least one Government Issued ID');
      return;
    }
  
    setLoading(true);
    try {
      // Prepare payload - KEEP AS ARRAYS, don't convert to strings
      const payload: any = {
        Name: formData.name,
        Email: formData.email,
        PhoneNumber: formData.phoneNumber,
        NumberOfYears: formData.numberOfYears || 0,
  
        // KEEP AS ARRAYS - this was the main issue
        ServingStates: formData.servingStates, // Array, not string
        Languages: formData.languages, // Array, not string  
        Market: formData.market, // Array, not string
  
        UserProfileImage: formData.userProfileImage || '',
        PassportUploads: formData.passportUploads || [],
        DriversLicenseUploads: formData.driversLicenseUploads || [],
        StateIDUploads: formData.stateIDUploads || [],
        MilitaryIdUploads: formData.militaryIdUploads || [],
        GreenCardUploads: formData.greenCardUploads || [],
        VotersCardUploads: formData.votersCardUploads || [],
  
        // Optional fields - only include if they have valid values
        ...(isValidValue(formData.businessName) && { BusinessName: formData.businessName }),
        ...(isValidValue(formData.personalWebsite) && { PersonalWebsite: formData.personalWebsite }),
        ...(isValidValue(formData.realStateIdNo) && { RealStateIdNo: formData.realStateIdNo }),
        ...(isValidValue(formData.realStateId) && { RealStateId: formData.realStateId }),
        ...(isValidValue(formData.companyLogo) && { CompanyLogo: formData.companyLogo }),
        ...(isValidValue(formData.brokerName) && { BrokerName: formData.brokerName }),
        ...(isValidValue(formData.brokerContact) && { BrokerContact: formData.brokerContact }),
        ...(isValidValue(formData.geographicalAreas) && { GeographicalAreas: formData.geographicalAreas }),
        ...(isValidValue(formData.aboutMe) && { AboutMe: formData.aboutMe }),
        ...(isValidValue(formData.facebook) && { Facebook: formData.facebook }),
        ...(isValidValue(formData.twitter) && { Twitter: formData.twitter }),
        ...(isValidValue(formData.linkedIn) && { LinkedIn: formData.linkedIn }),
        ...(isValidValue(formData.youtube) && { Youtube: formData.youtube }),
        ...(isValidValue(formData.tikTok) && { TikTok: formData.tikTok }),
        ...(isValidValue(formData.instagram) && { Instagram: formData.instagram }),
      };
  
      console.log('🔄 Processing seller profile...');
      console.log('📤 Request Data:', JSON.stringify(payload, null, 2));
  
      let response;
  
      // Determine which API to call based on profile status
      if (profileDeleted || !profileExists) {
        console.log('📝 Creating new profile...');
        response = await profileAPI.createSellerProfile(payload);
      } else {
        console.log('✏️ Updating existing profile...');
        response = await profileAPI.updateSellerProfile(payload);
      }
  
      console.log('✅ Profile operation successful:', response);
  
      Alert.alert(
        'Success',
        profileDeleted || !profileExists ? 'Profile created successfully!' : 'Profile updated successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Profile operation error:', error);
  
      let errorMessage = profileDeleted || !profileExists ? 'Failed to create profile' : 'Failed to update profile';
      
      if (error.response?.data?.errors) {
        // Handle validation errors from API
        const validationErrors = error.response.data.errors;
        errorMessage = 'Validation errors: ' + JSON.stringify(validationErrors, null, 2);
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
  
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getUploadedFileName = (idType: string): boolean => {
    switch (idType) {
      case 'Passport':
        return formData.passportUploads.length > 0;
      case "Driver's License":
        return formData.driversLicenseUploads.length > 0;
      case 'State ID Card':
        return formData.stateIDUploads.length > 0;
      case 'Military ID Card':
        return formData.militaryIdUploads.length > 0;
      case 'Green Card':
        return formData.greenCardUploads.length > 0;
      case "Voter's Registration Card":
        return formData.votersCardUploads.length > 0;
      default:
        return false;
    }
  };

  const toggleMarket = (market: string) => {
    setFormData(prev => ({
      ...prev,
      market: prev.market.includes(market)
        ? prev.market.filter(m => m !== market)
        : [...prev.market, market]
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const toggleState = (state: string) => {
    setFormData(prev => ({
      ...prev,
      servingStates: prev.servingStates.includes(state)
        ? prev.servingStates.filter(s => s !== state)
        : [...prev.servingStates, state]
    }));
  };

  if (loading && isEditMode) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  const renderUploadedImages = (idType: string) => {
    let images: string[] = [];
    
    switch (idType) {
      case 'Passport':
        images = formData.passportUploads;
        break;
      case "Driver's License":
        images = formData.driversLicenseUploads;
        break;
      case 'State ID Card':
        images = formData.stateIDUploads;
        break;
      case 'Military ID Card':
        images = formData.militaryIdUploads;
        break;
      case 'Green Card':
        images = formData.greenCardUploads;
        break;
      case "Voter's Registration Card":
        images = formData.votersCardUploads;
        break;
      default:
        images = [];
    }
    const validImages = images.filter(url => isValidValue(url) && url !== 'null' && url !== 'string');


    if (images.length === 0) return null;

    return (
      <View style={styles.uploadedImagesContainer}>
        <Text style={styles.uploadedImagesTitle}>Uploaded {idType}:</Text>
        <View style={styles.uploadedImagesList}>
          {validImages.map((imageUrl, index) => (
            <View key={`${idType}-${index}`} style={styles.uploadedImageItem}>
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.uploadedImageThumbnail}
                resizeMode="cover"
                onError={(e) => console.log(`Error loading ${idType} image:`, e.nativeEvent.error)}
              />
              <Text style={styles.uploadedImageText}>
                {idType} {index + 1} ✓
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAllGovtIdUploads = () => {
    const hasAnyUploads = GOVT_ID_OPTIONS.some(idType => hasUploadedImages(idType));
    
    if (!hasAnyUploads) return null;

    return (
      <View style={styles.allUploadsContainer}>
        <Text style={styles.uploadSectionTitle}>Uploaded Government IDs:</Text>
        {GOVT_ID_OPTIONS.map(idType => 
          hasUploadedImages(idType) && (
            <View key={idType} style={styles.govtIdTypeSection}>
              <Text style={styles.govtIdTypeTitle}>{idType}:</Text>
              <View style={styles.govtIdImagesContainer}>
                {(() => {
                  let images: string[] = [];
                  switch (idType) {
                    case 'Passport': images = formData.passportUploads; break;
                    case "Driver's License": images = formData.driversLicenseUploads; break;
                    case 'State ID Card': images = formData.stateIDUploads; break;
                    case 'Military ID Card': images = formData.militaryIdUploads; break;
                    case 'Green Card': images = formData.greenCardUploads; break;
                    case "Voter's Registration Card": images = formData.votersCardUploads; break;
                  }
                  return images
                    .filter(url => isValidValue(url) && url !== 'null' && url !== 'string')
                    .map((imageUrl, index) => (
                      <Image 
                        key={`${idType}-${index}`}
                        source={{ uri: imageUrl }} 
                        style={styles.govtIdThumbnail}
                        resizeMode="cover"
                        onError={(e) => console.log(`Error loading ${idType} image:`, e.nativeEvent.error)}
                      />
                    ));
                })()}
              </View>
            </View>
          )
        )}
      </View>
    );
  };

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
          {/* <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../../assets/icons/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity> */}
        <TouchableOpacity style={styles.iconButton}>
            <Image
              source={require('../../assets/icons/bell.png')}
              style={styles.bellIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {profileDeleted ? 'Create Profile' : (isEditMode ? 'Profile' : 'Profile')}
          </Text>
          
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
          {/* <View style={styles.iconButton} /> */}
        </View>

        {/* Profile Image Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={() => pickImage('profile')}
            disabled={uploading}
          >
            <View style={styles.profileImageContainer}>
              {uploading ? (
                <View style={[styles.profileImage, styles.uploadingContainer]}>
                  <ActivityIndicator size="small" color="#6C63FF" />
                </View>
              ) : formData.userProfileImage && isValidValue(formData.userProfileImage) ? (
                <Image
                  source={{ uri: formData.userProfileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <Image
                  source={require('../../assets/icons/default.png')}
                  style={styles.profileImage}
                />
              )}
              <View style={styles.editIconContainer}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#6C63FF" />
                ) : (
                  <Image
                    source={require('../../assets/icons/edit.png')}
                    style={styles.editIcon}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>



      {/* White Card Container */}
      <View style={styles.whiteCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Information Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <View style={styles.sectionDot} />
          </View>

          {/* Name Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Name<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Your First and Last Given Names"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              />
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Email Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Email<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputWithBadge}>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={formData.email}
                  editable={false}
                  placeholder="Email address"
                />
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Mobile Number Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Mobile Number<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputWithBadge}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Your Mobile Number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={formData.phoneNumber}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, phoneNumber: text }));
                    // Reset verification status if phone number changes
                    if (isPhoneVerified) {
                      setIsPhoneVerified(false);
                    }
                  }}
                  editable={!isPhoneVerified} // Disable editing when verified
                />
                {isPhoneVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.verifyButton, isSendingOTP && styles.verifyButtonDisabled]}
                    onPress={handleSendOTP}
                    disabled={isSendingOTP || !formData.phoneNumber.trim()}
                  >
                    {isSendingOTP ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inputLine} />
            </View>
            {isPhoneVerified && (
              <Text style={styles.verifiedSuccessText}>
                ✓ Phone number verified successfully
              </Text>
            )}
          </View>


          {/* Business Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Your Business Name"
                placeholderTextColor="#999"
                value={formData.businessName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
              />
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Personal or Business Website */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Personal or Business Website</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="www.example.com"
                value={formData.personalWebsite}
                onChangeText={(text) => setFormData(prev => ({ ...prev, personalWebsite: text }))}
                autoCapitalize="none"
              />
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Professional Information Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Professional Information</Text>
            <View style={styles.sectionDot} />
          </View>

          {/* Serving States */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Serving states</Text>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.dropdownContainer}
                onPress={() => setShowStatesDropdown(true)}
              >
                <Text style={[styles.dropdownText, formData.servingStates.length > 0 && styles.dropdownTextActive]}>
                  {formData.servingStates.length > 0
                    ? formData.servingStates.join(', ')
                    : 'Select states'}
                </Text>
                <Image
                  source={require('../../assets/icons/edit.png')}
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Years in Real Estate */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>No. of Years in Real Estate</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter number of years"
                keyboardType="numeric"
                value={formData.numberOfYears && formData.numberOfYears > 0 ? String(formData.numberOfYears) : ''}
                onChangeText={(text) =>
                  setFormData(prev => ({
                    ...prev,
                    numberOfYears: text ? Number(text) : 0,
                  }))
                }
              />
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Languages Spoken */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Languages Spoken</Text>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.dropdownContainer}
                onPress={() => setShowLanguageDropdown(true)}
              >
                <Text style={[styles.dropdownText, formData.languages.length > 0 && styles.dropdownTextActive]}>
                  {formData.languages.length > 0
                    ? formData.languages.join(', ')
                    : 'Select languages'}
                </Text>
                <Image
                  source={require('../../assets/icons/edit.png')}
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Government Issued ID */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Government Issued ID <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.GovUploadOrangeButton}
              onPress={() => setShowGovtIdDropdown(true)}
            >
              <Text style={styles.dropdownText}>
            {currentlyUploading ? `Uploading ${currentlyUploading}...` : 'Type of ID'}
          </Text>
              <Image
                source={require('../../assets/icons/edit.png')}
                style={styles.dropdownIcon}
              />
            </TouchableOpacity>
            {/* {GOVT_ID_OPTIONS.map(idType => renderUploadedImages(idType))} */}
            {renderAllGovtIdUploads()}
          </View>

          {/* Real Estate ID Upload Section */}
          <View style={styles.uploadDashedBox}>
            <Image
              source={require('../../assets/icons/edit.png')}
              style={styles.uploadIconLarge}
            />
            <Text style={styles.uploadFilesText}>Upload Files</Text>
          </View>

          {/* Real Estate ID Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Real Estate ID</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Your Real Estate ID"
                placeholderTextColor="#999"
                value={formData.realStateIdNo}
                onChangeText={(text) => setFormData(prev => ({ ...prev, realStateIdNo: text }))}
              />
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Upload Button for Real Estate ID */}
          <TouchableOpacity
          style={[
            styles.uploadDashedBox, 
            (uploading && currentlyUploading === 'realEstateId') && styles.uploadButtonDisabled
          ]}
          onPress={() => pickImage('realEstateId')}
          disabled={uploading && currentlyUploading === 'realEstateId'}
        >
          {(uploading && currentlyUploading === 'realEstateId') ? (
            <ActivityIndicator color="#6C63FF" />
          ) : (
            <>
              <Image
                source={require('../../assets/icons/edit.png')}
                style={styles.uploadIconLarge}
              />
              <Text style={styles.uploadFilesText}>
                {formData.realStateId && isValidValue(formData.realStateId) ? 'File Uploaded ✓' : 'Upload Real Estate ID Document'}
              </Text>
              
              {/* Show uploaded Real Estate ID thumbnail */}
              {formData.realStateId && isValidValue(formData.realStateId) && (
                <View style={styles.uploadedDocPreview}>
                  <Image 
                    source={{ uri: formData.realStateId }} 
                    style={styles.uploadedDocThumbnail}
                    resizeMode="contain"
                    onError={(e) => console.log('Error loading real estate ID:', e.nativeEvent.error)}
                  />
                  <Text style={styles.uploadedDocText}>Real Estate ID Document ✓</Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>

          {/* Brokerage Affiliation Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Brokerage Affiliation</Text>
            <View style={styles.sectionDot} />
          </View>

          {/* Brokerage Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Brokerage Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Brokerage Name"
                placeholderTextColor="#999"
                value={formData.brokerName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, brokerName: text }))}
              />
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Brokerage Contact */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Brokerage Contact</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add Brokerage Contact"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={formData.brokerContact}
                onChangeText={(text) => setFormData(prev => ({ ...prev, brokerContact: text }))}
              />
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Area of Specialization Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Area of Specialization</Text>
            <View style={styles.sectionDot} />
          </View>

          {/* Market Specialties */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Market Specialties</Text>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.dropdownContainer}
                onPress={() => setShowMarketDropdown(true)}
              >
                <Text style={[styles.dropdownText, formData.market.length > 0 && styles.dropdownTextActive]}>
                  {formData.market.length > 0
                    ? formData.market.join(', ')
                    : 'Select market specialties'}
                </Text>
                <Image
                  source={require('../../assets/icons/edit.png')}
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Geographical Areas */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Geographical Areas</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Geographical area"
                placeholderTextColor="#999"
                value={formData.geographicalAreas}
                onChangeText={(text) => setFormData(prev => ({ ...prev, geographicalAreas: text }))}
              />
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* About Me */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>About me</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.aboutMe}
                onChangeText={(text) => setFormData(prev => ({ ...prev, aboutMe: text }))}
                maxLength={200}
              />
              <View style={styles.inputLine} />
            </View>
            <Text style={styles.charCount}>{formData.aboutMe.length}/200</Text>
          </View>

          {/* Company Logo */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Company Logo</Text>
            <TouchableOpacity
              style={styles.logoUploadBox}
              onPress={() => pickImage('logo')}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="large" color="#6C63FF" />
              ) : formData.companyLogo && isValidValue(formData.companyLogo) ? (
                <Image
                  source={{ uri: formData.companyLogo }}
                  style={styles.logoPreview}
                />
              ) : (
                <>
                  <Image
                    source={require('../../assets/icons/edit.png')}
                    style={styles.uploadIconMedium}
                  />
                  <Text style={styles.logoUploadText}>Upload Photo</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Social Media Section */}
<View style={styles.sectionHeader}>
  <View style={styles.sectionDot} />
  <Text style={styles.sectionTitle}>Social Media</Text>
  <View style={styles.sectionDot} />
</View>

{/* Facebook */}
<View style={styles.formGroup}>
           
  <View style={styles.inputContainer}>
  <Image
              source={require('../../assets/icons/facebook.png')}
              style={styles.socialMediaIcon}
              resizeMode="contain"
            />
    <TextInput
      style={styles.input}
      placeholder="Enter Facebook profile URL"
      placeholderTextColor="#999"
      value={formData.facebook}
      onChangeText={(text) => setFormData(prev => ({ ...prev, facebook: text }))}
      autoCapitalize="none"
    />
    <View style={styles.inputLine} />
  </View>
</View>

{/* Twitter */}
<View style={styles.formGroup}>
 
  <View style={styles.inputContainer}>
  <Image
              source={require('../../assets/icons/twitter.png')}
              style={styles.socialMediaIcon}
              resizeMode="contain"
            />
    <TextInput
      style={styles.input}
      placeholder="Enter Twitter profile URL"
      placeholderTextColor="#999"
      value={formData.twitter}
      onChangeText={(text) => setFormData(prev => ({ ...prev, twitter: text }))}
      autoCapitalize="none"
    />
    <View style={styles.inputLine} />
  </View>
</View>

{/* LinkedIn */}
<View style={styles.formGroup}>
  
  <View style={styles.inputContainer}>
  <Image
              source={require('../../assets/icons/linkedin.png')}
              style={styles.socialMediaIcon}
              resizeMode="contain"
            />
    <TextInput
      style={styles.input}
      placeholder="Enter LinkedIn profile URL"
      placeholderTextColor="#999"
      value={formData.linkedIn}
      onChangeText={(text) => setFormData(prev => ({ ...prev, linkedIn: text }))}
      autoCapitalize="none"
    />
    <View style={styles.inputLine} />
  </View>
</View>

{/* YouTube */}
<View style={styles.formGroup}>
  <Text style={styles.label}>YouTube</Text>
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      placeholder="Enter YouTube channel URL"
      placeholderTextColor="#999"
      value={formData.youtube}
      onChangeText={(text) => setFormData(prev => ({ ...prev, youtube: text }))}
      autoCapitalize="none"
    />
    <View style={styles.inputLine} />
  </View>
</View>

{/* TikTok */}
<View style={styles.formGroup}>
  <Text style={styles.label}>TikTok</Text>
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      placeholder="Enter TikTok profile URL"
      placeholderTextColor="#999"
      value={formData.tikTok}
      onChangeText={(text) => setFormData(prev => ({ ...prev, tikTok: text }))}
      autoCapitalize="none"
    />
    <View style={styles.inputLine} />
  </View>
</View>

{/* Instagram */}
<View style={styles.formGroup}>
  <Text style={styles.label}>Instagram</Text>
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      placeholder="Enter Instagram profile URL"
      placeholderTextColor="#999"
      value={formData.instagram}
      onChangeText={(text) => setFormData(prev => ({ ...prev, instagram: text }))}
      autoCapitalize="none"
    />
    <View style={styles.inputLine} />
  </View>
</View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {profileDeleted || !profileExists ? 'CREATE PROFILE' : 'UPDATE PROFILE'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>


      {/* OTP Verification Modal */}
      <Modal
        visible={isVerificationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseVerificationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.verificationModalContent}>
            <Text style={styles.verificationModalTitle}>Verify Phone Number</Text>
            
            <Text style={styles.verificationModalSubtitle}>
              Enter the verification code sent to {formData.phoneNumber}
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="Enter verification code"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={otpCode}
              onChangeText={(text) => {
                setOtpCode(text);
                setVerificationError('');
              }}
              maxLength={6}
              autoFocus={true}
            />

            {verificationError ? (
              <Text style={styles.verificationErrorText}>{verificationError}</Text>
            ) : null}

            <View style={styles.verificationModalButtons}>
              <TouchableOpacity
                style={[styles.verificationButton, styles.cancelButton]}
                onPress={handleCloseVerificationModal}
                disabled={isVerifyingOTP}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.verificationButton, styles.verifyActionButton, 
                       (!otpCode.trim() || isVerifyingOTP) && styles.verifyButtonDisabled]}
                onPress={handleVerifyOTP}
                disabled={!otpCode.trim() || isVerifyingOTP}
              >
                {isVerifyingOTP ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyActionButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.resendButton}
              onPress={handleSendOTP}
              disabled={isSendingOTP}
            >
              {isSendingOTP ? (
                <ActivityIndicator size="small" color="#6C63FF" />
              ) : (
                <Text style={styles.resendButtonText}>Resend Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Market Dropdown Modal */}
      <Modal
        visible={showMarketDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMarketDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMarketDropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Market Specialties</Text>
              <TouchableOpacity onPress={() => setShowMarketDropdown(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={MARKET_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => toggleMarket(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {formData.market.includes(item) && (
                    <Text style={styles.modalItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Dropdown Modal */}
      <Modal
        visible={showLanguageDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageDropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Languages Spoken</Text>
              <TouchableOpacity onPress={() => setShowLanguageDropdown(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGE_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => toggleLanguage(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {formData.languages.includes(item) && (
                    <Text style={styles.modalItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* States Dropdown Modal */}
      <Modal
        visible={showStatesDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatesDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatesDropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Serving States</Text>
              <TouchableOpacity onPress={() => setShowStatesDropdown(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={US_STATES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => toggleState(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {formData.servingStates.includes(item) && (
                    <Text style={styles.modalItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Government ID Dropdown Modal */}
      <Modal
        visible={showGovtIdDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGovtIdDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGovtIdDropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Government Issued ID</Text>
              <TouchableOpacity onPress={() => setShowGovtIdDropdown(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={GOVT_ID_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setShowGovtIdDropdown(false);
                    pickGovtIdImage(item);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {getUploadedFileName(item) && (
                    <View style={styles.uploadBadge}>
                      <Text style={styles.uploadBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
    deletedWarning: {
        backgroundColor: '#FFF3E0',
        padding: 16,
        marginHorizontal: 20,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B35',
        marginTop: 10,
      },
      deletedWarningText: {
        color: '#FF6B35',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
      },
      backIcon: {
        width: 24,
        height: 24,
        tintColor: '#fff',
      },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Header Section
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
  paddingTop: 30, // Increased for better status bar spacing
  paddingBottom: 20,
  zIndex: 10,
  },
  iconButton: {
    width: 44, // Standard touch target size
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22, // Circular touch area
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle background on press
  },
  bellIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  headerTitle: {
    fontSize: 18, // Slightly smaller for better balance
    fontWeight: '700', // Bolder for better readability
    color: '#fff',
    textAlign: 'center',
    flex: 1, // Allows title to take available space
    marginHorizontal: 16, // Space from icons
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
  // Profile Section
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
    borderRadius: 50,
    backgroundColor: '#d0d0d0',
    borderWidth: 4,
    borderColor: '#fff',
  },
  uploadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
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
  // White Card Container
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
    position: 'relative',
    minHeight: '60%',
    minWidth: '60%',
    maxWidth: 400
  },
  scrollContent: {
    paddingBottom: 50,
  },
  // Section Titles (matching image)
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginBottom: 10,
    // borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  sectionDot: {
    width: 70,
    height: 2,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginHorizontal: 10, // even spacing on both sides
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    textAlign: 'center',
  },
  
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  // Form Elements
  formGroup: {
    marginBottom: 16,
  },
  socialMediaIcon: {
    width: 34, // Consistent icon size
    height: 34,
    resizeMode: 'contain', // Ensure icons maintain aspect ratio
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    marginLeft: 10

  },
  required: {
    color: '#FF6B35',
  },
   inputContainer: {
    position: 'relative',
  },
  govinputContainer: {
    position: 'absolute',
  },
  input: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 13
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  inputLine: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 4,
  },
  inputWithBadge: {
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  verifyButton: {
    position: 'absolute',
    right: 10,
    top: 6,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Dropdown
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  dropdownTextActive: {
    color: '#333',
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: '#999',
  },
  // Uploaded ID Display
  uploadedIdCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  uploadedIdText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  // Upload Dashed Box
  uploadDashedBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: '#FAFAFA',
    marginBottom: 20
  },
  uploadIconLarge: {
    width: 20,
    height: 20,
    tintColor: '#6C63FF',
    marginBottom: 12,
  },
  uploadFilesText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C63FF',
  },
  // Orange Upload Button
  uploadOrangeButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  GovUploadOrangeButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#D0D0D0'
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadOrangeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // ID Types List
  idTypesList: {
    marginTop: 15,
    marginBottom: 10,
  },
  idTypeButton: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  idTypeText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  // Text Area
  textArea: {
    height: 100,
    paddingTop: 12,
    // textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  // Logo Upload
  logoUploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D0D0D0',
    borderRadius: 12,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  uploadIconMedium: {
    width: 40,
    height: 40,
    tintColor: '#6C63FF',
    marginBottom: 8,
  },
  logoUploadText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
  },
  // Social Media
  socialMediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  socialIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  socialIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialInput: {
    flex: 1,
    marginBottom: 0,
  },
  // Submit Button
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Upload Badge
  uploadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemCheck: {
    fontSize: 18,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  verificationModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  verificationModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  otpInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  verificationErrorText: {
    color: '#FF6B35',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  verificationModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  verificationButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyActionButton: {
    backgroundColor: '#6C63FF',
  },
  verifyActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  resendButton: {
    paddingVertical: 10,
  },
  resendButtonText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedSuccessText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 10,
    fontWeight: '500',
  },

  allUploadsContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  uploadSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  govtIdTypeSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  govtIdTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  govtIdImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  govtIdThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  uploadedImagesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadedImagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  uploadedImagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  uploadedImageItem: {
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  uploadedImageThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  uploadedImageText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  uploadedDocPreview: {
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  uploadedDocThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6C63FF',
    marginBottom: 8,
  },
  uploadedDocText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },

});

export default EditProfileScreen;