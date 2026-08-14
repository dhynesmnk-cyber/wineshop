# Wine Drop - Hyper-Local Wine Dropshipping Platform

A complete e-commerce platform for dropshipping wines based on user proximity, featuring a blog for SEO/GEO, admin CMS, universal supplier sync, and Netlify deployment.

## 🍷 Features

- **Geo-Targeted Shopping**: Shows wines available from suppliers within delivery radius
- **Multi-Supplier Cart**: Support for split-order fulfillment
- **Universal Supplier Sync**: Automated inventory sync with Shopify, WooCommerce, Google Merchant (XML/CSV)
- **Age Verification**: 21+ gate with localStorage persistence
- **SEO Optimized**: Structured data, local landing pages, llms.txt, sitemap
- **Stripe Integration**: Secure checkout with webhook handling
- **Sanity CMS**: Full content management for products, suppliers, orders, and blog

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Astro.js 4 + TypeScript + Tailwind CSS + React (islands) |
| CMS | Sanity.io (products/suppliers/orders) |
| Backend | Netlify Edge Functions + Scheduled Functions |
| Payments | Stripe Checkout + Webhooks |
| Deployment | Netlify |
| State Management | Zustand (cart) |

## 📁 Project Structure

```
wine-drop/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AgeGate.astro
│   │   ├── CartDrawer.astro
│   │   └── ProductCard.astro
│   ├── layouts/             # Page layouts
│   │   └── BaseLayout.astro
│   ├── lib/                 # Utilities & clients
│   │   ├── cart.ts          # Zustand cart store
│   │   ├── sanity.ts        # Sanity client & queries
│   │   ├── geo.ts           # Geolocation utilities
│   │   ├── stripe.ts        # Stripe helpers
│   │   └── types.ts         # TypeScript interfaces
│   └── pages/               # Pages & API routes
│       ├── index.astro
│       ├── shop.astro
│       ├── product/
│       ├── blog/
│       ├── wine-delivery-[city].astro
│       └── sitemap.xml.ts
├── netlify/
│   ├── edge-functions/      # Edge functions
│   │   └── geo.ts
│   └── functions/           # Serverless functions
│       ├── sync-inventory.ts
│       ├── create-checkout.ts
│       └── stripe-webhook.ts
├── sanity/
│   ├── schemaTypes/         # Sanity schemas
│   └── structure.ts         # CMS structure
├── public/
│   ├── llms.txt             # AI search engine entity graph
│   └── robots.txt
├── astro.config.mjs
├── tailwind.config.js
├── netlify.toml
├── .env.example
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Sanity.io account
- Stripe account
- Netlify account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wine-drop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   # Sanity
   SANITY_PROJECT_ID=your-project-id
   SANITY_DATASET=production
   SANITY_API_TOKEN=your-api-token
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Site
   SITE_URL=http://localhost:4321
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🌐 Deployment

### Netlify Setup

1. Connect your Git repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist/`
4. Add environment variables from `.env.example`

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SANITY_PROJECT_ID` | Sanity project ID | Yes |
| `SANITY_DATASET` | Sanity dataset name | Yes |
| `SANITY_API_TOKEN` | Sanity API token (read/write) | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes |
| `SITE_URL` | Production URL | Yes |

### Post-Deployment Checklist

- [ ] Configure Stripe webhook endpoint (`/api/stripe-webhook`)
- [ ] Set up Sanity CORS origins
- [ ] Test age gate functionality
- [ ] Verify geo-location headers
- [ ] Run initial supplier sync
- [ ] Submit sitemap to Google Search Console

## 🔄 Supplier Sync

The platform supports automatic inventory sync from multiple sources:

- **Shopify**: GraphQL Storefront API
- **WooCommerce**: REST API v3
- **Google Merchant**: XML and CSV feeds

Sync runs every 6 hours via Netlify Scheduled Functions. Manual sync can be triggered from the Sanity CMS.

## 📊 CMS Structure

Access Sanity Studio at `/admin` (after deployment):

- **Products**: Manage wine listings, link to suppliers
- **Suppliers**: Configure sync methods, API keys, feed URLs
- **Orders**: View split-order routing status
- **Sync Logs**: Monitor sync success/failure
- **Blog**: Create posts with SEO fields and FAQ blocks

## 🔒 Security

- Age verification required before browsing
- Stripe webhook signature verification
- Idempotent order processing
- No sensitive data in client bundles
- Security headers configured in `netlify.toml`

## 📈 SEO Features

- Auto-generated sitemap.xml
- robots.txt with AI crawler rules
- llms.txt for AI search engines
- LocalBusiness structured data on city pages
- Product schema on all product pages
- FAQ schema on blog posts
- Open Graph + Twitter Card tags

## 🧪 Testing

```bash
# Run Lighthouse audit
npm run audit

# Type checking
npm run type-check

# Build validation
npm run build
```

## 📝 License

MIT

## 🤝 Support

- Email: support@wine-drop.example.com
- Documentation: See individual component comments

---

Built with Astro, Sanity, and Netlify.
