import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, ShieldCheck, MapPin, Calendar, ArrowLeft, Building2, Tag } from 'lucide-react';
import { SEED_SOURCES, SEED_PRICE_RECORDS, SEED_PRODUCTS, SEED_VENUES } from '@fairprice/shared';

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const source = SEED_SOURCES.find((s) => s.id === id);

  if (!source) {
    notFound();
  }

  // Linked price observations
  const linkedRecords = SEED_PRICE_RECORDS.filter((r) => r.sourceId === id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/sources"
          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sources Directory</span>
        </Link>
      </div>

      {/* Source Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
                {source.sourceType}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Reliability Score: {(source.reliabilityScore * 100).toFixed(0)}%
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">{source.name}</h1>
          </div>

          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <span>Visit Official Source URL</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {source.retrievedAt && (
          <p className="text-xs text-slate-500 font-mono pt-2 border-t border-slate-100">
            Retrieved / Verified Timestamp: {new Date(source.retrievedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Linked Observations */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Observed Prices Grounded in this Source ({linkedRecords.length})</span>
        </h2>

        {linkedRecords.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No active direct observations linked to this source ID in current view.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {linkedRecords.map((r) => {
              const product = SEED_PRODUCTS.find((p) => p.id === r.productId);
              const venue = SEED_VENUES.find((v) => v.id === r.venueId);

              return (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{product?.title || 'Verified Item'}</h3>
                      {venue && (
                        <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Venue / Seller: {venue.name} ({venue.address || 'Local Hub'})</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-700 font-mono">
                        {r.currency} {r.price}
                      </span>
                      <span className="text-xs text-slate-500 font-normal"> / {r.unit || 'unit'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Price Type: {r.priceType}
                    </span>

                    <span className="flex items-center space-x-1 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Observed: {r.observedAt.split('T')[0]}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
