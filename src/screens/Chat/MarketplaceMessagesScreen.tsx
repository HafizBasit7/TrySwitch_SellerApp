// screens/Chat/MarketplaceHubScreen.tsx - PROPERTY HUB (UPDATED UI)
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { marketplaceAPI } from '../../api/marketplace';
import { MarketPlaceChatThread } from '../../types/marketplace';

type NavigationProp = StackNavigationProp<any>;

const MarketplaceMessagesScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [chats, setChats] = useState<MarketPlaceChatThread[]>([]);
    const [filteredChats, setFilteredChats] = useState<MarketPlaceChatThread[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            console.log('🔄 [Property Hub] Screen focused');
            loadMarketplaceChats();
        }, [])
    );

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Property Hub',
            headerStyle: {
                backgroundColor: '#FF4500',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
            headerTitleAlign: 'center',
        });
    }, [navigation]);

    const loadMarketplaceChats = async () => {
        try {
            setLoading(true);
            console.log('🏪 [Property Hub] Loading marketplace chats');

            const response = await marketplaceAPI.getMarketPlaceUserChats();

            if (response.chats && Array.isArray(response.chats) && response.chats.length > 0) {
                console.log(`✅ [Property Hub] Loaded ${response.chats.length} properties`);
                setChats(response.chats);
                setFilteredChats(response.chats);
            } else {
                console.log('⚠️ [Property Hub] No marketplace chats found - showing empty state');
                setChats([]);
                setFilteredChats([]);
            }
        } catch (error: any) {
            console.error('❌ [Property Hub] Error loading chats:', error.message);
            if (error.response?.status !== 404) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: error.message || 'Failed to load properties',
                });
            }
            setChats([]);
            setFilteredChats([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMarketplaceChats();
        setRefreshing(false);
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setFilteredChats(chats);
        } else {
            const lowerText = text.toLowerCase();
            const filtered = chats.filter(
                (chat) =>
                    chat.propertyAddress.toLowerCase().includes(lowerText) ||
                    chat.userName.toLowerCase().includes(lowerText)
            );
            setFilteredChats(filtered);
        }
    };

    const formatTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

            if (diffInHours < 24) {
                return date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
            } else if (diffInHours < 48) {
                return 'Yesterday';
            } else {
                return date.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                });
            }
        } catch {
            return '';
        }
    };

    const renderPropertyItem = ({ item }: { item: MarketPlaceChatThread }) => (
        <TouchableOpacity
            style={styles.propertyCard}
            onPress={() => {
                // console.log('🏠 [Property Hub] Opening conversation:', item.propertyAddress);
                navigation.navigate('MarketplaceConversationScreen', {
                    propertyId: item.propertyId,
                    propertyAddress: item.propertyAddress,
                    propertyImage: item.propertyImage,
                    userId: item.userId,
                    userName: item.userName,
                    userProfileImage: item.userProfileImage,
                    userProfileType: item.userProfileType,
                });
            }}
            activeOpacity={0.7}
        >
            {/* Property Image Container */}
            <View style={styles.propertyImageWrapper}>
                {item.propertyImage ? (
                    <Image source={{ uri: item.propertyImage }} style={styles.propertyImage} />
                ) : (
                    <View style={styles.propertyImagePlaceholder}>
                        <Text style={styles.propertyImageText}>🏠</Text>
                    </View>
                )}

                {/* User Avatar - Bottom Right Overlap */}
                <View style={styles.userAvatarContainer}>
                    {item.userProfileImage ? (
                        <Image source={{ uri: item.userProfileImage }} style={styles.userAvatar} />
                    ) : (
                        <View style={styles.userAvatarPlaceholder}>
                            <Text style={styles.userAvatarText}>{item.userName?.charAt(0)?.toUpperCase()}</Text>
                        </View>
                    )}

                </View>
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
                <View style={styles.headerRow}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.propertyAddress} numberOfLines={1}>
                            {item.propertyAddress}
                        </Text>
                        {/* <Text style={styles.userName} numberOfLines={1}>
              {item.userName}
            </Text> */}
                        <Text style={styles.timestamp}>{formatTime(item.lastMessageTime)}</Text>

                    </View>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>
                                {item.unreadCount > 9 ? '9+' : item.unreadCount}
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={styles.lastMessage} numberOfLines={2}>
                    {item.lastMessage || 'No messages yet'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF4500" />
                <Text style={styles.loadingText}>Loading properties...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by property address"
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />

                <Image
                    source={require('../../assets/icons/search.png')}
                    style={styles.searchIcon}
                />
            </View>

            {/* Property List */}
            <FlatList
                data={filteredChats}
                renderItem={renderPropertyItem}
                keyExtractor={(item) => `${item.propertyId}`}
                contentContainerStyle={styles.listContent}
                scrollIndicatorInsets={{ right: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#FF4500']}
                        tintColor="#FF4500"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🏪</Text>
                        <Text style={styles.emptyTitle}>No properties yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Start chatting about properties to see them here
                        </Text>
                        <TouchableOpacity style={styles.retryButton} onPress={loadMarketplaceChats}>
                            <Text style={styles.retryButtonText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 25,
        paddingHorizontal: 16,
        elevation: 5
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 14,
        color: '#333',
    },
    searchIcon: {
        width: 25,
        height: 25,
        tintColor: '#FF4500',
    },
    listContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 16,
    },
    propertyCard: {
        flexDirection: 'row',
        // marginVertical: 10,
        paddingHorizontal: 2,
        paddingVertical: 10,

        alignItems: 'center',
    },
    propertyImageWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    propertyImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    propertyImagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    propertyImageText: {
        fontSize: 40,
    },
    userAvatarContainer: {
        position: 'absolute',
        bottom: -8,
        right: -8,
    },
    userAvatar: {
        width: 30,
        height: 30,
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#fff',
    },
    userAvatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#7C3AED',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userAvatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    unreadBadge: {
        position: 'absolute',
        top: 20,
        right: 0,
        backgroundColor: '#FF4500',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    contentSection: {
        flex: 1,
    },
    headerRow: {
        marginBottom: 6,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    propertyAddress: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
        flex: 1,
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
        textAlign: "right"
    },
    userName: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 13,
        color: '#999',
        lineHeight: 18,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: '#FF4500',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default MarketplaceMessagesScreen;