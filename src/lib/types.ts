// src/lib/types.ts

/**
 * Universal type definitions for the Wine Dropshipping Platform
 * All schemas use strict TypeScript interfaces
 */

// ==================== SUPPLIER SCHEMA ====================
export interface Supplier {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  name: string;
  slug: { current: string };
  description?: string;
  logo?: ImageAsset;
  website?: string;
  
  // Sync Configuration
  syncMethod: 'shopify' | 'woocommerce' | 'google_merchant_xml' | 'google_merchant_csv' | 'manual';
  apiCredentials?: {
    apiKey?: string;
    apiSecret?: string;
    storeUrl?: string;
    feedUrl?: string;
  };
  
  // Geographic Service Area
  serviceRadiusKm: number;
  serviceZones: ServiceZone[];
  
  // Fulfillment
  fulfillmentEmail: string;
  shippingRegions: string[];
  averageShippingDays: number;
  
  // Status
  isActive: boolean;
  lastSyncAt?: string;
  syncStatus: 'success' | 'warning' | 'error' | 'pending';
  syncErrorLog?: SyncError[];
}

export interface ServiceZone {
  country: string;
  subdivision?: string; // State/Province
  cities?: string[];
  postalCodes?: string[];
}

export interface SyncError {
  timestamp: string;
  errorCode: string;
  errorMessage: string;
  retryCount: number;
}

// ==================== PRODUCT SCHEMA ====================
export interface Product {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  
  // Core Identity
  name: string;
  slug: { current: string };
  sku: string;
  supplierId: string; // Reference to Supplier
  supplier: Supplier;
  
  // Wine Details
  vintage?: number;
  varietal: string;
  region: string;
  subRegion?: string;
  country: string;
  wineryName: string;
  
  // Tasting Profile
  tastingNotes?: string;
  foodPairings?: string[];
  alcoholContent?: number; // ABV percentage
  bottleSize: '375ml' | '750ml' | '1.5L' | '3L' | '5L';
  color: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified';
  sweetnessLevel?: 'dry' | 'off-dry' | 'medium-sweet' | 'sweet';
  bodyLevel?: 'light' | 'medium' | 'full';
  
  // Pricing & Inventory
  price: number;
  compareAtPrice?: number;
  inventoryQuantity: number;
  isAvailable: boolean;
  availabilityZones: ServiceZone[];
  
  // Media
  images: ImageAsset[];
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  
  // Status
  isActive: boolean;
  isFeatured: boolean;
  lastSyncedAt?: string;
}

export interface ImageAsset {
  _key?: string;
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
  caption?: string;
}

// ==================== ORDER SCHEMA ====================
export interface Order {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  
  // Customer Info
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  
  // Stripe Integration
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  
  // Line Items (may span multiple suppliers)
  lineItems: OrderLineItem[];
  
  // Shipping
  shippingAddress: Address;
  billingAddress: Address;
  
  // Financials
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  
  // Split-Order Routing
  routing_status: 'pending' | 'processing' | 'routed' | 'partially_routed' | 'failed';
  splitOrders: SplitOrder[];
  
  // Fulfillment Tracking
  fulfillmentNotificationsSent: boolean;
  notificationTimestamps?: {
    [supplierId: string]: string;
  };
  
  // Metadata
  metadata?: Record<string, any>;
}

export interface OrderLineItem {
  _key?: string;
  productId: string;
  productName: string;
  productSku: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  wineDetails: {
    vintage?: number;
    varietal: string;
    region: string;
  };
}

export interface SplitOrder {
  _key?: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  lineItemIds: string[];
  itemCount: number;
  itemTotal: number;
  fulfillmentStatus: 'pending' | 'notified' | 'confirmed' | 'shipped' | 'delivered' | 'failed';
  notificationSentAt?: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  subdivision: string; // State/Province
  postalCode: string;
  country: string;
  phone?: string;
}

// ==================== BLOG POST SCHEMA ====================
export interface BlogPost {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  
  title: string;
  slug: { current: string };
  excerpt: string;
  content: any; // Portable Text or MDX
  
