// screens/Chat/MarketplaceConversationScreen.tsx - UPDATED WITH PROPERTY SHARING
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { marketplaceAPI } from '../../api/marketplace';
import { MarketPlaceMessage } from '../../types/marketplace';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../api/profileAPI';
import { useImagePicker } from '../../hooks/useImagePicker';

interface RouteParams {
  propertyId: number;
  propertyAddress: string;
  propertyImage?: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  userProfileType: number;
}

interface Props {
  route: RouteProp<{ params: RouteParams }, 'params'>;
  navigation: StackNavigationProp<any>;
}

interface PropertyDetail {
  bathrooms: number;
  bedrooms: number;
  isDeleted: boolean;
  lotSize: string;
  parking: string[];
  price: number;
  propertyAddress: string;
  propertyListingId: number;
  saves: number;
  shares: number;
  siteOrPropertyImages: string[];
  soldStatus: string;
  squareFoot: number;
  views: number;
}

const MarketplaceConversationScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    propertyId,
    propertyAddress,
    propertyImage,
    userId,
    userName: initialUserName,
    userProfileImage: initialProfileImage,
    userProfileType,
  } = route.params;

  const { userInfo } = useAuth();

  const [messages, setMessages] = useState<MarketPlaceMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userName, setUserName] = useState(initialUserName);
  const [userImage, setUserImage] = useState(initialProfileImage);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MarketPlaceMessage | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [replyingTo, setReplyingTo] = useState<MarketPlaceMessage | null>(null);
  const [currentUserImage, setCurrentUserImage] = useState<string>('');
  const [showingPropertyCard, setShowingPropertyCard] = useState(true);
   const [propertyDetail, setPropertyDetail] = useState<PropertyDetail | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);

  const PAGE_SIZE = 20;
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  // Image picker hook
  const { 
    pickAndUploadMedia, 
    pickAndUploadDocument, 
    uploading: imageUploading,
    uploadingDocument: docUploading 
  } = useImagePicker();

  useEffect(() => {
    console.log('🎬 MarketplaceConversation mounted');
    initializeChat();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
  if (propertyId) {
    fetchPropertyDetails();
  }
}, [propertyId]);

  const initializeChat = async () => {
    await getCurrentUserId();
    await loadMessages(1);
    startPolling();
  };


  const fetchPropertyDetails = async () => {
  try {
    console.log('🏠 [Marketplace] Fetching property details for ID:', propertyId);
    
    const response = await marketplaceAPI.getPropertyDetails(propertyId);
    
    if (response.success && response.property) {
      console.log('✅ [Marketplace] Property details loaded:', {
        bedrooms: response.property.bedrooms,
        bathrooms: response.property.bathrooms,
        price: response.property.price,
        views: response.property.views,
        saves: response.property.saves,
        shares: response.property.shares,
        images: response.property.siteOrPropertyImages?.length
      });
      
      setPropertyDetail(response.property);
    }
  } catch (error: any) {
    console.error('❌ [Marketplace] Error fetching property details:', error.message);
    // Don't show toast for this as it's not critical for chat functionality
  }
};

const getPropertyDisplayImage = () => {
  if (propertyDetail?.siteOrPropertyImages && propertyDetail.siteOrPropertyImages.length > 0) {
    return propertyDetail.siteOrPropertyImages[0];
  }
  return propertyImage;
};

const getPropertyDisplayAddress = () => {
  if (propertyDetail?.propertyAddress) {
    return propertyDetail.propertyAddress;
  }
  return propertyAddress;
};

