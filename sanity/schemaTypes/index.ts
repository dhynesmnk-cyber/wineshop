/**
 * Sanity.io Schema Definitions
 * Production-ready schemas for Supplier, Product, Order, and BlogPost
 */

import { defineField, defineType } from 'sanity';

// ==================== SUPPLIER SCHEMA ====================
export const supplierSchema = defineType({
  name: 'supplier',
  title: 'Suppliers',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Supplier Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'website',
      title: 'Website URL',
      type: 'url',
    }),
    
    // Sync Configuration
    defineField({
      name: 'syncMethod',
      title: 'Sync Method',
      type: 'string',
      options: {
        list: [
          { title: 'Shopify API', value: 'shopify' },
          { title: 'WooCommerce REST', value: 'woocommerce' },
          { title: 'Google Merchant XML', value: 'google_merchant_xml' },
          { title: 'Google Merchant CSV', value: 'google_merchant_csv' },
          { title: 'Manual', value: 'manual' },
        ],
      },
      initialValue: 'manual',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'apiCredentials',
      title: 'API Credentials',
      type: 'object',
      fields: [
        defineField({ name: 'apiKey', type: 'string', title: 'API Key' }),
        defineField({ name: 'apiSecret', type: 'string', title: 'API Secret' }),
        defineField({ name: 'storeUrl', type: 'url', title: 'Store URL' }),
        defineField({ name: 'feedUrl', type: 'url', title: 'Feed URL' }),
      ],
      hidden: ({ parent }) => parent?.syncMethod === 'manual',
    }),
    
    // Geographic Service Area
    defineField({
      name: 'serviceRadiusKm',
      title: 'Service Radius (km)',
      type: 'number',
      description: 'Maximum delivery radius from supplier location',
      validation: (Rule) => Rule.min(1).max(500),
    }),
    defineField({
      name: 'serviceZones',
      title: 'Service Zones',
      type: 'array',
      of: [{ type: 'serviceZone' }],
    }),
    
    // Fulfillment
    defineField({
      name: 'fulfillmentEmail',
      title: 'Fulfillment Email',
      type: 'email',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'shippingRegions',
      title: 'Shipping Regions',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'averageShippingDays',
      title: 'Average Shipping Days',
      type: 'number',
    }),
    
    // Status
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'lastSyncAt',
      title: 'Last Sync',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'syncStatus',
      title: 'Sync Status',
      type: 'string',
      options: {
        list: ['success', 'warning', 'error', 'pending'],
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'syncErrorLog',
      title: 'Sync Error Log',
      type: 'array',
      of: [{ type: 'syncError' }],
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'syncMethod',
      media: 'logo',
    },
  },
});

// ==================== SERVICE ZONE SUB-SCHEMA ====================
export const serviceZoneSchema = defineType({
  name: 'serviceZone',
  title: 'Service Zone',
  type: 'object',
  fields: [
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subdivision',
      title: 'State/Province',
      type: 'string',
    }),
    defineField({
      name: 'cities',
      title: 'Cities',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'postalCodes',
      title: 'Postal Codes',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
});

// ==================== SYNC ERROR SUB-SCHEMA ====================
export const syncErrorSchema = defineType({
  name: 'syncError',
  title: 'Sync Error',
  type: 'object',
  fields: [
    defineField({ name: 'timestamp', type: 'datetime', title: 'Timestamp' }),
    defineField({ name: 'errorCode', type: 'string', title: 'Error Code' }),
    defineField({ name: 'errorMessage', type: 'text', title: 'Error Message' }),
    defineField({ name: 'retryCount', type: 'number', title: 'Retry Count' }),
  ],
});

// ==================== PRODUCT SCHEMA ====================
export const productSchema = defineType({
  name: 'product',
  title: 'Products',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'supplier',
      title: 'Supplier',
      type: 'reference',
      to: [{ type: 'supplier' }],
      validation: (Rule) => Rule.required(),
    }),
    
    // Wine Details
    defineField({
      name: 'vintage',
      title: 'Vintage Year',
      type: 'number',
    }),
    defineField({
      name: 'varietal',
      title: 'Varietal',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subRegion',
      title: 'Sub-Region',
      type: 'string',
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'wineryName',
      title: 'Winery Name',
      type: 'string',
    }),
    
    // Tasting Profile
    defineField({
      name: 'tastingNotes',
      title: 'Tasting Notes',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'foodPairings',
      title: 'Food Pairings',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'alcoholContent',
      title: 'Alcohol Content (ABV %)',
      type: 'number',
    }),
    defineField({
      name: 'bottleSize',
      title: 'Bottle Size',
      type: 'string',
      options: {
        list: ['375ml', '750ml', '1.5L', '3L', '5L'],
      },
      initialValue: '750ml',
    }),
    defineField({
      name: 'color',
      title: 'Wine Color',
      type: 'string',
      options: {
        list: ['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified'],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sweetnessLevel',
      title: 'Sweetness Level',
      type: 'string',
      options: {
        list: ['dry', 'off-dry', 'medium-sweet', 'sweet'],
      },
    }),
    defineField({
      name: 'bodyLevel',
      title: 'Body Level',
      type: 'string',
      options: {
        list: ['light', 'medium', 'full'],
      },
    }),
    
    // Pricing & Inventory
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.min(0).required(),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Compare At Price',
      type: 'number',
    }),
    defineField({
      name: 'inventoryQuantity',
      title: 'Inventory Quantity',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'isAvailable',
      title: 'Available',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'availabilityZones',
      title: 'Availability Zones',
      type: 'array',
      of: [{ type: 'serviceZone' }],
    }),
    
    // Media
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    
    // SEO
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
    }),
    
    // Status
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'lastSyncedAt',
      title: 'Last Synced',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'varietal',
      price: 'price',
      media: 'images.0',
    },
    prepare(selection) {
      const { title, subtitle, price } = selection;
      return {
        title,
        subtitle: `${subtitle} - $${price}`,
      };
    },
  },
});

