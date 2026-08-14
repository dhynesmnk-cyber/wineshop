/**
 * ARCHITECTURE DOCUMENTATION
 * Hyper-Local Wine Dropshipping E-commerce Platform
 * 
 * Tech Stack:
 * - Frontend: Astro.js 4 + TypeScript + Tailwind CSS + React (islands)
 * - CMS: Sanity.io (products/suppliers/orders) + Decap CMS (blog)
 * - Backend: Netlify Edge Functions + Scheduled Functions
 * - Payments: Stripe Checkout + Webhooks
 * - Deployment: Netlify
 */

// ==================== FOLDER STRUCTURE ====================
/**
wine-dropship-platform/
├── public/
│   ├── llms.txt                    # Entity graph for AI search engines
│   ├── robots.txt                  # SEO crawl rules
│   └── favicon.svg
│
├── src/
│   ├── components/
│   │   ├── AgeGate.astro           # 21+ age verification modal
│   │   ├── ProductCard.astro       # Product grid item
│   │   ├── ProductGrid.astro       # Filtered product listing
│   │   ├── Cart.astro              # Cart sidebar/modal
│   │   ├── CartItem.astro          # Individual cart item
│   │   ├── CheckoutForm.astro      # Stripe checkout form
│   │   ├── LocationBanner.astro    # Geo-location status display
│   │   ├── SeoHead.astro           # Meta tags + structured data
│   │   ├── BlogPostCard.astro      # Blog listing item
│   │   ├── FAQSection.astro        # Semantic FAQ with JSON-LD
│   │   └── LoadingSkeleton.astro   # Async loading states
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro        # Editorial design: burgundy/cream/gold
│   │   ├── BlogLayout.astro        # Blog post template
│   │   └── ProductLayout.astro     # Product detail template
│   │
│   ├── pages/
│   │   ├── index.astro             # Homepage with geo-filtered products
│   │   ├── shop.astro              # Product grid with filters
│   │   ├── product/
│   │   │   └── [slug].astro        # Dynamic product detail page
│   │   ├── cart.astro              # Cart page
│   │   ├── checkout.astro          # Checkout page
│   │   ├── blog/
│   │   │   ├── index.astro         # Blog index
│   │   │   └── [slug].astro        # Blog post detail
│   │   ├── wine-delivery-[city].astro  # Programmatic local landing pages
│   │   └── api/
│   │       └── revalidate.ts       # On-demand ISR revalidation
│   │
│   ├── lib/
│   │   ├── types.ts                # Universal TypeScript interfaces
│   │   ├── sanity.ts               # Sanity client configuration
│   │   ├── stripe.ts               # Stripe client initialization
│   │   ├── cart-store.ts           # Zustand cart state management
│   │   ├── geo-utils.ts            # Geo-location helper functions
│   │   └── seo-utils.ts            # Structured data generators
│   │
│   └── styles/
│       └── global.css              # Tailwind imports + custom styles
│
├── netlify/
│   ├── edge-functions/
│   │   ├── geo.ts                  # Location detection middleware
│   │   └── auth.ts                 # Optional authentication layer
│   │
│   └── functions/
│       ├── sync-inventory.ts       # Scheduled function (every 6h)
│       ├── create-checkout.ts      # Stripe session creation
│       ├── stripe-webhook.ts       # Payment webhook handler
│       └── send-fulfillment-email.ts # Supplier notification
│
├── sanity/
│   ├── schemaTypes/
│   │   └── index.ts                # All Sanity schemas (Supplier, Product, Order, BlogPost)
│   ├── lib/
│   │   └── client.ts               # Sanity client exports
│   ├── schema.ts                   # Schema registry
│   └── package.json
│
├── config/
│   ├── suppliers.example.json      # Mock supplier data for 4 wineries
│   └── feed-parsers/
│       ├── shopify-parser.ts       # Shopify Storefront API parser
│       ├── woocommerce-parser.ts   # WooCommerce REST parser
│       ├── xml-feed-parser.ts      # Google Merchant XML parser
│       └── csv-feed-parser.ts      # CSV feed parser
│
├── astro.config.mjs                # Astro configuration
├── tailwind.config.mjs             # Tailwind customization
├── tsconfig.json                   # TypeScript configuration
├── netlify.toml                    # Netlify deployment config
├── .env.example                    # Environment variable template
├── package.json                    # Dependencies
└── README.md                       # Setup + deployment guide
 */

