import { Transaction, User } from '@/types/api';

export interface PaymentQRData {
  type: 'payment_request';
  chargeId: string;
  amount: number;
  currency: string;
  description?: string;
  merchantName: string;
  merchantId: string;
  expiresAt?: string;
}

export interface UserQRData {
  type: 'user_profile';
  userId: string;
  userName: string;
  profileImage?: string;
}

export interface TransactionQRData {
  type: 'transaction_receipt';
  transactionId: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: string;
}

export class QRCodeGenerator {
  static generatePaymentRequest(
    chargeId: string,
    amount: number,
    currency: string,
    merchantName: string,
    merchantId: string,
    description?: string,
    expiresAt?: string
  ): string {
    const qrData: PaymentQRData = {
      type: 'payment_request',
      chargeId,
      amount,
      currency,
      merchantName,
      merchantId,
      description,
      expiresAt,
    };

    return JSON.stringify(qrData);
  }

  static generateUserProfile(user: User): string {
    const qrData: UserQRData = {
      type: 'user_profile',
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      profileImage: user.profileImage,
    };

    return JSON.stringify(qrData);
  }

  static generateTransactionReceipt(transaction: Transaction): string {
    const qrData: TransactionQRData = {
      type: 'transaction_receipt',
      transactionId: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      timestamp: transaction.createdAt,
      status: transaction.status,
    };

    return JSON.stringify(qrData);
  }

  static parseQRCode(qrString: string): PaymentQRData | UserQRData | TransactionQRData | null {
    try {
      const data = JSON.parse(qrString);
      
      if (data.type && ['payment_request', 'user_profile', 'transaction_receipt'].includes(data.type)) {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to parse QR code:', error);
      return null;
    }
  }

  static isValidPaymentQR(data: any): data is PaymentQRData {
    return (
      data.type === 'payment_request' &&
      typeof data.chargeId === 'string' &&
      typeof data.amount === 'number' &&
      typeof data.currency === 'string' &&
      typeof data.merchantName === 'string' &&
      typeof data.merchantId === 'string'
    );
  }

  static isValidUserQR(data: any): data is UserQRData {
    return (
      data.type === 'user_profile' &&
      typeof data.userId === 'string' &&
      typeof data.userName === 'string'
    );
  }

  static isValidTransactionQR(data: any): data is TransactionQRData {
    return (
      data.type === 'transaction_receipt' &&
      typeof data.transactionId === 'string' &&
      typeof data.amount === 'number' &&
      typeof data.currency === 'string' &&
      typeof data.timestamp === 'string' &&
      typeof data.status === 'string'
    );
  }
}

export const formatQRDisplayData = (qrData: PaymentQRData | UserQRData | TransactionQRData) => {
  switch (qrData.type) {
    case 'payment_request':
      return {
        title: 'Payment Request',
        subtitle: qrData.merchantName,
        amount: `${qrData.amount} ${qrData.currency}`,
        description: qrData.description || 'No description',
      };
    
    case 'user_profile':
      return {
        title: 'User Profile',
        subtitle: qrData.userName,
        amount: '',
        description: 'Scan to send money',
      };
    
    case 'transaction_receipt':
      return {
        title: 'Transaction Receipt',
        subtitle: `ID: ${qrData.transactionId.slice(0, 8)}...`,
        amount: `${qrData.amount} ${qrData.currency}`,
        description: `Status: ${qrData.status}`,
      };
    
    default:
      return {
        title: 'Unknown QR Code',
        subtitle: '',
        amount: '',
        description: '',
      };
  }
};