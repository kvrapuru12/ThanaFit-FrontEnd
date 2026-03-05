import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, CardContent } from '../components/ui/card';
import { MaterialIcons } from '@expo/vector-icons';

const DEFAULT_TITLE = 'Coming soon';
const DEFAULT_MESSAGE = "We're working on this feature. Check back soon!";

export function WorkInProgressScreen({
  navigation,
  route,
}: {
  navigation?: any;
  route?: { params?: { title?: string; message?: string } };
}) {
  const title = route?.params?.title ?? DEFAULT_TITLE;
  const message = route?.params?.message ?? DEFAULT_MESSAGE;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <Text style={styles.message}>{message}</Text>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
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
  cardContent: { padding: 24 },
  message: { fontSize: 15, lineHeight: 24, color: '#374151' },
});
