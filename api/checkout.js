import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { userId, email } = req.body;

    console.log('Creating checkout for user:', userId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }],
      metadata: {
        user_id: userId
      },
      subscription_data: {
        metadata: {
          user_id: userId
        }
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/index.html`
    });

    console.log('Checkout session created:', session.id);
    console.log('Metadata:', session.metadata);

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.log('Checkout error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}