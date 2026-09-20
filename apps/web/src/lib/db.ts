import {
  Category,
  CoverageStats,
  Location,
  PriceConflict,
  PriceRecord,
  Product,
  Seller,
  Source,
  TransportFare,
  TransportRoute,
  Venue,
} from '@fairprice/shared';
import {
  SEED_CATEGORIES,
  SEED_LOCATIONS,
  SEED_PRICE_RECORDS,
  SEED_PRODUCTS,
  SEED_SELLERS,
  SEED_SOURCES,
  SEED_TRANSPORT_FARES,
  SEED_TRANSPORT_ROUTES,
  SEED_VENUES,
} from '@fairprice/shared';

// In-memory data repository with source-backed benchmarks and full admin ingestion
class FairPriceRepository {
  private products: Product[] = [...SEED_PRODUCTS];
  private priceRecords: PriceRecord[] = [...SEED_PRICE_RECORDS];
  private categories: Category[] = [...SEED_CATEGORIES];
  private sources: Source[] = [...SEED_SOURCES];
  private locations: Location[] = [...SEED_LOCATIONS];
  private venues: Venue[] = [...SEED_VENUES];
  private sellers: Seller[] = [...(SEED_SELLERS || [])];
  private transportRoutes: TransportRoute[] = [...SEED_TRANSPORT_ROUTES];
  private transportFares: TransportFare[] = [...SEED_TRANSPORT_FARES];

  getAllProducts(): Product[] {
    return this.products;
  }

  getAllCategories(): Category[] {
    return this.categories;
  }

  getAllSources(): Source[] {
    return this.sources;
  }

  getAllVenues(): Venue[] {
    return this.venues;
  }

  getAllSellers(): Seller[] {
    return this.sellers;
  }

  getAllPriceRecords(includeInactive: boolean = false): PriceRecord[] {
    const list = includeInactive
      ? this.priceRecords
      : this.priceRecords.filter((r) => r.isActive !== false);
    return list.map((r) => this.hydratePriceRecord(r));
  }

  findProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  findProductByBarcode(barcode: string): Product | undefined {
    return this.products.find((p) => p.barcode === barcode);
  }

  findPriceRecordById(id: string): PriceRecord | undefined {
    const rec = this.priceRecords.find((r) => r.id === id);
    return rec ? this.hydratePriceRecord(rec) : undefined;
  }

  findSourceById(id: string): Source | undefined {
    return this.sources.find((s) => s.id === id);
  }

