import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Store processed session IDs to prevent duplicate processing
const processedSessions = new Set<string>();

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];

  if (!signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing Stripe signature' }),
    };
  }

  try {
    // Verify webhook signature
    const eventObj = stripe.webhooks.constructEvent(
      event.body,
      signature,
      webhookSecret
    );

    // Handle the checkout session completed event
    if (eventObj.type === 'checkout.session.completed') {
      const session = eventObj.data.object as Stripe.Checkout.Session;

      // Idempotency check - skip if already processed
      if (processedSessions.has(session.id)) {
        console.log(`Session ${session.id} already processed, skipping`);
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
      }

      // Mark as processing
      processedSessions.add(session.id);

      try {
        await processOrder(session);
      } catch (error) {
        console.error('Order processing failed:', error);
        // Log failure to Sanity for manual review
        await logFailedOrder(session, error.message);
        
        // Remove from processed set so it can be retried
        processedSessions.delete(session.id);
        
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Order processing failed' }),
        };
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${error.message}` }),
    };
  }
};

async function processOrder(session: Stripe.Checkout.Session) {
  const { customer_details, shipping_details, metadata } = session;
  const supplierIds = metadata.supplierIds?.split(',') || [];

  // Fetch full line items with product details
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  // Group items by supplier for split-order routing
  const itemsBySupplier = groupItemsBySupplier(lineItems.data, supplierIds);

  // Create order records in Sanity
  const orderId = await createOrderInSanity({
    sessionId: session.id,
    customer: customer_details,
    shipping: shipping_details,
    itemsBySupplier,
    total: session.amount_total ? session.amount_total / 100 : 0,
    status: 'paid',
  });

  // Send fulfillment emails to each supplier
  for (const [supplierId, items] of Object.entries(itemsBySupplier)) {
    try {
      await sendSupplierEmail(supplierId, {
        orderId,
        items,
        shippingAddress: shipping_details,
        customerEmail: customer_details?.email,
      });
    } catch (error) {
      console.error(`Failed to notify supplier ${supplierId}:`, error);
      // Update order with routing failure
      await updateOrderRoutingStatus(orderId, supplierId, 'failed');
    }
  }

  console.log(`Order ${orderId} processed successfully`);
}

function groupItemsBySupplier(lineItems: any[], supplierIds: string[]) {
  // Would need to fetch product metadata to get supplier IDs
  // This is simplified - in production would query Sanity for product-supplier mapping
  return lineItems.reduce((acc, item) => {
    const supplierId = item.price?.product?.metadata?.supplierId || supplierIds[0];
    if (!acc[supplierId]) acc[supplierId] = [];
    acc[supplierId].push({
      productId: item.price?.product?.metadata?.productId,
      name: item.description,
      quantity: item.quantity,
      price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
    });
    return acc;
  }, {} as Record<string, any[]>);
}

async function createOrderInSanity(orderData: any) {
  // Would use Sanity client to create order document
  const orderId = `order-${Date.now()}`;
  console.log('Creating order:', orderId, orderData);
  return orderId;
}

async function sendSupplierEmail(supplierId: string, orderData: any) {
  // Would use email service (SendGrid, Resend, etc.)
  console.log(`Sending email to supplier ${supplierId} for order ${orderData.orderId}`);
}

async function logFailedOrder(session: any, error: string) {
  // Log to Sanity for manual review
  console.log('Logging failed order:', session.id, error);
}

async function updateOrderRoutingStatus(orderId: string, supplierId: string, status: string) {
  // Update order document in Sanity
  console.log(`Updating order ${orderId} supplier ${supplierId} status to ${status}`);
}
