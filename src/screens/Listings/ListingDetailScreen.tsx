import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  ImageBackground
} from 'react-native';
import Video from 'react-native-video';
import { PropertyListing } from '../../types/propertyTypes';
import { propertyListingsAPI } from '../../api/propertyListingsAPI';

const { width } = Dimensions.get('window');

interface ListingDetailScreenProps {
  navigation: any;
  route: {
    params: {
      listing: PropertyListing;
    };
  };
}

const ListingDetailScreen: React.FC<ListingDetailScreenProps> = ({ navigation, route }) => {
  const { listing } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [videoPaused, setVideoPaused] = useState(true);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [currentPlayingVideoIndex, setCurrentPlayingVideoIndex] = useState<number | null>(null);
  const [inlineVideoPaused, setInlineVideoPaused] = useState<{ [key: number]: boolean }>({});
  const videoRef = useRef<Video>(null);
  const fullScreenVideoRef = useRef<Video>(null);

  const formatPrice = (price: number) => {
    return `$${price?.toLocaleString() || '0'}`;
  };

  // Toggle inline video play/pause
  const handleToggleInlineVideo = (index: number) => {
    setInlineVideoPaused(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Open full screen video
  const handleOpenFullScreen = (videoUrl: string, index: number) => {
    setPlayingVideo(videoUrl);
    setCurrentPlayingVideoIndex(index);
    // Pause inline video when opening fullscreen
    setInlineVideoPaused(prev => ({
      ...prev,
      [index]: true
    }));
  };

  const handleCloseVideo = () => {
    setPlayingVideo(null);
    setVideoPaused(true);
  };

  const handleVideoError = (error: any) => {
    console.error('Video playback error:', error);
    Alert.alert('Error', 'Failed to play video. Please try again.');
    handleCloseVideo();
  };

  // Generate video thumbnail URL
  const getVideoThumbnail = (videoUrl: string): string => {
    if (!videoUrl) return '';
    
    if (videoUrl.includes('cloudinary.com') && videoUrl.includes('/video/')) {
      return videoUrl
        .replace('/video/upload/', '/image/upload/')
        .replace('.mp4', '.jpg')
        .replace('.mov', '.jpg')
        .replace('.avi', '.jpg');
    }
    
    return '';
  };

  const handleMarkAsSold = async () => {
    setShowSoldModal(false);
    setIsProcessing(true);

    try {
      await propertyListingsAPI.updateSoldStatus(listing.propertyListingId);
      Alert.alert(
        'Success',
        'Property marked as sold successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to mark property as sold. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteListing = async () => {
    setShowDeleteModal(false);
    setIsProcessing(true);
    try {
      await propertyListingsAPI.deletePropertyListing(listing.propertyListingId);
      Alert.alert('Success', 'Property deleted successfully', [
        { text: 'OK', onPress: () => navigation.navigate('ListingMain') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete property. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenewListing = async () => {
    Alert.alert(
      'Renew Listing',
      'Are you sure you want to renew this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Renew',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await propertyListingsAPI.renewProperty(listing.propertyListingId);
              Alert.alert('Success', 'Property renewed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to renew property. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const images = listing.siteOrPropertyImages || [];
  const totalImages = images.length;

  const allDetails = [
    { label: 'Bedroom', value: String(listing.bedrooms).padStart(2, '0'), icon: 'bed' },
    { label: 'Bathroom', value: String(listing.bathrooms).padStart(2, '0'), icon: 'bath' },
    { label: 'Type', value: listing.propertyTypeName, icon: 'home' },
    { label: 'Lot', value: listing.lotSize, icon: 'lot' },
    { label: 'Parking', value: listing.parking?.join(', ') || 'N/A', icon: 'parking' },
    { 
      label: 'Cooling', 
      value: Array.isArray(listing.coolingSystems) ? listing.coolingSystems.join(', ') : listing.coolingSystems || 'N/A', 
      icon: 'cooling' 
    },
    { 
      label: 'Heating', 
      value: Array.isArray(listing.heatingSystems) ? listing.heatingSystems.join(', ') : listing.heatingSystems || 'N/A', 
      icon: 'heating' 
    },
    { label: 'Price/sqft', value: `$${listing.pricePerSquareFoot || 0}`, icon: 'dollar' },
    { label: 'Year Built', value: listing.yearBuilt, icon: 'calendar' },
    { label: 'Market Value', value: listing.networth, icon: 'checkmark' },
    { label: 'Rehab Estimate', value: listing.rehabEstimate, icon: 'listing' },
    { label: 'Avg Lease Price', value: listing.averageLeasePrice, icon: 'price' },
  ];

  const detailsToShow = showAllDetails ? allDetails : allDetails.slice(0, 3);

  const renderFullScreenVideo = () => {
    if (!playingVideo) return null;

    return (
      <Modal
        visible={!!playingVideo}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
      >
        <View style={styles.fullScreenVideo}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseVideo}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Video
            ref={fullScreenVideoRef}
            source={{ uri: playingVideo }}
            style={styles.fullScreenVideoPlayer}
            resizeMode="contain"
            paused={videoPaused}
            controls={false}
            poster={getVideoThumbnail(playingVideo)}
            posterResizeMode="contain"
            onError={handleVideoError}
            onEnd={() => setVideoPaused(true)}
            ignoreSilentSwitch="obey"
            playInBackground={false}
            playWhenInactive={false}
          />

          {/* Custom Play/Pause Button for Fullscreen */}
          <TouchableOpacity 
            style={styles.fullScreenPlayPauseButton}
            onPress={() => setVideoPaused(!videoPaused)}
            activeOpacity={0.7}
          >
            <View style={styles.fullScreenPlayPauseCircle}>
              <Text style={styles.fullScreenPlayPauseIcon}>
                {videoPaused ? '▶' : '❚❚'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  const renderMediaItem = (item: string, index: number) => {
    const isVideo = item.includes('/video/') || item.endsWith('.mp4') || item.endsWith('.mov') || item.endsWith('.avi');
    const thumbnailUrl = getVideoThumbnail(item);
    const isVideoPaused = inlineVideoPaused[index] !== false; // Default to paused

    if (isVideo) {
      return (
        <View key={index} style={styles.mediaItemContainer}>
          {/* Video Player - Always rendered */}
          <Video
            source={{ uri: item }}
            style={styles.videoPlayer}
            resizeMode="cover"
            paused={isVideoPaused}
            controls={false}
            poster={thumbnailUrl}
            posterResizeMode="cover"
            onError={handleVideoError}
            repeat={false}
            ignoreSilentSwitch="obey"
            playInBackground={false}
            playWhenInactive={false}
          />

          {/* Center Play/Pause Button */}
          <TouchableOpacity 
            style={styles.centerPlayPauseButton}
            onPress={() => handleToggleInlineVideo(index)}
            activeOpacity={0.7}
          >
            <View style={styles.playPauseCircle}>
              <Text style={styles.playPauseIcon}>
                {isVideoPaused ? '▶' : '❚❚'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Fullscreen Button - Only show when video is playing */}
          {!isVideoPaused && (
            <TouchableOpacity 
              style={styles.fullScreenButton}
              onPress={() => handleOpenFullScreen(item, index)}
              activeOpacity={0.7}
            >
              <Text style={styles.fullScreenButtonIcon}>⛶</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Regular image
    return (
      <Image
        key={index}
        source={{ uri: item }}
        style={styles.propertyImage}
        resizeMode="cover"
        onError={() => console.log('Image load failed for:', item)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageCarouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const slideIndex = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentImageIndex(slideIndex);
              // Pause all videos when scrolling
              setInlineVideoPaused(prev => {
                const newState = { ...prev };
                Object.keys(newState).forEach(key => {
                  newState[parseInt(key)] = true;
                });
                return newState;
              });
            }}
            scrollEventThrottle={16}
          >
            {images.map((image, index) => renderMediaItem(image, index))}
          </ScrollView>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../../assets/icons/back.png')}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Share Button */}
          <ImageBackground
            source={require('../../assets/images/auth-bg.png')}
            style={styles.shareButton}
            imageStyle={styles.createButtonBackgroundImage}
          >
            <TouchableOpacity 
              style={styles.createButton}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/icons/share.png')}
                style={styles.plusIcon}
                resizeMode="contain"
              />
              <Text style={styles.shareButtonText}>Share Listing</Text>
            </TouchableOpacity>
          </ImageBackground>

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} of {totalImages}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Address and Price */}
          <View style={styles.headerSection}>
            <Text style={styles.address}>{listing.propertyAddress}</Text>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditListing', { listing })}
              disabled={isProcessing}
            >
              <Text style={styles.editButtonText}>Edit Listing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.soldButton}
              onPress={() => setShowSoldModal(true)}
              disabled={isProcessing}
            >
              <Text style={styles.soldButtonText}>Mark as Sold</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryButtonsContainer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowDeleteModal(true)}
              disabled={isProcessing}
            >
              <Text style={styles.secondaryButtonText}>Delete Listing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleRenewListing}
              disabled={isProcessing}
            >
              <Text style={styles.secondaryButtonText}>Renew Listing</Text>
            </TouchableOpacity>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>Details</Text>
              {allDetails.length > 3 && (
                <TouchableOpacity onPress={() => setShowAllDetails(!showAllDetails)}>
                  <Text style={styles.seeMoreText}>
                    {showAllDetails ? 'See Less' : 'See All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {showAllDetails ? (
              detailsToShow.map((detail, index) => (
                <View key={index} style={styles.detailItem}>
                  <View style={styles.detailLeftSection}>
                    <View style={styles.detailIconContainer}>
                      <Image
                        source={getIconSource(detail.icon)}
                        style={styles.detailIcon}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.detailLabel}>{detail.label}:</Text>
                  </View>
                  <Text style={styles.detailValue}>{detail.value}</Text>
                </View>
              ))
            ) : (
              <View style={styles.collapsedDetails}>
                <View style={styles.collapsedDetailItem}>
                  <Image
                    source={require('../../assets/icons/bed.png')}
                    style={styles.collapsedDetailIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.collapsedDetailText}>{listing.bedrooms} Bedrooms</Text>
                </View>
                
                <View style={styles.collapsedDetailItem}>
                  <Image
                    source={require('../../assets/icons/bath.png')}
                    style={styles.collapsedDetailIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.collapsedDetailText}>{listing.bathrooms} Bathroom</Text>
                </View>
                
                <View style={styles.collapsedDetailItem}>
                  <Image
                    source={require('../../assets/icons/foot.png')}
                    style={styles.collapsedDetailIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.collapsedDetailText}>{listing.lotSize || 'N/A'}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Insights Section */}
          <View style={styles.insightsSection}>
            <Text style={styles.insightsTitle}>Insights</Text>
            <View style={styles.insightsRow}>
              <View style={styles.insightItem}>
                <Image
                  source={require('../../assets/icons/eye.png')}
                  style={styles.insightIcon}
                  resizeMode="contain"
                />
                <Text style={styles.insightText}>{listing.views || 0} clicks</Text>
              </View>

              <View style={styles.insightItem}>
                <Image
                  source={require('../../assets/icons/save.png')}
                  style={styles.insightIcon}
                  resizeMode="contain"
                />
                <Text style={styles.insightText}>{listing.saves || 0} save</Text>
              </View>

              <View style={styles.insightItem}>
                <Image
                  source={require('../../assets/icons/share.png')}
                  style={styles.insightIcon}
                  resizeMode="contain"
                />
                <Text style={styles.insightText}>{listing.shares || 0} shares</Text>
              </View>
            </View>
          </View>

          {/* Chats Section */}
          <View style={styles.chatsSection}>
            <View style={styles.chatsSectionHeader}>
              <Text style={styles.chatsTitle}>Chats</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.emptyChatState}>
              <Text style={styles.emptyChatText}>No chats yet</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Video Player */}
      {renderFullScreenVideo()}

      {/* Mark as Sold Modal */}
      <Modal
        visible={showSoldModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSoldModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark as Sold</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to mark this property as sold?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSoldModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleMarkAsSold}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Listing</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this listing? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleDeleteListing}
              >
                <Text style={styles.modalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FF4500" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
};

const getIconSource = (iconName: string) => {
  const icons: { [key: string]: any } = {
    bed: require('../../assets/icons/bed.png'),
    bath: require('../../assets/icons/bath.png'),
    home: require('../../assets/icons/Type.png'),
    lot: require('../../assets/icons/Lot.png'),
    parking: require('../../assets/icons/Park.png'),
    cooling: require('../../assets/icons/Cooling.png'),
    heating: require('../../assets/icons/Heat.png'),
    dollar: require('../../assets/icons/Price.png'),
    calendar: require('../../assets/icons/Calender.png'),
    checkmark: require('../../assets/icons/checkmark.png'),
    listing: require('../../assets/icons/listing.png'),
    price: require('../../assets/icons/Price.png')
  };
  return icons[iconName] || require('../../assets/icons/Type.png');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageCarouselContainer: {
    height: 400,
    position: 'relative',
  },
  propertyImage: {
    width,
    height: 400,
  },
  mediaItemContainer: {
    position: 'relative',
    width,
    height: 400,
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  // Center Play/Pause Button (Inline)
  centerPlayPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -35 }, { translateY: -35 }],
    zIndex: 10,
  },
  playPauseCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  playPauseIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  // Fullscreen Button
  fullScreenButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  fullScreenButtonIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#fff',
    borderWidth: 1,
    zIndex: 10,
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
    opacity: 0.95,
    transform: [{ scale: 1.1 }],
  },
  createButtonBackgroundImage: {
    borderRadius: 999,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  plusIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  contentSection: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  address: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    flex: 1,
    marginRight: 16,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: 'purple',
  },
  actionButtonsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#FF4500',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  soldButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4500',
  },
  soldButtonText: {
    color: '#FF4500',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  collapsedDetails: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  collapsedDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collapsedDetailIcon: {
    width: 20,
    height: 20,
    tintColor: '#6b7280',
  },
  collapsedDetailText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  seeMoreText: {
    color: '#FF4500',
    fontSize: 14,
    fontWeight: '600',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  detailLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailIcon: {
    width: 16,
    height: 16,
    tintColor: '#6b7280',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'left',
    flex: 1,
    marginLeft: 8,
    flexWrap: 'wrap',
  },
  insightsSection: {
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  insightsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightIcon: {
    width: 16,
    height: 16,
    tintColor: '#6b7280',
  },
  insightText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  chatsSection: {
    marginBottom: 24,
  },
  chatsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  seeAll: {
    color: '#FF4500',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyChatState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyChatText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  // Full Screen Video Styles
  fullScreenVideo: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Full Screen Play/Pause Button
  fullScreenPlayPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    zIndex: 1000,
  },
  fullScreenPlayPauseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  fullScreenPlayPauseIcon: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF4500',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
});

export default ListingDetailScreen;