  // Author
  author?: {
    name: string;
    image?: ImageAsset;
  };
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  
  // Content Organization
  categories: string[];
  tags: string[];
  featuredImage?: ImageAsset;
  
  // Local SEO (for location-specific content)
  relatedLocations?: string[];
  relatedProducts?: string[];
  
  // FAQ Schema Support
  faqSections?: FAQSection[];
  
  // Publishing
  publishedAt: string;
  isPublished: boolean;
  isFeatured: boolean;
}

export interface FAQSection {
  question: string;
  answer: string;
}

// ==================== GEO LOCATION TYPES ====================
export interface GeoLocation {
  country: string;
  countryCode: string;
  subdivision?: string;
  subdivisionCode?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

// ==================== SYNC ENGINE TYPES ====================
export interface SyncResult {
  success: boolean;
  timestamp: string;
  supplierId: string;
  productsAdded: number;
  productsUpdated: number;
  productsSkipped: number;
  errors: SyncError[];
}

export interface FeedParserResult {
  products: Partial<Product>[];
  errors: ParseError[];
  metadata: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
  };
}

export interface ParseError {
  rowNumber?: number;
  errorCode: string;
  errorMessage: string;
  rawData?: string;
}

// ==================== CART STATE TYPES ====================
export interface CartState {
  items: CartItem[];
  lastUpdated: string;
  location?: GeoLocation;
}

export interface CartItem {
  productId: string;
  productSlug: string;
  name: string;
  sku: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  price: number;
  image?: ImageAsset;
  availabilityStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unavailable_in_location';
}

// ==================== STRIPE TYPES ====================
export interface StripeCheckoutMetadata {
  orderId: string;
  customerEmail: string;
  supplierSplit: {
    [supplierId: string]: {
      supplierName: string;
      itemTotal: number;
      itemCount: number;
    };
  };
}

// ==================== NETLIFY FUNCTION TYPES ====================
export interface NetlifyContext {
  account_id: string;
  site: {
    id: string;
    name: string;
    url: string;
  };
  deploy: {
    id: string;
    url: string;
  };
  request_id: string;
}

export interface EdgeFunctionRequest extends Request {
  context: NetlifyContext;
  geo?: GeoLocation;
}

// ==================== SEO/GEO TYPES ====================
export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export interface LocalBusinessSchema extends StructuredData {
  '@type': 'LocalBusiness' | 'Winery' | 'LiquorStore';
  name: string;
  description: string;
  url: string;
  telephone: string;
  address: PostalAddress;
  geo: GeoCoordinates;
  openingHours?: string;
  priceRange?: string;
}

export interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
}

export interface GeoCoordinates {
  '@type': 'GeoCoordinates';
  latitude: number;
  longitude: number;
}

export interface ProductSchema extends StructuredData {
  '@type': 'Product';
  name: string;
  description: string;
  image: string[];
  offers: Offer;
  brand: Brand;
  additionalProperty?: PropertyValue[];
}

export interface Offer {
  '@type': 'Offer';
  url: string;
  priceCurrency: string;
  price: number;
  availability: string;
  seller: Organization;
}

export interface Organization {
  '@type': 'Organization';
  name: string;
}

export interface Brand {
  '@type': 'Brand';
  name: string;
}

export interface PropertyValue {
  '@type': 'PropertyValue';
  name: string;
  value: string;
}

export interface ArticleSchema extends StructuredData {
  '@type': 'Article' | 'BlogPosting';
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: Person;
  publisher: Organization;
}

export interface Person {
  '@type': 'Person';
  name: string;
}

export interface FAQPageSchema extends StructuredData {
  '@type': 'FAQPage';
  mainEntity: Question[];
}

export interface Question {
  '@type': 'Question';
  name: string;
  acceptedAnswer: Answer;
}

export interface Answer {
  '@type': 'Answer';
  text: string;
}

// Export all types
export type {
  ImageAsset as Image,
  SyncResult as InventorySyncResult,
  FeedParserResult as ParsedFeedResult,
};
