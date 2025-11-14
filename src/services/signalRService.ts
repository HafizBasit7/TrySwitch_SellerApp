// services/signalRService.ts - UPDATED FOR RECEIVE-ONLY
import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import { Message } from '../types/chat';

// SignalR Event Handlers Interface - MATCHING BACKEND TOPICS
export interface SignalREventHandlers {
  // Chat events (EXACTLY as provided by backend)
  onMessageReceived: (message: any) => void;
  onMarketPlaceMessageReceived?: (message: any) => void;
  onMessageRead?: (data: any) => void;
  onMessageDeleted?: (data: any) => void;
  onMarketMessageRead?: (data: any) => void;
  onMessageDeleteMarket?: (data: any) => void;
  
  // User & Notification events
  onUserLoggedIn?: (userId: string) => void;
  onNotificationReceived?: (notification: any) => void;
  onNotificationSeen?: (notificationId: string) => void;
  onInvitationAccepted?: (data: any) => void;
  onInvestorDeleted?: (data: any) => void;
  
  // Connection events
  onReconnecting?: (error?: Error) => void;
  onReconnected?: (connectionId?: string) => void;
  onConnectionClosed?: (error?: Error) => void;
}

class SignalRService {
  private connection: HubConnection | null = null;
  private token: string | null = null;
  private eventHandlers: Partial<SignalREventHandlers> = {};

  // Hub URL
  private readonly hubUrl = 'https://goswitch.app/chathub';

  /**
   * Initialize and connect to SignalR hub - RECEIVE ONLY
   */
  async connect(
    token: string,
    handlers: Partial<SignalREventHandlers>
  ): Promise<HubConnection> {
    if (!token) {
      throw new Error('Token is required for SignalR connection');
    }

    // If already connected, return existing connection
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      console.log('✅ SignalR already connected');
      return this.connection;
    }

    this.token = token;
    this.eventHandlers = handlers;

    try {
      // Create new connection - EXACTLY as provided by backend
      this.connection = new HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: async () => {
            if (!this.token) {
              throw new Error('Token is missing');
            }
            return this.token;
          },
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets,
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      // Configure timeouts
      this.connection.serverTimeoutInMilliseconds = 60000;
      this.connection.keepAliveIntervalInMilliseconds = 20000;

      // Register ALL event handlers from backend
      this.registerEventHandlers();

      // Start connection
      await this.connection.start();
      console.log('✅ SignalR connected for real-time receiving');
      
      return this.connection;
    } catch (error) {
      console.error('❌ SignalR connection error:', error);
      throw error;
    }
  }

  /**
   * Register ALL event handlers from backend topics
   */
  private registerEventHandlers(): void {
    if (!this.connection) return;

    // Chat Events - EXACTLY as provided by backend
    this.connection.on('ReceiveMessage', (rawMessage: any) => {
      console.log('📨 [SignalR] Message received:', rawMessage);
      this.eventHandlers.onMessageReceived?.(rawMessage);
    });

    this.connection.on('ReceiveMarketPlaceMessage', (message: any) => {
      console.log('📦 [SignalR] Marketplace message:', message);
      this.eventHandlers.onMarketPlaceMessageReceived?.(message);
    });

    this.connection.on('MessagesReadNotification', (data: any) => {
      console.log('✅ [SignalR] Messages read:', data);
      this.eventHandlers.onMessageRead?.(data);
    });

    this.connection.on('MarketPlaceMessagesAsRead', (data: any) => {
      console.log('✅ [SignalR] Marketplace messages read:', data);
      this.eventHandlers.onMarketMessageRead?.(data);
    });

    this.connection.on('MessageDeleted', (data: any) => {
      console.log('🗑️ [SignalR] Message deleted:', data);
      this.eventHandlers.onMessageDeleted?.(data);
    });

    this.connection.on('MessageMarketPlaceDeleted', (data: any) => {
      console.log('🗑️ [SignalR] Marketplace message deleted:', data);
      this.eventHandlers.onMessageDeleteMarket?.(data);
    });

    // User & Notification Events
    this.connection.on('UserLoggedIn', (userId: string) => {
      console.log('👤 [SignalR] User logged in:', userId);
      this.eventHandlers.onUserLoggedIn?.(userId);
    });

    this.connection.on('NotificationRecived', (notification: any) => {
      console.log('🔔 [SignalR] Notification received:', notification);
      this.eventHandlers.onNotificationReceived?.(notification);
    });

    this.connection.on('Notification-Seen', (notificationId: string) => {
      console.log('👁️ [SignalR] Notification seen:', notificationId);
      this.eventHandlers.onNotificationSeen?.(notificationId);
    });

    this.connection.on('InvitationAccepted', (data: any) => {
      console.log('🤝 [SignalR] Invitation accepted:', data);
      this.eventHandlers.onInvitationAccepted?.(data);
    });

    this.connection.on('InvestorProfileDelete', (data: any) => {
      console.log('🚫 [SignalR] Investor deleted:', data);
      this.eventHandlers.onInvestorDeleted?.(data);
    });

    // Connection lifecycle events
    this.connection.onreconnecting((error) => {
      console.warn('🔄 [SignalR] Reconnecting...', error?.message);
      this.eventHandlers.onReconnecting?.(error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('✅ [SignalR] Reconnected:', connectionId);
      this.eventHandlers.onReconnected?.(connectionId);
    });

    this.connection.onclose((error) => {
      console.error('❌ [SignalR] Connection closed', error?.message);
      this.eventHandlers.onConnectionClosed?.(error);
    });
  }

  /**
   * Check if connected (for receiving only)
   */
  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  /**
   * Disconnect from SignalR
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('✅ SignalR disconnected');
      } catch (error) {
        console.error('❌ Error disconnecting SignalR:', error);
      } finally {
        this.connection = null;
        this.token = null;
        this.eventHandlers = {};
      }
    }
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;