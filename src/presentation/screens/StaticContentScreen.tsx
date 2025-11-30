import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { MaterialIcons } from '@expo/vector-icons';

interface StaticContentScreenProps {
  navigation?: any;
  title: string;
  content: string;
}

export function StaticContentScreen({ navigation, title, content }: StaticContentScreenProps) {
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
        <Text style={styles.title}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <Text style={styles.contentText}>{content}</Text>
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
  },
});

// Privacy Policy Content
export const PRIVACY_POLICY_CONTENT = `
PRIVACY POLICY

Last Updated: January 2025

1. INTRODUCTION
ThanaFit ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

2. INFORMATION WE COLLECT
We collect information that you provide directly to us, including:
- Personal information (name, email, date of birth, gender)
- Health and fitness data (weight, height, activity levels, cycle tracking data)
- Usage data and preferences

3. HOW WE USE YOUR INFORMATION
We use the information we collect to:
- Provide and improve our services
- Personalize your experience
- Send you notifications and updates
- Analyze usage patterns

4. DATA SECURITY
We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. YOUR RIGHTS
You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Export your data
- Withdraw consent at any time

6. CONTACT US
If you have questions about this Privacy Policy, please contact us at:
Email: privacy@thanafit.com
`;

// Terms of Service Content
export const TERMS_OF_SERVICE_CONTENT = `
TERMS OF SERVICE

Last Updated: January 2025

1. ACCEPTANCE OF TERMS
By accessing and using ThanaFit, you accept and agree to be bound by the terms and provision of this agreement.

2. USE LICENSE
Permission is granted to temporarily use ThanaFit for personal, non-commercial purposes only.

3. HEALTH INFORMATION DISCLAIMER
ThanaFit provides health and fitness information for educational purposes only. It is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

4. USER ACCOUNTS
You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.

5. PROHIBITED USES
You may not use ThanaFit:
- For any unlawful purpose
- To violate any laws or regulations
- To transmit harmful or malicious code
- To impersonate others

6. LIMITATION OF LIABILITY
ThanaFit shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.

7. TERMINATION
We reserve the right to terminate or suspend your account and access to the service immediately, without prior notice, for any breach of these Terms.

8. CONTACT INFORMATION
For questions about these Terms, contact us at:
Email: support@thanafit.com
`;

// FAQ Content
export const FAQ_CONTENT = `
FREQUENTLY ASKED QUESTIONS

1. HOW DO I TRACK MY FOOD INTAKE?
You can track your food by tapping the "Food" tab and selecting "Add Food" for each meal. You can also use voice recording to quickly log your meals.

2. HOW DO I LOG MY EXERCISES?
Navigate to the "Exercise" tab and tap "Add Exercise" to log your workouts. You can track different types of exercises and their duration.

3. WHAT IS CYCLESYNC?
CycleSync is a feature available for female users to track menstrual cycles, predict periods, and receive personalized health recommendations.

4. HOW DO I CHANGE MY GOALS?
Go to your Profile, find the "Current Goals" section, and tap on any goal to edit it. You can set targets for calories, macros, water intake, steps, sleep, and weight.

5. CAN I EXPORT MY DATA?
Yes, you can export your data from the Privacy settings. This includes all your health and fitness data stored in the app.

6. HOW DO I DELETE MY ACCOUNT?
Go to Settings > Privacy > Delete My Account. This will permanently delete all your data from our servers.

7. IS MY DATA SECURE?
Yes, we use industry-standard encryption and security measures to protect your personal information and health data.

8. HOW DO I CHANGE MY PASSWORD?
Go to Settings > Change Password. You'll need to enter your current password and choose a new one.

9. CAN I USE THE APP OFFLINE?
Some features work offline, but you'll need an internet connection to sync your data and access certain features.

10. HOW DO I CONTACT SUPPORT?
You can contact support through the Support section in Settings, or email us directly at support@thanafit.com.
`;