const handlePropertyPress = () => {
  console.log('🏠 [Marketplace] Navigating to property details:', propertyId);
  
  // Prepare property data for ListingDetailScreen
  const propertyData = propertyDetail ? {
    ...propertyDetail,
    propertyListingId: propertyId,
    propertyAddress: propertyDetail.propertyAddress || propertyAddress,
    siteOrPropertyImages: propertyDetail.siteOrPropertyImages || (propertyImage ? [propertyImage] : [])
  } : {
    propertyListingId: propertyId,
    propertyAddress: propertyAddress,
    siteOrPropertyImages: propertyImage ? [propertyImage] : [],
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    squareFoot: 0,
    lotSize: '',
    soldStatus: 'Available',
    parking: [],
    views: 0,
    saves: 0,
    shares: 0,
    isDeleted: false
  };

  console.log('📦 [Marketplace] Property data for navigation:', propertyData);
  
  navigation.navigate('ListingDetail', { 
    listing: propertyData  // Using 'listing' to match ListingsScreen pattern
  });
};

  const getCurrentUserId = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo.id) {
          setCurrentUserId(userInfo.id);
          
          console.log('🔄 Fetching profile image for user:', userInfo.id);
          
          // Get current user's profile image from Profile API
          try {
            const profileResponse = await profileAPI.getSellerProfile();
            console.log('📊 Full Profile API Response:', JSON.stringify(profileResponse, null, 2));
            
            if (profileResponse && profileResponse.sellerProfile) {
              const sellerProfile = profileResponse.sellerProfile;
              console.log('👤 Seller Profile Data:', {
                userProfileImage: sellerProfile.userProfileImage,
                name: sellerProfile.name,
                hasImage: !!sellerProfile.userProfileImage
              });
              
              if (sellerProfile.userProfileImage) {
                let profileImageUrl = sellerProfile.userProfileImage;
                
                console.log('🖼️ Setting profile image URL:', profileImageUrl);
                setCurrentUserImage(profileImageUrl);
                
                // Test if image loads
                Image.getSize(profileImageUrl, 
                  (width, height) => {
                    console.log('✅ Image URL is valid - Dimensions:', width, 'x', height);
                  },
                  (error) => {
                    console.log('❌ Image URL failed to load:', error);
                  }
                );
              } else {
                console.log('❌ No userProfileImage found in profile response');
                setCurrentUserImage('');
              }
            } else {
              console.log('❌ No sellerProfile found in response');
              setCurrentUserImage('');
            }
          } catch (profileError) {
            console.error('❌ Error fetching profile image:', profileError);
            setCurrentUserImage('');
          }
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error getting userId:', error);
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      checkForNewMessages();
    }, 10000);
  };

  const loadMessages = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);

      const response = await marketplaceAPI.getMarketPlaceMessageHistory({
        reciverId: userId,
        propertyId,
        receiverProfileType: userProfileType,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });

         console.log('📥 [Marketplace] API Response:', {
        messagesCount: response.messages?.length,
        hasPropertyDetail: !!response.propertyDetail,
        success: response.success
      });

        if (response.propertyDetail && !propertyDetail) {
          console.log('🏠 [Marketplace] Setting property detail:', response.propertyDetail);
          setPropertyDetail(response.propertyDetail);
        }

      if (response.success && response.messages) {
        let newMessages = response.messages;
        
        newMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        if (append) {
          setMessages(prev => [...prev, ...newMessages]);
        } else {
          setMessages(newMessages);
        }

        setHasMore(response.hasNextPage);
        setPageNumber(page);

        if (!append && newMessages.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }

        const unreadMessageIds = newMessages
          .filter(msg => !msg.isRead && msg.receiverId === currentUserId)
          .map(msg => msg.id);

        if (unreadMessageIds.length > 0) {
          await marketplaceAPI.markMarketPlaceAsRead(unreadMessageIds);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading messages:', error);
      showToast('error', 'Error', error.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewMessages = useCallback(async () => {
    try {
      const response = await marketplaceAPI.getMarketPlaceMessageHistory({
        reciverId: userId,
        propertyId,
        receiverProfileType: userProfileType,
        pageNumber: 1,
        pageSize: 50,
      });

      if (response.success && response.messages && response.messages.length > 0) {
        let newMessages = response.messages;
        newMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        const latestMessageId = newMessages[newMessages.length - 1]?.id;
        const currentLatestId = messages[messages.length - 1]?.id;
        
        if (!currentLatestId || latestMessageId > currentLatestId) {
          setMessages(newMessages);
        }
      }
    } catch (error) {
      console.error('❌ Error checking for new messages:', error);
    }
  }, [userId, propertyId, userProfileType, messages]);

  // Handle sending text messages
  const handleSendMessage = async (): Promise<void> => {
    if (inputText.trim() === '' || sending || !currentUserId) return;

    const messageContent = inputText.trim();
    
    // Create temporary message with proper typing
    const tempMessage: MarketPlaceMessage = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      senderId: currentUserId,
      senderName: userInfo?.name || 'You',
      receiverId: userId,
      receiverName: userName,
      content: messageContent,
      timestamp: new Date().toISOString(),
      isRead: true,
      propertyId,
      propertyAddress,
      replyedMessageId: replyingTo?.id,
      replyedMessage: replyingTo ? {
        id: replyingTo.id,
        senderId: replyingTo.senderId,
        senderName: replyingTo.senderName,
        receiverId: replyingTo.receiverId,
        receiverName: replyingTo.receiverName,
        content: replyingTo.content,
        timestamp: replyingTo.timestamp,
        isRead: replyingTo.isRead,
        propertyId: replyingTo.propertyId,
        propertyAddress: replyingTo.propertyAddress,
        ...(replyingTo.senderProfileImage && { senderProfileImage: replyingTo.senderProfileImage }),
        ...(replyingTo.receiverProfileImage && { receiverProfileImage: replyingTo.receiverProfileImage }),
        ...(replyingTo.replyedMessageId && { replyedMessageId: replyingTo.replyedMessageId }),
        ...(replyingTo.replyedMessage && { replyedMessage: replyingTo.replyedMessage }),
      } : undefined,
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    setInputText('');
    setReplyingTo(null);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setSending(true);

    try {
      // Prepare API request with correct typing
      const sendMessageRequest = {
        receiverId: userId,
        propertyId,
        content: messageContent,
        ...(replyingTo?.id && { replyedMessageId: replyingTo.id }),
      };

      const response = await marketplaceAPI.sendMarketPlaceMessage(sendMessageRequest);

      if (response.success) {
        const apiMessage = response.data;
        
        if (apiMessage) {
          // Replace temporary message with actual message from API
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempMessage.id ? apiMessage : msg
            )
          );
          showToast('success', 'Sent', 'Message sent successfully');
        } else {
          // Fallback: reload messages if API doesn't return message data
          await loadMessages(1, false);
          showToast('success', 'Sent', 'Message sent successfully');
        }
      } else {
        // Revert optimistic update on failure
        handleSendMessageFailure(tempMessage.id, messageContent);
        showToast('error', 'Failed', response.message || 'Message sending failed');
      }
    } catch (error: any) {
      // Revert optimistic update on error
      handleSendMessageFailure(tempMessage.id, messageContent);
      showToast('error', 'Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Helper function to handle send failure
  const handleSendMessageFailure = (tempMessageId: number, originalText: string): void => {
    setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
    setInputText(originalText);
  };

  // Handle sending images
  const handleSendImage = async () => {
    if (!currentUserId || imageUploading) return;
    
    try {
      console.log('📸 Starting image picker for marketplace chat');
      
      const mediaResult = await pickAndUploadMedia(currentUserId, 'chatMedia');
      
      if (mediaResult && mediaResult.type === 'image') {
        console.log('🖼️ Image uploaded successfully:', mediaResult.url);
        
        // Create a media message
        const mediaContent = `[IMAGE]${mediaResult.url}`;
        
        const mediaMessage: MarketPlaceMessage = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          senderId: currentUserId,
          senderName: userInfo?.name || 'You',
          receiverId: userId,
          receiverName: userName,
          content: mediaContent,
          timestamp: new Date().toISOString(),
          isRead: true,
          propertyId,
          propertyAddress,
          messageType: 'image',
          mediaUrl: mediaResult.url,
        };

        // Send the media message
        await sendMediaMessage(mediaMessage);
      }
    } catch (error) {
      console.error('❌ Error sending image:', error);
      showToast('error', 'Error', 'Failed to send image');
    }
  };

  // Handle sending documents
  const handleSendDocument = async () => {
    if (!currentUserId || docUploading) return;
    
    try {
      console.log('📄 Starting document picker for marketplace chat');
      
      const documentUrl = await pickAndUploadDocument(currentUserId, 'chatDocuments');
      
      if (documentUrl) {
        console.log('📎 Document uploaded successfully:', documentUrl);
        
        // Create a document message
        const documentContent = `[DOCUMENT]${documentUrl}`;
        
        const documentMessage: MarketPlaceMessage = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          senderId: currentUserId,
          senderName: userInfo?.name || 'You',
          receiverId: userId,
          receiverName: userName,
          content: documentContent,
          timestamp: new Date().toISOString(),
          isRead: true,
          propertyId,
          propertyAddress,
          messageType: 'document',
          mediaUrl: documentUrl,
          fileName: 'document',
        };

        // Send the document message
        await sendMediaMessage(documentMessage);
      }
    } catch (error) {
      console.error('❌ Error sending document:', error);
      showToast('error', 'Error', 'Failed to send document');
    }
  };

  // Send media message using the text message API
  const sendMediaMessage = async (mediaMessage: MarketPlaceMessage) => {
    // Optimistic update
    setMessages(prev => [...prev, mediaMessage]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Prepare API request - using content field to send media URL
      const sendMessageRequest = {
        receiverId: userId,
        propertyId,
        content: mediaMessage.content, // This contains the media URL
        ...(replyingTo?.id && { replyedMessageId: replyingTo.id }),
      };

      const response = await marketplaceAPI.sendMarketPlaceMessage(sendMessageRequest);

      if (response.success) {
        const apiMessage = response.data;
        
        if (apiMessage) {
          // Replace temporary message with actual message from API
          setMessages(prev => 
            prev.map(msg => 
              msg.id === mediaMessage.id ? apiMessage : msg
            )
          );
          showToast('success', 'Sent', `${mediaMessage.messageType === 'image' ? 'Image' : 'Document'} sent successfully`);
        } else {
          // Fallback: reload messages
          await loadMessages(1, false);
          showToast('success', 'Sent', `${mediaMessage.messageType === 'image' ? 'Image' : 'Document'} sent successfully`);
        }
      } else {
        // Revert optimistic update on failure
        setMessages(prev => prev.filter(msg => msg.id !== mediaMessage.id));
        showToast('error', 'Failed', response.message || `Failed to send ${mediaMessage.messageType}`);
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setMessages(prev => prev.filter(msg => msg.id !== mediaMessage.id));
      showToast('error', 'Error', error.message || `Failed to send ${mediaMessage.messageType}`);
    }
  };

  // Handle sharing property as a message


  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMessages(pageNumber + 1, true);
    }
  };

  const showMessageMenu = (message: MarketPlaceMessage, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedMessage(message);
    setMenuPosition({ x: pageX - 100, y: pageY - 50 });
    setMenuVisible(true);
  };

  const handleReply = () => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
      textInputRef.current?.focus();
    }
    setMenuVisible(false);
    setSelectedMessage(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await marketplaceAPI.deleteMarketPlaceMessage(selectedMessage.id);
              setMessages(prev => prev.filter(msg => msg.id !== selectedMessage.id));
              showToast('success', 'Deleted', 'Message deleted successfully');
            } catch (error: any) {
              showToast('error', 'Error', error.message || 'Failed to delete message');
            }
          },
        },
      ]
    );
    setMenuVisible(false);
    setSelectedMessage(null);
  };

  const showToast = (type: 'success' | 'error' | 'info', text1: string, text2: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'bottom',
      bottomOffset: 80,
    });
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return '';
    }
  };

  const formatDateHeader = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
      }
    } catch (error) {
      return '';
    }
  };

  const shouldShowDateHeader = (currentMsg: MarketPlaceMessage, prevMsg: MarketPlaceMessage | null) => {
    if (!prevMsg) return true;
    try {
      const currentDate = new Date(currentMsg.timestamp).toDateString();
      const prevDate = new Date(prevMsg.timestamp).toDateString();
      return currentDate !== prevDate;
    } catch (error) {
      return false;
    }
  };




