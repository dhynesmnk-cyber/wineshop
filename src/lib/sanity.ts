import { createClient, type SanityClient } from '@sanity/client';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

interface SanityConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  useCdn: boolean;
  token?: string;
}

// Environment variables (never hardcode secrets)
const sanityConfig: SanityConfig = {
  projectId: import.meta.env.SANITY_PROJECT_ID || 'your-project-id',
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: import.meta.env.SANITY_API_VERSION || '2024-01-01',
  useCdn: import.meta.env.SANITY_USE_CDN !== 'false', // Default to true for production
  token: import.meta.env.SANITY_API_TOKEN, // Optional, for write operations
};

/**
 * Create a Sanity client instance
 * Use CDN for read-only operations in production
 * Use direct API for write operations or preview mode
 */
export function createSanityClient(options: Partial<SanityConfig> = {}): SanityClient {
  const config = { ...sanityConfig, ...options };
  
  return createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    useCdn: config.useCdn,
    token: config.token,
    perspective: config.token ? 'previewDrafts' : 'published',
  });
}

/**
 * Get a read-only client (uses CDN by default)
 */
export const sanityReadOnlyClient = createSanityClient({ useCdn: true });

/**
 * Get a write-enabled client (requires token)
 * Only use this server-side or in protected routes
 */
export function getSanityWriteClient(): SanityClient {
  if (!sanityConfig.token) {
    throw new Error('SANITY_API_TOKEN is required for write operations');
  }
  return createSanityClient({ useCdn: false, token: sanityConfig.token });
}

/**
 * Image URL helper using sanity-image-url
 * @param source - Image asset reference
 * @param width - Target width
 * @param height - Target height
 * @param fit - Fit mode (crop, fillmax, max, scale, etc.)
 */
export function getImageUrl(
  source: SanityImageSource,
  options: { width?: number; height?: number; fit?: string } = {}
): string {
  // This would normally use @sanity/image-url
  // For now, return a placeholder that should be replaced with actual implementation
  const { width = 800, height, fit = 'max' } = options;
  
  if (!source || typeof source !== 'object') {
    return '/placeholder-image.jpg';
  }
  
  const assetRef = (source as any)._ref || (source as any).asset?._ref;
  if (!assetRef) {
    return '/placeholder-image.jpg';
  }
  
  // Extract asset ID from reference format: image-<id>-<size>.<ext>
  const assetId = assetRef.split('-')[1];
  const extension = assetRef.split('.').pop() || 'jpg';
  
  let url = `https://cdn.sanity.io/images/${sanityConfig.projectId}/${sanityConfig.dataset}/${assetId}.${extension}`;
  
  // Add transformation parameters
  const params = new URLSearchParams();
  params.set('w', width.toString());
  params.set('fit', fit);
  
  if (height) {
    params.set('h', height.toString());
  }
  
  url += `?${params.toString()}`;
  
  return url;
}

/**
 * GROQ queries for common data fetching patterns
 */
export const groqQueries = {
  // Fetch all published products with supplier info
  products: `*[_type == "product" && published == true] | order(name asc) {
    _id,
    name,
    slug,
    description,
    price,
    salePrice,
    currency,
    sku,
    vintage,
    grapeVarieties,
    region,
    country,
    tastingNotes,
    foodPairings,
    alcoholContent,
    bottleSize,
    stock,
    availabilityZones,
    images[] {
      asset->{
        _ref,
        url,
        metadata
      },
      alt,
      caption
    },
    supplier->{_id, name, slug, location, deliveryRadius},
    categories[]->,
    tags,
    publishedAt,
    updatedAt
  }`,
  
  // Fetch single product by slug
  productBySlug: `*[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    price,
    salePrice,
    currency,
    sku,
    vintage,
    grapeVarieties,
    region,
    country,
    tastingNotes,
    foodPairings,
    alcoholContent,
    bottleSize,
    stock,
    availabilityZones,
    images[] {
      asset->{
        _ref,
        url,
        metadata
      },
      alt,
      caption
    },
    supplier->{_id, name, slug, location, deliveryRadius, syncMethod, apiCredentials},
    categories[]->,
    tags,
    publishedAt,
    updatedAt
  }`,
  
  // Fetch products available in a specific location
  productsByLocation: `*[_type == "product" && published == true] {
    ...,
    supplier->{_id, location, deliveryRadius}
  } | order(name asc)`,
  
  // Fetch all suppliers
  suppliers: `*[_type == "supplier"] | order(name asc) {
    _id,
    name,
    slug,
    description,
    logo,
    location,
    deliveryRadius,
    syncMethod,
    feedUrl,
    apiCredentials,
    isActive,
    contactEmail,
    contactPhone,
    shippingInfo,
    createdAt,
    updatedAt
  }`,
  
  // Fetch blog posts
  blogPosts: `*[_type == "blogPost" && published == true] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    featuredImage {
      asset->{
        _ref,
        url,
        metadata
      },
      alt
    },
    author->{
      name,
      image
    },
    categories[]->,
    tags,
    publishedAt,
    readingTime
  }`,
  
  // Fetch single blog post by slug
  blogPostBySlug: `*[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    content,
    excerpt,
    featuredImage {
      asset->{
        _ref,
        url,
        metadata
      },
      alt
    },
    author->{
      name,
      bio,
      image
    },
    categories[]->,
    tags,
    seoTitle,
    seoDescription,
    faq[],
    publishedAt,
    updatedAt,
    readingTime
  }`,
};

export default createSanityClient;
