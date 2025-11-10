// types/marketplace.ts - UPDATED WITH PROPERTY DETAIL TYPES

/**
 * SEND MESSAGE REQUEST
 * Endpoint: POST /api/MarketPlaceMessage/SendMarketPlaceMessage
 * Parameters: query params (receiverId, propertyId, content, replyedMessageId)
 */
export interface SendMarketPlaceMessageRequest {
  receiverId: string;
  propertyId: number;
  content: string;
  replyedMessageId?: number;
}

/**
 * GET MESSAGE HISTORY REQUEST
 * Endpoint: POST /api/MarketPlaceMessage/GetMessageHistoryWithProperty
 * Parameters: request body JSON
 */
export interface GetMarketPlaceMessageHistoryRequest {
  reciverId: string; // Note: API uses "reciverId" (typo in Swagger - matches API exactly)
  propertyId: number;
  receiverProfileType: number;
  pageNumber: number;
  pageSize: number;
}

/**
 * MARK AS READ REQUEST
 * Endpoint: POST /api/MarketPlaceMessage/MarkMarkePlacetMessageAsRead
 * Parameters: request body (array of message IDs)
 */
export interface MarkMarketPlaceAsReadRequest {
  messageIds: number[];
}

/**
 * DELETE THREAD REQUEST
 * Endpoint: POST /api/MarketPlaceMessage/DeleteMarketPlaceThreads
 * Parameters: request body (array of thread objects)
 */
export interface DeleteMarketPlaceThreadRequest {
  receiverId: string;
  propertyId: number;
}

// ============================================================
// PROPERTY DETAIL TYPES
// ============================================================

export interface PropertyDetail {
  propertyListingId: number;
  accountId: string;
  sellerName: string | null;
  siteOrPropertyImages: string[];
  propertyAddress: string;
  propertyTypeName: string;
  yearBuilt: number;
  heatingSystems: string[];
  coolingSystems: string[];
  price: number;
  bedrooms: number;
  bathrooms: number;
  parking: string[];
  lotSize: string;
  squareFoot: number;
  pricePerSquareFoot: number;
  documents: string[];
  description: string;
  imageCount: number;
  videoCount: number;
  soldStatus: string;
  isDeleted: boolean;
  isExpired: boolean;
  expireDate: string;
  createdDate: string;
  modifiedDate: string;
  views: number;
  saves: number;
  shares: number;
  networth: number;
  rehabEstimate: number;
  averageLeasePrice: number;
}

export interface PropertyDetailResponse {
  success: boolean;
  property: PropertyDetail;
  message?: string;
}

// ============================================================
// MESSAGE TYPES
// ============================================================

export interface MarketPlaceMessage {
  id: number;
  senderId: string;
  senderName: string;
  senderProfileImage?: string;
  receiverId: string;
  receiverName: string;
  receiverProfileImage?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  propertyId: number;
  propertyAddress?: string;
  replyedMessageId?: number;
  replyedMessage?: MarketPlaceMessage;
}

export interface RawMarketPlaceMessage {
  messageId?: number;
  id?: number;
  senderId: string;
  senderName: string;
  senderProfileImage?: string;
  profileImage?: string;
  receiverId: string;
  receiverName: string;
  receiverProfileImage?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  propertyId: number;
  propertyAddress?: string;
  replyedMessageId?: number;
  replyedMessage?: RawMarketPlaceMessage;
}

// ============================================================
// CHAT THREAD TYPES (Property-based conversation)
// ============================================================

export interface MarketPlaceChatThread {
  propertyId: number;
  propertyAddress: string;
  propertyImage?: string;
  userId: string; // Other user ID
  userName: string;
  userProfileImage?: string;
  userProfileType: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface RawMarketPlaceChatThread {
  propertyId: number;
  propertyAddress: string;
  propertyImage?: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  profileImage?: string;
  userProfileType: number;
  lastMessage: string;
  lastMessageTime?: string;
  timestamp?: string;
  unreadCount?: number;
  unreadMessagesCount?: number;
}

// ============================================================
// RESPONSE TYPES
// ============================================================

export interface GetMarketPlaceMessageHistoryResponse {
  messages: MarketPlaceMessage[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasNextPage: boolean;
  success: boolean;
  propertyDetail?: PropertyDetail;
  message?: string;
}

export interface GetMarketPlaceUserChatsResponse {
  chats: MarketPlaceChatThread[];
  success: boolean;
  message?: string;
}

export interface GetUnreadMessagesResponse {
  unreadCount: number;
  chatThreadsInfo: Array<{
    propertyId: number;
    unreadCount: number;
  }>;
  success: boolean;
  message?: string;
}

export interface SendMarketPlaceMessageResponse {
  success: boolean;
  message?: string;
  data?: MarketPlaceMessage;
}

export interface MarkMarketPlaceAsReadResponse {
  success: boolean;
  message?: string;
}

export interface DeleteMarketPlaceMessageResponse {
  success: boolean;
  message?: string;
}

export interface DeleteMarketPlaceThreadsResponse {
  success: boolean;
  message?: string;
}

// ============================================================
// NAVIGATION TYPES
// ============================================================

export interface MarketplaceStackParamList {
  MarketplaceHub: undefined;
  MarketplaceConversation: {
    propertyId: number;
    propertyAddress: string;
    propertyImage?: string;
    userId: string;
    userName: string;
    userProfileImage?: string;
    userProfileType: number;
  };
}