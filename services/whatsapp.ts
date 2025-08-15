import { Linking, Alert } from 'react-native';

export class WhatsAppService {
  private static readonly BUSINESS_NUMBER = '27111234567'; // Replace with actual WhatsApp Business number

  static async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert('WhatsApp not available', 'Please install WhatsApp to use this feature.');
        return false;
      }
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return false;
    }
  }

  static async sendPaymentNotification(
    phoneNumber: string,
    amount: number,
    currency: string,
    transactionId: string
  ): Promise<boolean> {
    const message = `💰 Payment Received!\n\nAmount: ${amount} ${currency}\nTransaction ID: ${transactionId}\n\nThank you for using LZAR!`;
    return this.sendMessage(phoneNumber, message);
  }

  static async sendTransferConfirmation(
    phoneNumber: string,
    amount: number,
    currency: string,
    recipientName: string,
    transactionId: string
  ): Promise<boolean> {
    const message = `✅ Transfer Successful!\n\nSent: ${amount} ${currency}\nTo: ${recipientName}\nTransaction ID: ${transactionId}\n\nYour LZAR wallet has been updated.`;
    return this.sendMessage(phoneNumber, message);
  }

  static async sendRewardNotification(
    phoneNumber: string,
    rewardAmount: number,
    merchantName: string
  ): Promise<boolean> {
    const message = `🎉 Reward Earned!\n\nYou've earned ${rewardAmount} LZAR from ${merchantName}!\n\nCheck your LZAR wallet to see your updated balance.`;
    return this.sendMessage(phoneNumber, message);
  }

  static async sendSecurityAlert(
    phoneNumber: string,
    alertType: 'login' | 'password_change' | 'suspicious_activity'
  ): Promise<boolean> {
    let message = '';
    
    switch (alertType) {
      case 'login':
        message = '🔐 Security Alert\n\nNew login detected on your LZAR account. If this wasn\'t you, please contact support immediately.';
        break;
      case 'password_change':
        message = '🔐 Security Alert\n\nYour LZAR account password has been changed. If you didn\'t make this change, contact support immediately.';
        break;
      case 'suspicious_activity':
        message = '⚠️ Security Alert\n\nSuspicious activity detected on your LZAR account. Your account has been temporarily secured. Contact support for assistance.';
        break;
    }
    
    return this.sendMessage(phoneNumber, message);
  }

  static async contactSupport(issue?: string): Promise<boolean> {
    const message = issue 
      ? `Hi LZAR Support,\n\nI need help with: ${issue}\n\nPlease assist me.`
      : 'Hi LZAR Support,\n\nI need assistance with my LZAR wallet.\n\nPlease help me.';
    
    return this.sendMessage(this.BUSINESS_NUMBER, message);
  }

  static parseCommand(message: string): {
    command: string;
    amount?: number;
    recipient?: string;
    description?: string;
  } | null {
    const lowerMessage = message.toLowerCase().trim();
    
    // Send money command: "send 100 to john" or "send R100 to john doe"
    const sendMatch = lowerMessage.match(/send\s+r?(\d+(?:\.\d{2})?)\s+to\s+(.+)/);
    if (sendMatch) {
      return {
        command: 'send',
        amount: parseFloat(sendMatch[1]),
        recipient: sendMatch[2].trim(),
      };
    }

    // Request money command: "request 50 from jane" or "request R50 from jane smith"
    const requestMatch = lowerMessage.match(/request\s+r?(\d+(?:\.\d{2})?)\s+from\s+(.+)/);
    if (requestMatch) {
      return {
        command: 'request',
        amount: parseFloat(requestMatch[1]),
        recipient: requestMatch[2].trim(),
      };
    }

    // Balance command: "balance" or "check balance"
    if (lowerMessage.includes('balance')) {
      return { command: 'balance' };
    }

    // History command: "history" or "transactions"
    if (lowerMessage.includes('history') || lowerMessage.includes('transactions')) {
      return { command: 'history' };
    }

    // Help command: "help" or "commands"
    if (lowerMessage.includes('help') || lowerMessage.includes('commands')) {
      return { command: 'help' };
    }

    return null;
  }

  static getHelpMessage(): string {
    return `🤖 LZAR WhatsApp Commands:\n\n` +
           `💸 Send Money:\n"send 100 to John"\n"send R50 to Jane Smith"\n\n` +
           `💰 Request Money:\n"request 200 from Mike"\n"request R75 from Sarah"\n\n` +
           `📊 Check Balance:\n"balance"\n"check balance"\n\n` +
           `📋 View History:\n"history"\n"transactions"\n\n` +
           `❓ Get Help:\n"help"\n"commands"\n\n` +
           `For complex transactions, please use the LZAR mobile app.`;
  }
}