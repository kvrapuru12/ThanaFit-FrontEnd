import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Card, CardContent } from '../components/ui/card';
import { MaterialIcons } from '@expo/vector-icons';

const SUPPORT_EMAIL = 'support@thanafit.com';

export function SupportScreen({ navigation }: { navigation?: any }) {
  const handleEmailPress = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Support</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <Text style={styles.contentText}>
              Need help? We're here for you. For any questions, feedback, or issues, please reach out to us by email.
            </Text>
            <Text style={styles.emailLabel}>Mail to:</Text>
            <TouchableOpacity onPress={handleEmailPress} activeOpacity={0.7}>
              <Text style={styles.emailLink}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>
            <Text style={styles.emailHint}>Tap to open your email app</Text>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    padding: 24,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 20,
  },
  emailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emailLink: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  emailHint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
});
