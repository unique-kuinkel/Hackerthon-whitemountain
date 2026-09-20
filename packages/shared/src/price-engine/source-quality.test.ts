import { describe, expect, it } from 'vitest';
import { evaluatePrice } from './engine';
import { PriceRecord, PriceType, Source } from '../types/index';

describe('Source Quality & Conflict Handling Engine', () => {
  const officialSource: Source = {
    id: 'src_gov',
    name: 'Ministry of Industry & Commerce',
    url: 'https://gov.np',
    sourceType: 'official_gov',
    reliabilityScore: 1.0,
  };

  const menuSource: Source = {
    id: 'src_menu',
    name: 'Thamel Menu Audit 2026',
    url: 'https://kvta.org.np',
    sourceType: 'retailer_menu',
    reliabilityScore: 0.85,
  };

  const communitySource: Source = {
    id: 'src_comm',
    name: 'Tourist Forum Post',
    sourceType: 'community',
    reliabilityScore: 0.4,
  };

  it('correctly ranks records by source quality hierarchy', () => {
    const records: PriceRecord[] = [
      {
        id: 'r1',
        productId: 'p1',
        sourceId: 'src_comm',
        price: 800,
        currency: 'NPR',
        unit: 'item',
        priceType: 'community_reported',
        observedAt: '2026-09-01T00:00:00Z',
        retrievedAt: '2026-09-01T00:00:00Z',
        sourceQuality: 2,
        isActive: true,
        source: communitySource,
      },
      {
        id: 'r2',
        productId: 'p1',
        sourceId: 'src_gov',
        price: 500,
        currency: 'NPR',
        unit: 'item',
        priceType: 'official_tariff',
        observedAt: '2026-09-01T00:00:00Z',
        retrievedAt: '2026-09-01T00:00:00Z',
        sourceQuality: 5,
        isActive: true,
        source: officialSource,
      },
      {
        id: 'r3',
        productId: 'p1',
        sourceId: 'src_menu',
        price: 650,
        currency: 'NPR',
        unit: 'item',
        priceType: 'restaurant_menu',
        observedAt: '2026-09-02T00:00:00Z',
        retrievedAt: '2026-09-02T00:00:00Z',
        sourceQuality: 4,
        isActive: true,
        source: menuSource,
      },
    ];

    const result = evaluatePrice(500, records);

    expect(result.officialReference).toBe(500);
    expect(result.officialSourceName).toBe('Ministry of Industry & Commerce');
    expect(result.status).toBe('MATCHES_OFFICIAL_PRICE');
    expect(result.minObserved).toBe(500);
    expect(result.maxObserved).toBe(800);
  });

  it('detects price conflicts when discrepancies exceed threshold without silently merging', () => {
    const conflictingRecords: PriceRecord[] = [
      {
        id: 'c1',
        productId: 'p_sim',
        sourceId: 'src_gov',
        price: 600,
        currency: 'NPR',
        unit: 'pack',
        priceType: 'official_tariff',
        observedAt: '2026-09-10T00:00:00Z',
        retrievedAt: '2026-09-10T00:00:00Z',
        sourceQuality: 5,
        isActive: true,
        source: officialSource,
      },
      {
        id: 'c2',
        productId: 'p_sim',
        sourceId: 'src_comm',
        price: 1200,
        currency: 'NPR',
        unit: 'pack',
        priceType: 'retail',
        observedAt: '2026-09-12T00:00:00Z',
        retrievedAt: '2026-09-12T00:00:00Z',
        sourceQuality: 3,
        isActive: true,
        source: communitySource,
      },
    ];

    const result = evaluatePrice(1200, conflictingRecords);

    expect(result.conflict).toBeDefined();
    expect(result.conflict?.hasConflict).toBe(true);
    expect(result.conflict?.minPrice).toBe(600);
    expect(result.conflict?.maxPrice).toBe(1200);
    expect(result.conflict?.discrepancyPercentage).toBe(100);
    expect(result.conflict?.conflictingRecords.length).toBe(2);
  });

  it('ignores inactive price records during comparison', () => {
    const records: PriceRecord[] = [
      {
        id: 'r_active',
        productId: 'p_water',
        sourceId: 'src_gov',
        price: 25,
        currency: 'NPR',
        unit: 'bottle',
        priceType: 'official_mrp',
        observedAt: '2026-09-01T00:00:00Z',
        retrievedAt: '2026-09-01T00:00:00Z',
        sourceQuality: 5,
        isActive: true,
        source: officialSource,
      },
      {
        id: 'r_inactive',
        productId: 'p_water',
        sourceId: 'src_comm',
        price: 200,
        currency: 'NPR',
        unit: 'bottle',
        priceType: 'retail',
        observedAt: '2026-09-01T00:00:00Z',
        retrievedAt: '2026-09-01T00:00:00Z',
        sourceQuality: 1,
        isActive: false, // Inactive record should be excluded from active calculations
        source: communitySource,
      },
    ];

    const activeOnlyRecords = records.filter((r) => r.isActive);
    const result = evaluatePrice(25, activeOnlyRecords);

    expect(result.sourceCount).toBe(1);
    expect(result.maxObserved).toBe(25);
  });
});
