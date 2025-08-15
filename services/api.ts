import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ApiResponse, 
  User, 
  AuthToken, 
  Balance, 
  Transaction, 
  BankAccount, 
  Coupon, 
  Staff,
  TransferRequest,
  ChargeRequest,
  MintRequest,
  RedeemRequest,
  CreateUserRequest,
  LoginRequest
} from '@/types/api';

class ApiService {
  private api: AxiosInstance;
  private baseURL = process.env.EXPO_PUBLIC_RAPYD_API_BASE_URL || 'https://seal-app-qp9cc.ondigitalocean.app/api/v1';
  private masterApiKey = process.env.EXPO_PUBLIC_RAPYD_API_KEY || '';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (this.masterApiKey) {
          // Use master API key for unauthenticated requests (like user creation)
          config.headers.Authorization = this.masterApiKey;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_id');
          // Navigate to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async register(userData: CreateUserRequest): Promise<User> {
    const response = await this.api.post('/users', userData);
    return response.data;
  }

  async createToken(description?: string): Promise<{ id: string; token: string }> {
    const response = await this.api.post('/tokens', { description });
    return response.data;
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // First, create a token for this user session
    const tokenResponse = await this.createToken(`Login session for ${email}`);
    
    if (tokenResponse.token) {
      await AsyncStorage.setItem('auth_token', tokenResponse.token);
      
      // Find user by email to get their profile
      const usersResponse = await this.api.get('/users');
      const users = usersResponse.data.users || [];
      const user = users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        await AsyncStorage.setItem('user_id', user.id);
        return { user, token: tokenResponse.token };
      } else {
        throw new Error('User not found');
      }
    }
    
    throw new Error('Failed to create authentication token');
  }

  async getCurrentUser(): Promise<User | null> {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) return null;
    
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_id');
  }

  // User Profile
  async getProfile(userId: string): Promise<User> {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async updateProfile(userId: string, userData: Partial<User>): Promise<User> {
    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data;
  }

  // Wallet & Balance
  async getBalance(userId: string): Promise<Balance> {
    const response = await this.api.get(`/${userId}/balance`);
    return response.data;
  }

  async getFloat(): Promise<Balance> {
    const response = await this.api.get('/float');
    return response.data;
  }

  // Transactions
  async transfer(userId: string, transferData: TransferRequest): Promise<any> {
    const response = await this.api.post(`/transfer/${userId}`, transferData);
    return response.data;
  }

  async batchTransfer(userId: string, payments: Array<{ recipient: string; amount: number }>, notes?: string): Promise<any> {
    const response = await this.api.post(`/transfer/batch/${userId}`, { 
      payments,
      transactionNotes: notes 
    });
    return response.data;
  }

  async createCharge(userId: string, chargeData: ChargeRequest): Promise<any> {
    const response = await this.api.post(`/charge/${userId}/create`, chargeData);
    return response.data;
  }

  async getTransactions(userId: string): Promise<{ transactions: Transaction[] }> {
    const response = await this.api.get(`/${userId}/transactions`);
    return response.data;
  }

  async getTransaction(userId: string, transactionId: string): Promise<Transaction> {
    const response = await this.api.get(`/${userId}/transactions/${transactionId}`);
    return response.data;
  }

  async getPendingTransactions(page = 1, pageSize = 10): Promise<any> {
    const response = await this.api.get(`/transactions/pending?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }

  // Mint & Redeem
  async mintTokens(mintData: MintRequest): Promise<any> {
    const response = await this.api.post('/mint', mintData);
    return response.data;
  }

  async redeemTokens(redeemData: RedeemRequest): Promise<any> {
    const response = await this.api.post('/redeem', redeemData);
    return response.data;
  }

  // Bank Accounts
  async getBankAccount(userId: string): Promise<BankAccount> {
    const response = await this.api.get(`/bank/${userId}`);
    return response.data;
  }

  async upsertBankAccount(userId: string, bankData: {
    accountHolder: string;
    accountNumber: string;
    branchCode: string;
    bankName: string;
  }): Promise<{ message: string; bankAccount: BankAccount }> {
    const response = await this.api.post(`/bank/${userId}`, bankData);
    return response.data;
  }

  async deleteBankAccount(userId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/bank/${userId}`);
    return response.data;
  }

  async createTransaction(userId: string, transactionData: {
    transactionType: string;
    transactionMethod: string;
    transactionCurrency: string;
    transactionAmount: number;
    transactionNetwork?: string;
    transactionAddress?: string;
  }): Promise<any> {
    const response = await this.api.post(`/create-transaction/${userId}`, transactionData);
    return response.data;
  }

  // Coupons & Rewards
  async getCoupons(): Promise<Coupon[]> {
    const response = await this.api.get('/coupons');
    return response.data;
  }

  async createCoupon(userId: string, couponData: {
    title: string;
    imageUrl?: string;
    description: string;
    code: string;
    ref: string;
    validUntil: string;
    maxCoupons: number;
    availableCoupons: number;
  }): Promise<void> {
    const response = await this.api.post(`/coupons/${userId}`, couponData);
    return response.data;
  }

  async claimCoupon(userId: string, couponId: string): Promise<any> {
    const response = await this.api.post(`/coupons/claim/${userId}`, { couponId });
    return response.data;
  }

  // Staff Management
  async getStaff(userId: string): Promise<Staff[]> {
    const response = await this.api.get(`/staff/${userId}`);
    return response.data;
  }

  async addStaff(userId: string, input: string): Promise<{ success: boolean }> {
    const response = await this.api.post(`/staff/${userId}`, { input });
    return response.data;
  }

  async removeStaff(userId: string, staffId: string): Promise<{ success: boolean }> {
    const response = await this.api.delete(`/staff/${userId}/${staffId}`);
    return response.data;
  }

  // Verification
  async createVerification(userId: string): Promise<any> {
    const response = await this.api.post(`/verification/${userId}`);
    return response.data;
  }

  async getVerificationStatus(sessionId: string): Promise<any> {
    const response = await this.api.get(`/verification/${sessionId}/status`);
    return response.data;
  }

  // Recipient lookup
  async getRecipient(identifier: string): Promise<any> {
    const response = await this.api.get(`/recipient/${identifier}`);
    return response.data;
  }
}

export const apiService = new ApiService();