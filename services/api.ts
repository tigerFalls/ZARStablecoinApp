import { supabase } from './supabase';
import type { Transaction, TransferRequest, ApiResponse } from '../types/api';

export class ApiService {
  async getBalance(userId: string): Promise<ApiResponse<{ balance: number }>> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { balance: data?.balance || 0 } };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get balance' 
      };
    }
  }

  async getTransactions(userId: string): Promise<ApiResponse<Transaction[]>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get transactions' 
      };
    }
  }

  async transfer(transferData: TransferRequest): Promise<ApiResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          sender_id: transferData.senderId,
          recipient_id: transferData.recipientId,
          amount: transferData.amount,
          description: transferData.description,
          type: 'transfer',
          status: 'completed'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update sender balance
      await supabase.rpc('update_balance', {
        user_id: transferData.senderId,
        amount: -transferData.amount
      });

      // Update recipient balance
      await supabase.rpc('update_balance', {
        user_id: transferData.recipientId,
        amount: transferData.amount
      });

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process transfer' 
      };
    }
  }

  async getUserByPhone(phoneNumber: string): Promise<ApiResponse<{ id: string; name: string }>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('phone', phoneNumber)
        .single();

      if (error) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to find user' 
      };
    }
  }
}

export const apiService = new ApiService();