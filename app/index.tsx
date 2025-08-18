import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, user, session } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user && session) {
        console.log('User authenticated, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('User not authenticated, redirecting to login');
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, user, session]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>LZAR</Text>
        <Text style={styles.tagline}>ZAR Stablecoin Wallet</Text>
      </View>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>Loading LZAR...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
});