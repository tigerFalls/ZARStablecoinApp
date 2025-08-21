import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Plus, Bell } from 'lucide-react-native';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { QuickActions } from '@/components/wallet/QuickActions';
import { TransactionList } from '@/components/wallet/TransactionList';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const { balance, transactions, isLoading, isRefreshing, refreshWallet } = useWallet();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const handleSend = () => {
    router.push('/send');
  };

  const handleRequest = () => {
    router.push('/request');
  };

  const handleScan = () => {
    router.push('/(tabs)/scan');
  };

  const handleRewards = () => {
    router.push('/rewards');
  };

  const handleTopUp = () => {
    router.push('/topup');
  };

  const handleWithdraw = () => {
    router.push('/withdraw');
  };

  const handleTransactionPress = (transaction: any) => {
    router.push(`/transaction/${transaction.id}`);
  };

  const handleNotifications = () => {
    router.push('/notifications');
  };

  const getUserDisplayName = () => {
    if (profile?.firstName) {
      return profile.firstName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.userName}>{getUserDisplayName()}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={handleNotifications}>
          <Bell size={24} color="#F3F4F6" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshWallet}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        <BalanceCard
          balance={balance}
          isBalanceVisible={isBalanceVisible}
          onToggleVisibility={() => setIsBalanceVisible(!isBalanceVisible)}
          onTopUp={handleTopUp}
          onWithdraw={handleWithdraw}
        />

        <QuickActions
          onSend={handleSend}
          onRequest={handleRequest}
          onScan={handleScan}
          onRewards={handleRewards}
        />

        <TransactionList
          transactions={transactions.slice(0, 5)}
          isRefreshing={isRefreshing}
          onRefresh={refreshWallet}
          onTransactionPress={handleTransactionPress}
        />

        {transactions.length > 5 && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Text style={styles.viewAllText}>View All Transactions</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleSend}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  viewAllButton: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 100,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});