// ==================== ORDER SCHEMA ====================
export const orderSchema = defineType({
  name: 'order',
  title: 'Orders',
  type: 'document',
  fields: [
    defineField({
      name: 'orderNumber',
      title: 'Order Number',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'customerEmail',
      title: 'Customer Email',
      type: 'email',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    
    // Stripe Integration
    defineField({
      name: 'stripeSessionId',
      title: 'Stripe Session ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'stripePaymentIntentId',
      title: 'Stripe Payment Intent ID',
      type: 'string',
    }),
    defineField({
      name: 'paymentStatus',
      title: 'Payment Status',
      type: 'string',
      options: {
        list: ['pending', 'paid', 'failed', 'refunded'],
      },
      initialValue: 'pending',
    }),
    
    // Line Items
    defineField({
      name: 'lineItems',
      title: 'Line Items',
      type: 'array',
      of: [{ type: 'orderLineItem' }],
      validation: (Rule) => Rule.required().min(1),
    }),
    
    // Shipping
    defineField({
      name: 'shippingAddress',
      title: 'Shipping Address',
      type: 'address',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'billingAddress',
      title: 'Billing Address',
      type: 'address',
      validation: (Rule) => Rule.required(),
    }),
    
    // Financials
    defineField({
      name: 'subtotal',
      title: 'Subtotal',
      type: 'number',
      validation: (Rule) => Rule.min(0).required(),
    }),
    defineField({
      name: 'shippingTotal',
      title: 'Shipping Total',
      type: 'number',
      validation: (Rule) => Rule.min(0).required(),
    }),
    defineField({
      name: 'taxTotal',
      title: 'Tax Total',
      type: 'number',
      validation: (Rule) => Rule.min(0).required(),
    }),
    defineField({
      name: 'total',
      title: 'Total',
      type: 'number',
      validation: (Rule) => Rule.min(0).required(),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'USD',
    }),
    
    // Split-Order Routing
    defineField({
      name: 'routing_status',
      title: 'Routing Status',
      type: 'string',
      options: {
        list: ['pending', 'processing', 'routed', 'partially_routed', 'failed'],
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'splitOrders',
      title: 'Split Orders',
      type: 'array',
      of: [{ type: 'splitOrder' }],
    }),
    
    // Fulfillment Tracking
    defineField({
      name: 'fulfillmentNotificationsSent',
      title: 'Fulfillment Notifications Sent',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'notificationTimestamps',
      title: 'Notification Timestamps',
      type: 'object',
      fields: [],
      options: { columns: 2 },
    }),
  ],
  preview: {
    select: {
      title: 'orderNumber',
      subtitle: 'customerName',
      total: 'total',
      status: 'routing_status',
    },
    prepare(selection) {
      const { title, subtitle, total, status } = selection;
      return {
        title,
        subtitle: `${subtitle} - $${total} (${status})`,
      };
    },
  },
});

// ==================== ORDER LINE ITEM SUB-SCHEMA ====================
export const orderLineItemSchema = defineType({
  name: 'orderLineItem',
  title: 'Order Line Item',
  type: 'object',
  fields: [
    defineField({ name: 'productId', type: 'string', title: 'Product ID' }),
    defineField({ name: 'productName', type: 'string', title: 'Product Name' }),
    defineField({ name: 'productSku', type: 'string', title: 'Product SKU' }),
    defineField({ name: 'supplierId', type: 'string', title: 'Supplier ID' }),
    defineField({ name: 'supplierName', type: 'string', title: 'Supplier Name' }),
    defineField({ name: 'quantity', type: 'number', title: 'Quantity' }),
    defineField({ name: 'unitPrice', type: 'number', title: 'Unit Price' }),
    defineField({ name: 'totalPrice', type: 'number', title: 'Total Price' }),
    defineField({
      name: 'wineDetails',
      title: 'Wine Details',
      type: 'object',
      fields: [
        { name: 'vintage', type: 'number', title: 'Vintage' },
        { name: 'varietal', type: 'string', title: 'Varietal' },
        { name: 'region', type: 'string', title: 'Region' },
      ],
    }),
  ],
});

// ==================== SPLIT ORDER SUB-SCHEMA ====================
export const splitOrderSchema = defineType({
  name: 'splitOrder',
  title: 'Split Order',
  type: 'object',
  fields: [
    defineField({ name: 'supplierId', type: 'string', title: 'Supplier ID' }),
    defineField({ name: 'supplierName', type: 'string', title: 'Supplier Name' }),
    defineField({ name: 'supplierEmail', type: 'email', title: 'Supplier Email' }),
    defineField({ name: 'lineItemIds', type: 'array', of: [{ type: 'string' }], title: 'Line Item IDs' }),
    defineField({ name: 'itemCount', type: 'number', title: 'Item Count' }),
    defineField({ name: 'itemTotal', type: 'number', title: 'Item Total' }),
    defineField({
      name: 'fulfillmentStatus',
      title: 'Fulfillment Status',
      type: 'string',
      options: {
        list: ['pending', 'notified', 'confirmed', 'shipped', 'delivered', 'failed'],
      },
    }),
    defineField({ name: 'notificationSentAt', type: 'datetime', title: 'Notification Sent At' }),
    defineField({ name: 'trackingNumber', type: 'string', title: 'Tracking Number' }),
    defineField({ name: 'carrier', type: 'string', title: 'Carrier' }),
  ],
});

// ==================== ADDRESS SUB-SCHEMA ====================
export const addressSchema = defineType({
  name: 'address',
  title: 'Address',
  type: 'object',
  fields: [
    defineField({ name: 'firstName', type: 'string', title: 'First Name' }),
    defineField({ name: 'lastName', type: 'string', title: 'Last Name' }),
    defineField({ name: 'company', type: 'string', title: 'Company' }),
    defineField({ name: 'address1', type: 'string', title: 'Address Line 1' }),
    defineField({ name: 'address2', type: 'string', title: 'Address Line 2' }),
    defineField({ name: 'city', type: 'string', title: 'City' }),
    defineField({ name: 'subdivision', type: 'string', title: 'State/Province' }),
    defineField({ name: 'postalCode', type: 'string', title: 'Postal Code' }),
    defineField({ name: 'country', type: 'string', title: 'Country' }),
    defineField({ name: 'phone', type: 'string', title: 'Phone' }),
  ],
});

// ==================== BLOG POST SCHEMA ====================
export const blogPostSchema = defineType({
  name: 'blogPost',
  title: 'Blog Posts',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
      validation: (Rule) => Rule.required(),
    }),
    
    // Author
    defineField({
      name: 'author',
      title: 'Author',
      type: 'object',
      fields: [
        { name: 'name', type: 'string', title: 'Name' },
        { name: 'image', type: 'image', title: 'Image' },
      ],
    }),
    
    // SEO
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
    }),
    
    // Content Organization
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
    }),
    
    // Local SEO
    defineField({
      name: 'relatedLocations',
      title: 'Related Locations',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'relatedProducts',
      title: 'Related Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
    }),
    
    // FAQ Schema Support
    defineField({
      name: 'faqSections',
      title: 'FAQ Sections',
      type: 'array',
      of: [{ type: 'faqSection' }],
    }),
    
    // Publishing
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: new Date().toISOString(),
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'featuredImage',
    },
    prepare(selection) {
      const { title, author } = selection;
      return {
        title,
        subtitle: author ? `by ${author}` : 'Draft',
      };
    },
  },
});

// ==================== FAQ SECTION SUB-SCHEMA ====================
export const faqSectionSchema = defineType({
  name: 'faqSection',
  title: 'FAQ Section',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
  ],
});

// ==================== BLOCK CONTENT FOR RICH TEXT ====================
export const blockContentSchema = defineType({
  name: 'blockContent',
  title: 'Block Content',
  type: 'array',
  of: [
    { type: 'block' },
    { type: 'image', options: { hotspot: true } },
  ],
});

// Export all schemas
export const schemaTypes = [
  supplierSchema,
  serviceZoneSchema,
  syncErrorSchema,
  productSchema,
  orderSchema,
  orderLineItemSchema,
  splitOrderSchema,
  addressSchema,
  blogPostSchema,
  faqSectionSchema,
  blockContentSchema,
];
