import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { propertyListingsAPI } from '../../api/propertyListingsAPI';
import { PropertyListing } from '../../types/propertyTypes';

interface ListingsScreenProps {
  navigation: any;
}

const ListingsScreen: React.FC<ListingsScreenProps> = ({ navigation }) => {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async (page = 1, refresh = false) => {
    if (loading || (!hasMore && !refresh)) return;

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await propertyListingsAPI.getLoggedUserPropertyListings(page, 10);

      // Clean up the listings data before setting state
      const cleanedListings = response.items.map(cleanListingData);
      
      if (refresh || page === 1) {
        setListings(cleanedListings);
      } else {
        setListings(prev => [...prev, ...cleanedListings]);
      }

      setHasMore(page < response.totalPages);
      setPageNumber(page);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cleanListingData = (listing: PropertyListing): PropertyListing => {
    if (!listing.siteOrPropertyImages || !Array.isArray(listing.siteOrPropertyImages)) {
      return {
        ...listing,
        siteOrPropertyImages: [],
        imageCount: 0
      };
    }

    // Extract valid image URLs from the array
    const validImages = listing.siteOrPropertyImages
      .map(image => extractValidImageUrl(image))
      .filter((url): url is string => url !== null);

    return {
      ...listing,
      siteOrPropertyImages: validImages,
      imageCount: validImages.length
    };
  };

  const extractValidImageUrl = (image: any): string | null => {
    if (!image) return null;

    let url: string | null = null;

    // Case 1: Direct string URL
    if (typeof image === 'string') {
      url = image.trim();
    }
    // Case 2: Object with url/uri property
    else if (typeof image === 'object' && image !== null) {
      url = (image.url || image.uri || image.secure_url || '').trim();
    }

    // Validate the URL
    if (url && isValidImageUrl(url)) {
      return url;
    }

    return null;
  };

  const isValidImageUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    
    // Must be a valid HTTP URL
    if (!trimmedUrl.startsWith('http')) return false;
    
    // Must not contain invalid strings
    if (trimmedUrl.toLowerCase().includes('unsupported')) return false;
    
    // Must be a reasonable length
    if (trimmedUrl.length < 10) return false;
    
    return true;
  };

  const getFirstImageUrl = (images: any[] | null | undefined): string | null => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return null;
    }
    return images[0] || null;
  };

  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const videoKeywords = ['/video/', 'video/upload', '.mp4', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) ||
           videoKeywords.some(keyword => url.toLowerCase().includes(keyword));
  };

  const handleRefresh = () => {
    fetchListings(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchListings(pageNumber + 1);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'active':
        return '#22c55e'; 
      case 'expired':
        return '#f97316';
      case 'sold':
        return '#ef4444';
      default:
        return '#22c55e'; 
    }
  };

  const formatPrice = (price: number) => {
    return `$${price?.toLocaleString() || '0'}`;
  };

  const filteredListings = listings.filter(listing =>
    listing.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleListingPress = (listing: PropertyListing) => {
    navigation.navigate('ListingDetail', { listing });
  };

  const renderListingItem = ({ item }: { item: PropertyListing }) => {
    const imageUrl = getFirstImageUrl(item.siteOrPropertyImages);
    const hasValidImage = !!imageUrl;
    const isVideo = hasValidImage && isVideoUrl(imageUrl);
    const validImageCount = item.imageCount || 0;
    const videoCount = item.videoCount || 0;

    return (
      <TouchableOpacity 
        style={styles.listingCard}
        onPress={() => handleListingPress(item)}
        activeOpacity={0.7}
      >
        {/* Left Side - Image */}
        <View style={styles.imageSection}>
          {hasValidImage ? (
            <View style={styles.mediaContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.propertyImage}
                resizeMode="cover"
              />
              {isVideo && (
                <View style={styles.videoOverlay}>
                  <View style={styles.videoPlayButton}>
                    <Text style={styles.videoPlayIcon}>▶</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderIcon}>🏠</Text>
            </View>
          )}
          
          {/* Media count badges - bottom left */}
          <View style={styles.mediaBadgesContainer}>
            {validImageCount > 0 && videoCount > 0 &&(
              <View style={styles.mediaBadge}>
                <Text style={styles.mediaBadgeIcon}>📷</Text>
                <Text style={styles.mediaBadgeText}>{validImageCount}</Text>
                <Text style={styles.mediaBadgeIcon}>🎥</Text>
                <Text style={styles.mediaBadgeText}>{videoCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Side - Details */}
        <View style={styles.detailsSection}>
          {/* Address and Status Badge */}
          <View style={styles.headerRow}>
            <Text style={styles.address} numberOfLines={1}>
              {item.propertyAddress || 'No Address'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.soldStatus) }]}>
              <Text style={styles.statusText}>{item.soldStatus || 'Active'}</Text>
            </View>
          </View>

          {/* Property Info Icons Row */}
          <View style={styles.propertyInfoRow}>
            <View style={styles.infoItem}>
              <Image
                source={require('../../assets/icons/bed.png')}
                style={styles.infoIcon}
                resizeMode="contain"
              />
              <Text style={styles.infoText}>{item.bedrooms || 0}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Image
                source={require('../../assets/icons/bath.png')}
                style={styles.infoIcon}
                resizeMode="contain"
              />
              <Text style={styles.infoText}>{item.bathrooms || 0}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Image
                source={require('../../assets/icons/foot.png')}
                style={styles.infoIcon}
                resizeMode="contain"
              />
              <Text style={styles.infoText}>{item.squareFoot || 0} sq ft</Text>
            </View>
            
            {/* Share button */}
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={(e) => {
                e.stopPropagation();
                // Handle share functionality
              }}
            >
              <Image
                source={require('../../assets/icons/message.png')}
                style={styles.shareIconButton}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Stats and Price Row */}
          <View style={styles.footerRow}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Image
                  source={require('../../assets/icons/eye.png')}
                  style={styles.statIcon}
                  resizeMode="contain"
                />
                <Text style={styles.statText}>{item.views || 0}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Image
                  source={require('../../assets/icons/save.png')}
                  style={styles.statIcon}
                  resizeMode="contain"
                />
                <Text style={styles.statText}>{item.saves || 0}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Image
                  source={require('../../assets/icons/share.png')}
                  style={styles.statIcon}
                  resizeMode="contain"
                />
                <Text style={styles.statText}>{item.shares || 0}</Text>
              </View>
            </View>
            
            <Text style={styles.price}>{formatPrice(item.price || 0)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyText}>No listings available</Text>
      <Text style={styles.emptySubtext}>Create your first listing to get started!</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.bellButton}>
          <Image
            source={require('../../assets/icons/bell.png')}
            style={styles.bellIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Image
          source={require('../../assets/icons/search.png')}
          style={styles.searchIcon}
          resizeMode="contain"
        />
      </View>

      {/* Listings */}
      <FlatList
        data={filteredListings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item.propertyListingId.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={['#f97316']}
            tintColor="#f97316"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="large" color="#f97316" />
            </View>
          ) : null
        }
      />

      {/* Create Listing Button */}
      <ImageBackground
        source={require('../../assets/images/auth-bg.png')}
        style={styles.createButtonBackground}
        imageStyle={styles.createButtonBackgroundImage}
      >
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateListing')}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/icons/plus.png')}
            style={styles.plusIcon}
            resizeMode="contain"
          />
          <Text style={styles.createButtonText}>Create Listing</Text>
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#f97316',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bellButton: {
    padding: 4,
  },
  bellIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 30,
  },
  searchContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 2,
  },
  searchInput: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 45,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  searchIcon: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    tintColor: '#6b7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    padding: 12,
    paddingVertical: 12,
  },
  imageSection: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayIcon: {
    fontSize: 12,
    color: '#000',
    marginLeft: 2,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  mediaBadgesContainer: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    gap: 4,
  },
  mediaBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediaBadgeIcon: {
    fontSize: 10,
  },
  mediaBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  detailsSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  address: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  propertyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 12,
  },
  infoIcon: {
    width: 14,
    height: 14,
    tintColor: '#6b7280',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  shareButton: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  shareIconButton: {
    width: 14,
    height: 14,
    tintColor: '#f97316',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statIcon: {
    width: 14,
    height: 14,
    tintColor: '#9ca3af',
  },
  statText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
  },
  createButtonBackground: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    borderRadius: 999,
    overflow: 'hidden',
  },
  createButtonBackgroundImage: {
    borderRadius: 999,
  },
  createButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  plusIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ListingsScreen;