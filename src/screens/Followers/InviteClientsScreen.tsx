// Updated InviteClientsScreen.tsx - Simplified and more robust approach
import React, { useState, useEffect } from 'react';
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
import { InvestorProfile, InvestorWithStatus } from '../../types/investorTypes';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export const InviteClientsScreen = ({ navigation, route }: any) => {
  const { userInfo } = useAuth(); 
  const [allInvestors, setAllInvestors] = useState<InvestorWithStatus[]>([]);
  const [filteredInvestors, setFilteredInvestors] = useState<InvestorWithStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (userInfo?.email) {
      setUserEmail(userInfo.email);
    }
  }, [userInfo]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Screen focused - refreshing data');
      fetchData();
    }, [])
  );

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, allInvestors]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all investors and already added investors in parallel
      const [investors, followers] = await Promise.all([
        investorAPI.getAllInvestorProfiles(),
        investorAPI.getInvestorsFollowingSeller()
      ]);

      console.log('📊 Loaded investors:', investors.length);
      console.log('👥 Followers data:', followers);

      // Extract investor IDs that are already following you
      const addedInvestorIds = extractAddedInvestorIds(followers);
      console.log('✅ Already added investor IDs:', addedInvestorIds);

      // Filter out already added investors and set initial status
      const availableInvestors = investors
        .filter(investor => !addedInvestorIds.includes(investor.userId))
        .map(investor => ({
          ...investor,
          isFollowing: false,
          inviteStatus: [] // Start with empty invite status
        }));

      // console.log('🔍 Available investors after filtering:', availableInvestors.length);
      
      // For each available investor, check invite status but with a timeout logic
      const investorsWithSmartStatus = await Promise.all(
        availableInvestors.map(async (investor) => {
          try {
            const inviteStatus = await investorAPI.getInvestorInviteStatus(investor.userId);
            console.log(`📨 Raw invite status for ${investor.name}:`, inviteStatus);
            
            if (inviteStatus && inviteStatus.length > 0) {
              // CRITICAL FIX: Check if pending invites are too old or should be ignored
              const validPendingInvites = inviteStatus.filter(invite => {
                // If investor is not in followers but has pending invites, they might be old/stale
                // Let's be more aggressive in clearing them
                const isPending = invite.isAccepted === false;
                
                if (isPending) {
                  // Check if the invite is recent (within last 7 days)
                  const inviteDate = new Date(invite.requestedDate);
                  const now = new Date();
                  const daysDiff = (now.getTime() - inviteDate.getTime()) / (1000 * 60 * 60 * 24);
                  
                  console.log(`   - Invite ${invite.id}: ${daysDiff.toFixed(1)} days old, pending=${isPending}`);
                  
                  // If invite is older than 7 days, consider it stale
                  if (daysDiff > 7) {
                    console.log(`   - ❌ Ignoring stale invite (${daysDiff.toFixed(1)} days old)`);
                    return false;
                  }
                  
                  // For recent invites, only show if investor is truly not in followers
                  return !addedInvestorIds.includes(investor.userId);
                }
                
                return false;
              });

              console.log(`✅ Final invites for ${investor.name}:`, validPendingInvites.length);
              
              return {
                ...investor,
                inviteStatus: validPendingInvites
              };
            }
            
            return investor;
            
          } catch (error) {
            console.log(`❌ Error loading invite status for ${investor.userId}:`, error);
            return investor;
          }
        })
      );

      setAllInvestors(investorsWithSmartStatus);
      setFilteredInvestors([]);

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load investors');
    } finally {
      setLoading(false);
    }
  };

  const extractAddedInvestorIds = (followers: any[]): string[] => {
    const investorIds: string[] = [];
    followers.forEach(followerData => {
      if (followerData.investors && Array.isArray(followerData.investors)) {
        followerData.investors.forEach((investor: any) => {
          if (investor.investorId) {
            investorIds.push(investor.investorId);
          }
        });
      }
    });
    return investorIds;
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    
    if (!text.trim()) {
      setFilteredInvestors([]);
      return;
    }
    
    const term = text.toLowerCase();
    const filtered = allInvestors.filter(investor => 
      investor.name?.toLowerCase().includes(term) ||
      investor.email?.toLowerCase().includes(term) ||
      investor.companyName?.toLowerCase().includes(term)
    );
    // console.log('🔍 Search results:', filtered.length, 'for term:', text);
    setFilteredInvestors(filtered);
  };

  const getInviteButtonState = (investor: InvestorWithStatus) => {
    const hasPendingInvite = investor.inviteStatus && 
                            investor.inviteStatus.length > 0 && 
                            investor.inviteStatus.some(invite => invite.isAccepted === false);

    // console.log(`🎯 ${investor.name} - hasPendingInvite: ${hasPendingInvite}`);

    if (hasPendingInvite) {
      return { status: 'pending', text: 'Pending', disabled: true };
    }
    
    return { status: 'invite', text: 'Invite', disabled: false };
  };

  const handleInvestorPress = (investor: InvestorWithStatus) => {
    // console.log('👤 Investor pressed:', investor.name);
    navigation.navigate('InvestorProfile', { investor });
  };

  const handleInviteInvestor = async (investor: InvestorWithStatus) => {
    const buttonState = getInviteButtonState(investor);
    
    if (buttonState.status !== 'invite') {
      Alert.alert('Info', `Cannot send invite: Investor status is ${buttonState.status}`);
      return;
    }

    try {
      // console.log('📤 Sending invite to:', investor.name, 'ID:', investor.userId);
      await investorAPI.sendInviteToInvestor(investor.userId);
      
      // Update the investor's status immediately in UI
      const updatedInvestors = allInvestors.map(inv => 
        inv.userId === investor.userId 
          ? { 
              ...inv, 
              inviteStatus: [{
                id: Date.now(),
                sellerId: userInfo?.userId || '',
                investorId: investor.userId,
                requestedDate: new Date().toISOString(),
                isAccepted: false,
                sellerName: userInfo?.name || ''
              }]
            }
          : inv
      );
      
      setAllInvestors(updatedInvestors);
      
      // Update filtered investors if this investor is currently displayed
      if (searchTerm.trim()) {
        handleSearch(searchTerm);
      }
      
      Alert.alert('Success', `Invitation sent to ${investor.name}`);
    } catch (error: any) {
      console.error('❌ Invite error:', error);
      if (error.message?.includes('already sent')) {
        Alert.alert('Info', `Invite has already been sent to ${investor.name}`);
        // Refresh data to get correct status
        fetchData();
      } else {
        Alert.alert('Error', 'Failed to send invitation');
      }
    }
  };

 const handleSendEmailInvites = async () => {
  if (!recipientEmails.trim()) {
    Alert.alert('Error', 'Please enter at least one email address');
    return;
  }

  try {
    setSendingEmail(true);
    console.log('📧 Starting email send process...');
    console.log('👤 Sender email:', userEmail);
    console.log('📨 Recipient emails string:', recipientEmails);
    
    // Count actual valid emails for success message
    const emailList = recipientEmails.split(',').map(email => email.trim()).filter(email => email);
    const validEmails = emailList.filter(email => isValidEmail(email));
    
    if (validEmails.length === 0) {
      Alert.alert('Error', 'No valid email addresses provided');
      return;
    }

    console.log('✅ Valid emails count:', validEmails.length);
    
    await investorAPI.sendEmailInvites(
      userEmail,        // This becomes the subject
      recipientEmails,  // These become the recipients
      userInfo?.name    // Optional sender name
    );
    
    Alert.alert(
      'Success', 
      `Email invitations sent successfully to ${validEmails.length} recipient(s)!`
    );
    
    setShowEmailModal(false);
    setRecipientEmails('');
    
  } catch (error: any) {
    console.error('❌ Email send error:', error);
    
    let userFriendlyMessage = error.message || 'Failed to send email invitations';
    
    // Make error messages more user-friendly
    if (userFriendlyMessage.includes('Email service is currently experiencing issues')) {
      userFriendlyMessage = 'Our email service is temporarily unavailable. Please try again in a few minutes.';
    } else if (userFriendlyMessage.includes('Network error')) {
      userFriendlyMessage = 'Network connection issue. Please check your internet and try again.';
    }
    
    Alert.alert('Error', userFriendlyMessage);
  } finally {
    setSendingEmail(false);
  }
};

  // NEW: Force clear pending status for a specific investor
  const clearPendingStatus = (investorId: string) => {
    const updatedInvestors = allInvestors.map(inv => 
      inv.userId === investorId 
        ? { ...inv, inviteStatus: [] }
        : inv
    );
    setAllInvestors(updatedInvestors);
    
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
    }
  };

  const renderInvestorItem = ({ item }: { item: InvestorWithStatus }) => {
    const buttonState = getInviteButtonState(item);
    
    return (
      <TouchableOpacity 
        style={styles.investorCard}
        onPress={() => handleInvestorPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ 
            uri: item.userProfileImage || 'https://via.placeholder.com/50x50?text=No+Image'
          }}
          style={styles.profileImage}
        />
        <View style={styles.investorInfo}>
          <Text style={styles.investorName}>{item.name || 'Unknown User'}</Text>
        </View>
        
        <View style={styles.buttonContainer}> 
          <TouchableOpacity
            style={[
              styles.inviteButtonSmall,
              buttonState.status === 'pending' && styles.pendingButton,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleInviteInvestor(item);
            }}
            disabled={buttonState.disabled}
          >
            <Text style={styles.inviteButtonSmallText}>
              {buttonState.text}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#FF4500" />
          <Text style={styles.loadingText}>Loading investors...</Text>
        </View>
      );
    }

    if (searchTerm.trim() === '') {
      return (
        <View style={styles.emptyState}>
          {/* <Text style={styles.emptyText}>Search for Investors</Text> */}
          <Text style={styles.hintText}>
            Start typing a name to find people
          </Text>
        </View>
      );
    }

    if (searchTerm.trim() !== '' && filteredInvestors.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No investors found</Text>
          <Text style={styles.hintText}>
            No investors match "{searchTerm}". Try a different search term.
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
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

      {/* Invite via Email Button */}
      <TouchableOpacity
        style={styles.inviteButton}
        onPress={() => setShowEmailModal(true)}
      >
        <Text style={styles.inviteButtonText}>Invite via Email</Text>
      </TouchableOpacity>

      {/* Investors List or Empty State */}
      {filteredInvestors.length > 0 ? (
        <FlatList
          data={filteredInvestors}
          renderItem={renderInvestorItem}
          keyExtractor={item => `${item.id}-${item.userId}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchData}
        />
      ) : (
        renderEmptyState()
      )}

      {/* Email Invite Modal */}
      {showEmailModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowEmailModal(false);
                setRecipientEmails('');
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Invite via Email</Text>

            <TextInput
              style={styles.modalInput}
              value={userEmail}
              editable={false}
              placeholderTextColor="#999"
            />

            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="Enter email addresses separated by commas"
              placeholderTextColor="#999"
              value={recipientEmails}
              onChangeText={setRecipientEmails}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.sendButton, sendingEmail && styles.sendButtonDisabled]}
              onPress={handleSendEmailInvites}
              disabled={sendingEmail || !recipientEmails.trim()}
            >
              {sendingEmail ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>
                  Send Invitation{recipientEmails.split(',').filter(e => e.trim()).length !== 1 ? 's' : ''}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    color: "#000"
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
  emptyState: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  hintText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  investorCard: {
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
  investorInfo: {
    flex: 1,
    marginRight: 12,
  },
  investorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  investorEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  investorCompany: {
    fontSize: 12,
    color: '#999',
  },
  buttonContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  inviteButtonSmall: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 70,
  },
  pendingButton: {
    backgroundColor: '#FFA500',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  inviteButtonSmallText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    margin: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#999',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#FF4500',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InviteClientsScreen;