// ==================== DATA FLOW DIAGRAM ====================
/**
 * Wineries → Sync → CMS → Storefront
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                         EXTERNAL WINERIES                          │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  beyondtheglass.com.au    │  littlebrunswickwineco.com             │
 * │  (Shopify API)            │  (WooCommerce REST)                    │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  bloodmoonwines.com       │  vinointrepido.com                     │
 * │  (Google Merchant XML)    │  (Google Merchant CSV)                 │
 * └─────────────────┬─────────┴──────────────┬─────────────────────────┘
 *                   │                        │
 *                   ▼                        ▼
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                    NETLIFY SCHEDULED FUNCTION                       │
 * │              /netlify/functions/sync-inventory.ts                   │
 * │                    (Runs every 6 hours via cron)                    │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  1. Fetch from all 4 supplier APIs/feeds                            │
 * │  2. Parse & normalize to universal Product schema                   │
 * │  3. Deduplicate by SKU + Supplier ID                                │
 * │  4. Apply rate limiting with exponential backoff                    │
 * │  5. Handle malformed data gracefully (skip bad rows, log errors)    │
 * │  6. Upsert to Sanity CMS                                            │
 * │  7. Notify admin on 3+ consecutive failures                         │
 * └────────────────────────────────────┬────────────────────────────────┘
 *                                      │
 *                                      ▼
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                         SANITY.IO CMS                               │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  Collections:                                                        │
 * │  - suppliers (sync config, service zones, fulfillment emails)       │
 * │  - products (normalized wine data, availability zones)              │
 * │  - orders (customer orders with split-order routing)                │
 * │  - blogPost (SEO content with FAQ schema support)                   │
 * └────────────────────────────────────┬────────────────────────────────┘
 *                                      │
 *                                      ▼
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                      ASTRO STOREFRONT                               │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  Static Generation (ISR):                                            │
 * │  - Homepage (/)                                                      │
 * │  - Product pages (/product/[slug])                                  │
 * │  - Blog posts (/blog/[slug])                                        │
 * │  - Local landing pages (/wine-delivery-[city])                      │
 * │                                                                      │
 * │  Dynamic Rendering:                                                  │
 * │  - Cart state (Zustand, persisted in localStorage)                  │
 * │  - Geo-filtered product queries                                     │
 * │  - Real-time inventory badges                                       │
 * └────────────────────────────────────┬────────────────────────────────┘
 *                                      │
 *                                      ▼
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                      NETLIFY EDGE FUNCTIONS                         │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  /edge/geo.ts - Location Detection                                   │
 * │  - Reads x-nf-country, x-nf-subdivision, x-nf-city headers          │
 * │  - Falls back to IP geolocation API if headers missing              │
 * │  - Sets user location cookie for session persistence                │
 * │                                                                      │
 * │  Geo-Filtering Logic:                                                │
 * │  - Compare user location against product.availabilityZones          │
 * │  - Only show wines within supplier service radius                   │
 * │  - Display "No wines available in [location] yet" if empty          │
 * └────────────────────────────────────┬────────────────────────────────┘
 *                                      │
 *                                      ▼
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                       CHECKOUT FLOW                                 │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  1. User adds items to cart (multi-supplier supported)              │
 * │  2. Clicks checkout → /api/create-checkout.ts                       │
 * │  3. Creates Stripe Checkout Session with metadata:                  │
 * │     - orderId (temporary)                                            │
 * │     - supplierSplit { [supplierId]: { itemCount, itemTotal } }      │
 * │     - customerEmail                                                  │
 * │  4. Redirects to Stripe hosted checkout                             │
 * │  5. Stripe webhook → /netlify/functions/stripe-webhook.ts           │
 * │  6. Webhook verifies signature, creates Order in Sanity             │
 * │  7. Split-order routing logic groups line items by supplier         │
 * │  8. Sends fulfillment email to each supplier                        │
 * │  9. Updates Order.routing_status to 'routed'                        │
 * │  10. Optional: Pushes draft order to supplier's native platform     │
 * └─────────────────────────────────────────────────────────────────────┘
 */

