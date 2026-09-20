import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';

interface SearchScreenProps {
  onBack: () => void;
  apiBaseUrl: string;
}

export function SearchScreen({ onBack, apiBaseUrl }: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const searchPrices = async (q: string) => {
    setLoading(true);
    try {
      const resp = await fetch(`${apiBaseUrl}/api/search?query=${encodeURIComponent(q)}`);
      if (resp.ok) {
        const data = await resp.json();
        setItems(data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchPrices('');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Price</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={(text: string) => {
              setQuery(text);
              searchPrices(text);
            }}
            placeholder="Search momo, Wai Wai, TIMS, taxi fare..."
            placeholderTextColor="#64748b"
          />
        </View>

        <Text style={styles.resultsHeader}>Benchmark Items ({items.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 24 }} />
        ) : (
          items.map((item: any, idx: number) => {
            const { product, comparison } = item;
            return (
              <View key={product.id || idx} style={styles.itemCard}>
                <Text style={styles.categoryBadge}>{product.tags?.[0] || 'Verified Product'}</Text>
                <Text style={styles.productTitle}>{product.title}</Text>

                <View style={styles.metricsBox}>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricLabel}>Official Ref</Text>
                    <Text style={styles.metricVal}>
                      {comparison.officialReference ? `NPR ${comparison.officialReference}` : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={styles.metricLabel}>Observed Range</Text>
                    <Text style={styles.metricVal}>
                      {comparison.minObserved !== undefined
                        ? `NPR ${comparison.minObserved}-${comparison.maxObserved}`
                        : 'N/A'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sourceCountText}>
                  {comparison.sourceCount} verified source records
                </Text>
              </View>
            );
          })
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
  backText: { color: '#4ade80', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20 },
  searchBox: { marginBottom: 16 },
  searchInput: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    padding: 14,
    borderRadius: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultsHeader: { color: '#ffffff', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  itemCard: { backgroundColor: '#1e293b', padding: 18, borderRadius: 18, marginBottom: 12, gap: 8 },
  categoryBadge: { color: '#4ade80', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  productTitle: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  metricsBox: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 12, borderRadius: 12, marginVertical: 4 },
  metricCol: { flex: 1, alignItems: 'center' },
  metricLabel: { color: '#94a3b8', fontSize: 10 },
  metricVal: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginTop: 2 },
  sourceCountText: { color: '#94a3b8', fontSize: 11 },
});
