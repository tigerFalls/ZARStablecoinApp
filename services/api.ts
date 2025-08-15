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
  RedeemRequest
} from '@/types/api';

class ApiService {
  private api: AxiosInstance;
  private baseURL = 'https://api.rapyd-money.com/v1'; // Replace with actual API URL

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
          await AsyncStorage.removeItem('refresh_token');
          // Navigate to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }): Promise<ApiResponse<User>> {
    const response = await this.api.post('/users', userData);
    return response.data;
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthToken>> {
    const response = await this.api.post('/tokens', { email, password });
    if (response.data.success) {
      await AsyncStorage.setItem('auth_token', response.data.data.token);
      await AsyncStorage.setItem('refresh_token', response.data.data.refreshToken);
    }
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse<AuthToken>> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    const response = await this.api.post('/tokens/refresh', { refreshToken });
    if (response.data.success) {
      await AsyncStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
  }

  // User Profile
  async getProfile(userId: string): Promise<ApiResponse<User>> {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async updateProfile(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data;
  }

  async uploadProfileImage(userId: string, imageData: FormData): Promise<ApiResponse<{ imageUrl: string }>> {
    const response = await this.api.post(`/users/${userId}/profile-image`, imageData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async submitKYC(userId: string, kycData: any): Promise<ApiResponse<{ status: string }>> {
    const response = await this.api.post(`/verification/${userId}`, kycData);
    return response.data;
  }

  // Wallet & Balance
  async getBalance(userId: string): Promise<ApiResponse<Balance>> {
    const response = await this.api.get(`/${userId}/balance`);
    return response.data;
  }

  async getFloat(): Promise<ApiResponse<{ totalFloat: number; availableFloat: number }>> {
    const response = await this.api.get('/float');
    return response.data;
  }

  // Transactions
  async transfer(userId: string, transferData: TransferRequest): Promise<ApiResponse<Transaction>> {
    const response = await this.api.post(`/transfer/${userId}`, transferData);
    return response.data;
  }

  async batchTransfer(userId: string, transfers: TransferRequest[]): Promise<ApiResponse<Transaction[]>> {
    const response = await this.api.post(`/transfer/batch/${userId}`, { transfers });
    return response.data;
  }

  async createCharge(userId: string, chargeData: ChargeRequest): Promise<ApiResponse<{ chargeId: string; qrCode: string }>> {
    const response = await this.api.post(`/charge/${userId}/create`, chargeData);
    return response.data;
  }

  async getTransactions(userId: string, page = 1, limit = 20): Promise<ApiResponse<{ transactions: Transaction[]; total: number }>> {
    const response = await this.api.get(`/${userId}/transactions?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getTransaction(userId: string, transactionId: string): Promise<ApiResponse<Transaction>> {
    const response = await this.api.get(`/${userId}/transactions/${transactionId}`);
    return response.data;
  }

  async getPendingTransactions(): Promise<ApiResponse<Transaction[]>> {
    const response = await this.api.get('/transactions/pending');
    return response.data;
  }

  // Mint & Redeem
  async mintTokens(userId: string, mintData: MintRequest): Promise<ApiResponse<Transaction>> {
    const response = await this.api.post(`/mint/${userId}`, mintData);
    return response.data;
  }

  async redeemTokens(userId: string, redeemData: RedeemRequest): Promise<ApiResponse<Transaction>> {
    const response = await this.api.post(`/redeem/${userId}`, redeemData);
    return response.data;
  }

  // Bank Accounts
  async getBankAccounts(userId: string): Promise<ApiResponse<BankAccount[]>> {
    const response = await this.api.get(`/bank/${userId}`);
    return response.data;
  }

  async addBankAccount(userId: string, bankData: Omit<BankAccount, 'id' | 'userId' | 'isVerified'>): Promise<ApiResponse<BankAccount>> {
    const response = await this.api.post(`/bank/${userId}`, bankData);
    return response.data;
  }

  async updateBankAccount(userId: string, accountId: string, bankData: Partial<BankAccount>): Promise<ApiResponse<BankAccount>> {
    const response = await this.api.put(`/bank/${userId}/${accountId}`, bankData);
    return response.data;
  }

  async deleteBankAccount(userId: string, accountId: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/bank/${userId}/${accountId}`);
    return response.data;
  }

  async createBankTransaction(userId: string, transactionData: {
    type: 'deposit' | 'withdrawal';
    amount: number;
    bankAccountId: string;
  }): Promise<ApiResponse<Transaction>> {
    const response = await this.api.post(`/create-transaction/${userId}`, transactionData);
    return response.data;
  }

  // Coupons & Rewards
  async getCoupons(userId: string): Promise<ApiResponse<Coupon[]>> {
    const response = await this.api.get(`/coupons/${userId}`);
    return response.data;
  }

  async createCoupon(userId: string, couponData: Omit<Coupon, 'id' | 'merchantId' | 'currentRedemptions'>): Promise<ApiResponse<Coupon>> {
    const response = await this.api.post(`/coupons/${userId}`, couponData);
    return response.data;
  }

  async claimCoupon(userId: string, couponId: string): Promise<ApiResponse<{ success: boolean; reward: number }>> {
    const response = await this.api.post(`/coupons/claim/${userId}`, { couponId });
    return response.data;
  }

  // Staff Management
  async getStaff(userId: string): Promise<ApiResponse<Staff[]>> {
    const response = await this.api.get(`/staff/${userId}`);
    return response.data;
  }

  async addStaff(userId: string, staffData: Omit<Staff, 'id' | 'merchantId'>): Promise<ApiResponse<Staff>> {
    const response = await this.api.post(`/staff/${userId}`, staffData);
    return response.data;
  }

  async updateStaff(userId: string, staffId: string, staffData: Partial<Staff>): Promise<ApiResponse<Staff>> {
    const response = await this.api.put(`/staff/${userId}/${staffId}`, staffData);
    return response.data;
  }

  async deleteStaff(userId: string, staffId: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/staff/${userId}/${staffId}`);
    return response.data;
  }
}

export const apiService = new ApiService();