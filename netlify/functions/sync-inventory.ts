import type { Handler } from '@netlify/functions';
import { parseXMLFeed } from '../utils/xml-parser';
import { parseCSVFeed } from '../utils/csv-parser';
import { syncShopify } from '../utils/shopify-sync';
import { syncWooCommerce } from '../utils/woocommerce-sync';
import { upsertToSanity } from '../utils/sanity-client';
import { sendAdminNotification } from '../utils/notifications';

interface SyncResult {
  success: boolean;
  productsSynced: number;
  errors: string[];
  supplierId: string;
}

export const handler: Handler = async (event, context) => {
  console.log('Starting inventory sync');
  
  const results: SyncResult[] = [];
  let totalErrors = 0;
  
  try {
    // Fetch all suppliers needing sync
    const suppliers = await fetchSuppliersForSync();
    
    for (const supplier of suppliers) {
      try {
        let result: SyncResult;
        
        switch (supplier.syncType) {
          case 'shopify':
            result = await syncShopify(supplier);
            break;
          case 'woocommerce':
            result = await syncWooCommerce(supplier);
            break;
          case 'xml':
            result = await processXMLFeed(supplier);
            break;
          case 'csv':
            result = await processCSVFeed(supplier);
            break;
          default:
            throw new Error(`Unknown sync type: ${supplier.syncType}`);
        }
        
        results.push(result);
        if (result.errors.length > 0) {
          totalErrors += result.errors.length;
        }
        
        // Log sync result
        await logSyncResult(supplier._id, result);
        
      } catch (error) {
        console.error(`Sync failed for supplier ${supplier.name}:`, error);
        results.push({
          success: false,
          productsSynced: 0,
          errors: [error.message],
          supplierId: supplier._id,
        });
        totalErrors++;
      }
    }
    
    // Send notification if there were failures
    if (totalErrors > 0) {
      await sendAdminNotification(
        `Inventory Sync: ${totalErrors} error(s) occurred`,
        `Sync completed with ${totalErrors} errors across ${results.length} suppliers.`
      );
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Sync completed',
        results,
        totalErrors,
      }),
    };
    
  } catch (error) {
    console.error('Critical sync error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Sync failed', message: error.message }),
    };
  }
};

async function processXMLFeed(supplier: any): Promise<SyncResult> {
  const response = await fetch(supplier.feedUrl, {
    headers: { 'User-Agent': 'WineDrop-Sync/1.0' },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch XML feed: ${response.statusText}`);
  }
  
  const xml = await response.text();
  const products = parseXMLFeed(xml);
  
  const normalized = normalizeProducts(products, supplier._id);
  const upserted = await upsertToSanity(normalized);
  
  return {
    success: true,
    productsSynced: upserted.length,
    errors: [],
    supplierId: supplier._id,
  };
}

async function processCSVFeed(supplier: any): Promise<SyncResult> {
  const response = await fetch(supplier.feedUrl, {
    headers: { 'User-Agent': 'WineDrop-Sync/1.0' },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV feed: ${response.statusText}`);
  }
  
  const csv = await response.text();
  const products = parseCSVFeed(csv);
  
  const normalized = normalizeProducts(products, supplier._id);
  const upserted = await upsertToSanity(normalized);
  
  return {
    success: true,
    productsSynced: upserted.length,
    errors: [],
    supplierId: supplier._id,
  };
}

function normalizeProducts(products: any[], supplierId: string) {
  return products.map(p => ({
    _type: 'product',
    name: p.title || p.name,
    sku: p.sku || p.id,
    supplierId,
    price: parseFloat(p.price) || 0,
    description: p.description,
    region: p.region,
    varietal: p.varietal,
    vintage: p.vintage,
    images: p.images?.map((img: string) => ({ asset: { _ref: img } })),
    inStock: p.inStock !== false,
    lastSynced: new Date().toISOString(),
  }));
}

async function fetchSuppliersForSync() {
  // Would query Sanity for suppliers due for sync
  return [
    {
      _id: 'supplier-1',
      name: 'Test Supplier',
      syncType: 'xml',
      feedUrl: 'https://example.com/feed.xml',
    },
  ];
}

async function logSyncResult(supplierId: string, result: SyncResult) {
  await upsertToSanity([{
    _type: 'syncLog',
    supplierId,
    success: result.success,
    productsSynced: result.productsSynced,
    errors: result.errors,
    timestamp: new Date().toISOString(),
  }]);
}
