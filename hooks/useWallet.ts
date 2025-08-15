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
      const balanceData = await apiService.getBalance(user.id);
      setBalance(balanceData);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.getTransactions(user.id);
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const refreshWallet = async () => {
    setIsRefreshing(true);
    await loadWalletData();
    setIsRefreshing(false);
  };

  const sendMoney = async (recipient: string, amount: number, notes?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const result = await apiService.transfer(user.id, {
        transactionAmount: amount,
        transactionRecipient: recipient,
        transactionNotes: notes,
      });
      
      await refreshWallet();
      return result;
    } catch (error) {
      console.error('Send money failed:', error);
      throw error;
    }
  };

  const createPaymentRequest = async (paymentId: string, amount: number, note?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const result = await apiService.createCharge(user.id, {
        paymentId,
        amount,
        note,
      });
      
      return result;
    } catch (error) {
      console.error('Create payment request failed:', error);
      throw error;
    }
  };

  const mintTokens = async (amount: number, recipient?: string, notes?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const result = await apiService.mintTokens({
        transactionAmount: amount,
        transactionRecipient: recipient,
        transactionNotes: notes,
      });
      
      await refreshWallet();
      return result;
    } catch (error) {
      console.error('Mint tokens failed:', error);
      throw error;
    }
  };

  const redeemTokens = async (amount: number) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const result = await apiService.redeemTokens({
        userId: user.id,
        amount,
      });
      
      await refreshWallet();
      return result;
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
  };
};