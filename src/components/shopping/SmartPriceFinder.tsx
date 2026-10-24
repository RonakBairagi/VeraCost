import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Barcode, 
  Image as ImageIcon, 
  Link2, 
  PlusCircle, 
  SlidersHorizontal, 
  TrendingDown, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ArrowRight, 
  Copy, 
  Trash2, 
  Download, 
  Printer, 
  RefreshCw,
  Bell,
  Sparkles,
  ShoppingBag,
  Store,
  ChevronDown,
  Layers,
  ArrowUpDown,
  QrCode,
  Scissors
} from 'lucide-react';
import { 
  SearchedProduct, 
  RetailerListing, 
  RetailerId, 
  ProductSortOption, 
  PriceAlert, 
  ListingStatus 
} from '../../types/shopping';
import { ComparisonOption, ProductCategory } from '../../types/cost';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ImageSearchModal } from './ImageSearchModal';
import { ProductQrScannerModal } from './ProductQrScannerModal';
import { UrlSearchModal } from './UrlSearchModal';
import { PriceHistoryModal } from './PriceHistoryModal';
import { PriceAlertModal } from './PriceAlertModal';
import { RetailerStatusModal } from './RetailerStatusModal';
import { performClientCatalogSearch } from '../../utils/clientCatalogSearch';
import { inferProductCategory } from '../../engine/discovery';
import { cleanRetailerSearchQuery } from '../../../server/retailers/baseAdapter';

interface SmartPriceFinderProps {
  onImportToCalculator: (option: Partial<ComparisonOption>) => void;
  currentCurrency: string;
  onOpenScreenshotImport?: () => void;
}

const POPULAR_SEARCH_PRESETS = [
  'Apple iPhone 16 Pro 128GB',
  'Samsung Galaxy S24 Ultra 256GB',
  'Apple MacBook Pro 14" M3 512GB',
  'Sony WH-1000XM5 Headphones',
  'PlayStation 5 Slim Disc Edition',
];

