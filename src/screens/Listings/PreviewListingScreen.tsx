import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Image,
    Platform,
    Dimensions,
    Modal,
} from 'react-native';
import Video from 'react-native-video';
import Toast from 'react-native-toast-message';
import { propertyListingsAPI } from '../../api/propertyListingsAPI';
import { CreatePropertyListingRequest } from '../../types/propertyTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MediaItem {
    url: string;
    uri: string;
    type: 'image' | 'video';
    fileName?: string;
}

interface PreviewListingScreenProps {
    navigation: any;
    route: {
        params: {
            listingData: {
                formData: any;
                mediaItems: MediaItem[];
                documentItems: string[];
                imageCount: number;
                videoCount: number;
                isEdit?: boolean;
                listingId?: number;
                originalListing?: any;
            };
        };
    };
}

const { width: screenWidth } = Dimensions.get('window');
const MEDIA_HEIGHT = 300;

const PreviewListingScreen: React.FC<PreviewListingScreenProps> = ({ navigation, route }) => {
    const { listingData } = route.params;
    const { formData, mediaItems, documentItems, imageCount, videoCount, isEdit, listingId } = listingData;

    const [loading, setLoading] = useState(false);
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    const [videoPaused, setVideoPaused] = useState(true);
    const [inlineVideoPaused, setInlineVideoPaused] = useState<{ [key: number]: boolean }>({});
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const videoRef = useRef<Video>(null);
    const fullScreenVideoRef = useRef<Video>(null);
    const insets = useSafeAreaInsets();
    const formatPrice = (price: string | number) => {
        const priceNum = typeof price === 'string' ? parseFloat(price) : price;
        return `$${priceNum?.toLocaleString() || '0'}`;
    };

    const calculatePricePerSqFt = () => {
        const price = parseFloat(formData.price) || 0;
        const sqFt = parseFloat(formData.squareFoot) || 1;
        return (price / sqFt).toFixed(2);
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
        // Pause inline video when opening fullscreen
        setInlineVideoPaused(prev => ({
            ...prev,
            [index]: true
        }));
        setVideoPaused(false);
    };

    const handleCloseVideo = () => {
        setPlayingVideo(null);
        setVideoPaused(true);
    };

    const handleVideoError = (error: any) => {
        console.error('Video playback error:', error);
        Toast.show({
            type: 'error',
            text1: 'Video Error',
            text2: 'Failed to play video. Please try again.',
            position: 'bottom',
            bottomOffset: insets.bottom + 80,
        });
        handleCloseVideo();
    };

    const handlePublishListing = async () => {
        try {
            setLoading(true);

            const requestData: CreatePropertyListingRequest = {
                SiteOrPropertyImages: mediaItems.map(item => item.url),
                PropertyAddress: formData.propertyAddress,
                PropertyType: formData.propertyType,
                YearBuilt: parseInt(formData.yearBuilt) || 0,
                HeatingSystems: formData.heatingSystems,
                CoolingSystems: formData.coolingSystems,
                Price: parseFloat(formData.price) || 0,
                Bedrooms: parseInt(formData.bedrooms) || 0,
                Bathrooms: parseFloat(formData.bathrooms) || 0,
                Parking: formData.parking,
                LotSize: `${formData.lotSize} ${formData.lotUnit}`,
                SquareFoot: parseFloat(formData.squareFoot) || 0,
                Documents: documentItems,
                Description: formData.description,
                Networth: parseFloat(formData.networth) || 0,
                ImageCount: imageCount,
                VideoCount: videoCount,
            };


            if (formData.rehabEstimate) {
                requestData.RehabEstimate = parseFloat(formData.rehabEstimate);
            }
            if (formData.averageLeasePrice) {
                requestData.AverageLeasePrice = parseFloat(formData.averageLeasePrice);
            }

            console.log('🚀 Processing listing with data:', requestData);
            console.log('📝 Mode:', isEdit ? 'EDIT' : 'CREATE');
            if (isEdit) {
                console.log('🔄 Listing ID to update:', listingId);
            }

            let result;
            let successMessage;

            if (isEdit && listingId) {
                console.log('🔄 Updating existing listing:', listingId);
                result = await propertyListingsAPI.updatePropertyListing(listingId, requestData);
                successMessage = 'Listing updated successfully!';
            } else {
                console.log('🆕 Creating new listing');
                result = await propertyListingsAPI.createPropertyListing(requestData);
                successMessage = 'Listing published successfully!';
            }

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: successMessage,
                position: 'bottom',
                visibilityTime: 2000,
                bottomOffset: insets.bottom + 40,
                onHide: () => navigation.navigate('ListingMain'),
            });

        } catch (error: any) {
            console.error('💥 Error processing listing:', error);

            if (error.response?.status === 500) {
                const errorMessage = error.response?.data;
                if (errorMessage?.includes('already exists')) {
                    Toast.show({
                        type: 'error',
                        text1: 'Address Already Exists',
                        text2: 'This property is already in use. Please use a different address.',
                        position: 'bottom',
                        visibilityTime: 4000,
                    });
                } else {
                    const action = isEdit ? 'updating' : 'publishing';
                    Toast.show({
                        type: 'error',
                        text1: 'Server Error',
                        text2: `There was an issue ${action} the listing.`,
                        position: 'bottom',
                    });
                }
            } else if (error.response?.status === 400) {
                Toast.show({
                    type: 'error',
                    text1: 'Validation Error',
                    text2: 'Please check all required fields.',
                    position: 'bottom',
                });
            } else if (error.message?.includes('Network Error')) {
                Toast.show({
                    type: 'error',
                    text1: 'Network Error',
                    text2: 'Please check your internet connection.',
                    position: 'bottom',
                });
            } else {
                const action = isEdit ? 'update' : 'publish';
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: error.message || `Failed to ${action} listing.`,
                    position: 'bottom',
                });
            }
        } finally {
            setLoading(false);
        }
    };

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

    const renderMediaPreview = () => {
        if (mediaItems.length === 0) {
            return (
                <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderIcon}>🏠</Text>
                </View>
            );
        }

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mediaScrollView}
                contentContainerStyle={styles.mediaContentContainer}
                pagingEnabled
                onScroll={(event) => {
                    const slideIndex = Math.round(
                        event.nativeEvent.contentOffset.x / screenWidth
                    );
                    setCurrentMediaIndex(slideIndex);
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
                {mediaItems.map((item, index) => (
                    <View key={index} style={styles.mediaItemContainer}>
                        {item.type === 'image' ? (
                            <Image
                                source={{ uri: item.url }}
                                style={styles.mediaImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.videoContainer}>
                                {/* Video Player - Always rendered with poster */}
                                <Video
                                    source={{ uri: item.url }}
                                    style={styles.videoPlayer}
                                    resizeMode="cover"
                                    paused={inlineVideoPaused[index] !== false}
                                    controls={false}
                                    poster={getVideoThumbnail(item.url)}
                                    posterResizeMode="cover"
                                    repeat={false}
                                    muted={false}
                                    onError={handleVideoError}
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
                                            {inlineVideoPaused[index] !== false ? '▶' : '❚❚'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Fullscreen Button - Only show when video is playing */}
                                {inlineVideoPaused[index] === false && (
                                    <TouchableOpacity
                                        style={styles.fullScreenButton}
                                        onPress={() => handleOpenFullScreen(item.url, index)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.fullScreenButtonIcon}>⛶</Text>
                                    </TouchableOpacity>
                                )}

                                {/* Video Badge */}
                                <View style={styles.videoBadge}>
                                    <Text style={styles.videoBadgeText}>VIDEO</Text>
                                </View>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Full Screen Video Player Modal */}
            {renderFullScreenVideo()}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Property Media - Scrollable */}
                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Image
                            source={require('../../assets/icons/back.png')}
                            style={styles.backIcon}
                        />
                    </TouchableOpacity>
                    {renderMediaPreview()}

                    <View style={styles.imageCountBadge}>
                        <Text style={styles.imageCountText}>
                            {currentMediaIndex + 1} of {mediaItems.length}
                        </Text>
                    </View>
                </View>

                {/* Address and Price Section */}
                <Text style={styles.addressText}>{formData.propertyAddress}</Text>

                <View style={styles.addressSection}>
                    <View style={styles.priceStatsRow}>
                        <Text style={styles.priceText}>{formatPrice(formData.price)}</Text>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{formData.bedrooms}</Text>
                                <Text style={styles.statLabel}>Beds</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{formData.bathrooms}</Text>
                                <Text style={styles.statLabel}>Baths</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{formData.squareFoot}</Text>
                                <Text style={styles.statLabel}>sq.Ft.</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Description Section */}
                <View style={styles.section}>
                    <Text style={styles.descriptionText}>
                        {formData.description || 'No description provided.'}
                    </Text>
                </View>

                {/* Facts and Features Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Facts and Features</Text>
                    <View style={styles.tabDivider} />
                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                             <Image
                                source={require('../../assets/icons/Type.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Type:</Text>
                            <Text style={styles.featureValue}>{formData.propertyType}</Text>
                        </View>

                        <View style={styles.featureItem}>
                             <Image
                                source={require('../../assets/icons/Calender.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Year Built:</Text>
                            <Text style={styles.featureValue}>{formData.yearBuilt}</Text>
                        </View>

                        <View style={styles.featureItem}>
                               <Image
                                source={require('../../assets/icons/Heat.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Heating:</Text>
                            <Text style={styles.featureValue}>
                                {formData.heatingSystems.join(', ')}
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                               <Image
                                source={require('../../assets/icons/Cooling.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Cooling:</Text>
                            <Text style={styles.featureValue}>
                                {formData.coolingSystems.join(', ')}
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                               <Image
                                source={require('../../assets/icons/Park.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Parking:</Text>
                            <Text style={styles.featureValue}>
                                {formData.parking.join(', ')}
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                               <Image
                                source={require('../../assets/icons/Lot.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Lot:</Text>
                            <Text style={styles.featureValue}>
                                {formData.lotSize} {formData.lotUnit}
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                               <Image
                                source={require('../../assets/icons/Price.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Price/sqft:</Text>
                            <Text style={styles.featureValue}>
                                ${calculatePricePerSqFt()}
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                            <Image
                                source={require('../../assets/icons/bed.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Bedrooms:</Text>
                            <Text style={styles.featureValue}>{formData.bedrooms}</Text>
                        </View>

                        <View style={styles.featureItem}>
                               <Image
                                source={require('../../assets/icons/bath.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Bathrooms:</Text>
                            <Text style={styles.featureValue}>{formData.bathrooms}</Text>
                        </View>

                        <View style={styles.featureItem}>
                              <Image
                                source={require('../../assets/icons/checkmark.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Market Value:</Text>
                            <Text style={styles.featureValue}>{formData.networth}</Text>
                        </View>

                        <View style={styles.featureItem}>
                              <Image
                                source={require('../../assets/icons/listing.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Rehab Estimate:</Text>
                            <Text style={styles.featureValue}>{formData.rehabEstimate}</Text>
                        </View>

                        <View style={styles.featureItem}>
                              <Image
                                source={require('../../assets/icons/Price.png')}
                                style={styles.detailIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.featureLabel}>Avg Lease Price:</Text>
                            <Text style={styles.featureValue}>{formData.averageLeasePrice}</Text>
                        </View>
                    </View>
                </View>

                {/* Documents Section */}
                {documentItems.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Documents</Text>
                        <View style={styles.tabDivider} />
                        <View style={styles.documentsList}>
                            {documentItems.map((doc, index) => (
                                <View key={index} style={styles.documentItem}>
                                    <Text style={styles.documentIcon}>📄</Text>
                                    <Text style={styles.documentName}>
                                        {doc.split('/').pop() || `Document${index + 1}.pdf`}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.bottomSpacer} />

                {/* Publish Listing Button */}
                <View style={styles.publishButtonContainer}>
                    <TouchableOpacity
                        style={[styles.publishButton, loading && styles.publishButtonDisabled]}
                        onPress={handlePublishListing}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.publishButtonText}>
                                {isEdit ? 'UPDATE LISTING' : 'PUBLISH LISTING'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 100,
    },
    imageSection: {
        position: 'relative',
        height: MEDIA_HEIGHT,
        backgroundColor: '#000',
    },
    mediaScrollView: {
        flex: 1,
    },
    mediaContentContainer: {
        flexDirection: 'row',
    },
    mediaItemContainer: {
        width: screenWidth,
        height: MEDIA_HEIGHT,
        backgroundColor: '#000',
    },
    mediaImage: {
        width: '100%',
        height: '100%',
    },
    videoContainer: {
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
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
    videoBadge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        zIndex: 10,
    },
    videoBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
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
        top: Platform.OS === 'ios' ? 60 : 40,
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
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderIcon: {
        fontSize: 64,
        opacity: 0.5,
    },
    imageCountBadge: {
        position: 'absolute',
        bottom: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: "center"
    },
    imageCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        width: 40,
        height: 40,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 6,
    },
    backIcon: {
        width: 22,
        height: 22,
        tintColor: '#fff',
        opacity: 0.95,
        transform: [{ scale: 1.1 }],
    },
    addressSection: {
        marginHorizontal: 22,
        marginVertical: 0,
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#f3f4f6',
    },
    addressText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
        marginTop: 10,
    },
    priceStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'purple',
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '45%',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 1,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 10,
    },
    tabDivider: {
        height: 2,
        backgroundColor: '#e5e7eb',
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 12,
        lineHeight: 20,
        color: '#374151',
    },
    featuresList: {
        gap: 6,
    },
    featureItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    featureLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
        left: 10
    },
    detailIcon: {
        width: 16,
        height: 16,
        tintColor: '#1347a8ff',
    },
    featureValue: {
        fontSize: 12,
        color: '#6b7280',
        flex: 1,
        textAlign: 'left',
    },
    documentsList: {
        gap: 8,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    documentIcon: {
        fontSize: 16,
        marginRight: 12,
    },
    documentName: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    bottomSpacer: {
        height: 20,
    },
    publishButtonContainer: {
        position: 'relative',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    publishButton: {
        backgroundColor: '#FF4500',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    publishButtonDisabled: {
        opacity: 0.6,
    },
    publishButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default PreviewListingScreen;