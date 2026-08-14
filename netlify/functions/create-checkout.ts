import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, customerInfo, shippingAddress } = JSON.parse(event.body || '{}');

    if (!items || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No items in cart' }),
      };
    }

    // Group items by supplier for split-order metadata
    const itemsBySupplier = items.reduce((acc: Record<string, any[]>, item: any) => {
      const supplierId = item.supplierId;
      if (!acc[supplierId]) acc[supplierId] = [];
      acc[supplierId].push(item);
      return acc;
    }, {});

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description,
          images: item.images?.length ? [item.images[0]] : undefined,
          metadata: {
            productId: item.productId,
            supplierId: item.supplierId,
          },
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Create checkout session with split-order metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/cart`,
      customer_email: customerInfo?.email,
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 999, currency: 'usd' },
            display_name: 'Standard Shipping',
            delivery_estimate: { minimum: { unit: 'business_day', value: 3 }, maximum: { unit: 'business_day', value: 5 } },
          },
        },
      ],
      metadata: {
        supplierIds: Object.keys(itemsBySupplier).join(','),
        itemCount: items.length.toString(),
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('Checkout creation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout', message: error.message }),
    };
  }
};
