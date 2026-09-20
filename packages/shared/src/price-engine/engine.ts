import { Category, ComparisonStatus, PriceComparisonSummary, PriceRecord, Product, VenueCategory } from '../types/index';

export interface PriceEngineParams {
  userPrice?: number;
  product?: Product;
  category?: Category;
  records: PriceRecord[];
  targetVenueCategory?: VenueCategory;
}

export function evaluatePriceComparison(params: PriceEngineParams): PriceComparisonSummary {
  const { userPrice, product, category, records, targetVenueCategory } = params;

  // Filter records by venue category if provided and relevant
  let filteredRecords = records;
  if (targetVenueCategory) {
    const venueSpecific = records.filter(
      (r) => r.venue?.venueCategory === targetVenueCategory
    );
    if (venueSpecific.length > 0) {
      filteredRecords = venueSpecific;
    }
  }

  if (!filteredRecords || filteredRecords.length === 0) {
    return {
      status: 'INSUFFICIENT_DATA',
      statusMessage: 'No verified price records available for this item in database.',
      userPrice,
      sourceCount: 0,
      sourceQualityScore: 0,
      records: [],
      matchedProduct: product,
      matchedCategory: category,
    };
  }

  // Identify official MRP or Tariff
  const officialRecord = filteredRecords.find(
    (r) => r.priceType === 'official_mrp' || r.priceType === 'official_tariff'
  );
  const officialReference = officialRecord ? officialRecord.price : undefined;
  const officialSourceUrl = officialRecord ? officialRecord.sourceUrl || officialRecord.source?.url : undefined;
  const officialSourceName = officialRecord ? officialRecord.source?.name || 'Official Government / Packaging MRP' : undefined;

  // Compute numerical statistics
  const prices = filteredRecords.map((r) => r.price).sort((a, b) => a - b);
  const minObserved = Math.min(...prices);
  const maxObserved = Math.max(...prices);
  
  const mid = Math.floor(prices.length / 2);
  const medianObserved =
    prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;

  // Calculate overall source quality and freshness
  const totalQuality = filteredRecords.reduce((acc, r) => acc + (r.sourceQuality || 3), 0);
  const sourceQualityScore = Math.round((totalQuality / filteredRecords.length) * 10) / 10;

  const dates = filteredRecords
    .map((r) => new Date(r.observedAt).getTime())
    .filter((t) => !isNaN(t));
  const latestTimestamp = dates.length > 0 ? Math.max(...dates) : Date.now();
  const freshnessDate = new Date(latestTimestamp).toISOString().split('T')[0];

  // Check if records consist purely of provider quotes
  const allProviderQuotes = filteredRecords.every((r) => r.priceType === 'provider_quote');

  let status: ComparisonStatus = 'WITHIN_OBSERVED_RANGE';
  let statusMessage = 'Price is within verified market range.';

  if (userPrice !== undefined && userPrice !== null) {
    if (officialReference !== undefined) {
      if (Math.abs(userPrice - officialReference) <= 0.01) {
        status = 'MATCHES_OFFICIAL_PRICE';
        statusMessage = `Matches official MRP/tariff of NPR ${officialReference.toLocaleString()}.`;
      } else if (userPrice > officialReference) {
        status = 'DIFFERS_FROM_OFFICIAL_PRICE';
        statusMessage = `Price of NPR ${userPrice.toLocaleString()} is higher than official reference of NPR ${officialReference.toLocaleString()}.`;
      } else {
        status = 'BELOW_OBSERVED_RANGE';
        statusMessage = `Price of NPR ${userPrice.toLocaleString()} is below official reference of NPR ${officialReference.toLocaleString()}.`;
      }
    } else if (allProviderQuotes) {
      status = 'PROVIDER_QUOTE_ONLY';
      statusMessage = 'Compared against verified provider quotes. No official government tariff exists.';
    } else {
      if (userPrice > maxObserved * 1.05) {
        status = 'ABOVE_OBSERVED_RANGE';
        statusMessage = `Price of NPR ${userPrice.toLocaleString()} is above observed market range (NPR ${minObserved} - ${maxObserved}).`;
      } else if (userPrice < minObserved * 0.95) {
        status = 'BELOW_OBSERVED_RANGE';
        statusMessage = `Price of NPR ${userPrice.toLocaleString()} is below observed market range (NPR ${minObserved} - ${maxObserved}).`;
      } else {
        status = 'WITHIN_OBSERVED_RANGE';
        statusMessage = `Price of NPR ${userPrice.toLocaleString()} is within observed market range (NPR ${minObserved} - ${maxObserved}).`;
      }
    }
  } else {
    // If no user price provided, summarize market status
    if (officialReference !== undefined) {
      status = 'MATCHES_OFFICIAL_PRICE';
      statusMessage = `Official MRP/Tariff: NPR ${officialReference.toLocaleString()}. Market range: NPR ${minObserved} - ${maxObserved}.`;
    } else if (allProviderQuotes) {
      status = 'PROVIDER_QUOTE_ONLY';
      statusMessage = `Verified provider quotes range from NPR ${minObserved} to ${maxObserved}.`;
    } else {
      status = 'WITHIN_OBSERVED_RANGE';
      statusMessage = `Verified market range: NPR ${minObserved} to ${maxObserved}.`;
    }
  }

  return {
    status,
    statusMessage,
    userPrice,
    officialReference,
    officialSourceUrl,
    officialSourceName,
    minObserved,
    maxObserved,
    medianObserved,
    sourceCount: filteredRecords.length,
    freshnessDate,
    sourceQualityScore,
    records: filteredRecords,
    matchedProduct: product,
    matchedCategory: category,
  };
}

export function evaluatePrice(userPrice: number, records: PriceRecord[]): PriceComparisonSummary {
  const summary = evaluatePriceComparison({ userPrice, records });

  // Add conflict detection if discrepancy is >= 25%
  if (records && records.length >= 2) {
    const prices = records.map((r) => r.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const discrepancyPercentage = minPrice > 0 ? Math.round(((maxPrice - minPrice) / minPrice) * 100) : 0;
    
    summary.conflict = {
      productId: records[0]?.productId || 'unknown',
      productTitle: records[0]?.product?.title || 'Product',
      hasConflict: discrepancyPercentage >= 25,
      minPrice,
      maxPrice,
      discrepancyPercentage,
      conflictingRecords: records,
      summaryNote: discrepancyPercentage >= 25
        ? `Discrepancy of ${discrepancyPercentage}% observed between conflicting price sources.`
        : `Consistent pricing across ${records.length} active sources.`,
    };
  }

  return summary;
}

