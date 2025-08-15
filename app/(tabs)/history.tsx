import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Filter, Search } from 'lucide-react-native';
import { TransactionList } from '@/components/wallet/TransactionList';
import { Input } from '@/components/ui/Input';
import { useWallet } from '@/hooks/useWallet';
import { Transaction } from '@/types/api';
import { router } from 'expo-router';

export default function HistoryScreen() {
  const { transactions, isRefreshing, refreshWallet, loadTransactions } = useWallet();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received' | 'rewards'>('all');

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, filterType]);

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => {
        switch (filterType) {
          case 'sent':
            return transaction.type === 'transfer' && !transaction.fromUserId;
          case 'received':
            return transaction.type === 'transfer' && transaction.fromUserId;
          case 'rewards':
            return transaction.type === 'reward';
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    router.push(`/transaction/${transaction.id}`);
  };

  const handleFilterPress = () => {
    // Cycle through filter types
    const filters: Array<'all' | 'sent' | 'received' | 'rewards'> = ['all', 'sent', 'received', 'rewards'];
    const currentIndex = filters.indexOf(filterType);
    const nextIndex = (currentIndex + 1) % filters.length;
    setFilterType(filters[nextIndex]);
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'sent':
        return 'Sent';
      case 'received':
        return 'Received';
      case 'rewards':
        return 'Rewards';
      default:
        return 'All';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color="#9CA3AF" />}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
          <Filter size={20} color="#6366F1" />
          <Text style={styles.filterText}>{getFilterLabel()}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TransactionList
          transactions={filteredTransactions}
          isRefreshing={isRefreshing}
          onRefresh={refreshWallet}
          onTransactionPress={handleTransactionPress}
          onLoadMore={() => loadTransactions(Math.ceil(transactions.length / 20) + 1)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});