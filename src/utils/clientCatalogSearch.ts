import { SearchedProduct, RetailerListing, RetailerId } from '../types/shopping';
import { VERIFIED_INDIAN_CATALOG } from '../../server/retailers/verifiedCatalog';
import { cleanRetailerSearchQuery } from '../../server/retailers/baseAdapter';
import { inferProductCategory } from '../engine/discovery';

const RETAILER_CONFIGS: {
  id: RetailerId;
  name: string;
  logoText: string;
  brandColor: string;
  buildFallbackUrl: (q: string) => string;
}[] = [
  {
    id: 'amazon-in',
    name: 'Amazon India',
    logoText: 'Amazon.in',
    brandColor: '#FF9900',
    buildFallbackUrl: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(cleanRetailerSearchQuery(q))}`,
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    logoText: 'Flipkart',
    brandColor: '#2874F0',
    buildFallbackUrl: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(cleanRetailerSearchQuery(q))}`,
  },
  {
    id: 'croma',
    name: 'Croma',
    logoText: 'Croma',
    brandColor: '#00E5D9',
    buildFallbackUrl: (q) => `https://www.croma.com/searchB?q=${encodeURIComponent(cleanRetailerSearchQuery(q))}`,
  },
  {
    id: 'reliance-digital',
    name: 'Reliance Digital',
    logoText: 'Reliance',
    brandColor: '#E42529',
    buildFallbackUrl: (q) => `https://www.reliancedigital.in/search?q=${encodeURIComponent(cleanRetailerSearchQuery(q))}`,
  },
  {
    id: 'vijay-sales',
    name: 'Vijay Sales',
    logoText: 'Vijay Sales',
    brandColor: '#C62828',
    buildFallbackUrl: (q) => {
      const clean = cleanRetailerSearchQuery(q);
      const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return `https://www.vijaysales.com/search/${encodeURIComponent(slug)}`;
    },
  },
  {
    id: 'tatacliq',
    name: 'Tata CLiQ',
    logoText: 'Tata CLiQ',
    brandColor: '#8E24AA',
    buildFallbackUrl: (q) => `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(cleanRetailerSearchQuery(q))}`,
  },
  {
    id: 'myntra',
    name: 'Myntra',
    logoText: 'Myntra',
    brandColor: '#FF3F6C',
    buildFallbackUrl: (q) => `https://www.myntra.com/${encodeURIComponent(cleanRetailerSearchQuery(q).toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`,
  },
  {
    id: 'nykaa',
    name: 'Nykaa',
    logoText: 'Nykaa',
    brandColor: '#FC2779',
    buildFallbackUrl: (q) => `https://www.nykaa.com/search/result/?q=${encodeURIComponent(cleanRetailerSearchQuery(q))}`,
  },
  {
    id: 'official-store',
    name: 'Official Brand Store',
    logoText: 'Official Store',
    brandColor: '#374151',
    buildFallbackUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(cleanRetailerSearchQuery(q) + ' official store India buy online')}`,
  },
];

export function performClientCatalogSearch(queryText: string, barcode?: string, categoryHint?: string): SearchedProduct {
  const rawQuery = (queryText || '').trim();
  const normalizedQuery = rawQuery.toLowerCase();
  const barcodeQuery = (barcode || '').trim();

  // 1. Search verified catalog for matching product
  const catalogMatch = VERIFIED_INDIAN_CATALOG.find((prod) => {
    if (barcodeQuery && prod.barcode && prod.barcode === barcodeQuery) return true;
    if (prod.aliases.some((alias) => normalizedQuery.includes(alias) || alias.includes(normalizedQuery))) return true;
    if (normalizedQuery.includes(prod.model.toLowerCase()) || normalizedQuery.includes(prod.name.toLowerCase())) return true;
    return false;
  });

  const effectiveCategory =
    catalogMatch?.category ||
    inferProductCategory(rawQuery, catalogMatch?.brand, categoryHint) ||
    'electronics';

  const allListings: RetailerListing[] = [];

  RETAILER_CONFIGS.forEach((ret) => {
    // Check if catalog has an offer for this retailer
    const catalogOffer = catalogMatch?.offers.find((o) => o.retailerId === ret.id);

    if (catalogOffer) {
      const base = Number(catalogOffer.listedPrice) || 0;
      const delivery = Number(catalogOffer.deliveryCharge) || 0;
      const fees = Number(catalogOffer.mandatoryFees) || 0;
      const discount = Number(catalogOffer.applicableDiscount) || 0;
      const checkoutCost = Math.max(0, base + delivery + fees - discount);

      allListings.push({
        ...catalogOffer,
        estimatedCheckoutCost: checkoutCost,
      });
    } else {
      // Unconfigured or no direct listing found -> provide honest search gateway fallback
      allListings.push({
        id: `client-${ret.id}-${Date.now()}`,
        retailerId: ret.id,
        retailerName: ret.name,
        retailerLogo: ret.logoText,
        retailerColor: ret.brandColor,
        productTitle: `${rawQuery || catalogMatch?.name || 'Product'} on ${ret.name}`,
        brand: catalogMatch?.brand || '',
        model: catalogMatch?.model || rawQuery,
        listedPrice: 0,
        currency: 'INR',
        deliveryCharge: 0,
        mandatoryFees: 0,
        applicableDiscount: 0,
        estimatedCheckoutCost: 0,
        stockStatus: 'unknown',
        searchFallbackUrl: ret.buildFallbackUrl(rawQuery || catalogMatch?.name || ''),
        source: `${ret.name} Search Gateway`,
        status: 'not_configured',
        priceType: 'unavailable',
        matchConfidence: 0,
        lastVerifiedTimestamp: new Date().toISOString(),
        statusMessage: `No direct API credentials configured for ${ret.name}. You can open their official search portal directly.`,
      });
    }
  });

  // Rank verified listings
  const validPurchasable = allListings.filter(
    (l) => (l.status === 'exact_match' || l.status === 'possible_match') && l.listedPrice > 0 && l.stockStatus !== 'out_of_stock'
  );

  validPurchasable.sort((a, b) => a.estimatedCheckoutCost - b.estimatedCheckoutCost);

  const unranked = allListings.filter((l) => !validPurchasable.includes(l));
  const sortedListings = [...validPurchasable, ...unranked];

  const bestOffer = validPurchasable.length > 0 ? validPurchasable[0] : undefined;

  const prices = validPurchasable.map((l) => l.estimatedCheckoutCost).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return {
    id: `prod-${catalogMatch?.id || Date.now()}`,
    name: catalogMatch?.name || rawQuery,
    brand: catalogMatch?.brand || 'Verified Retail Product',
    model: catalogMatch?.model || rawQuery,
    category: effectiveCategory,
    variant: catalogMatch?.variant,
    image: catalogMatch?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    barcode: barcode || catalogMatch?.barcode,
    listings: sortedListings,
    bestOffer,
    priceRange: { min: minPrice, max: maxPrice },
    priceHistory: catalogMatch?.priceHistory || [],
    alternatives: catalogMatch?.alternatives || [],
    lastUpdated: new Date().toISOString(),
  };
}
