import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MessageCircle, Phone, Mail, CircleHelp as HelpCircle, Shield, FileText, ExternalLink } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ContactScreen() {
  const [selectedFAQ, setSelectedFAQ] = useState<number | null>(null);

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      description: 'Chat with our support team',
      action: () => openWhatsApp(),
      color: '#25D366',
    },
    {
      icon: Phone,
      title: 'Call Support',
      description: '+27 11 123 4567',
      action: () => makeCall('+27111234567'),
      color: '#6366F1',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@lzarpay.co.za',
      action: () => sendEmail('support@lzarpay.co.za'),
      color: '#EC4899',
    },
  ];

  const faqs = [
    {
      question: 'How do I send money using LZAR?',
      answer: 'You can send money by tapping the Send button on your home screen, entering the recipient\'s details, and confirming the transaction. All transfers are instant and secure on the Lisk blockchain.',
    },
    {
      question: 'What are the transaction fees?',
      answer: 'LZAR transactions have minimal fees. Peer-to-peer transfers cost 0.1% of the transaction amount, with a minimum fee of R0.50 and maximum of R10.00.',
    },
    {
      question: 'How do I top up my LZAR wallet?',
      answer: 'You can top up your wallet by linking your bank account and using the Top Up feature. Funds are converted to LZAR tokens at a 1:1 ratio with ZAR.',
    },
    {
      question: 'Is my money safe?',
      answer: 'Yes, LZAR is backed 1:1 by ZAR reserves held in regulated South African banks. All transactions are secured by blockchain technology and your funds are protected.',
    },
    {
      question: 'How do rewards work?',
      answer: 'Earn LZAR rewards by making purchases at participating merchants, referring friends, or completing promotional activities. Rewards are automatically added to your wallet.',
    },
  ];

  const openWhatsApp = () => {
    const phoneNumber = '27111234567';
    const message = 'Hi, I need help with my LZAR wallet.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('WhatsApp not installed', 'Please install WhatsApp to use this feature.');
      }
    });
  };

  const makeCall = (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Unable to make call', 'Your device does not support phone calls.');
      }
    });
  };

  const sendEmail = (email: string) => {
    const subject = 'LZAR Wallet Support Request';
    const body = 'Hi,\n\nI need assistance with my LZAR wallet.\n\nPlease describe your issue here.\n\nThank you.';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('No email app', 'Please install an email app to use this feature.');
      }
    });
  };

  const openURL = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>We're here to help you 24/7</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          {contactMethods.map((method, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactItem}
              onPress={method.action}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: `${method.color}20` }]}>
                <method.icon size={24} color={method.color} />
              </View>
              <View style={styles.contactDetails}>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactDescription}>{method.description}</Text>
              </View>
              <ExternalLink size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <Card key={index} style={styles.faqItem}>
              <TouchableOpacity
                onPress={() => setSelectedFAQ(selectedFAQ === index ? null : index)}
                style={styles.faqHeader}
              >
                <HelpCircle size={20} color="#6366F1" />
                <Text style={styles.faqQuestion}>{faq.question}</Text>
              </TouchableOpacity>
              {selectedFAQ === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Security</Text>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => openURL('https://lzarpay.co.za/privacy')}
          >
            <Shield size={20} color="#10B981" />
            <Text style={styles.legalText}>Privacy Policy</Text>
            <ExternalLink size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => openURL('https://lzarpay.co.za/terms')}
          >
            <FileText size={20} color="#F59E0B" />
            <Text style={styles.legalText}>Terms of Service</Text>
            <ExternalLink size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.emergencySection}>
          <Card gradient gradientColors={['#EF4444', '#DC2626']}>
            <Text style={styles.emergencyTitle}>Emergency Support</Text>
            <Text style={styles.emergencyText}>
              If you suspect fraudulent activity or need immediate assistance with your account security, contact us immediately.
            </Text>
            <Button
              title="Emergency Contact"
              onPress={() => makeCall('+27111234567')}
              variant="secondary"
              style={styles.emergencyButton}
            />
          </Card>
        </View>
      </ScrollView>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactDetails: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  faqItem: {
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginLeft: 12,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginLeft: 32,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  legalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F3F4F6',
    marginLeft: 12,
    flex: 1,
  },
  emergencySection: {
    marginVertical: 24,
    marginBottom: 100,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#FEE2E2',
    lineHeight: 20,
    marginBottom: 16,
  },
  emergencyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});