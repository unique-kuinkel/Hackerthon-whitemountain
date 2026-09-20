'use client';

import { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, ExternalLink, ShieldCheck, MapPin, Tag } from 'lucide-react';
import { SEED_CATEGORIES } from '@fairprice/shared';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVenueType, setSelectedVenueType] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedVenueType) params.set('venueType', selectedVenueType);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [selectedCategory, selectedVenueType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSearchResults();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Search Source-Backed Prices</h1>
        <p className="text-sm text-slate-500">
          Search products, food menus, transport fares, SIM packs, and government fees across Nepal
        </p>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center bg-slate-50 rounded-xl border border-slate-300 p-1.5 focus-within:ring-2 focus-within:ring-emerald-500">
          <div className="pl-3 text-slate-400">
            <SearchIcon className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Wai Wai, momo, water, TIMS card, taxi fare, pashmina..."
            className="w-full px-3 py-2.5 bg-transparent text-slate-900 focus:outline-none text-sm"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Category Filter</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
            >
              <option value="">All Categories</option>
              {SEED_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Venue Category Filter</span>
            </label>
            <select
              value={selectedVenueType}
              onChange={(e) => setSelectedVenueType(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
            >
              <option value="">All Venue Types</option>
              <option value="local_eatery">Local Eatery</option>
              <option value="restaurant">Tourist Restaurant</option>
              <option value="hotel">Hotel Dining</option>
              <option value="supermarket">Supermarket</option>
              <option value="tourist_shop">Tourist Shop / Market</option>
              <option value="government">Government Counter</option>
            </select>
          </div>
        </div>
      </form>

      {/* Results Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Searching verified prices...</div>
      ) : items.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
          <p className="font-bold text-slate-700">No items match your search criteria</p>
          <p className="text-xs text-slate-500">Try clearing your filters or searching for "momo" or "Wai Wai".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, idx) => {
            const { product, comparison } = item;
            return (
              <div
                key={product.id || idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                      {product.tags?.[0] || 'Verified Product'}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900 mt-1">{product.title}</h3>
                    {product.description && <p className="text-xs text-slate-500">{product.description}</p>}
                  </div>
                </div>

                {/* Price Metrics Summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Official Reference</span>
                    <span className="text-base font-bold text-slate-900">
                      {comparison.officialReference ? `NPR ${comparison.officialReference}` : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Observed Range</span>
                    <span className="text-base font-bold text-slate-900">
                      {comparison.minObserved !== undefined
                        ? `NPR ${comparison.minObserved} – ${comparison.maxObserved}`
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Records list */}
                <div className="space-y-2 border-t pt-3 border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Price Observations ({comparison.sourceCount})</span>
                  </span>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {comparison.records.map((r: any) => (
                      <div key={r.id} className="flex justify-between items-center text-[11px] bg-slate-50 p-2 rounded">
                        <div>
                          <span className="font-semibold text-slate-800">{r.venue?.name || r.priceType}</span>
                          <span className="text-slate-400 block">{r.priceType} &bull; {r.observedAt.split('T')[0]}</span>
                        </div>
                        <span className="font-extrabold text-slate-900">NPR {r.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
