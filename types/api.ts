export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  enabledPay?: boolean;
  role: 'ADMIN' | 'MEMBER' | 'CUSTOMER';
  publicKey?: string;
  paymentIdentifier?: string;
  businessId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  token: string;
  userId: string;
}

export interface Balance {
  tokens: Array<{
    name: string;
    balance: string;
  }>;
}

export interface Transaction {
  id: string;
  userId: string;
  externalId?: string;
  txType: string;
  method: string;
  currency: string;
  value: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  bank: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  userId: string;
  title: string;
  imageUrl?: string;
  description: string;
  code: string;
  ref: string;
  validUntil: string;
  maxCoupons: number;
  availableCoupons: number;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface TransferRequest {
  transactionAmount: number;
  transactionRecipient: string;
  transactionNotes?: string;
}

export interface ChargeRequest {
  paymentId: string;
  amount: number;
  note?: string;
}

export interface MintRequest {
  transactionAmount: number;
  transactionRecipient?: string;
  transactionNotes?: string;
}

export interface RedeemRequest {
  userId: string;
  amount: number;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}