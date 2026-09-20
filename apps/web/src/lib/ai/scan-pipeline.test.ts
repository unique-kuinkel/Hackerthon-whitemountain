import { describe, expect, it } from 'vitest';
import { evaluatePriceComparison } from '@fairprice/shared';
import { preprocessImage } from '../image-preprocessor';
import { UniversalScanResultSchema } from '@fairprice/shared';

describe('Quality Control & Scan Pipeline Tests', () => {
  it('preprocessor rejects oversized image payloads > 10MB', () => {
    const hugePayload = 'data:image/jpeg;base64,' + 'A'.repeat(15 * 1024 * 1024);
    expect(() => preprocessImage(hugePayload)).toThrow(/exceeds maximum limit/);
  });

  it('preprocessor rejects corrupt/tiny payload', () => {
    expect(() => preprocessImage('data:image/jpeg;base64,A')).toThrow(/corrupt or too small/);
  });

  it('validates structured AI output matching Zod schema', () => {
    const rawAiOutput = {
      type: 'product',
      name: 'Wai Wai Chicken Noodle (75g Packet)',
      brand: 'CG Foods',
      size: '75g',
      quantity: 1,
      unit: 'packet',
      category: 'Packaged Goods & MRP',
      confidence: 0.95,
      searchTerms: ['wai wai', 'noodles'],
    };

    const parsed = UniversalScanResultSchema.parse(rawAiOutput);
    expect(parsed.name).toBe('Wai Wai Chicken Noodle (75g Packet)');
    expect(parsed.confidence).toBe(0.95);
  });

  it('returns INSUFFICIENT_DATA status when item has zero database price records', () => {
    const comparison = evaluatePriceComparison({
      userPrice: 500,
      records: [],
    });

    expect(comparison.status).toBe('INSUFFICIENT_DATA');
    expect(comparison.statusMessage).toContain('No verified price records');
  });

  it('handles missing price and generates category bounds', () => {
    const mockRecords = [
      {
        id: 'rec_1',
        productId: 'prod_1',
        sourceId: 'src_1',
        price: 150,
        currency: 'NPR' as const,
        priceType: 'restaurant_menu' as const,
        observedAt: '2026-09-01T00:00:00Z',
        sourceQuality: 4,
      },
      {
        id: 'rec_2',
        productId: 'prod_1',
        sourceId: 'src_2',
        price: 250,
        currency: 'NPR' as const,
        priceType: 'restaurant_menu' as const,
        observedAt: '2026-09-05T00:00:00Z',
        sourceQuality: 4,
      },
    ];

    const comparison = evaluatePriceComparison({
      records: mockRecords,
    });

    expect(comparison.status).toBe('WITHIN_OBSERVED_RANGE');
    expect(comparison.minObserved).toBe(150);
    expect(comparison.maxObserved).toBe(250);
  });

  it('flags ABOVE_OBSERVED_RANGE when user price is higher than market range', () => {
    const mockRecords = [
      {
        id: 'rec_1',
        productId: 'prod_1',
        sourceId: 'src_1',
        price: 100,
        currency: 'NPR' as const,
        priceType: 'restaurant_menu' as const,
        observedAt: '2026-09-01T00:00:00Z',
        sourceQuality: 4,
      },
    ];

    const comparison = evaluatePriceComparison({
      userPrice: 300,
      records: mockRecords,
    });

    expect(comparison.status).toBe('ABOVE_OBSERVED_RANGE');
    expect(comparison.statusMessage).toContain('above observed market range');
  });
});
