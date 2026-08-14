import type { APIRoute } from 'astro';
import { sanityFetch } from '../lib/sanity';

export const GET: APIRoute = async () => {
  const siteUrl = 'https://wine-drop.example.com';
  
  // Fetch products and blog posts for dynamic routes
  let products: Array<{ slug: string }> = [];
  let blogPosts: Array<{ slug: string }> = [];
  let suppliers: Array<{ slug: string }> = [];

  try {
    products = await sanityFetch(`*[_type == "product" && defined(slug.current)]{ "slug": slug.current }`) || [];
    blogPosts = await sanityFetch(`*[_type == "blogPost" && defined(slug.current)]{ "slug": slug.current }`) || [];
    suppliers = await sanityFetch(`*[_type == "supplier" && defined(slug.current)]{ "slug": slug.current }`) || [];
  } catch (error) {
    console.error('Error fetching sitemap data:', error);
  }

  // Static routes
  const staticRoutes = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/shop', changefreq: 'daily', priority: '0.9' },
    { loc: '/about', changefreq: 'monthly', priority: '0.8' },
    { loc: '/faq', changefreq: 'monthly', priority: '0.7' },
    { loc: '/blog', changefreq: 'daily', priority: '0.8' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.6' },
  ];

  // Dynamic product routes
  const productRoutes = products.map((p: any) => ({
    loc: `/product/${p.slug}`,
    changefreq: 'weekly' as const,
    priority: '0.8',
  }));

  // Dynamic blog routes
  const blogRoutes = blogPosts.map((p: any) => ({
    loc: `/blog/${p.slug}`,
    changefreq: 'monthly' as const,
    priority: '0.6',
  }));

  // Supplier routes
  const supplierRoutes = suppliers.map((s: any) => ({
    loc: `/supplier/${s.slug}`,
    changefreq: 'weekly' as const,
    priority: '0.7',
  }));

  // Local landing pages (example cities - would be generated from actual service areas)
  const localPages = [
    { city: 'new-york', name: 'New York' },
    { city: 'los-angeles', name: 'Los Angeles' },
    { city: 'chicago', name: 'Chicago' },
    { city: 'houston', name: 'Houston' },
    { city: 'phoenix', name: 'Phoenix' },
    { city: 'philadelphia', name: 'Philadelphia' },
    { city: 'san-antonio', name: 'San Antonio' },
    { city: 'san-diego', name: 'San Diego' },
    { city: 'dallas', name: 'Dallas' },
    { city: 'san-jose', name: 'San Jose' },
  ].map(({ city, name }) => ({
    loc: `/wine-delivery-${city}`,
    changefreq: 'weekly' as const,
    priority: '0.7',
    title: `Wine Delivery in ${name} | Wine Drop`,
  }));

  const allRoutes = [...staticRoutes, ...productRoutes, ...blogRoutes, ...supplierRoutes, ...localPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allRoutes.map(route => `  <url>
    <loc>${siteUrl}${route.loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