export const SmartPriceFinder: React.FC<SmartPriceFinderProps> = ({
  onImportToCalculator,
  currentCurrency,
  onOpenScreenshotImport,
}) => {
  // Search & Products Session State
  const [searchInput, setSearchInput] = useState('Apple iPhone 16 Pro 128GB');
  const [products, setProducts] = useState<SearchedProduct[]>([]);
  const [activeProductIndex, setActiveProductIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Sorting & Filtering State
  const [sortBy, setSortBy] = useState<ProductSortOption>('lowest_checkout');
  const [filterInStockOnly, setFilterInStockOnly] = useState(false);
  const [filterExactOnly, setFilterExactOnly] = useState(false);
  const [selectedRetailerFilter, setSelectedRetailerFilter] = useState<RetailerId[]>([]);

  // Modals
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Watchlist stored in localStorage
  const [watchlist, setWatchlist] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('veracost_price_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('veracost_recent_searches');
      return saved ? JSON.parse(saved) : POPULAR_SEARCH_PRESETS.slice(0, 3);
    } catch {
      return POPULAR_SEARCH_PRESETS.slice(0, 3);
    }
  });

  // Initial search on mount if empty
  useEffect(() => {
    if (products.length === 0) {
      executeSearch('Apple iPhone 16 Pro 128GB');
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('veracost_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const executeSearch = async (queryText: string, barcode?: string, categoryHint?: ProductCategory) => {
    const q = queryText.trim();
    if (!q && !barcode) return;

    setIsSearching(true);
    setSearchError(null);

    let productResult: SearchedProduct | null = null;

    try {
      const resp = await fetch('/api/search/retailers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          barcode,
          category: categoryHint,
        }),
      });

      if (resp.ok) {
        productResult = await resp.json();
      } else {
        console.warn(`Backend retailer search returned HTTP ${resp.status}, utilizing verified benchmark catalog.`);
      }
    } catch (fetchErr: any) {
      console.warn('Network or proxy error during retailer search, utilizing verified benchmark catalog:', fetchErr);
    }

    // If server response is unavailable or returned empty listings, fall back to verified catalog
    if (!productResult || !productResult.listings || productResult.listings.length === 0) {
      try {
        productResult = performClientCatalogSearch(q, barcode, categoryHint);
      } catch (fallbackErr: any) {
        console.error('Client catalog search error:', fallbackErr);
      }
    }

    if (productResult) {
      if (categoryHint && categoryHint !== 'other') {
        productResult.category = categoryHint;
      } else if (!productResult.category || productResult.category === 'other' || productResult.category === 'electronics') {
        productResult.category = inferProductCategory(productResult.name, productResult.brand, categoryHint);
      }

      const finalProduct = productResult;
      setProducts((prev) => {
        // Replace or append
        const existingIdx = prev.findIndex((p) => p.name.toLowerCase() === finalProduct.name.toLowerCase());
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = finalProduct;
          setActiveProductIndex(existingIdx);
          return updated;
        } else {
          const updated = [...prev, finalProduct];
          setActiveProductIndex(updated.length - 1);
          return updated;
        }
      });

      if (q) saveRecentSearch(q);
    } else {
      setSearchError('No verified product listings or retailer portals found for this query. Please check spelling or enter product model manually.');
    }

    setIsSearching(false);
  };

  const handleAddSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      executeSearch(searchInput.trim());
    }
  };

  const handleRemoveProduct = (indexToRemove: number) => {
    setProducts((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (activeProductIndex >= updated.length) {
        setActiveProductIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleSaveAlert = (alert: PriceAlert) => {
    setWatchlist((prev) => {
      const updated = [alert, ...prev];
      try {
        localStorage.setItem('veracost_price_alerts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleExportCSV = () => {
    if (products.length === 0) return;

    const headers = ['Product', 'Brand', 'Model', 'Retailer', 'Listed Price', 'Delivery', 'Fees', 'Discount', 'Estimated Checkout', 'Status', 'Product URL'];
    const rows: string[][] = [];

    products.forEach((p) => {
      p.listings.forEach((l) => {
        rows.push([
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.brand}"`,
          `"${p.model}"`,
          `"${l.retailerName}"`,
          l.listedPrice.toString(),
          l.deliveryCharge.toString(),
          l.mandatoryFees.toString(),
          l.applicableDiscount.toString(),
          l.estimatedCheckoutCost.toString(),
          `"${l.status}"`,
          `"${l.directProductUrl || l.searchFallbackUrl}"`,
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VeraCost_Price_Comparison_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSafeRetailerUrl = (listing: RetailerListing): string => {
    // 1. Flipkart seller internal item IDs (/p/itm...) frequently expire or cycle, throwing 404 error pages
    // Using the clean verified search fallback guarantees Flipkart loads the active product listing with 100% reliability
    if (listing.retailerId === 'flipkart') {
      if (!listing.directProductUrl || listing.directProductUrl.includes('/p/itm')) {
        return listing.searchFallbackUrl || `https://www.flipkart.com/search?q=${encodeURIComponent(cleanRetailerSearchQuery(listing.productTitle || listing.model))}`;
      }
    }

    // 2. Amazon direct product pages frequently block requests with external referrers;
    // When direct link is missing or fallback requested, use clean verified search
    if (listing.retailerId === 'amazon-in') {
      if (!listing.directProductUrl) {
        return listing.searchFallbackUrl || `https://www.amazon.in/s?k=${encodeURIComponent(cleanRetailerSearchQuery(listing.productTitle || listing.model))}`;
      }
    }

    return listing.directProductUrl || listing.searchFallbackUrl;
  };

  const currentProduct = products[activeProductIndex];

  // Filtered & Sorted listings for active product
  const getProcessedListings = (product?: SearchedProduct) => {
    if (!product) return [];

    let list = [...product.listings];

    if (filterInStockOnly) {
      list = list.filter((l) => l.stockStatus !== 'out_of_stock');
    }

    if (filterExactOnly) {
      list = list.filter((l) => l.status === 'exact_match');
    }

    if (selectedRetailerFilter.length > 0) {
      list = list.filter((l) => selectedRetailerFilter.includes(l.retailerId));
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'lowest_checkout') {
        if (a.estimatedCheckoutCost === 0) return 1;
        if (b.estimatedCheckoutCost === 0) return -1;
        return a.estimatedCheckoutCost - b.estimatedCheckoutCost;
      }
      if (sortBy === 'lowest_listed') {
        if (a.listedPrice === 0) return 1;
        if (b.listedPrice === 0) return -1;
        return a.listedPrice - b.listedPrice;
      }
      if (sortBy === 'best_match') {
        return b.matchConfidence - a.matchConfidence;
      }
      if (sortBy === 'retailer_name') {
        return a.retailerName.localeCompare(b.retailerName);
      }
      return 0;
    });

    return list;
  };

  const processedListings = getProcessedListings(currentProduct);

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'exact_match':
        return <span className="status-chip verified"><CheckCircle2 size={12} /> Exact Match</span>;
      case 'possible_match':
        return <span className="status-chip alert"><AlertCircle size={12} /> Possible Match</span>;
      case 'out_of_stock':
        return <span className="status-chip missing">Out of Stock</span>;
      case 'unable_to_verify':
        return <span className="status-chip missing"><AlertCircle size={12} /> Unable to Verify</span>;
      case 'not_configured':
        return <span className="status-chip unverified"><Store size={12} /> Search Gateway</span>;
      default:
        return <span className="status-chip unverified">Unverified</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', minHeight: '85vh' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--teal-primary), var(--cyan-primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 16px var(--teal-glow)',
              }}
            >
              <ShoppingBag size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.9rem', lineHeight: 1.2 }}>Smart Price Finder</h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Multi-retailer price discovery, live barcode scanning, and direct bridge to lifetime TCO analysis
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsStatusModalOpen(true)}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
              title="Inspect Retailer API Gateways & Credentials"
            >
              <ShieldCheck size={14} style={{ color: 'var(--emerald-success)' }} />
              Retailer Gateways
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportCSV}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
              title="Download comparison table as CSV"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.print()}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
              title="Print comparison report"
            >
              <Printer size={14} />
              Print
            </button>
          </div>
        </div>

        {/* Input Bar & Discovery Tools */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            backdropFilter: 'var(--glass-blur)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <form onSubmit={handleAddSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', position: 'relative' }}>
              <input
                type="text"
                className="input-box"
                placeholder="Search any product, brand, or model number (e.g. iPhone 16 Pro, Galaxy S24 Ultra, PS5)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ paddingLeft: '2.5rem', height: '46px' }}
              />
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '14px',
                  color: 'var(--text-muted)',
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSearching || !searchInput.trim()}
              style={{ height: '46px', padding: '0 1.5rem', whiteSpace: 'nowrap' }}
            >
              <Search size={16} />
              {isSearching ? 'Searching Retailers...' : 'Find Best Offer'}
            </button>

            {/* Specialized Input Modals Triggers */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsBarcodeOpen(true)}
                title="Scan retail product barcode using device camera"
                style={{ height: '46px', padding: '0 1rem', fontSize: '0.85rem' }}
              >
                <Barcode size={16} style={{ color: 'var(--teal-bright)' }} />
                Scan Barcode
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsQrScannerOpen(true)}
                title="Scan product packaging or manual QR code"
                style={{ height: '46px', padding: '0 1rem', fontSize: '0.85rem' }}
              >
                <QrCode size={16} style={{ color: 'var(--cyan-primary)' }} />
                Scan Product QR
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsImageSearchOpen(true)}
                title="Identify product from photo using multimodal AI"
                style={{ height: '46px', padding: '0 1rem', fontSize: '0.85rem' }}
              >
                <ImageIcon size={16} style={{ color: 'var(--indigo-accent)' }} />
                Image Search
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsUrlModalOpen(true)}
                title="Paste Amazon, Flipkart, or Croma product URL"
                style={{ height: '46px', padding: '0 1rem', fontSize: '0.85rem' }}
              >
                <Link2 size={16} style={{ color: 'var(--cyan-bright)' }} />
                Paste URL
              </button>

              {onOpenScreenshotImport && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onOpenScreenshotImport}
                  title="Import product screenshot via clipboard paste (Ctrl+V) or drag-and-drop"
                  style={{ height: '46px', padding: '0 1rem', fontSize: '0.85rem' }}
                >
                  <Scissors size={16} style={{ color: 'var(--amber-warning)' }} />
                  Screenshot Import
                </button>
              )}
            </div>
          </form>

          {/* Quick Presets / Recent Searches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Quick Verified Searches:</span>
            {recentSearches.map((term, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSearchInput(term);
                  executeSearch(term);
                }}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.65rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {searchError && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--rose-danger)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.85rem' }}>{searchError}</span>
        </div>
      )}

      {/* Multi-Product Session Tray */}
      {products.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Comparison Tray ({products.length} {products.length === 1 ? 'Product' : 'Products Selected'})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click to inspect individual retailer offers or review multi-product matrix below
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {products.map((prod, index) => {
              const isActive = index === activeProductIndex;
              return (
                <div
                  key={prod.id}
                  onClick={() => setActiveProductIndex(index)}
                  style={{
                    background: isActive ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    border: `2px solid ${isActive ? 'var(--teal-bright)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: isActive ? '0 0 15px var(--teal-glow)' : 'var(--shadow-sm)',
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                  }}
                >
                  <img
                    src={prod.image}
                    alt={prod.name}
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {prod.brand} • {prod.variant || prod.model}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--teal-bright)', marginTop: '0.2rem' }}>
                      {prod.priceRange.min > 0 ? `From ₹${prod.priceRange.min.toLocaleString('en-IN')}` : 'Check search links'}
                    </div>
                  </div>

                  {products.length > 1 && (
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveProduct(index);
                      }}
                      title="Remove from comparison tray"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Single Product View */}
      {currentProduct && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '3rem' }}>
          {/* Best Verified Offer Showcase Card */}
          {currentProduct.bestOffer && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(6, 182, 212, 0.06))',
                border: '1px solid rgba(20, 184, 166, 0.35)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.75rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.5rem',
                boxShadow: '0 8px 30px rgba(20, 184, 166, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <img
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--teal-bright)',
                        color: '#ffffff',
                      }}
                    >
                      Lowest Verified Price
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Verified on {currentProduct.bestOffer.retailerName}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.45rem', marginBottom: '0.25rem' }}>{currentProduct.name}</h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Variant: <strong>{currentProduct.variant || currentProduct.model}</strong> • {currentProduct.bestOffer.deliveryEstimate}
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Listed Price: ₹{currentProduct.bestOffer.listedPrice.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--teal-bright)', lineHeight: 1 }}>
                  ₹{currentProduct.bestOffer.estimatedCheckoutCost.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Estimated Final Checkout Cost (incl. delivery & verified discounts)
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                  <a
                    href={getSafeRetailerUrl(currentProduct.bestOffer)}
                    target="_blank"
                    rel="noreferrer noopener"
                    referrerPolicy="no-referrer"
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
                  >
                    View on {currentProduct.bestOffer.retailerName}
                    <ExternalLink size={14} />
                  </a>

                  {/* Bridge directly to VeraCost Lifetime Calculator */}
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      const effCategory = (currentProduct.category as ProductCategory) || inferProductCategory(currentProduct.name, currentProduct.brand);
                      onImportToCalculator({
                        name: currentProduct.name,
                        brandOrModel: currentProduct.brand,
                        initialPurchasePrice: currentProduct.bestOffer?.estimatedCheckoutCost || 0,
                        category: effCategory,
                        currency: 'INR',
                      });
                    }}
                    style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                    title="Transfer this verified purchase price into VeraCost's Lifetime TCO Simulation"
                  >
                    <Layers size={15} />
                    Import to TCO Calculator
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter & Sort Bar */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <ArrowUpDown size={14} />
                <span>Sort by:</span>
                <select
                  className="currency-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.82rem' }}
                >
                  <option value="lowest_checkout">Lowest Checkout Cost</option>
                  <option value="lowest_listed">Lowest Listed Price</option>
                  <option value="best_match">Best Match Confidence</option>
                  <option value="retailer_name">Retailer Name</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterInStockOnly}
                  onChange={(e) => setFilterInStockOnly(e.target.checked)}
                />
                In-Stock Only
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterExactOnly}
                  onChange={(e) => setFilterExactOnly(e.target.checked)}
                />
                Exact Matches Only
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsPriceHistoryOpen(true)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <TrendingDown size={13} style={{ color: 'var(--teal-bright)' }} />
                Price History
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsPriceAlertOpen(true)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <Bell size={13} style={{ color: 'var(--amber-warning)' }} />
                Set Alert
              </button>
            </div>
          </div>

          {/* Verified Offers Grid across Indian Retailers */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem' }}>
                Offers Across Verified Indian Retailers ({processedListings.length} Checked)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Ranked by estimated checkout cost
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {processedListings.map((listing) => {
                const hasPrice = listing.listedPrice > 0;
                return (
                  <div
                    key={listing.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backdropFilter: 'var(--glass-blur)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  >
                    <div>
                      {/* Top Retailer row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              color: listing.retailerColor || 'var(--text-main)',
                            }}
                          >
                            {listing.retailerName}
                          </span>
                        </div>
                        {getStatusBadge(listing.status)}
                      </div>

                      {/* Title */}
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                        {listing.productTitle}
                      </div>

                      {/* Pricing Breakdown */}
                      {hasPrice ? (
                        <div
                          style={{
                            background: 'var(--bg-elevated)',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '0.75rem',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                            <span>Listed Price:</span>
                            <span style={{ fontFamily: 'monospace' }}>₹{listing.listedPrice.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                            <span>Delivery / Shipping:</span>
                            <span style={{ fontFamily: 'monospace' }}>{listing.deliveryCharge === 0 ? 'FREE' : `+₹${listing.deliveryCharge}`}</span>
                          </div>
                          {listing.mandatoryFees > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                              <span>Packaging / Handling Fee:</span>
                              <span style={{ fontFamily: 'monospace' }}>+₹{listing.mandatoryFees}</span>
                            </div>
                          )}
                          {listing.applicableDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--emerald-success)', marginBottom: '0.2rem' }}>
                              <span>Bank Discount / Rebate:</span>
                              <span style={{ fontFamily: 'monospace' }}>-₹{listing.applicableDiscount.toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          <div
                            style={{
                              borderTop: '1px solid var(--border-subtle)',
                              paddingTop: '0.4rem',
                              marginTop: '0.4rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              color: 'var(--text-main)',
                            }}
                          >
                            <span>Estimated Checkout:</span>
                            <span style={{ color: 'var(--teal-bright)', fontFamily: 'monospace' }}>
                              ₹{listing.estimatedCheckoutCost.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            background: 'var(--bg-elevated)',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '0.75rem',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.5,
                          }}
                        >
                          {listing.statusMessage || 'Direct API credentials not configured. Click search link below to browse live merchant inventory.'}
                        </div>
                      )}

                      {/* Policy Badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        {listing.deliveryEstimate && <div>🚚 Delivery: {listing.deliveryEstimate}</div>}
                        {listing.warrantyInfo && <div>🛡️ Warranty: {listing.warrantyInfo}</div>}
                        {listing.returnPolicy && <div>🔄 Returns: {listing.returnPolicy}</div>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <a
                        href={getSafeRetailerUrl(listing)}
                        target="_blank"
                        rel="noreferrer noopener"
                        referrerPolicy="no-referrer"
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center', padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        {hasPrice ? 'Open Listing' : 'Search on Store'}
                        <ExternalLink size={13} />
                      </a>

                      {hasPrice && (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => {
                            const effCategory = (currentProduct.category as ProductCategory) || inferProductCategory(currentProduct.name, currentProduct.brand);
                            onImportToCalculator({
                              name: currentProduct.name,
                              brandOrModel: currentProduct.brand,
                              initialPurchasePrice: listing.estimatedCheckoutCost,
                              category: effCategory,
                              currency: 'INR',
                            });
                          }}
                          title="Import this deal into VeraCost Lifetime Calculator"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                        >
                          <Layers size={13} />
                          TCO Model
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Product Side-by-Side Comparison Matrix */}
          {products.length > 1 && (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.75rem',
                border: '1px solid var(--border-subtle)',
                marginTop: '1.5rem',
              }}
            >
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.35rem' }}>Side-by-Side Product Comparison Matrix</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Cross-examine best verified offers, price spreads, and lifetime ownership parameters
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-medium)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem' }}>Product Identity</th>
                      <th style={{ padding: '0.75rem' }}>Lowest Listed Price</th>
                      <th style={{ padding: '0.75rem' }}>Estimated Checkout Cost</th>
                      <th style={{ padding: '0.75rem' }}>Cheapest Verified Retailer</th>
                      <th style={{ padding: '0.75rem' }}>Verified Offers</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => {
                      const best = prod.bestOffer;
                      return (
                        <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <img src={prod.image} alt={prod.name} style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{prod.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.brand} • {prod.variant || prod.model}</div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 600 }}>
                            {best ? `₹${best.listedPrice.toLocaleString('en-IN')}` : 'Unavailable'}
                          </td>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--teal-bright)' }}>
                            {best ? `₹${best.estimatedCheckoutCost.toLocaleString('en-IN')}` : 'Check search links'}
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                            {best ? best.retailerName : 'Official Search Gateway'}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {prod.listings.filter((l) => l.listedPrice > 0).length} of {prod.listings.length} Stores Verified
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => {
                                onImportToCalculator({
                                  name: prod.name,
                                  brandOrModel: prod.brand,
                                  initialPurchasePrice: best?.estimatedCheckoutCost || 0,
                                  category: prod.category as ProductCategory,
                                  currency: 'INR',
                                });
                              }}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            >
                              Model TCO
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Product Alternatives */}
          {currentProduct.alternatives && currentProduct.alternatives.length > 0 && (
            <div
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <Sparkles size={18} style={{ color: 'var(--teal-bright)' }} />
                <h3 style={{ fontSize: '1.1rem' }}>Smart Product Alternatives & Trade-Offs</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {currentProduct.alternatives.map((alt, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {alt.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--teal-bright)', marginBottom: '0.4rem' }}>
                      Approx. ₹{alt.priceEstimate.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      {alt.reason}
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setSearchInput(alt.searchQuery);
                        executeSearch(alt.searchQuery);
                      }}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Compare {alt.brand} Offers
                      <ArrowRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onBarcodeDetected={(code, data) => {
          const name = data?.productName || code;
          const cat = data?.category
            ? (data.category as ProductCategory)
            : inferProductCategory(name);
          setSearchInput(name);
          executeSearch(name, code, cat);
        }}
      />

      <ImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        onProductRecognized={(name, _brand, _model, category) => {
          const effectiveCat = category || inferProductCategory(name);
          setSearchInput(name);
          executeSearch(name, undefined, effectiveCat);
        }}
      />

      <ProductQrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onProductFound={(name, category) => {
          setSearchInput(name);
          executeSearch(name, undefined, category);
        }}
      />

      <UrlSearchModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onUrlParsed={(extracted) => {
          setSearchInput(extracted);
          executeSearch(extracted);
        }}
      />

      {currentProduct && (
        <PriceHistoryModal
          isOpen={isPriceHistoryOpen}
          onClose={() => setIsPriceHistoryOpen(false)}
          productName={currentProduct.name}
          history={currentProduct.priceHistory || []}
        />
      )}

      {currentProduct && currentProduct.bestOffer && (
        <PriceAlertModal
          isOpen={isPriceAlertOpen}
          onClose={() => setIsPriceAlertOpen(false)}
          productId={currentProduct.id}
          productName={currentProduct.name}
          currentLowest={currentProduct.bestOffer.estimatedCheckoutCost}
          currency="INR"
          retailer={currentProduct.bestOffer.retailerName}
          onAlertCreated={handleSaveAlert}
        />
      )}

      <RetailerStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
    </div>
  );
};
