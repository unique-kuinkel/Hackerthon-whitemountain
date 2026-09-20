import { describe, expect, it } from 'vitest';
import { PriceRecord } from '../types/index';
import { evaluatePriceComparison } from './engine';

describe('Price Engine - evaluatePriceComparison', () => {
  it('returns INSUFFICIENT_DATA when no records exist', () => {
    const result = evaluatePriceComparison({
      userPrice: 100,
      records: [],
    });
    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.sourceCount).toBe(0);
  });

  it('detects MATCHES_OFFICIAL_PRICE when user price equals MRP', () => {
    const mockRecords: PriceRecord[] = [
      {
        id: '1',
        productId: 'prod_1',
        sourceId: 'src_1',
        price: 20,
        currency: 'NPR',
        priceType: 'official_mrp',
        observedAt: '2026-09-01T00:00:00Z',
        sourceQuality: 5,
      },
    ];

    const result = evaluatePriceComparison({
      userPrice: 20,
      records: mockRecords,
    });

    expect(result.status).toBe('MATCHES_OFFICIAL_PRICE');
    expect(result.officialReference).toBe(20);
    expect(result.statusMessage).toContain('Matches official MRP');
  });

  it('detects DIFFERS_FROM_OFFICIAL_PRICE when user price exceeds MRP', () => {
    const mockRecords: PriceRecord[] = [
      {
        id: '1',
        productId: 'prod_1',
        sourceId: 'src_1',
        price: 20,
        currency: 'NPR',
        priceType: 'official_mrp',
        observedAt: '2026-09-01T00:00:00Z',
        sourceQuality: 5,
      },
    ];

    const result = evaluatePriceComparison({
      userPrice: 35,
      records: mockRecords,
    });

    expect(result.status).toBe('DIFFERS_FROM_OFFICIAL_PRICE');
    expect(result.userPrice).toBe(35);
  });

  it('evaluates market range correctly (ABOVE_OBSERVED_RANGE vs WITHIN_OBSERVED_RANGE)', () => {
    const mockRecords: PriceRecord[] = [
      {
        id: '1',
        productId: 'prod_momo',
        sourceId: 'src_1',
        price: 150,
        currency: 'NPR',
        priceType: 'restaurant_menu',
        observedAt: '2026-09-01T00:00:00Z',
        sourceQuality: 4,
      },
      {
        id: '2',
        productId: 'prod_momo',
        sourceId: 'src_2',
        price: 280,
        currency: 'NPR',
        priceType: 'restaurant_menu',
        observedAt: '2026-09-02T00:00:00Z',
        sourceQuality: 4,
      },
    ];

    const inside = evaluatePriceComparison({
      userPrice: 200,
      records: mockRecords,
    });
    expect(inside.status).toBe('WITHIN_OBSERVED_RANGE');
    expect(inside.minObserved).toBe(150);
    expect(inside.maxObserved).toBe(280);

    const high = evaluatePriceComparison({
      userPrice: 500,
      records: mockRecords,
    });
    expect(high.status).toBe('ABOVE_OBSERVED_RANGE');
  });

  it('identifies PROVIDER_QUOTE_ONLY correctly', () => {
    const mockRecords: PriceRecord[] = [
      {
        id: '1',
        productId: 'prod_transfer',
        sourceId: 'src_1',
        price: 1200,
        currency: 'NPR',
        priceType: 'provider_quote',
        observedAt: '2026-09-01T00:00:00Z',
        sourceQuality: 4,
      },
    ];

    const result = evaluatePriceComparison({
      userPrice: 1200,
      records: mockRecords,
    });

    expect(result.status).toBe('PROVIDER_QUOTE_ONLY');
  });
});