const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'available':
    case 'active':
      return '#22c55e'; 
    case 'expired':
      return '#FF4500';
    case 'sold':
      return '#ef4444';
    default:
      return '#22c55e'; 
  }
};

const formatPrice = (price: number) => {
  return `$${price?.toLocaleString() || '0'}`;
};



    const getMessageType = (content: string) => {
    if (content.startsWith('[IMAGE]')) return 'image';
    if (content.startsWith('[DOCUMENT]')) return 'document';
    if (content.startsWith('[PROPERTY]')) return 'property';
    return 'text';
  };

  // Extract media URL from message content
  const extractMediaUrl = (content: string, type: string) => {
    if (type === 'image') return content.replace('[IMAGE]', '');
    if (type === 'document') return content.replace('[DOCUMENT]', '');
    return null;
  };

  // Updated renderMessage to handle property messages
  const renderMessage = ({ item, index }: { item: MarketPlaceMessage; index: number }) => {
    const isOwnMessage = item.senderId === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateHeader = shouldShowDateHeader(item, prevMessage);
    const isReply = item.replyedMessageId || item.content.startsWith('Replying to:');

    // Check message types
    const isImage = item.content.startsWith('[IMAGE]');
    const isDocument = item.content.startsWith('[DOCUMENT]');
    const isProperty = item.content.startsWith('[PROPERTY]');
    
    const mediaUrl = isImage || isDocument ? item.content.replace('[IMAGE] ', '').replace('[DOCUMENT] ', '') : null;
    
    // Extract property info from property message
    let propertyData = null;
    if (isProperty) {
      const propertyParts = item.content.replace('[PROPERTY] ', '').split('|');
      if (propertyParts.length >= 3) {
        propertyData = {
          id: parseInt(propertyParts[0]),
          address: propertyParts[1],
          image: propertyParts[2] || propertyImage,
        };
      }
    }

    

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <Text style={styles.dateHeaderText}>
              {formatDateHeader(item.timestamp)}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageRow,
          isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow,
        ]}>
          {/* Sender Avatar - Left side */}
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              {userImage ? (
                <Image source={{ uri: userImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {userName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Message Content Area */}
          <View style={[
            styles.messageContent,
            isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent,
          ]}>
            {/* Reply Preview */}
            {isReply && (
              <View style={[
                styles.replyPreviewContainer,
                isOwnMessage ? styles.ownReplyPreview : styles.otherReplyPreview,
              ]}>
                <Text style={styles.replyPreviewLabel}>
                  Replying to {isOwnMessage ? userName : 'you'}
                </Text>
                <Text style={[
                  styles.replyPreviewText,
                  isOwnMessage ? styles.ownReplyPreviewText : styles.otherReplyPreviewText,
                ]} numberOfLines={2}>
                  {item.replyedMessage 
                    ? item.replyedMessage.content
                    : item.content.split('\n')[0].replace('Replying to: ', '')
                  }
                </Text>
              </View>
            )}
            
            {/* Message Bubble and Three Dots Row */}
            <View style={styles.messageBubbleRow}>
              {/* Three Dots Menu - NOW AT START FOR OWN MESSAGES */}
              {isOwnMessage && (
                <TouchableOpacity
                  style={[
                    styles.menuButton,
                    styles.menuButtonLeft
                  ]}
                  onPress={(event) => {
                    event.stopPropagation();
                    showMessageMenu(item, event);
                  }}
                >
                  <Text style={styles.menuButtonText}>⋮</Text>
                </TouchableOpacity>
              )}

              {/* Message Bubble */}
              <View style={[
                styles.messageBubble,
                isOwnMessage ? styles.ownBubble : styles.otherBubble,
                (isImage || isDocument || isProperty) && styles.mediaBubble,
              ]}>
                {isImage ? (
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('Opening image:', mediaUrl);
                    }}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={{ uri: mediaUrl }} 
                      style={styles.mediaImage}
                      resizeMode="cover"
                      onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
                    />
                    <View style={styles.imageOverlay}>
                      <Image 
                        source={require('../../assets/icons/media.png')}
                        style={styles.imageOverlayIcon}
                      />
                    </View>
                  </TouchableOpacity>
                ) : isDocument ? (
                  <TouchableOpacity 
                    style={styles.documentContainer}
                    onPress={() => {
                      console.log('Opening document:', mediaUrl);
                    }}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={require('../../assets/icons/document.png')}
                      style={styles.documentIcon}
                    />
                    <View style={styles.documentTextContainer}>
                      <Text style={[
                        styles.documentText,
                        isOwnMessage ? styles.ownDocumentText : styles.otherDocumentText,
                      ]}>
                        Document
                      </Text>
                      <Text style={[
                        styles.documentSubtext,
                        isOwnMessage ? styles.ownDocumentSubtext : styles.otherDocumentSubtext,
                      ]}>
                        Tap to open
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : isProperty ? (
                  <TouchableOpacity 
                    style={styles.propertyMessageContainer}
                    onPress={handlePropertyPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.propertyMessageHeader}>
                      <Text style={styles.propertyMessageTitle}>🏠 Property Shared</Text>
                    </View>
                    <View style={styles.propertyMessageContent}>
                      {propertyData?.image ? (
                        <Image 
                          source={{ uri: propertyData.image }} 
                          style={styles.propertyMessageImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.propertyMessageImagePlaceholder}>
                          <Text style={styles.propertyMessageImageText}>🏠</Text>
                        </View>
                      )}
                      <View style={styles.propertyMessageDetails}>
                        <Text style={[
                          styles.propertyMessageAddress,
                          isOwnMessage ? styles.ownPropertyText : styles.otherPropertyText,
                        ]} numberOfLines={2}>
                          {propertyData?.address || propertyAddress}
                        </Text>
                        <Text style={[
                          styles.propertyMessageTap,
                          isOwnMessage ? styles.ownPropertySubtext : styles.otherPropertySubtext,
                        ]}>
                          Tap to view details
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={[
                    styles.messageText,
                    isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                  ]}>
                    {item.replyedMessage 
                      ? item.content
                      : item.content.startsWith('Replying to:') 
                        ? item.content.split('\n').slice(1).join('\n')
                        : item.content
                    }
                  </Text>
                )}
              </View>

              {/* Three Dots Menu - AT END FOR OTHER MESSAGES */}
              {!isOwnMessage && (
                <TouchableOpacity
                  style={[
                    styles.menuButton,
                    styles.menuButtonRight
                  ]}
                  onPress={(event) => {
                    event.stopPropagation();
                    showMessageMenu(item, event);
                  }}
                >
                  <Text style={styles.menuButtonText}>⋮</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Time */}
            <View style={[
              styles.timeContainer,
              isOwnMessage ? styles.ownTimeContainer : styles.otherTimeContainer,
            ]}>
              <Text style={[
                styles.timeText,
                isOwnMessage ? styles.ownTimeText : styles.otherTimeText,
              ]}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
          </View>

          {/* My Avatar - Right side */}
          {isOwnMessage && (
            <View style={styles.avatarContainer}>
              {currentUserImage ? (
                <Image 
                  source={{ uri: currentUserImage }} 
                  style={styles.avatar} 
                  onError={(e) => {
                    console.log('❌ Error loading avatar image:', e.nativeEvent.error);
                  }}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {userInfo?.name?.charAt(0)?.toUpperCase() || 'Y'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <View style={styles.headerUserInfo}>
          {userImage ? (
            <Image source={{ uri: userImage }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text style={styles.headerUserName}>{userName}</Text>
        </View>
        
      </View>


{/* Property Info Card - Using ListingsScreen Design */}
{showingPropertyCard && (
  <TouchableOpacity
    style={styles.propertyCard}
    onPress={handlePropertyPress}
    activeOpacity={0.7}
  >
    {/* Left Side - Image */}
    <View style={styles.imageSection}>
      {getPropertyDisplayImage() ? (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: getPropertyDisplayImage() }}
            style={styles.propertyImage}
            resizeMode="cover"
          />
          {/* Media count badges */}
          <View style={styles.mediaBadgesContainer}>
            {propertyDetail?.siteOrPropertyImages && propertyDetail.siteOrPropertyImages.length > 0 && (
              <View style={styles.mediaBadge}>
                <Image 
                  source={require('../../assets/icons/cam.png')}
                  style={styles.mediaBadgeIcon}
                />
                <Text style={styles.mediaBadgeText}>
                  {propertyDetail.siteOrPropertyImages.length}
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderIcon}>🏠</Text>
        </View>
      )}
    </View>

    {/* Right Side - Details */}
    <View style={styles.detailsSection}>
      {/* Address and Status Badge */}
      <View style={styles.headerRow}>
        <Text style={styles.address} numberOfLines={1}>
          {getPropertyDisplayAddress()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(propertyDetail?.soldStatus) }]}>
          <Text style={styles.statusText}>
            {propertyDetail?.soldStatus || 'Available'}
          </Text>
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
          <Text style={styles.infoText}>{propertyDetail?.bedrooms || 0}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Image
            source={require('../../assets/icons/bath.png')}
            style={styles.infoIcon}
            resizeMode="contain"
          />
          <Text style={styles.infoText}>{propertyDetail?.bathrooms || 0}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Image
            source={require('../../assets/icons/foot.png')}
            style={styles.infoIcon}
            resizeMode="contain"
          />
          <Text style={styles.infoText}>{propertyDetail?.squareFoot || 0} sq ft</Text>
        </View>
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
            <Text style={styles.statText}>{propertyDetail?.views || 0}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Image
              source={require('../../assets/icons/save.png')}
              style={styles.statIcon}
              resizeMode="contain"
            />
            <Text style={styles.statText}>{propertyDetail?.saves || 0}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Image
              source={require('../../assets/icons/share.png')}
              style={styles.statIcon}
              resizeMode="contain"
            />
            <Text style={styles.statText}>{propertyDetail?.shares || 0}</Text>
          </View>
        </View>
        
        <Text style={styles.price}>
          {formatPrice(propertyDetail?.price || 0)}
        </Text>
      </View>
    </View>

    {/* Close Button */}
    <TouchableOpacity 
      style={styles.propertyCardClose}
      onPress={() => setShowingPropertyCard(false)}
    >
      <Text style={styles.propertyCardCloseText}>✕</Text>
    </TouchableOpacity>
  </TouchableOpacity>
)}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Start the conversation about this property!</Text>
          </View>
        }
      />

      {/* Three dots menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { top: menuPosition.y, left: menuPosition.x }]}>
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuButtonContainer]}
              onPress={handleReply}
            >
              <Image
                source={require('../../assets/icons/reply.png')}
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>Reply</Text>
            </TouchableOpacity>
            
            {selectedMessage?.senderId === currentUserId && (
              <TouchableOpacity 
                style={[styles.menuItem, styles.menuItemDanger, styles.menuButtonContainer]}
                onPress={handleDeleteMessage}
              >
                <Image
                  source={require('../../assets/icons/delete.png')}
                  style={styles.deleteIcon}
                />
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Input Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardAvoidingView}
      >
        {/* Reply Preview */}
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewContent}>
              <Text style={styles.replyPreviewLabel}>Replying to:</Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={cancelReply} style={styles.replyPreviewClose}>
              <Text style={styles.replyPreviewCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.attachmentButtonsContainer}>
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={handleSendImage}
              disabled={imageUploading}
            >
              {imageUploading ? (
                <ActivityIndicator size="small" color="#054274ff" />
              ) : (
                <Image 
                  source={require('../../assets/icons/media.png')}
                  style={styles.attachmentIcon}
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={handleSendDocument}
              disabled={docUploading}
            >
              {docUploading ? (
                <ActivityIndicator size="small" color="#054274ff" />
              ) : (
                <Image 
                  source={require('../../assets/icons/document.png')}
                  style={styles.attachmentIcon}
                />
              )}
            </TouchableOpacity>

         
          </View>

          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder="Write a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            editable={!sending}
            onSubmitEditing={handleSendMessage}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (inputText.trim() === '' || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={inputText.trim() === '' || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  headerUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
propertyCard: {
  backgroundColor: '#fff',
  borderRadius: 12,
  marginHorizontal: 16,
  marginVertical: 8,
  overflow: 'hidden',
  flexDirection: 'row',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 3,
  padding: 12,
  paddingVertical: 12,
  position: 'relative',
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
  gap: 8,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
},
mediaBadgeIcon: {
  width: 10,
  height: 10,
  tintColor: "#fff"
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
propertyCardClose: {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
},
propertyCardCloseText: {
  fontSize: 14,
  color: '#666',
  fontWeight: 'bold',
  lineHeight: 16,
},

  propertyCardImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  propertyCardImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  propertyCardImageText: {
    fontSize: 20,
    color: '#fff',
  },
  propertyCardContent: {
    flex: 1,
  },
  propertyCardAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  propertyCardHint: {
    fontSize: 12,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 2,
    paddingBottom: 80,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 8,
    marginTop: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContent: {
    maxWidth: '75%',
    flex: 1,
  },
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  otherMessageContent: {
    alignItems: 'flex-start',
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  messageBubble: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
    maxWidth: '95%',
    flexShrink: 1,
  },
  ownBubble: {
    backgroundColor: '#FF4500',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  mediaBubble: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 14,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  imageOverlayIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minWidth: 150,
  },
  documentIcon: {
    width: 32,
    height: 32,
    tintColor: '#666',
    marginRight: 12,
  },
  documentTextContainer: {
    flex: 1,
  },
  documentText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  ownDocumentText: {
    color: '#333',
  },
  otherDocumentText: {
    color: '#333',
  },
  documentSubtext: {
    fontSize: 12,
    opacity: 0.7,
  },
  ownDocumentSubtext: {
    color: '#666',
  },
  otherDocumentSubtext: {
    color: '#666',
  },
  propertyMessageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  propertyMessageHeader: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  propertyMessageTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  propertyMessageContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  propertyMessageImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  propertyMessageImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  propertyMessageImageText: {
    fontSize: 20,
    color: '#fff',
  },
  propertyMessageDetails: {
    flex: 1,
  },
  propertyMessageAddress: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  ownPropertyText: {
    color: '#333',
  },
  otherPropertyText: {
    color: '#333',
  },
  propertyMessageTap: {
    fontSize: 12,
  },
  ownPropertySubtext: {
    color: '#666',
  },
  otherPropertySubtext: {
    color: '#666',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#000',
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  menuButtonRight: {
    marginLeft: 4,
  },
  menuButtonLeft: {
    marginRight: 4,
  },
  menuButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  replyPreviewContainer: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    maxWidth: '95%',
  },
  ownReplyPreview: {
    backgroundColor: '#f0f0f0',
    borderLeftColor: '#FF4500',
    alignSelf: 'flex-end',
  },
  otherReplyPreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderLeftColor: '#FF4500',
    alignSelf: 'flex-start',
  },
  replyPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  ownReplyPreviewText: {
    fontSize: 13,
    color: '#666',
    opacity: 0.8,
  },
  otherReplyPreviewText: {
    fontSize: 13,
    color: '#666',
    opacity: 0.8,
  },
  timeContainer: {
    marginHorizontal: 4,
    marginTop: 2,
  },
  ownTimeContainer: {
    alignItems: 'flex-end',
  },
  otherTimeContainer: {
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  ownTimeText: {
    color: '#999',
  },
  otherTimeText: {
    color: '#999',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 150,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 12,
  },
  menuItemTextDanger: {
    color: '#FF3B30',
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: '#FF3B30',
  },
  menuIcon: {
    width: 20,
    height: 20,
    tintColor: '#333',
  },
  replyPreview: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 14,
    color: '#666',
  },
  replyPreviewClose: {
    padding: 8,
  },
  replyPreviewCloseText: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  attachmentButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentButton: {
    padding: 6,
    marginRight: 4,
  },
  attachmentIcon: {
    width: 20,
    height: 20,
    tintColor: "#054274ff"
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    marginHorizontal: 8,
    paddingVertical: 8,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#FF4500',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MarketplaceConversationScreen;