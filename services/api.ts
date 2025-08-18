import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { supabase } from './supabase';
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

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private api: AxiosInstance;
  private baseURL = process.env.EXPO_PUBLIC_RAPYD_API_BASE_URL || 'https://seal-app-qp9cc.ondigitalocean.app/api/v1';
  private masterApiKey = process.env.EXPO_PUBLIC_RAPYD_API_KEY || '';
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000, // 15 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          // Get Supabase session for authenticated requests
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.access_token) {
            // Use Supabase JWT token for authenticated requests
            config.headers.Authorization = `Bearer ${session.access_token}`;
          } else if (this.masterApiKey) {
            // Use master API key for unauthenticated requests
            config.headers.Authorization = this.masterApiKey;
          }

          // Add request timestamp for debugging
          config.metadata = { startTime: Date.now() };
          
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
          return config;
        } catch (error) {
          console.error('Request interceptor error:', error);
          // If we can't get session, use master API key as fallback
          if (this.masterApiKey) {
            config.headers.Authorization = this.masterApiKey;
          }
          return config;
        }
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(new ApiError('Request configuration failed', 0, 'REQUEST_CONFIG_ERROR', error));
      }
    );
          config.headers.Authorization = this.masterApiKey;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for success logging and error handling
    this.api.interceptors.response.use(
      (response) => {
        // Log successful requests
        const duration = Date.now() - (response.config.metadata?.startTime || 0);
        console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
        return response;
      },
      async (error) => {
        const duration = Date.now() - (error.config?.metadata?.startTime || 0);
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });

        // Handle different types of errors
        if (error.code === 'ECONNABORTED') {
          return Promise.reject(new ApiError('Request timeout. Please check your connection and try again.', 0, 'TIMEOUT'));
        }

        if (!error.response) {
          return Promise.reject(new ApiError('Network error. Please check your internet connection.', 0, 'NETWORK_ERROR'));
        }

        const { status, data } = error.response;

        // Handle authentication errors
        if (status === 401) {
          console.log('🔐 Authentication error - signing out user');
          await supabase.auth.signOut();
          return Promise.reject(new ApiError('Authentication failed. Please log in again.', 401, 'AUTH_ERROR'));
        }

        // Handle different HTTP status codes
        let message = 'An unexpected error occurred';
        let code = 'UNKNOWN_ERROR';

        switch (status) {
          case 400:
            message = data?.message || data?.error || 'Invalid request. Please check your input.';
            code = 'BAD_REQUEST';
            break;
          case 403:
            message = 'Access denied. You don\'t have permission to perform this action.';
            code = 'FORBIDDEN';
            break;
          case 404:
            message = 'The requested resource was not found.';
            code = 'NOT_FOUND';
            break;
          case 409:
            message = data?.message || 'Conflict. The resource already exists or there\'s a conflict.';
            code = 'CONFLICT';
            break;
          case 422:
            message = data?.message || 'Validation error. Please check your input.';
            code = 'VALIDATION_ERROR';
            break;
          case 429:
            message = 'Too many requests. Please wait a moment and try again.';
            code = 'RATE_LIMIT';
            break;
          case 500:
            message = 'Server error. Please try again later.';
            code = 'SERVER_ERROR';
            break;
          case 502:
          case 503:
          case 504:
            message = 'Service temporarily unavailable. Please try again later.';
            code = 'SERVICE_UNAVAILABLE';
            break;
          default:
            message = data?.message || data?.error || `Request failed with status ${status}`;
            code = `HTTP_${status}`;
        }

        return Promise.reject(new ApiError(message, status, code, data));
      }
    );
  }

  /**
   * Retry mechanism for failed requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        console.log(`🔄 Retrying request... (${this.maxRetries - retries + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay * (this.maxRetries - retries + 1));
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: any): boolean {
    if (error instanceof ApiError) {
      // Retry on network errors, timeouts, and 5xx server errors
      return (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT' ||
        error.code === 'SERVICE_UNAVAILABLE' ||
        (error.status && error.status >= 500)
      );
    }
    return false;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Authentication (now handled by Supabase, but keeping for API token management)
  async createToken(description?: string): Promise<{ id: string; token: string }> {
    return this.retryRequest(async () => {
      const response = await this.api.post('/tokens', { description });
      return response.data;
    });
  }

  // User management (for Rapyd API integration)
  async createRapydUser(userData: CreateUserRequest): Promise<User> {
    return this.retryRequest(async () => {
      const response = await this.api.post('/users', userData);
      return response.data;
    });
  }

  // User Profile
  async getProfile(userId: string): Promise<User> {
    return this.retryRequest(async () => {
      const response = await this.api.get(`/users/${userId}`);
      return response.data;
    });
  }

  async updateProfile(userId: string, userData: Partial<User>): Promise<User> {
    return this.retryRequest(async () => {
      const response = await this.api.put(`/users/${userId}`, userData);
      return response.data;
    });
  }

  // Wallet & Balance
  async getBalance(userId: string): Promise<Balance> {
    return this.retryRequest(async () => {
      const response = await this.api.get(`/${userId}/balance`);
      return response.data;
    });
  }

  async getFloat(): Promise<Balance> {
    return this.retryRequest(async () => {
      const response = await this.api.get('/float');
      return response.data;
    });
  }

  // Transactions
  async transfer(userId: string, transferData: TransferRequest): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.post(`/transfer/${userId}`, transferData);
      return response.data;
    });
  }

  async batchTransfer(userId: string, payments: Array<{ recipient: string; amount: number }>, notes?: string): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.post(`/transfer/batch/${userId}`, { 
        payments,
        transactionNotes: notes 
      });
      return response.data;
    });
  }

  async createCharge(userId: string, chargeData: ChargeRequest): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.post(`/charge/${userId}/create`, chargeData);
      return response.data;
    });
  }

  async getTransactions(userId: string): Promise<{ transactions: Transaction[] }> {
    return this.retryRequest(async () => {
      const response = await this.api.get(`/${userId}/transactions`);
      return response.data;
    });
  }

  async getTransaction(userId: string, transactionId: string): Promise<Transaction> {
    return this.retryRequest(async () => {
      const response = await this.api.get(`/${userId}/transactions/${transactionId}`);
      return response.data;
    });
  }

  async getPendingTransactions(page = 1, pageSize = 10): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.get(`/transactions/pending?page=${page}&pageSize=${pageSize}`);
      return response.data;
    });
  }

  // Mint & Redeem
  async mintTokens(mintData: MintRequest): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.post('/mint', mintData);
      return response.data;
    });
  }

  async redeemTokens(redeemData: RedeemRequest): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.post('/redeem', redeemData);
      return response.data;
    });
  }

  // Bank Accounts
  async getBankAccount(userId: string): Promise<BankAccount> {
    return this.retryRequest(async () => {
      const response = await this.api.get(`/bank/${userId}`);
      return response.data;
    });
  }

  async upsertBankAccount(userId: string, bankData: {
    accountHolder: string;
    accountNumber: string;
    branchCode: string;
    bankName: string;
  }): Promise<{ message: string; bankAccount: BankAccount }> {
    return this.retryRequest(async () => {
      const response = await this.api.post(`/bank/${userId}`, bankData);
      return response.data;
    });
  }

  async deleteBankAccount(userId: string): Promise<{ message: string }> {
    return this.retryRequest(async () => {
      const response = await this.api.delete(`/bank/${userId}`);
      return response.data;
    });
  }

  async createTransaction(userId: string, transactionData: {
    transactionType: string;
    transactionMethod: string;
    transactionCurrency: string;
    transactionAmount: number;
    transactionNetwork?: string;
    transactionAddress?: string;
  }): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.post(`/create-transaction/${userId}`, transactionData);
      return response.data;
    });
  }

  // Coupons & Rewards
  async getCoupons(): Promise<Coupon[]> {
    return this.retryRequest(async () => {
      const response = await this.api.get('/coupons');
      return response.data;
    });
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
    return this.retryRequest(async () => {
      const response = await this.api.post(`/coupons/${userId}`, couponData);
      return response.data;
    });
  }

  async claimCoupon(userId: string, couponId: string): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.post(`/coupons/claim/${userId}`, { couponId });
      return response.data;
    });
  }

  // Staff Management
  async getStaff(userId: string): Promise<Staff[]> {
    return this.retryRequest(async () => {
      const response = await this.api.get(`/staff/${userId}`);
      return response.data;
    });
  }

  async addStaff(userId: string, input: string): Promise<{ success: boolean }> {
    return this.retryRequest(async () => {
      const response = await this.api.post(`/staff/${userId}`, { input });
      return response.data;
    });
  }

  async removeStaff(userId: string, staffId: string): Promise<{ success: boolean }> {
    return this.retryRequest(async () => {
      const response = await this.api.delete(`/staff/${userId}/${staffId}`);
      return response.data;
    });
  }

  // Verification
  async createVerification(userId: string): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.post(`/verification/${userId}`);
      return response.data;
    });
  }

  async getVerificationStatus(sessionId: string): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.get(`/verification/${sessionId}/status`);
      return response.data;
    });
  }

  // Recipient lookup
  async getRecipient(identifier: string): Promise<any> {
    return this.retryRequest(async () => {
      const response = await this.api.get(`/recipient/${identifier}`);
      return response.data;
    });
  }
}

export const apiService = new ApiService();