import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Balance, Transaction } from '@/types/api';
import { useAuth } from './useAuth';

export const useWallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await Promise.all([
        loadBalance(),
        loadTransactions(),
      ]);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBalance = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.getBalance(user.id);
      if (response.success) {
        setBalance(response.data);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const loadTransactions = async (page = 1, limit = 20) => {
    if (!user) return;
    
    try {
      const response = await apiService.getTransactions(user.id, page, limit);
      if (response.success) {
        if (page === 1) {
          setTransactions(response.data.transactions);
        } else {
          setTransactions(prev => [...prev, ...response.data.transactions]);
        }
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const refreshWallet = async () => {
    setIsRefreshing(true);
    await loadWalletData();
    setIsRefreshing(false);
  };

  const sendMoney = async (toUserId: string, amount: number, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await apiService.transfer(user.id, {
        toUserId,
        amount,
        currency: 'LZAR',
        description,
      });
      
      if (response.success) {
        await refreshWallet();
        return response.data;
      }
      throw new Error(response.error || 'Transfer failed');
    } catch (error) {
      console.error('Send money failed:', error);
      throw error;
    }
  };

  const createPaymentRequest = async (amount: number, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await apiService.createCharge(user.id, {
        amount,
        currency: 'LZAR',
        description,
      });
      
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create payment request');
    } catch (error) {
      console.error('Create payment request failed:', error);
      throw error;
    }
  };

  const mintTokens = async (amount: number, bankAccountId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await apiService.mintTokens(user.id, {
        amount,
        bankAccountId,
      });
      
      if (response.success) {
        await refreshWallet();
        return response.data;
      }
      throw new Error(response.error || 'Mint failed');
    } catch (error) {
      console.error('Mint tokens failed:', error);
      throw error;
    }
  };

  const redeemTokens = async (amount: number, bankAccountId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await apiService.redeemTokens(user.id, {
        amount,
        bankAccountId,
      });
      
      if (response.success) {
        await refreshWallet();
        return response.data;
      }
      throw new Error(response.error || 'Redeem failed');
    } catch (error) {
      console.error('Redeem tokens failed:', error);
      throw error;
    }
  };

  return {
    balance,
    transactions,
    isLoading,
    isRefreshing,
    loadWalletData,
    refreshWallet,
    sendMoney,
    createPaymentRequest,
    mintTokens,
    redeemTokens,
    loadTransactions,
  };
};