// ==================== API CONTRACTS ====================
/**
 * NETLIFY FUNCTION: sync-inventory.ts
 * -----------------------------------
 * Trigger: Scheduled (every 6 hours)
 * Input: None (reads SUPPLIERS from Sanity)
 * Output: SyncResult[] logged to Sanity
 * 
 * Endpoint: POST /.netlify/functions/sync-inventory
 * Headers: Authorization: Bearer <SANITY_API_TOKEN>
 * Body: { forceFullSync?: boolean }
 * 
 * Response:
 * {
 *   success: boolean,
 *   timestamp: string,
 *   results: {
 *     [supplierId]: {
 *       productsAdded: number,
 *       productsUpdated: number,
 *       productsSkipped: number,
 *       errors: SyncError[]
 *     }
 *   }
 * }
 * 
 * 
 * NETLIFY FUNCTION: create-checkout.ts
 * ------------------------------------
 * Trigger: HTTP POST from storefront
 * Input: { items: CartItem[], shippingAddress: Address, customerEmail: string }
 * Output: Stripe Checkout Session URL
 * 
 * Endpoint: POST /.netlify/functions/create-checkout
 * Headers: Content-Type: application/json
 * Body: {
 *   items: [{
 *     productId: string,
 *     quantity: number,
 *     price: number
 *   }],
 *   shippingAddress: Address,
 *   customerEmail: string
 * }
 * 
 * Response:
 * {
 *   sessionId: string,
 *   sessionUrl: string
 * }
 * 
 * 
 * NETLIFY FUNCTION: stripe-webhook.ts
 * -----------------------------------
 * Trigger: Stripe webhook event
 * Input: Stripe event payload
 * Output: 200 OK or error
 * 
 * Endpoint: POST /.netlify/functions/stripe-webhook
 * Headers: Stripe-Signature: <signature>
 * Body: Stripe.Event
 * 
 * Events Handled:
 * - checkout.session.completed → Create Order, route to suppliers
 * - payment_intent.payment_failed → Update Order paymentStatus
 * - charge.refunded → Update Order paymentStatus
 * 
 * Response:
 * { received: true }
 * 
 * 
 * NETLIFY EDGE FUNCTION: geo.ts
 * -----------------------------
 * Trigger: Every request (middleware)
 * Input: Request headers
 * Output: Geo-location context
 * 
 * Headers Read:
 * - x-nf-country (e.g., "US")
 * - x-nf-subdivision (e.g., "CA")
 * - x-nf-city (e.g., "San Francisco")
 * 
 * Fallback Strategy:
 * 1. Check Netlify headers
 * 2. If missing, call IP geolocation API (ipapi.co, ipstack, etc.)
 * 3. Cache result in cookie for session
 * 
 * Response: Injects geo context into request
 */

// ==================== GEO-LOCATION STRATEGY ====================
/**
 * Primary Method: Netlify Context Headers
 * ----------------------------------------
 * Netlify automatically injects geo headers on all requests:
 * - x-nf-country: Two-letter country code (ISO 3166-1 alpha-2)
 * - x-nf-subdivision: State/province code (ISO 3166-2)
 * - x-nf-city: City name
 * - x-nf-postal-code: Postal code
 * - x-nf-latitude: Latitude coordinate
 * - x-nf-longitude: Longitude coordinate
 * - x-nf-timezone: Timezone identifier
 * 
 * Implementation:
 * ```typescript
 * // netlify/edge-functions/geo.ts
 * export default async (request: Request, context: Context) => {
 *   const country = context.geo?.country?.code;
 *   const subdivision = context.geo?.subdivision?.code;
 *   const city = context.geo?.city;
 *   
 *   return new Response(null, {
 *     status: 307,
 *     headers: {
 *       'x-user-country': country || '',
 *       'x-user-subdivision': subdivision || '',
 *       'x-user-city': city || '',
 *     },
 *   });
 * };
 * ```
 * 
 * Fallback Method: IP Geolocation API
 * ------------------------------------
 * If Netlify headers are unavailable (local dev, certain proxies):
 * 
 * ```typescript
 * async function getGeoFromIP(ip: string): Promise<GeoLocation> {
 *   const response = await fetch(`https://ipapi.co/${ip}/json/`);
 *   const data = await response.json();
 *   return {
 *     country: data.country_code,
 *     subdivision: data.region_code,
 *     city: data.city,
 *     postalCode: data.postal,
 *     latitude: data.latitude,
 *     longitude: data.longitude,
 *   };
 * }
 * ```
 * 
 * Session Persistence:
 * --------------------
 * Store user location in cookie to maintain consistency across pages:
 * ```typescript
 * document.cookie = `user_location=${JSON.stringify(geo)}; path=/; max-age=86400`;
 * ```
 * 
 * Geo-Filtering Logic:
 * --------------------
 * For each product, check if user location matches availabilityZones:
 * ```typescript
 * function isProductAvailable(product: Product, userLocation: GeoLocation): boolean {
 *   return product.availabilityZones.some(zone => {
 *     const countryMatch = zone.country === userLocation.countryCode;
 *     const subdivisionMatch = !zone.subdivision || zone.subdivision === userLocation.subdivisionCode;
 *     const cityMatch = !zone.cities || zone.cities.includes(userLocation.city);
 *     const postalMatch = !zone.postalCodes || zone.postalCodes.includes(userLocation.postalCode);
 *     
 *     return countryMatch && subdivisionMatch && (cityMatch || postalMatch);
 *   });
 * }
 * ```
 */

