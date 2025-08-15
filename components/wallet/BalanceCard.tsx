import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, TrendingUp } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Balance } from '@/types/api';

interface BalanceCardProps {
  balance: Balance | null;
  isBalanceVisible: boolean;
  onToggleVisibility: () => void;
  onTopUp: () => void;
  onWithdraw: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  isBalanceVisible,
  onToggleVisibility,
  onTopUp,
  onWithdraw,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatLZAR = (amount: number) => {
    return `${amount.toFixed(2)} LZAR`;
  };

  return (
    <Card gradient gradientColors={['#6366F1', '#8B5CF6', '#EC4899']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Total Balance</Text>
          <View style={styles.balanceContainer}>
            <Text style={styles.balance}>
              {isBalanceVisible 
                ? formatLZAR(balance?.lzarBalance || 0)
                : '••••••'
              }
            </Text>
            <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
              {isBalanceVisible ? (
                <Eye size={20} color="#FFFFFF" />
              ) : (
                <EyeOff size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.trendContainer}>
          <TrendingUp size={24} color="#10B981" />
        </View>
      </View>

      <View style={styles.subBalances}>
        <View style={styles.subBalance}>
          <Text style={styles.subBalanceLabel}>ZAR Equivalent</Text>
          <Text style={styles.subBalanceValue}>
            {isBalanceVisible 
              ? formatCurrency(balance?.zarBalance || 0)
              : '••••••'
            }
          </Text>
        </View>
        <View style={styles.subBalance}>
          <Text style={styles.subBalanceLabel}>Locked</Text>
          <Text style={styles.subBalanceValue}>
            {isBalanceVisible 
              ? formatLZAR(balance?.lockedBalance || 0)
              : '••••••'
            }
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onTopUp}>
          <Text style={styles.actionButtonText}>Top Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={onWithdraw}>
          <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Withdraw</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 12,
  },
  eyeButton: {
    padding: 4,
  },
  trendContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  subBalances: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  subBalance: {
    flex: 1,
  },
  subBalanceLabel: {
    fontSize: 12,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  subBalanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryActionText: {
    color: '#E5E7EB',
  },
});