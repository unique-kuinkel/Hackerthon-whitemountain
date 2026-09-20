import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

interface HomeScreenProps {
  onNavigate: (screen: 'scan' | 'transport' | 'search' | 'receipt') => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>FP</Text>
          </View>
          <Text style={styles.title}>FAIRPRICE</Text>
          <Text style={styles.tagline}>"Know the price before you pay."</Text>
        </View>

        {/* Primary Action Button */}
        <View style={styles.primarySection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => onNavigate('scan')}
          >
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.primaryButtonText}>SCAN & CHECK</Text>
            <Text style={styles.primaryButtonSub}>Instant AI Camera & Price Engine</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Action Grid */}
        <View style={styles.secondarySection}>
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={() => onNavigate('transport')}
          >
            <Text style={styles.cardIcon}>🚌</Text>
            <Text style={styles.cardTitle}>Compare Fare</Text>
            <Text style={styles.cardSub}>DoTM Tariffs & Taxis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={() => onNavigate('search')}
          >
            <Text style={styles.cardIcon}>🔍</Text>
            <Text style={styles.cardTitle}>Search Price</Text>
            <Text style={styles.cardSub}>MRP & Market Items</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCardFull}
            onPress={() => onNavigate('receipt')}
          >
            <Text style={styles.cardIcon}>🧾</Text>
            <View>
              <Text style={styles.cardTitle}>Check My Bill</Text>
              <Text style={styles.cardSub}>Receipt OCR & Arithmetic Check</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#4ade80',
    fontWeight: '600',
    marginTop: 6,
    fontStyle: 'italic',
  },
  primarySection: {
    marginVertical: 24,
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  cameraIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  primaryButtonSub: {
    color: '#dcfce7',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  secondarySection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryCard: {
    backgroundColor: '#1e293b',
    width: '48%',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryCardFull: {
    backgroundColor: '#1e293b',
    width: '100%',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
});
