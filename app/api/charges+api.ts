import { supabase } from '@/services/supabase';

export async function POST(request: Request) {
  try {
    const { userId, paymentId, amount, note } = await request.json();
    
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || user.id !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate input
    if (!paymentId || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid payment data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create charge record
    const { data: charge, error: chargeError } = await supabase
      .from('charges')
      .insert({
        user_id: userId,
        payment_id: paymentId,
        amount: amount,
        currency: 'LZAR',
        status: 'pending',
        description: note || 'Payment request',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single();

    if (chargeError) {
      return new Response(JSON.stringify({ error: 'Failed to create charge' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process charge using Stablecoin API
    try {
      const stablecoinResponse = await fetch(`${process.env.STABLECOIN_API_URL}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STABLECOIN_API_KEY}`,
        },
        body: JSON.stringify({
          merchant_id: userId,
          payment_id: paymentId,
          amount: amount,
          currency: 'LZAR',
          description: note,
          reference: charge.id,
        }),
      });

      if (!stablecoinResponse.ok) {
        throw new Error('Stablecoin API charge creation failed');
      }

      const stablecoinData = await stablecoinResponse.json();

      // Update charge with external reference
      await supabase
        .from('charges')
        .update({ 
          external_id: stablecoinData.id,
          status: 'active'
        })
        .eq('id', charge.id);

    } catch (stablecoinError) {
      console.error('Stablecoin API error:', stablecoinError);
      
      // Update charge status to failed
      await supabase
        .from('charges')
        .update({ status: 'failed' })
        .eq('id', charge.id);

      return new Response(JSON.stringify({ error: 'Charge processing failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      charge: {
        ...charge,
        status: 'active'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Charges API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}