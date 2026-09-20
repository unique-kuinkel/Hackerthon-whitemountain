import { PriceComparisonSummary, PriceRecord, ReceiptScan, TransportFare, TransportRoute } from '../types/index.js';

export interface ApiClientOptions {
  baseUrl?: string;
}

export class FairPriceApiClient {
  private baseUrl: string;

  constructor(options?: ApiClientOptions) {
    // Default to relative window.location or localhost:3000 for mobile dev
    this.baseUrl = options?.baseUrl || '';
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error [${response.status}]: ${errorText || response.statusText}`);
    }

    return (await response.json()) as T;
  }

  async scanProductImage(base64Image: string, userLocation?: { lat: number; lng: number }): Promise<{
    scanResult: any;
    comparison: PriceComparisonSummary;
  }> {
    return this.fetchJson('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image, location: userLocation }),
    });
  }

  async scanReceiptImage(base64Image: string): Promise<{
    scanResult: any;
    receipt: ReceiptScan;
  }> {
    return this.fetchJson('/api/scan-receipt', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image }),
    });
  }

  async searchPrices(params: {
    query?: string;
    category?: string;
    city?: string;
    venueType?: string;
  }): Promise<{
    products: any[];
    records: PriceRecord[];
  }> {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.set('query', params.query);
    if (params.category) queryParams.set('category', params.category);
    if (params.city) queryParams.set('city', params.city);
    if (params.venueType) queryParams.set('venueType', params.venueType);

    return this.fetchJson(`/api/search?${queryParams.toString()}`);
  }

  async compareTransport(origin: string, destination: string): Promise<{
    routes: TransportRoute[];
    fares: TransportFare[];
  }> {
    const queryParams = new URLSearchParams({ origin, destination });
    return this.fetchJson(`/api/transport?${queryParams.toString()}`);
  }
}
