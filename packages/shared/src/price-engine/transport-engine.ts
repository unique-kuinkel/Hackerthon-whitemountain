import { TransportFare, TransportQueryResult, TransportRoute } from '../types/index';

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function evaluateTransportQuery(params: {
  origin: string;
  destination: string;
  queryDate?: string;
  queryTime?: string;
  routes: TransportRoute[];
  fares: TransportFare[];
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
}): TransportQueryResult {
  const { origin, destination, queryDate, queryTime, routes, fares, originLat, originLng, destLat, destLng } = params;

  const origTrim = origin.trim().toLowerCase();
  const destTrim = destination.trim().toLowerCase();

  // 1. Same Origin / Destination Check
  if (origTrim && destTrim && origTrim === destTrim) {
    return {
      origin,
      destination,
      queryDate,
      queryTime,
      distanceKm: 0,
      estimatedDurationMins: 0,
      fares: [],
      status: 'SAME_ORIGIN_DESTINATION',
      statusMessage: 'Origin and destination are identical. Please specify different departure and arrival locations.',
    };
  }

  // 2. Invalid Coordinates Check
  if (
    (originLat !== undefined && (isNaN(originLat) || Math.abs(originLat) > 90)) ||
    (originLng !== undefined && (isNaN(originLng) || Math.abs(originLng) > 180)) ||
    (destLat !== undefined && (isNaN(destLat) || Math.abs(destLat) > 90)) ||
    (destLng !== undefined && (isNaN(destLng) || Math.abs(destLng) > 180))
  ) {
    return {
      origin,
      destination,
      queryDate,
      queryTime,
      distanceKm: 0,
      estimatedDurationMins: 0,
      fares: [],
      status: 'INVALID_COORDINATES',
      statusMessage: 'Invalid geographic latitude/longitude coordinates provided.',
    };
  }

  // 3. Find Route Match
  const matchedRoute = routes.find((r) => {
    const matchOrig = r.originName.toLowerCase().includes(origTrim) || r.name.toLowerCase().includes(origTrim);
    const matchDest = r.destinationName.toLowerCase().includes(destTrim) || r.name.toLowerCase().includes(destTrim);
    return matchOrig && matchDest;
  });

  // Calculate Distance
  let distanceKm = matchedRoute ? matchedRoute.distanceKm : 0;
  let estimatedDurationMins = matchedRoute ? matchedRoute.estimatedDurationMins : 0;

  if (originLat !== undefined && originLng !== undefined && destLat !== undefined && destLng !== undefined) {
    distanceKm = calculateHaversineDistance(originLat, originLng, destLat, destLng);
    estimatedDurationMins = Math.round((distanceKm / 25) * 60); // Assume 25 km/h average speed in Nepal terrain
  }

  // 4. Filter Fares for Matched Route
  const routeFares = matchedRoute
    ? fares.filter((f) => f.routeId === matchedRoute.id)
    : fares.filter((f) => {
        const r = f.route;
        if (!r) return false;
        return (
          (r.originName.toLowerCase().includes(origTrim) || r.name.toLowerCase().includes(origTrim)) &&
          (r.destinationName.toLowerCase().includes(destTrim) || r.name.toLowerCase().includes(destTrim))
        );
      });

  const warnings: string[] = [];

  // Check stale fares (> 365 days old)
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const staleCount = routeFares.filter((f) => new Date(f.observedAt).getTime() < oneYearAgo).length;
  if (staleCount > 0) {
    warnings.push(`${staleCount} transport record(s) are older than 12 months. Verify current tariff at terminal.`);
  }

  if (routeFares.length === 0) {
    return {
      route: matchedRoute,
      origin,
      destination,
      queryDate,
      queryTime,
      distanceKm,
      estimatedDurationMins,
      fares: [],
      status: 'NO_FARES_FOUND',
      statusMessage: `No verified transport fare data available for trip from ${origin} to ${destination}.`,
      warnings,
    };
  }

  return {
    route: matchedRoute,
    origin,
    destination,
    queryDate,
    queryTime,
    distanceKm,
    estimatedDurationMins,
    fares: routeFares,
    status: 'FOUND',
    statusMessage: `Found ${routeFares.length} verified transport fare option(s) for trip from ${origin} to ${destination}.`,
    warnings,
  };
}
