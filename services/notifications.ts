import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  static async getExpoPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    delaySeconds = 0
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  static async sendPaymentNotification(
    amount: number,
    currency: string,
    senderName: string,
    transactionId: string
  ): Promise<void> {
    await this.scheduleLocalNotification(
      '💰 Payment Received',
      `You received ${amount} ${currency} from ${senderName}`,
      {
        type: 'payment_received',
        transactionId,
        amount,
        currency,
        senderName,
      }
    );
  }

  static async sendTransferConfirmation(
    amount: number,
    currency: string,
    recipientName: string,
    transactionId: string
  ): Promise<void> {
    await this.scheduleLocalNotification(
      '✅ Transfer Successful',
      `Sent ${amount} ${currency} to ${recipientName}`,
      {
        type: 'transfer_sent',
        transactionId,
        amount,
        currency,
        recipientName,
      }
    );
  }

  static async sendRewardNotification(
    rewardAmount: number,
    merchantName: string
  ): Promise<void> {
    await this.scheduleLocalNotification(
      '🎉 Reward Earned!',
      `You earned ${rewardAmount} LZAR from ${merchantName}`,
      {
        type: 'reward_earned',
        rewardAmount,
        merchantName,
      }
    );
  }

  static async sendSecurityAlert(alertType: string, message: string): Promise<void> {
    await this.scheduleLocalNotification(
      '🔐 Security Alert',
      message,
      {
        type: 'security_alert',
        alertType,
      }
    );
  }

  static async sendKYCStatusUpdate(status: 'approved' | 'rejected' | 'pending'): Promise<void> {
    const messages = {
      approved: 'Your identity verification has been approved! You can now access all features.',
      rejected: 'Your identity verification was not approved. Please contact support for assistance.',
      pending: 'Your identity verification is being reviewed. We\'ll notify you once complete.',
    };

    const titles = {
      approved: '✅ KYC Approved',
      rejected: '❌ KYC Rejected',
      pending: '⏳ KYC Under Review',
    };

    await this.scheduleLocalNotification(
      titles[status],
      messages[status],
      {
        type: 'kyc_update',
        status,
      }
    );
  }

  static async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  static async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  static async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // Listen for notification responses
  static addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Listen for notifications received while app is in foreground
  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }
}