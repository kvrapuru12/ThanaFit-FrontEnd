import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Card, CardContent } from '../components/ui/card';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { StaticContentScreen, PRIVACY_POLICY_CONTENT, TERMS_OF_SERVICE_CONTENT, FAQ_CONTENT } from './StaticContentScreen';

export function PrivacyPolicyScreen({ navigation }: { navigation?: any }) {
  const { deleteAccount } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm deletion',
              'Your account and all associated data will be permanently deleted. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete my account',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      await deleteAccount();
                      // Navigation will switch to Login automatically when isAuthenticated becomes false
                    } catch (err: any) {
                      Alert.alert(
                        'Error',
                        err?.message || 'Could not delete account. Please try again or contact support.'
                      );
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
          disabled={isDeleting}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <Text style={styles.contentText}>{PRIVACY_POLICY_CONTENT}</Text>
            
            {/* Link to Terms */}
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation?.navigate('Terms')}
              disabled={isDeleting}
            >
              <Text style={styles.linkText}>View Terms of Service →</Text>
            </TouchableOpacity>

            {/* Delete my account - required for App Store */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#dc2626" size="small" />
              ) : (
                <MaterialIcons name="delete-forever" size={20} color="#dc2626" />
              )}
              <Text style={styles.deleteButtonText}>Delete my account</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

export function TermsOfServiceScreen({ navigation }: { navigation?: any }) {
  return (
    <StaticContentScreen
      navigation={navigation}
      title="Terms of Service"
      content={TERMS_OF_SERVICE_CONTENT}
    />
  );
}

export function FAQScreen({ navigation }: { navigation?: any }) {
  return (
    <StaticContentScreen
      navigation={navigation}
      title="FAQ & Help Center"
      content={FAQ_CONTENT}
    />
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
    marginBottom: 24,
  },
  linkButton: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff6b6b',
    textAlign: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});

