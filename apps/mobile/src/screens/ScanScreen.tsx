import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { PriceComparisonSummary, PriceRecord, ProductScanResult } from '@fairprice/shared';

interface ScanScreenProps {
  onBack: () => void;
  apiBaseUrl: string;
}

export function ScanScreen({ onBack, apiBaseUrl }: ScanScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ProductScanResult | null>(null);
  const [comparison, setComparison] = useState<PriceComparisonSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cameraRef = React.useRef<any>(null);

  const startLiveCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        alert('Camera permission is required to scan items.');
        return;
      }
    }
    setUseLiveCamera(true);
  };

  const captureLivePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
        setUseLiveCamera(false);
        if (photo.base64) {
          setImageUri(photo.uri);
          processImage(photo.base64);
        }
      } catch (err: any) {
        alert('Failed to capture photo: ' + err.message);
      }
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!res.canceled && res.assets[0].base64) {
      setImageUri(res.assets[0].uri);
      processImage(res.assets[0].base64);
    }
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${apiBaseUrl}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: `data:image/jpeg;base64,${base64}` }),
      });

      if (!resp.ok) {
        throw new Error('Server connectivity or image analysis issue');
      }

      const data = await resp.json();
      setScanResult(data.scanResult);
      setComparison(data.comparison);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze product image. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for evidence-based status label
  const renderNeutralStatusLabel = (status: string) => {
    switch (status) {
      case 'MATCHES_OFFICIAL_PRICE':
        return 'Official Reference';
      case 'WITHIN_OBSERVED_RANGE':
        return 'Within Observed Range';
      case 'ABOVE_OBSERVED_RANGE':
        return 'Above Observed Range';
      case 'BELOW_OBSERVED_RANGE':
        return 'Below Observed Range';
      case 'PROVIDER_QUOTE_ONLY':
        return 'Provider Quote Only';
      default:
        return 'Insufficient Data';
    }
  };

  if (useLiveCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.cameraView} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setUseLiveCamera(false)}>
              <Text style={styles.closeCameraText}>✕ Close</Text>
            </TouchableOpacity>

            <View style={styles.guidanceBox}>
              <Text style={styles.guidanceTitle}>Align Item inside Frame</Text>
              <Text style={styles.guidanceSub}>Position product, menu item, SIM pack, or receipt clearly</Text>
            </View>

            <View style={styles.captureArea}>
              <TouchableOpacity style={styles.captureBtn} onPress={captureLivePhoto}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan & Check Price</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!imageUri ? (
          <View style={styles.pickerBox}>
            <Text style={styles.pickerIcon}>📷</Text>
            <Text style={styles.pickerTitle}>Capture Product or Price Tag</Text>
            <Text style={styles.pickerSub}>Point at Wai Wai, momo, SIM card, souvenirs, gear, or menu</Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={startLiveCamera}>
              <Text style={styles.primaryBtnText}>Open Live Viewfinder</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
              <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            {/* Item Photo & Retake */}
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              {loading ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#16a34a" />
                  <Text style={styles.loadingText}>Analyzing visual evidence...</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.retakeBtn} onPress={() => { setImageUri(null); setScanResult(null); setComparison(null); }}>
              <Text style={styles.retakeText}>Retake Photo</Text>
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Analysis Notice</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {scanResult && comparison ? (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.categoryBadge}>{scanResult.category || 'General Item'}</Text>
                  {comparison.freshnessDate && (
                    <Text style={styles.freshnessText}>Freshness: {comparison.freshnessDate}</Text>
                  )}
                </View>

                {/* Item Name */}
                <Text style={styles.productTitle}>{scanResult.name}</Text>

                {/* Location */}
                <Text style={styles.locationText}>
                  📍 Context: {scanResult.subcategory || scanResult.category || 'Kathmandu / Tourist Area'}
                </Text>

                {/* Evidence-Based Neutral Comparison Status */}
                <View style={styles.statusBadge}>
                  <Text style={styles.statusTitle}>
                    {renderNeutralStatusLabel(comparison.status)}
                  </Text>
                  <Text style={styles.statusMsg}>{comparison.statusMessage}</Text>
                </View>

                {/* Price Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Official Reference</Text>
                    <Text style={styles.metricValue}>
                      {comparison.officialReference ? `NPR ${comparison.officialReference}` : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Observed Range</Text>
                    <Text style={styles.metricValue}>
                      {comparison.minObserved !== undefined
                        ? `NPR ${comparison.minObserved} - ${comparison.maxObserved}`
                        : 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Source-backed records list & web links */}
                <Text style={styles.recordsHeader}>
                  Verified Price Observations ({comparison.sourceCount})
                </Text>

                {comparison.records.map((r: PriceRecord) => (
                  <View key={r.id} style={styles.recordRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordVenue}>{r.venue?.name || r.source?.name || 'Verified Source'}</Text>
                      <Text style={styles.recordMeta}>
                        Type: {r.priceType} • Date: {r.observedAt.split('T')[0]}
                      </Text>
                      {r.sourceUrl && (
                        <TouchableOpacity onPress={() => Linking.openURL(r.sourceUrl!)}>
                          <Text style={styles.sourceLinkText}>🔗 Source Link</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.recordPrice}>NPR {r.price}</Text>
                  </View>
                ))}
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
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraView: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 24, paddingTop: 48 },
  closeCameraBtn: { backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start' },
  closeCameraText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  guidanceBox: { backgroundColor: 'rgba(15, 23, 42, 0.75)', padding: 14, borderRadius: 16, marginVertical: 10, alignItems: 'center' },
  guidanceTitle: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  guidanceSub: { color: '#cbd5e1', fontSize: 12, marginTop: 4, textAlign: 'center' },
  captureArea: { alignItems: 'center', marginBottom: 36 },
  captureBtn: { width: 76, height: 76, borderRadius: 38, borderColor: '#ffffff', borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#16a34a' },
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
  backText: { color: '#4ade80', fontSize: 16, fontWeight: '700' },
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
    backgroundColor: '#16a34a',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: '#334155',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
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
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { color: '#4ade80', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  freshnessText: { color: '#94a3b8', fontSize: 11 },
  productTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  locationText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  statusBadge: { backgroundColor: '#0f291e', padding: 14, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: '#34d399' },
  statusTitle: { color: '#34d399', fontSize: 14, fontWeight: '900' },
  statusMsg: { color: '#dcfce7', fontSize: 12, marginTop: 4, lineHeight: 18 },
  metricsGrid: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 14, borderRadius: 14 },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { color: '#94a3b8', fontSize: 11 },
  metricValue: { color: '#ffffff', fontSize: 16, fontWeight: '800', marginTop: 2 },
  recordsHeader: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginTop: 8 },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
  },
  recordVenue: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  recordMeta: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  sourceLinkText: { color: '#38bdf8', fontSize: 11, fontWeight: '700', marginTop: 4 },
  recordPrice: { color: '#4ade80', fontSize: 15, fontWeight: '800' },
  errorCard: { backgroundColor: '#451a1a', padding: 14, borderRadius: 14 },
  errorTitle: { color: '#fca5a5', fontSize: 13, fontWeight: '800' },
  errorText: { color: '#f87171', fontSize: 12, marginTop: 2 },
});
