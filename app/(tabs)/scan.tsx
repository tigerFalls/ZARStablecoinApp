import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QRScanner } from '@/components/qr/QRScanner';
import { router } from 'expo-router';

export default function ScanScreen() {
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = (data: string) => {
    setIsScanning(false);
    
    try {
      // Parse QR code data
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'payment_request') {
        // Navigate to payment confirmation screen
        router.push({
          pathname: '/payment-confirm',
          params: {
            chargeId: qrData.chargeId,
            amount: qrData.amount,
            description: qrData.description,
            merchantName: qrData.merchantName,
          },
        });
      } else if (qrData.type === 'user_profile') {
        // Navigate to send money screen with user info
        router.push({
          pathname: '/send',
          params: {
            userId: qrData.userId,
            userName: qrData.userName,
          },
        });
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not supported.');
        setIsScanning(true);
      }
    } catch (error) {
      Alert.alert('Invalid QR Code', 'Unable to read QR code data.');
      setIsScanning(true);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (!isScanning) {
    return (
      <View style={styles.container}>
        <Text style={styles.processingText}>Processing QR code...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <QRScanner onScan={handleScan} onClose={handleClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  processingText: {
    fontSize: 18,
    color: '#F3F4F6',
    textAlign: 'center',
    marginTop: 100,
  },
});