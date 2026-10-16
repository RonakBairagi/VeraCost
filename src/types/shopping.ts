/**
 * VeraCost Smart Price Finder — Comprehensive Types & Data Structures
 * Multi-retailer price comparison, barcode scanning, image recognition & TCO bridge.
 */

export type RetailerId = 
  | 'amazon-in'
  | 'flipkart'
  | 'croma'
  | 'reliance-digital'
  | 'vijay-sales'
  | 'tatacliq'
  | 'myntra'
  | 'nykaa'
  | 'official-store';

export type ListingStatus = 
  | 'exact_match'          // Verified exact product & variant match
  | 'possible_match'       // Similar listing, model/variant needs confirmation
  | 'no_match'             // Query returned no suitable match
  | 'unable_to_verify'     // Retailer search failed/timed out/rate limited
  | 'out_of_stock'         // Retailer explicitly confirms item is out of stock
  | 'not_configured';      // Retailer API not configured; search fallback link provided

export type PriceType = 'live' | 'verified_cache' | 'estimated' | 'unavailable';

export type StockStatus = 'in_stock' | 'limited_stock' | 'out_of_stock' | 'unknown';

export interface RetailerListing {
  id: string;
  retailerId: RetailerId;
  retailerName: string;
  retailerLogo: string;
  retailerColor: string;
  productTitle: string;
  brand: string;
  model: string;
  variant?: string;
  listedPrice: number;
  currency: string;
  deliveryCharge: number;
  mandatoryFees: number;
  applicableDiscount: number;
  discountDetails?: string;
  estimatedCheckoutCost: number;
  stockStatus: StockStatus;
  deliveryEstimate?: string;
  warrantyInfo?: string;
  returnPolicy?: string;
  directProductUrl?: string;
  searchFallbackUrl: string;
  source: string;
  status: ListingStatus;
  priceType: PriceType;
  matchConfidence: number; // 0 - 100
  lastVerifiedTimestamp: string;
  statusMessage?: string;
  sellerRating?: number;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  retailerName: string;
  isEstimate?: boolean;
}

export interface ProductAlternative {
  name: string;
  brand: string;
  model: string;
  priceEstimate: number;
  currency: string;
  reason: string;
  searchQuery: string;
}

export interface SearchedProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  variant?: string;
  image?: string;
  barcode?: string;
  sourceUrl?: string;
  listings: RetailerListing[];
  bestOffer?: RetailerListing;
  priceRange: {
    min: number;
    max: number;
  };
  priceHistory?: PriceHistoryPoint[];
  alternatives?: ProductAlternative[];
  lastUpdated: string;
  isSearching?: boolean;
}

export interface RetailerIntegrationStatus {
  id: RetailerId;
  name: string;
  isConfigured: boolean;
  status: 'active' | 'awaiting_keys' | 'search_fallback_only';
  authType: 'api_key' | 'affiliate_token' | 'public_feed' | 'direct_search';
  requiredEnvVar?: string;
  documentationUrl: string;
  notes: string;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  currentLowest: number;
  targetPrice: number;
  currency: string;
  retailer: string;
  email?: string;
  createdAt: string;
  status: 'active' | 'triggered' | 'dismissed';
}

export type ProductSortOption = 
  | 'lowest_checkout'
  | 'lowest_listed'
  | 'best_match'
  | 'fastest_delivery'
  | 'retailer_name';

export interface ShoppingFilterState {
  retailers: RetailerId[];
  inStockOnly: boolean;
  exactMatchesOnly: boolean;
  minPrice?: number;
  maxPrice?: number;
  searchQuery: string;
}

export interface BarcodeLookupResult {
  found: boolean;
  barcode: string;
  productName?: string;
  brand?: string;
  model?: string;
  category?: string;
  imageUrl?: string;
  source: string;
  message?: string;
}

export interface ImageRecognitionResult {
  success: boolean;
  detectedName?: string;
  brand?: string;
  model?: string;
  category?: string;
  confidence: number;
  attributes?: string[];
  message?: string;
  isAwaitingConfig?: boolean;
}