  searchProducts(query: string, categoryId?: string): Product[] {
    const q = query.toLowerCase().trim();
    return this.products.filter((p) => {
      const matchesCategory = categoryId ? p.categoryId === categoryId : true;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));
      return matchesCategory && matchesQuery;
    });
  }

  getPriceRecordsForProduct(productId: string, includeInactive: boolean = false): PriceRecord[] {
    return this.priceRecords
      .filter((r) => r.productId === productId && (includeInactive || r.isActive !== false))
      .map((r) => this.hydratePriceRecord(r));
  }

  getPriceRecordsForCategory(categoryId: string, includeInactive: boolean = false): PriceRecord[] {
    const categoryProducts = this.products.filter((p) => p.categoryId === categoryId).map((p) => p.id);
    return this.priceRecords
      .filter((r) => categoryProducts.includes(r.productId) && (includeInactive || r.isActive !== false))
      .map((r) => this.hydratePriceRecord(r));
  }

  getPriceRecordsForSource(sourceId: string, includeInactive: boolean = false): PriceRecord[] {
    return this.priceRecords
      .filter((r) => r.sourceId === sourceId && (includeInactive || r.isActive !== false))
      .map((r) => this.hydratePriceRecord(r));
  }

  getPriceHistory(productId: string): PriceRecord[] {
    return this.priceRecords
      .filter((r) => r.productId === productId)
      .map((r) => this.hydratePriceRecord(r))
      .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
  }

  detectPriceConflicts(productId: string): PriceConflict {
    const records = this.getPriceRecordsForProduct(productId, false);
    const product = this.findProductById(productId);
    const productTitle = product ? product.title : 'Unknown Product';

    if (records.length < 2) {
      return {
        productId,
        productTitle,
        hasConflict: false,
        minPrice: records[0]?.price || 0,
        maxPrice: records[0]?.price || 0,
        discrepancyPercentage: 0,
        conflictingRecords: records,
        summaryNote: 'Single source available or no active price observations.',
      };
    }

    const prices = records.map((r) => r.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const discrepancyPercentage = minPrice > 0 ? Math.round(((maxPrice - minPrice) / minPrice) * 100) : 0;
    const hasConflict = discrepancyPercentage >= 25; // Conflict threshold >= 25% discrepancy

    return {
      productId,
      productTitle,
      hasConflict,
      minPrice,
      maxPrice,
      discrepancyPercentage,
      conflictingRecords: records,
      summaryNote: hasConflict
        ? `Discrepancy of ${discrepancyPercentage}% observed between conflicting sources for ${productTitle}.`
        : `Consistent pricing across ${records.length} active sources.`,
    };
  }

  getCoverageStats(): CoverageStats {
    const activeRecords = this.priceRecords.filter((r) => r.isActive !== false);
    const verifiedSourcesCount = this.sources.filter((s) => s.reliabilityScore >= 0.8).length;

    const regionsSet = new Set<string>();
    this.locations.forEach((loc) => {
      if (loc.city) regionsSet.add(loc.city);
    });

    const regionsCovered = Array.from(regionsSet);

    return {
      totalProducts: this.products.length,
      totalPriceRecords: this.priceRecords.length,
      activeRecords: activeRecords.length,
      verifiedSourcesCount,
      regionsCovered,
      coverageBadgeText: `Verified prices available in ${verifiedSourcesCount} sources / ${regionsCovered.length} regions.`,
    };
  }

  private hydratePriceRecord(r: PriceRecord): PriceRecord {
    const product = this.products.find((p) => p.id === r.productId);
    const venue = this.venues.find((v) => v.id === r.venueId);
    const source = this.sources.find((s) => s.id === r.sourceId);
    const seller = this.sellers.find((s) => s.id === r.sellerId);
    return {
      ...r,
      unit: r.unit || 'unit',
      retrievedAt: r.retrievedAt || r.observedAt || new Date().toISOString(),
      isActive: r.isActive !== false,
      product,
      venue,
      source,
      seller,
    };
  }

  findTransportFares(originQuery: string, destQuery: string): { routes: TransportRoute[]; fares: TransportFare[] } {
    const orig = originQuery.toLowerCase().trim();
    const dest = destQuery.toLowerCase().trim();

    const matchedRoutes = this.transportRoutes.filter((r) => {
      const matchOrig = !orig || r.originName.toLowerCase().includes(orig) || r.name.toLowerCase().includes(orig);
      const matchDest = !dest || r.destinationName.toLowerCase().includes(dest) || r.name.toLowerCase().includes(dest);
      return matchOrig && matchDest;
    });

    const routeIds = matchedRoutes.map((r) => r.id);
    const fares = this.transportFares
      .filter((f) => routeIds.includes(f.routeId))
      .map((f) => ({
        ...f,
        route: this.transportRoutes.find((r) => r.id === f.routeId),
        source: this.sources.find((s) => s.id === f.sourceId),
      }));

    return { routes: matchedRoutes, fares };
  }

  addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.unshift(newProduct);
    return newProduct;
  }

  addSeller(sellerData: Omit<Seller, 'id'>): Seller {
    const newSeller: Seller = {
      ...sellerData,
      id: `sel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.sellers.unshift(newSeller);
    return newSeller;
  }

  addSource(sourceData: Omit<Source, 'id'>): Source {
    const newSource: Source = {
      ...sourceData,
      id: `src_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      retrievedAt: sourceData.retrievedAt || new Date().toISOString(),
    };
    this.sources.unshift(newSource);
    return newSource;
  }

  addPriceRecord(record: Omit<PriceRecord, 'id'>): PriceRecord {
    const newRecord: PriceRecord = {
      ...record,
      id: `pr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      unit: record.unit || 'unit',
      retrievedAt: record.retrievedAt || new Date().toISOString(),
      isActive: record.isActive !== false,
    };
    this.priceRecords.unshift(newRecord);
    return this.hydratePriceRecord(newRecord);
  }

  toggleRecordActiveStatus(id: string, isActive: boolean): PriceRecord | undefined {
    const rec = this.priceRecords.find((r) => r.id === id);
    if (!rec) return undefined;
    rec.isActive = isActive;
    return this.hydratePriceRecord(rec);
  }

  updateRecordNormalization(id: string, updates: Partial<PriceRecord>): PriceRecord | undefined {
    const idx = this.priceRecords.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.priceRecords[idx] = {
      ...this.priceRecords[idx],
      ...updates,
    };
    return this.hydratePriceRecord(this.priceRecords[idx]);
  }

  parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    
    return lines.slice(1).map((line) => {
      if (!line.trim()) return null;
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] !== undefined ? values[i] : '';
      });
      return obj;
    }).filter(Boolean);
  }

  ingestBatch(records: any[]): { successCount: number; errors: string[] } {
    let successCount = 0;
    const errors: string[] = [];

    records.forEach((rec, idx) => {
      try {
        const productTitle = rec.productTitle || rec.product_title || rec.product;
        if (!productTitle) {
          throw new Error('Missing product title');
        }

        const price = parseFloat(rec.price);
        if (isNaN(price)) {
          throw new Error(`Invalid price value: ${rec.price}`);
        }

        // Match or create product
        let prod = this.products.find(
          (p) => p.title.toLowerCase() === productTitle.toLowerCase()
        );
        if (!prod) {
          prod = this.addProduct({
            title: productTitle,
            categoryId: rec.categoryId || rec.category_id || 'cat_food',
            description: rec.description,
            tags: rec.tags ? rec.tags.split(';') : undefined,
          });
        }

        // Match or create venue
        const venueName = rec.venueName || rec.venue_name || rec.seller || 'Standard Retailer';
        let venue = this.venues.find(
          (v) => v.name.toLowerCase() === venueName.toLowerCase()
        );
        if (!venue) {
          venue = {
            id: `ven_${Date.now()}_${idx}`,
            name: venueName,
            locationId: 'loc_thamel',
            venueTypeId: 'vt_shop',
            venueCategory: rec.venueCategory || 'tourist_shop',
          };
          this.venues.push(venue);
        }

        // Match or create source
        const sourceName = rec.sourceName || rec.source_name || rec.source || 'Verified Audit';
        let source = this.sources.find(
          (s) => s.name.toLowerCase() === sourceName.toLowerCase()
        );
        if (!source) {
          source = this.addSource({
            name: sourceName,
            url: rec.sourceUrl || rec.source_url,
            sourceType: rec.sourceType || rec.source_type || 'retailer_menu',
            reliabilityScore: parseFloat(rec.reliabilityScore || '0.8') || 0.8,
            retrievedAt: rec.retrievedAt || rec.retrieved_at || new Date().toISOString(),
          });
        }

        this.addPriceRecord({
          productId: prod.id,
          venueId: venue.id,
          sourceId: source.id,
          price,
          currency: (rec.currency || 'NPR').toUpperCase() as any,
          unit: rec.unit || 'unit',
          priceType: rec.priceType || rec.price_type || 'retail',
          observedAt: rec.observedAt || rec.observed_at || rec.captured_at || new Date().toISOString(),
          retrievedAt: rec.retrievedAt || rec.retrieved_at || new Date().toISOString(),
          sourceUrl: rec.sourceUrl || rec.source_url || source.url,
          sourceQuality: parseInt(rec.sourceQuality || '4', 10) || 4,
          isActive: rec.isActive !== 'false' && rec.isActive !== false,
          notes: rec.notes,
        });

        successCount++;
      } catch (err: any) {
        errors.push(`Row ${idx + 1}: ${err.message}`);
      }
    });

    return { successCount, errors };
  }
}

export const db = new FairPriceRepository();
