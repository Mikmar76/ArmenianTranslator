import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Armenian Translator</Text>
      <Text style={styles.subtitle}>Test version</Text>
      <Text style={styles.info}>If you see this, the app works!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  info: {
    fontSize: 18,
    color: '#6C63FF',
    marginTop: 40,
    fontWeight: '600',
  },
});
