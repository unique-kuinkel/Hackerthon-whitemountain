'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  History,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { PriceRecord, Product, Seller, Source, CoverageStats } from '@fairprice/shared';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'review' | 'add' | 'history'>('import');

  // Datasets state
  const [records, setRecords] = useState<PriceRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [coverageStats, setCoverageStats] = useState<CoverageStats | null>(null);

  // Import state
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('csv');
  const [rawInput, setRawInput] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Review & Normalization state
  const [reviewSearch, setReviewSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editUnit, setEditUnit] = useState<string>('');
  const [editPriceType, setEditPriceType] = useState<string>('');

  // Manual Add state
  const [addType, setAddType] = useState<'product' | 'seller' | 'source'>('product');
  const [prodTitle, setProdTitle] = useState('');
  const [prodCategory, setProdCategory] = useState('cat_food');
  const [prodDesc, setProdDesc] = useState('');
  
  const [sellerName, setSellerName] = useState('');
  const [sellerContact, setSellerContact] = useState('');

  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceType, setSourceType] = useState('official_gov');
  const [sourceQuality, setSourceQuality] = useState('1.0');

  const [addStatus, setAddStatus] = useState<string | null>(null);

  // History state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productHistory, setProductHistory] = useState<PriceRecord[]>([]);

  // Fetch admin records on load
  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/records?includeInactive=true');
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setProducts(data.products || []);
        setSources(data.sources || []);
        setSellers(data.sellers || []);
        setCoverageStats(data.coverageStats || null);
        if (data.products && data.products.length > 0 && !selectedProductId) {
          setSelectedProductId(data.products[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Fetch history when product changes
  useEffect(() => {
    if (!selectedProductId) return;
    fetch(`/api/prices/history?productId=${selectedProductId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProductHistory(data.history || []);
        }
      });
  }, [selectedProductId]);

  // Sample CSV & JSON templates
  const sampleCsv = `productTitle,price,currency,unit,priceType,venueName,sourceName,sourceUrl,sourceQuality,observedAt
Steamed Buff Momo,140,NPR,plate,restaurant_menu,Asan Momo Hub,Tourist Association Audit 2026,https://kvta.org.np,4,2026-09-18T12:00:00Z
Wai Wai Noodle 75g,20,NPR,packet,official_mrp,Bhat-Bhateni Supermarket,CG Foods Official,https://cgfoods.com,5,2026-09-15T09:00:00Z`;

  const sampleJson = [
    {
      productTitle: '100% Cashmere Pashmina Shawl',
      price: 3500,
      currency: 'NPR',
      unit: 'piece',
      priceType: 'retail',
      venueName: 'Thamel Handicraft Emporium',
      sourceName: 'Thamel Tourist Market Audit',
      sourceUrl: 'https://kvta.org.np',
      sourceQuality: 4,
      observedAt: '2026-09-19T11:00:00Z',
    },
  ];

  // Handle Import Submit
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportLoading(true);
    setImportResult(null);

    try {
      const bodyPayload =
        importFormat === 'csv'
          ? { format: 'csv', data: rawInput }
          : { format: 'json', data: JSON.parse(rawInput) };

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      setImportResult(data);
      if (data.success) {
        fetchAdminData();
      }
    } catch (err: any) {
      setImportResult({ success: false, error: err.message || 'Invalid format or import failure' });
    } finally {
      setImportLoading(false);
    }
  };

  // Toggle record active/inactive
  const toggleActiveStatus = async (recordId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/records/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRecords((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, isActive: !currentStatus } : r))
        );
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to update record status');
    }
  };

  // Save normalization edit
  const saveNormalizationEdit = async (recordId: string) => {
    try {
      const updates: any = {};
      if (editPrice) updates.price = parseFloat(editPrice);
      if (editUnit) updates.unit = editUnit;
      if (editPriceType) updates.priceType = editPriceType;

      const res = await fetch(`/api/admin/records/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (data.success) {
        setRecords((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, ...data.record } : r))
        );
        setEditingRecordId(null);
      }
    } catch (err) {
      alert('Failed to save normalization edit');
    }
  };

  // Manual Add submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStatus(null);
    let endpoint = '';
    let payload = {};

    if (addType === 'product') {
      endpoint = '/api/admin/products';
      payload = { title: prodTitle, categoryId: prodCategory, description: prodDesc };
    } else if (addType === 'seller') {
      endpoint = '/api/admin/sellers';
      payload = { name: sellerName, contactInfo: sellerContact };
    } else {
      endpoint = '/api/admin/sources';
      payload = { name: sourceName, url: sourceUrl, sourceType, reliabilityScore: parseFloat(sourceQuality) };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setAddStatus(`Successfully created ${addType}!`);
        setProdTitle('');
        setProdDesc('');
        setSellerName('');
        setSellerContact('');
        setSourceName('');
        setSourceUrl('');
        fetchAdminData();
      } else {
        setAddStatus(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setAddStatus(`Error: ${err.message}`);
    }
  };

  // Filtered records for Review
  const filteredRecords = records.filter((r) => {
    const titleMatch =
      r.product?.title.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.source?.name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.venue?.name.toLowerCase().includes(reviewSearch.toLowerCase());

    if (!titleMatch) return false;
    if (filterActive === 'active') return r.isActive !== false;
    if (filterActive === 'inactive') return r.isActive === false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Coverage Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-emerald-400 font-bold">
            FairPrice Nepal Admin Portal
          </span>
          <h1 className="text-3xl font-black mt-1">Source-Backed Price Data System</h1>
          <p className="text-sm text-slate-300 mt-1">
            Zero-hallucination ingestion, conflict resolution, active status toggling & normalization engine.
          </p>
        </div>

        {coverageStats && (
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1 min-w-[240px]">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Coverage Indicator</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {coverageStats.coverageBadgeText}
            </p>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
              <span>{coverageStats.totalProducts} Products</span>
              <span>{coverageStats.activeRecords} Active Records</span>
              <span>{coverageStats.verifiedSourcesCount} Sources</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'import'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Batch Data Import (CSV/JSON)</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'review'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Review & Normalization ({records.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'add'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add Product / Seller / Source</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historical Inspector</span>
        </button>
      </div>

      {/* TAB 1: CSV / JSON BATCH IMPORT */}
      {activeTab === 'import' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-emerald-600" />
                <span>Import Source-Backed Price Benchmarks</span>
              </h2>
              <p className="text-xs text-slate-500">
                Supports CSV format or JSON structure with strict mandatory fields validation.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setImportFormat('csv');
                  setRawInput(sampleCsv);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  importFormat === 'csv' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                CSV Format
              </button>
              <button
                onClick={() => {
                  setImportFormat('json');
                  setRawInput(JSON.stringify(sampleJson, null, 2));
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  importFormat === 'json' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                JSON Format
              </button>
            </div>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Paste Raw Data ({importFormat.toUpperCase()})
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={12}
                placeholder={`Paste your verified ${importFormat.toUpperCase()} price records here...`}
                className="w-full p-4 border border-slate-300 rounded-2xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-950 text-emerald-400"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() =>
                  setRawInput(importFormat === 'csv' ? sampleCsv : JSON.stringify(sampleJson, null, 2))
                }
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Load Sample Benchmark Dataset
              </button>

              <button
                type="submit"
                disabled={importLoading || !rawInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{importLoading ? 'Ingesting Batch...' : 'Import Dataset Batch'}</span>
              </button>
            </div>
          </form>

          {importResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                importResult.success
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-red-50 text-red-900 border-red-200'
              }`}
            >
              <div className="flex items-center space-x-2 font-bold text-sm">
                {importResult.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Successfully Ingested {importResult.successCount} Price Records!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>Import Failed: {importResult.error}</span>
                  </>
                )}
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="pt-2 text-red-700 border-t border-red-200 space-y-1">
                  <p className="font-bold">Validation Warnings / Errors:</p>
                  {importResult.errors.map((err: string, idx: number) => (
                    <p key={idx}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REVIEW & NORMALIZATION */}
      {activeTab === 'review' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Review & Normalization Dashboard</h2>
              <p className="text-xs text-slate-500">
                Mark price records active/inactive, correct units or pricing types, and inspect source metadata.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                />
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFilterActive('all')}
                  className={`px-3 py-1 rounded-lg ${
                    filterActive === 'all' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  All ({records.length})
                </button>
                <button
                  onClick={() => setFilterActive('active')}
                  className={`px-3 py-1 rounded-lg ${
                    filterActive === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterActive('inactive')}
                  className={`px-3 py-1 rounded-lg ${
                    filterActive === 'inactive' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4">Price & Unit</th>
                  <th className="py-3 px-4">Price Type</th>
                  <th className="py-3 px-4">Source & Quality</th>
                  <th className="py-3 px-4">Observed At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.map((r) => {
                  const isEditing = editingRecordId === r.id;
                  const isActive = r.isActive !== false;

                  return (
                    <tr key={r.id} className={!isActive ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/50'}>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleActiveStatus(r.id, isActive)}
                          className={`flex items-center space-x-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{r.product?.title || 'Unlinked Item'}</p>
                        <p className="text-[11px] text-slate-400">{r.venue?.name || 'Standard Retailer'}</p>
                      </td>

                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-16 p-1 border rounded text-xs font-mono font-bold"
                            />
                            <input
                              type="text"
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value)}
                              className="w-14 p-1 border rounded text-xs"
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-700 font-mono text-sm">
                            {r.currency} {r.price} <span className="text-xs font-normal text-slate-500">/ {r.unit}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editPriceType}
                            onChange={(e) => setEditPriceType(e.target.value)}
                            className="w-28 p-1 border rounded text-xs font-mono"
                          />
                        ) : (
                          <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">
                            {r.priceType}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{r.source?.name || 'Verified Source'}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                          <span className="font-bold text-emerald-600">Q Score: {r.sourceQuality}/5</span>
                          {r.sourceUrl && (
                            <a
                              href={r.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-600 hover:underline"
                            >
                              [Link]
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(r.observedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => saveNormalizationEdit(r.id)}
                              className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded text-[11px]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingRecordId(null)}
                              className="bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingRecordId(r.id);
                              setEditPrice(r.price.toString());
                              setEditUnit(r.unit || 'unit');
                              setEditPriceType(r.priceType);
                            }}
                            className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-slate-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL ADMIN ENTRY (PRODUCTS / SELLERS / SOURCES) */}
      {activeTab === 'add' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-4 border-b pb-4 border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Manual Entry Form</h2>
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setAddType('product')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  addType === 'product' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Add Product
              </button>
              <button
                onClick={() => setAddType('seller')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  addType === 'seller' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Add Seller/Provider
              </button>
              <button
                onClick={() => setAddType('source')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  addType === 'source' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Add Source
              </button>
            </div>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4 max-w-xl">
            {addType === 'product' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    placeholder="e.g. Traditional Nepali Khukuri (10-inch Craft)"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="cat_food">Food & Meals</option>
                    <option value="cat_transport">Transport</option>
                    <option value="cat_accommodation">Accommodation</option>
                    <option value="cat_trekking">Trekking & Gear</option>
                    <option value="cat_shopping">Shopping & Goods</option>
                    <option value="cat_communication">Communication</option>
                    <option value="cat_services">Services</option>
                    <option value="cat_activities">Activities & Adventure</option>
                    <option value="cat_permits">Government Fees & Permits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    rows={3}
                    placeholder="Product specifications or benchmark details..."
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}

            {addType === 'seller' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seller / Provider Name *</label>
                  <input
                    type="text"
                    required
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="e.g. Himalayan Paragliding Club Pokhara"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Info / Address</label>
                  <input
                    type="text"
                    value={sellerContact}
                    onChange={(e) => setSellerContact(e.target.value)}
                    placeholder="e.g. Lakeside 6, Pokhara | +977-61-520000"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}

            {addType === 'source' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Name *</label>
                  <input
                    type="text"
                    required
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="e.g. Civil Aviation Authority Tariff Gazette"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source URL</label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://official-government-source.gov.np"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Source Type</label>
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="official_gov">Official Government (5/5)</option>
                      <option value="official_provider">Official Provider (4.5/5)</option>
                      <option value="retailer_menu">Retailer / Menu (4/5)</option>
                      <option value="marketplace">Marketplace (3/5)</option>
                      <option value="community">Community (2/5)</option>
                      <option value="estimate">Estimate (1/5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reliability Score (0-1.0)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1.0"
                      value={sourceQuality}
                      onChange={(e) => setSourceQuality(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create {addType.toUpperCase()} Record</span>
            </button>

            {addStatus && (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                {addStatus}
              </p>
            )}
          </form>
        </div>
      )}

      {/* TAB 4: HISTORICAL INSPECTOR */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-emerald-600" />
                <span>Historical Price Inspector</span>
              </h2>
              <p className="text-xs text-slate-500">
                Inspect historical observation series chronologically for any verified item in Nepal.
              </p>
            </div>

            <div className="w-72">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Select Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {productHistory.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="font-bold text-slate-900 text-sm">
                  Historical Timeline Series for {products.find((p) => p.id === selectedProductId)?.title}
                </p>
                <p className="text-xs text-slate-500">
                  Total observations recorded: {productHistory.length}
                </p>
              </div>

              <div className="relative border-l-2 border-emerald-500 ml-4 pl-6 space-y-6">
                {productHistory.map((hist, idx) => (
                  <div key={hist.id} className="relative bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow" />
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-lg font-black text-emerald-700">
                          {hist.currency} {hist.price}
                        </span>
                        <span className="text-xs text-slate-500 font-normal"> / {hist.unit}</span>
                      </div>
                      <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                        {hist.priceType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 pt-1 space-y-0.5">
                      <p className="font-bold text-slate-800">Source: {hist.source?.name || 'Verified Source'}</p>
                      <p className="text-[11px] text-slate-500">Venue: {hist.venue?.name || 'Standard Retailer'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Observed At: {new Date(hist.observedAt).toLocaleString()}
                      </p>
                      {hist.notes && (
                        <p className="text-[11px] text-emerald-800 italic bg-emerald-50/50 p-2 rounded-lg mt-2">
                          "{hist.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic py-8 text-center">
              No historical price entries recorded for this product yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
