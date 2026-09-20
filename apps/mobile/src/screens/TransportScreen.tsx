import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { TransportFare, TransportQueryResult } from '@fairprice/shared';

interface TransportScreenProps {
  onBack: () => void;
  apiBaseUrl: string;
}

export function TransportScreen({ onBack, apiBaseUrl }: TransportScreenProps) {
  const [origin, setOrigin] = useState('Kathmandu Airport (TIA)');
  const [destination, setDestination] = useState('Thamel');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransportQueryResult | null>(null);

  const fetchTransportFares = async (orig: string, dest: string) => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${apiBaseUrl}/api/transport?origin=${encodeURIComponent(orig)}&destination=${encodeURIComponent(dest)}`
      );
      if (resp.ok) {
        const data = await resp.json();
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportFares(origin, destination);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Transport Fare</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Input Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Origin Station</Text>
          <TextInput
            style={styles.input}
            value={origin}
            onChangeText={setOrigin}
            placeholder="Origin (e.g. TIA Airport, Ratna Park)"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.inputLabel}>Destination</Text>
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder="Destination (e.g. Thamel, Pokhara)"
            placeholderTextColor="#64748b"
          />

          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => fetchTransportFares(origin, destination)}
          >
            <Text style={styles.searchBtnText}>Search Verified Fares</Text>
          </TouchableOpacity>
        </View>

        {/* Presets */}
        <View style={styles.presetRow}>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => {
              setOrigin('Kathmandu Airport (TIA)');
              setDestination('Thamel');
              fetchTransportFares('Kathmandu Airport (TIA)', 'Thamel');
            }}
          >
            <Text style={styles.presetText}>TIA → Thamel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => {
              setOrigin('Kathmandu');
              setDestination('Pokhara');
              fetchTransportFares('Kathmandu', 'Pokhara');
            }}
          >
            <Text style={styles.presetText}>KTM → Pokhara</Text>
          </TouchableOpacity>
        </View>

        {/* Results Container */}
        {result && (
          <View>
            {result.status === 'SAME_ORIGIN_DESTINATION' ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Same Origin & Destination</Text>
                <Text style={styles.errorText}>{result.statusMessage}</Text>
              </View>
            ) : (
              <View>
                <View style={styles.summaryBar}>
                  <Text style={styles.summaryText}>Distance: {result.distanceKm} km</Text>
                  <Text style={styles.summaryText}>Est. Time: {result.estimatedDurationMins} mins</Text>
                </View>

                <Text style={styles.resultsHeader}>Verified Transport Options ({result.fares.length})</Text>

                {loading ? (
                  <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 24 }} />
                ) : result.fares.length === 0 ? (
                  <View style={styles.noFaresCard}>
                    <Text style={styles.noFaresTitle}>No verified fare data for this exact trip</Text>
                    <Text style={styles.noFaresSub}>Try selecting popular routes like TIA Airport to Thamel.</Text>
                  </View>
                ) : (
                  result.fares.map((fare: TransportFare) => (
                    <View key={fare.id} style={styles.fareCard}>
                      <View style={styles.fareHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.priceTypeBadge}>
                            {fare.priceType.replace(/_/g, ' ').toUpperCase()}
                          </Text>
                          <Text style={styles.providerName}>
                            {fare.providerName || fare.transportCategory.replace(/_/g, ' ').toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.fareAmount}>NPR {fare.fare}</Text>
                      </View>

                      {fare.rulesNote ? <Text style={styles.rulesNote}>{fare.rulesNote}</Text> : null}

                      <Text style={styles.sourceText}>
                        Source: {fare.source?.name || 'DoTM / CAAN Official Publication'} - Observed: {fare.observedAt.split('T')[0]}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
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
  backText: { color: '#60a5fa', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20 },
  inputCard: { backgroundColor: '#1e293b', padding: 18, borderRadius: 20, gap: 10 },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  input: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  searchBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  presetRow: { flexDirection: 'row', gap: 8, marginVertical: 14 },
  presetChip: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  presetText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  summaryBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1e293b', padding: 12, borderRadius: 12, marginBottom: 16 },
  summaryText: { color: '#60a5fa', fontSize: 13, fontWeight: '800' },
  resultsHeader: { color: '#ffffff', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  fareCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 18, marginBottom: 12, gap: 8 },
  fareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  priceTypeBadge: { color: '#60a5fa', fontSize: 10, fontWeight: '900' },
  providerName: { color: '#ffffff', fontSize: 16, fontWeight: '800', marginTop: 2 },
  fareAmount: { color: '#60a5fa', fontSize: 20, fontWeight: '900' },
  rulesNote: { color: '#cbd5e1', fontSize: 12, backgroundColor: '#0f172a', padding: 8, borderRadius: 8 },
  sourceText: { color: '#94a3b8', fontSize: 10 },
  errorCard: { backgroundColor: '#7f1d1d', padding: 16, borderRadius: 14, marginVertical: 16 },
  errorTitle: { color: '#fca5a5', fontSize: 16, fontWeight: '800' },
  errorText: { color: '#fca5a5', fontSize: 12, marginTop: 4 },
  noFaresCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, alignItems: 'center' },
  noFaresTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  noFaresSub: { color: '#94a3b8', fontSize: 12, marginTop: 4, textAlign: 'center' },
});
