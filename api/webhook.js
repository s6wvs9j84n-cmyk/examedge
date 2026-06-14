import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const body = req.body;

    // Handle both old and new Stripe event formats
    const eventType = body?.type || body?.event_type;
    const sessionData = body?.data?.object || body?.data;

    console.log('Webhook received:', eventType);
    console.log('Session data:', JSON.stringify(sessionData));

    if (eventType === 'checkout.session.completed') {
      const userId = sessionData?.metadata?.user_id ||
                     sessionData?.custom_fields?.find(f => f.key === 'user_id')?.text?.value;

      console.log('User ID from metadata:', userId);

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_premium: true, markings_used: 0 })
          .eq('user_id', userId);

        if (error) {
          console.log('Supabase error:', error);
          return res.status(500).json({ error: error.message });
        }

        console.log('Successfully upgraded user:', userId);
      }
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.log('Webhook error:', error.message);
    return res.status(200).json({ received: true });
  }
}