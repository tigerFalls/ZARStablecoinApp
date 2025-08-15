export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profileImage?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  faceIdEnabled: boolean;
  createdAt: string;
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface Balance {
  userId: string;
  lzarBalance: number;
  zarBalance: number;
  lockedBalance: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: 'LZAR' | 'ZAR';
  type: 'transfer' | 'mint' | 'redeem' | 'charge' | 'reward';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  transactionHash?: string;
  createdAt: string;
  completedAt?: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  isDefault: boolean;
  isVerified: boolean;
}

export interface Coupon {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  minAmount: number;
  maxRedemptions: number;
  currentRedemptions: number;
  expiresAt: string;
  isActive: boolean;
}

export interface Staff {
  id: string;
  merchantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'cashier' | 'manager' | 'admin';
  permissions: string[];
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface TransferRequest {
  toUserId: string;
  amount: number;
  currency: 'LZAR' | 'ZAR';
  description?: string;
}

export interface ChargeRequest {
  amount: number;
  currency: 'LZAR' | 'ZAR';
  description?: string;
  expiresAt?: string;
}

export interface MintRequest {
  amount: number;
  bankAccountId: string;
}

export interface RedeemRequest {
  amount: number;
  bankAccountId: string;
}