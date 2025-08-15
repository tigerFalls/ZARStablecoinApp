import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Send, QrCode, Users, Gift } from 'lucide-react-native';

interface QuickActionsProps {
  onSend: () => void;
  onRequest: () => void;
  onScan: () => void;
  onRewards: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSend,
  onRequest,
  onScan,
  onRewards,
}) => {
  const actions = [
    { icon: Send, label: 'Send', onPress: onSend, color: '#6366F1' },
    { icon: QrCode, label: 'Request', onPress: onRequest, color: '#10B981' },
    { icon: QrCode, label: 'Scan', onPress: onScan, color: '#F59E0B' },
    { icon: Gift, label: 'Rewards', onPress: onRewards, color: '#EC4899' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionItem}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
              <action.icon size={24} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});