import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, Clock, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { Transaction } from '@/types/api';

interface TransactionListProps {
  transactions: Transaction[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onTransactionPress: (transaction: Transaction) => void;
  onLoadMore?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isRefreshing,
  onRefresh,
  onTransactionPress,
  onLoadMore,
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'LZAR') {
      return `${amount.toFixed(2)} LZAR`;
    }
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-ZA', { 
        weekday: 'short' 
      });
    } else {
      return date.toLocaleDateString('en-ZA', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    const iconProps = { size: 20, color: '#9CA3AF' };
    
    switch (transaction.status) {
      case 'pending':
        return <Clock {...iconProps} color="#F59E0B" />;
      case 'completed':
        return <CheckCircle {...iconProps} color="#10B981" />;
      case 'failed':
      case 'cancelled':
        return <XCircle {...iconProps} color="#EF4444" />;
      default:
        return transaction.type === 'transfer' && transaction.fromUserId 
          ? <ArrowDownLeft {...iconProps} color="#10B981" />
          : <ArrowUpRight {...iconProps} color="#EF4444" />;
    }
  };

  const getTransactionTitle = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'transfer':
        return transaction.fromUserId ? 'Received' : 'Sent';
      case 'mint':
        return 'Top Up';
      case 'redeem':
        return 'Withdrawal';
      case 'charge':
        return 'Payment Request';
      case 'reward':
        return 'Reward';
      default:
        return 'Transaction';
    }
  };

  const getAmountColor = (transaction: Transaction) => {
    if (transaction.status === 'failed' || transaction.status === 'cancelled') {
      return '#9CA3AF';
    }
    return transaction.type === 'transfer' && transaction.fromUserId 
      ? '#10B981' 
      : '#F3F4F6';
  };

  const getAmountPrefix = (transaction: Transaction) => {
    if (transaction.type === 'transfer' && transaction.fromUserId) {
      return '+';
    }
    return transaction.type === 'mint' || transaction.type === 'reward' ? '+' : '-';
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => onTransactionPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionIcon}>
        {getTransactionIcon(item)}
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{getTransactionTitle(item)}</Text>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {item.description || 'No description'}
        </Text>
        <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
      </View>
      
      <View style={styles.transactionAmount}>
        <Text style={[styles.amount, { color: getAmountColor(item) }]}>
          {getAmountPrefix(item)}{formatCurrency(item.amount, item.currency)}
        </Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Transactions</Text>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});