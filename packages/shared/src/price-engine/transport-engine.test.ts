import { describe, expect, it } from 'vitest';
import { TransportFare, TransportRoute } from '../types/index';
import { calculateHaversineDistance, evaluateTransportQuery } from './transport-engine';

describe('Transport Comparison Engine - evaluateTransportQuery', () => {
  const mockRoute: TransportRoute = {
    id: 'route_tia_thamel',
    name: 'Kathmandu Airport (TIA) to Thamel',
    originName: 'Kathmandu Airport (TIA)',
    originLat: 27.6981,
    originLng: 85.3592,
    destinationName: 'Thamel',
    destLat: 27.7154,
    destLng: 85.3123,
    distanceKm: 6.5,
    estimatedDurationMins: 25,
  };

  const mockOfficialFare: TransportFare = {
    id: 'tf_official_prepaid',
    routeId: 'route_tia_thamel',
    transportCategory: 'official_taxi',
    fare: 800,
    currency: 'NPR',
    providerName: 'TIA Official Prepaid Taxi Counter',
    sourceId: 'src_caan',
    sourceUrl: 'https://www.kathmanduairport.com.np/prepaid-taxi',
    observedAt: '2026-09-01T00:00:00Z',
    priceType: 'official_tariff',
    rulesNote: 'Official fixed prepaid ticket rate.',
  };

  const mockProviderQuote: TransportFare = {
    id: 'tf_private_quote',
    routeId: 'route_tia_thamel',
    transportCategory: 'private_transfer',
    fare: 1200,
    currency: 'NPR',
    providerName: 'Himalayan Luxury Transfer',
    sourceId: 'src_audit',
    observedAt: '2026-09-10T00:00:00Z',
    priceType: 'provider_quote',
    rulesNote: 'Private AC sedan booking.',
  };

  it('detects SAME_ORIGIN_DESTINATION correctly', () => {
    const res = evaluateTransportQuery({
      origin: 'Thamel',
      destination: 'Thamel',
      routes: [mockRoute],
      fares: [mockOfficialFare],
    });

    expect(res.status).toBe('SAME_ORIGIN_DESTINATION');
    expect(res.distanceKm).toBe(0);
  });

  it('detects INVALID_COORDINATES correctly', () => {
    const res = evaluateTransportQuery({
      origin: 'Kathmandu',
      destination: 'Pokhara',
      originLat: 150, // Invalid latitude > 90
      originLng: 85.3,
      destLat: 28.2,
      destLng: 83.9,
      routes: [],
      fares: [],
    });

    expect(res.status).toBe('INVALID_COORDINATES');
  });

  it('returns NO_FARES_FOUND when route exists but no fares exist', () => {
    const res = evaluateTransportQuery({
      origin: 'Kathmandu Airport (TIA)',
      destination: 'Thamel',
      routes: [mockRoute],
      fares: [],
    });

    expect(res.status).toBe('NO_FARES_FOUND');
    expect(res.fares.length).toBe(0);
  });

  it('distinguishes official_tariff from provider_quote', () => {
    const res = evaluateTransportQuery({
      origin: 'Kathmandu Airport (TIA)',
      destination: 'Thamel',
      routes: [mockRoute],
      fares: [mockOfficialFare, mockProviderQuote],
    });

    expect(res.status).toBe('FOUND');
    expect(res.fares.length).toBe(2);

    const official = res.fares.find((f) => f.priceType === 'official_tariff');
    const quote = res.fares.find((f) => f.priceType === 'provider_quote');

    expect(official?.fare).toBe(800);
    expect(quote?.fare).toBe(1200);
  });

  it('flags stale fares older than 12 months in warnings', () => {
    const staleFare: TransportFare = {
      ...mockOfficialFare,
      id: 'tf_stale',
      observedAt: '2024-01-01T00:00:00Z', // 2+ years old
    };

    const res = evaluateTransportQuery({
      origin: 'Kathmandu Airport (TIA)',
      destination: 'Thamel',
      routes: [mockRoute],
      fares: [staleFare],
    });

    expect(res.warnings && res.warnings.length).toBeGreaterThan(0);
    expect(res.warnings?.[0]).toContain('older than 12 months');
  });

  it('computes Haversine distance correctly', () => {
    const dist = calculateHaversineDistance(27.6981, 85.3592, 27.7154, 85.3123);
    expect(dist).toBeGreaterThan(4);
    expect(dist).toBeLessThan(10);
  });
});