// ==================== UNIVERSAL SYNC SUPPORT ====================
/**
 * Supported Feed Types:
 * ---------------------
 * 
 * 1. SHOPIFY STOREFRONT API
 *    Endpoint: https://{store}.myshopify.com/api/{version}/graphql.json
 *    Query: Products with inventory levels
 *    Auth: Storefront access token (public)
 *    Rate Limit: 2 calls/second (leaky bucket)
 *    
 *    Example Query:
 *    ```graphql
 *    query GetProducts {
 *      products(first: 250) {
 *        edges {
 *          node {
 *            id
 *            title
 *            handle
 *            variants(first: 100) {
 *              edges {
 *                node {
 *                  sku
 *                  price
 *                  inventoryQuantity
 *                }
 *              }
 *            }
 *          }
 *        }
 *      }
 *    }
 *    ```
 * 
 * 2. WOOCOMMERCE REST API
 *    Endpoint: https://{store}.com/wp-json/wc/v3/products
 *    Auth: Consumer key + secret (query params or OAuth 1.0a)
 *    Rate Limit: Varies by host (typically 60/min)
 *    
 *    Example Response Fields:
 *    - id, name, slug, sku
 *    - regular_price, stock_quantity
 *    - categories, images
 *    - attributes (for varietal, region, etc.)
 * 
 * 3. GOOGLE MERCHANT XML FEED
 *    Format: XML conforming to Google Shopping spec
 *    Required Attributes: id, title, description, link, image_link, price, availability
 *    Optional: brand, gtin, mpn, condition, adult
 *    
 *    Example Structure:
 *    ```xml
 *    <rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
 *      <channel>
 *        <item>
 *          <g:id>SKU123</g:id>
 *          <g:title>2019 Cabernet Sauvignon</g:title>
 *          <g:description>Full-bodied red wine...</g:description>
 *          <g:link>https://example.com/product/123</g:link>
 *          <g:image_link>https://example.com/image.jpg</g:image_link>
 *          <g:price>29.99 USD</g:price>
 *          <g:availability>in_stock</g:availability>
 *          <g:brand>Blood Moon Wines</g:brand>
 *        </item>
 *      </channel>
 *    </rss>
 *    ```
 * 
 * 4. GOOGLE MERCHANT CSV FEED
 *    Format: CSV with required columns
 *    Required Columns: id, title, description, link, image_link, price, availability
 *    
 *    Example Row:
 *    ```csv
 *    id,title,description,link,image_link,price,availability,brand
 *    SKU123,"2019 Cabernet Sauvignon","Full-bodied red wine...",https://example.com/product/123,https://example.com/image.jpg,29.99 USD,in_stock,"Blood Moon Wines"
 *    ```
 * 
 * Normalization Layer:
 * --------------------
 * All feeds are normalized to the universal Product interface:
 * ```typescript
 * interface NormalizedProduct {
 *   sku: string;
 *   name: string;
 *   price: number;
 *   inventoryQuantity: number;
 *   isAvailable: boolean;
 *   images: ImageAsset[];
 *   // ... mapped from source-specific fields
 * }
 * ```
 * 
 * Deduplication Strategy:
 * -----------------------
 * - Primary key: `${supplierId}:${sku}`
 * - If duplicate found, update existing record instead of creating new
 * - Log conflicts in syncErrorLog array
 * 
 * Error Handling:
 * ---------------
 * - Malformed XML/CSV: Skip bad rows, continue processing
 * - API rate limit: Exponential backoff (1s, 2s, 4s, 8s, 16s)
 * - Authentication failure: Log error, notify admin
 * - Network timeout: Retry up to 3 times
 * - After 3 consecutive failures: Send admin notification email
 */

