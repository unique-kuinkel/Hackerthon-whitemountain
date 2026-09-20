import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ReceiptItemEvaluated, ReceiptScan } from '@fairprice/shared';

interface ReceiptScreenProps {
  onBack: () => void;
  apiBaseUrl: string;
}

export function ReceiptScreen({ onBack, apiBaseUrl }: ReceiptScreenProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptScan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickReceipt = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!res.canceled && res.assets[0].base64) {
      setImageUri(res.assets[0].uri);
      processReceipt(res.assets[0].base64);
    }
  };

  const processReceipt = async (base64: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${apiBaseUrl}/api/scan-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: `data:image/jpeg;base64,${base64}` }),
      });

      if (!resp.ok) {
        throw new Error('API server returned error');
      }

      const data = await resp.json();
      setReceipt(data.receipt);
    } catch (err: any) {
      setError(err.message || 'Failed to process receipt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check My Bill</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!imageUri ? (
          <View style={styles.pickerBox}>
            <Text style={styles.pickerIcon}>🧾</Text>
            <Text style={styles.pickerTitle}>Check Restaurant / Retail Bill</Text>
            <Text style={styles.pickerSub}>Scan or upload printed receipt to verify arithmetic & market rates</Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={pickReceipt}>
              <Text style={styles.primaryBtnText}>Upload Bill Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              {loading ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#a855f7" />
                  <Text style={styles.loadingText}>Checking Bill Arithmetic & Market Rates...</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.retakeBtn} onPress={() => setImageUri(null)}>
              <Text style={styles.retakeText}>Upload Another Bill</Text>
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {receipt ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.merchantName}>{receipt.merchantName}</Text>
                  <Text
                    style={[
                      styles.arithBadge,
                      { backgroundColor: receipt.isArithmeticValid ? '#064e3b' : '#7f1d1d' },
                    ]}
                  >
                    {receipt.isArithmeticValid ? 'Math Verified' : 'Math Mismatch'}
                  </Text>
                </View>

                <Text style={styles.sectionHeader}>Line Items ({receipt.items.length})</Text>
                {receipt.items.map((item: ReceiptItemEvaluated, idx: number) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemMain}>
                      <Text style={styles.itemName}>
                        {item.quantity}x {item.rawName}
                      </Text>
                      <Text style={styles.itemPrice}>NPR {item.lineTotal}</Text>
                    </View>
                    <Text style={styles.itemStatus}>{item.statusMessage}</Text>
                  </View>
                ))}

                <View style={styles.summaryContainer}>
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>Subtotal</Text>
                    <Text style={styles.sumVal}>NPR {receipt.subtotal}</Text>
                  </View>
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>Service Charge</Text>
                    <Text style={styles.sumVal}>NPR {receipt.serviceCharge}</Text>
                  </View>
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>Tax / VAT</Text>
                    <Text style={styles.sumVal}>NPR {receipt.taxAmount}</Text>
                  </View>
                  <View style={[styles.sumRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Bill</Text>
                    <Text style={styles.totalVal}>NPR {receipt.totalAmount}</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#1e293b',
  },
  backButton: { padding: 8 },
  backText: { color: '#c084fc', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20 },
  pickerBox: {
    backgroundColor: '#1e293b',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  pickerIcon: { fontSize: 48, marginBottom: 16 },
  pickerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  pickerSub: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  primaryBtn: {
    backgroundColor: '#9333ea',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  resultContainer: { gap: 16 },
  imagePreviewWrapper: {
    height: 250,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  imagePreview: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#ffffff', fontWeight: '700', marginTop: 12 },
  retakeBtn: { backgroundColor: '#334155', padding: 12, borderRadius: 12, alignItems: 'center' },
  retakeText: { color: '#ffffff', fontWeight: '700' },
  card: { backgroundColor: '#1e293b', padding: 20, borderRadius: 20, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  merchantName: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  arithBadge: { color: '#ffffff', fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sectionHeader: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginTop: 8 },
  itemRow: { backgroundColor: '#0f172a', padding: 12, borderRadius: 12, gap: 4 },
  itemMain: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  itemPrice: { color: '#c084fc', fontSize: 13, fontWeight: '800' },
  itemStatus: { color: '#94a3b8', fontSize: 11 },
  summaryContainer: { borderTopWidth: 1, borderColor: '#334155', paddingTop: 12, gap: 6 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLabel: { color: '#94a3b8', fontSize: 12 },
  sumVal: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderColor: '#334155', paddingTop: 8, marginTop: 4 },
  totalLabel: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  totalVal: { color: '#c084fc', fontSize: 16, fontWeight: '900' },
  errorCard: { backgroundColor: '#7f1d1d', padding: 12, borderRadius: 12 },
  errorText: { color: '#fca5a5', fontSize: 13 },
});
