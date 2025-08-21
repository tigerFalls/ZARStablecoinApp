import { supabase } from './supabase';
import type { Balance, Transaction } from '../types/api';

export class ApiService {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  async getBalance(userId: string): Promise<Balance | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching balance:', error);
        return null;
      }

      // Transform wallet data to Balance format
      return {
        tokens: [
          {
            name: 'LZAR',
            balance: data?.balance?.toString() || '0.00'
          }
        ]
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      return null;
    }
  }

  async getTransactions(userId: string, page = 1, limit = 20): Promise<{ transactions: Transaction[]; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching transactions:', error);
        return { transactions: [], hasMore: false };
      }

      // Transform database transactions to app format
      const transactions: Transaction[] = (data || []).map(tx => ({
        id: tx.id,
        userId: tx.sender_id === userId ? tx.sender_id : tx.recipient_id,
        externalId: tx.external_id,
        txType: tx.type?.toUpperCase() || 'TRANSFER',
        method: 'blockchain',
        currency: tx.currency || 'LZAR',
        value: tx.amount,
        status: tx.status,
        description: tx.description,
        fromUserId: tx.sender_id !== userId ? tx.sender_id : undefined,
        type: tx.type,
        createdAt: tx.created_at
      }));

      return {
        transactions,
        hasMore: data?.length === limit
      };
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return { transactions: [], hasMore: false };
    }
  }

  async transfer(userId: string, transferData: {
    transactionAmount: number;
    transactionRecipient: string;
    transactionNotes?: string;
  }): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      // Call server-side API endpoint for secure transfer processing
      const response = await fetch(`${this.baseUrl}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId,
          ...transferData
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Transfer failed' };
      }

      return { success: true, transaction: result.transaction };
    } catch (error) {
      console.error('Transfer failed:', error);
      return { success: false, error: 'Network error during transfer' };
    }
  }

  async createCharge(userId: string, chargeData: {
    paymentId: string;
    amount: number;
    note?: string;
  }): Promise<{ success: boolean; charge?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId,
          ...chargeData
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Charge creation failed' };
      }

      return { success: true, charge: result.charge };
    } catch (error) {
      console.error('Create charge failed:', error);
      return { success: false, error: 'Network error during charge creation' };
    }
  }

  async mintTokens(mintData: {
    transactionAmount: number;
    transactionRecipient?: string;
    transactionNotes?: string;
  }): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(mintData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Mint failed' };
      }

      return { success: true, transaction: result.transaction };
    } catch (error) {
      console.error('Mint failed:', error);
      return { success: false, error: 'Network error during mint' };
    }
  }

  async redeemTokens(redeemData: {
    userId: string;
    amount: number;
  }): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(redeemData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Redeem failed' };
      }

      return { success: true, transaction: result.transaction };
    } catch (error) {
      console.error('Redeem failed:', error);
      return { success: false, error: 'Network error during redeem' };
    }
  }
}

export const apiService = new ApiService();