// ==================== SPLIT-ORDER ROUTING LOGIC ====================
/**
 * Algorithm:
 * ----------
 * 1. Receive Stripe checkout.session.completed webhook
 * 2. Extract line items from session metadata
 * 3. Group items by supplierId
 * 4. For each supplier group:
 *    a. Create SplitOrder record
 *    b. Calculate itemTotal for that supplier
 *    c. Set fulfillmentStatus = 'pending'
 * 5. Update Order.splitOrders array
 * 6. Set Order.routing_status = 'processing'
 * 7. For each SplitOrder:
 *    a. Generate HTML email with items, quantities, shipping address
 *    b. Send email to supplier.fulfillmentEmail
 *    c. On success: set fulfillmentStatus = 'notified', record timestamp
 *    d. On failure: set fulfillmentStatus = 'failed', log error
 * 8. If all suppliers notified: set routing_status = 'routed'
 * 9. If partial failure: set routing_status = 'partially_routed'
 * 10. If all failed: set routing_status = 'failed'
 * 
 * Email Template:
 * ---------------
 * Subject: New Order #{orderNumber} - {supplierName}
 * From: orders@yourwinesite.com
 * To: supplier.fulfillmentEmail
 * 
 * Body (HTML):
 * - Order number, date, customer name
 * - Shipping address (formatted)
 * - Itemized list: SKU, Name, Quantity, Price
 * - Packing slip (printable section)
 * - Special instructions (if any)
 * - Contact info for questions
 * 
 * Idempotency:
 * ------------
 * - Store processed webhook IDs in memory/cache
 * - Before processing, check if webhook ID already handled
 * - If yes, return 200 OK without re-processing
 * - Prevents duplicate orders from Stripe retry logic
 * 
 * Fallback Mechanism:
 * -------------------
 * If email fails:
 * 1. Log error to Order.notificationTimestamps[supplierId]
 * 2. Update SplitOrder.fulfillmentStatus = 'failed'
 * 3. Set Order.routing_status = 'partially_routed' or 'failed'
 * 4. Trigger admin alert (email/SMS/Slack)
 * 5. Provide manual resend button in Sanity CMS
 * 
 * Optional Supplier Integration:
 * ------------------------------
 * For suppliers with API access:
 * - Push draft order directly to their platform
 * - Shopify: POST /admin/api/{version}/orders.json
 * - WooCommerce: POST /wp-json/wc/v3/orders
 * - Store externalOrderId in SplitOrder for tracking
 */

// ==================== QUALITY GATE 1 CHECKLIST ====================
/**
 * ✅ All schemas use strict TypeScript interfaces
 *    - Defined in src/lib/types.ts with full type safety
 *    - No 'any' types except for Portable Text content
 * 
 * ✅ Geo-location strategy documented
 *    - Primary: Netlify headers (x-nf-*)
 *    - Fallback: IP geolocation API
 *    - Session persistence via cookies
 *    - Geo-filtering logic implemented
 * 
 * ✅ Universal sync supports all 4 feed types
 *    - Shopify Storefront API (GraphQL)
 *    - WooCommerce REST API
 *    - Google Merchant XML
 *    - Google Merchant CSV
 *    - Normalization layer maps all to unified schema
 * 
 * ✅ Split-order routing logic mapped
 *    - Group line items by supplier
 *    - Create SplitOrder records
 *    - Send fulfillment emails
 *    - Track notification status
 *    - Handle failures gracefully
 * 
 * PHASE 1 COMPLETE - READY FOR PHASE 2
 */

export const architectureDoc = {
  phase: 1,
  status: 'complete',
  qualityGatePassed: true,
  filesCreated: [
    'src/lib/types.ts',
    'sanity/schemaTypes/index.ts',
    'ARCHITECTURE.md',
  ],
  nextPhase: 'Core Infrastructure (Phase 2)',
};
