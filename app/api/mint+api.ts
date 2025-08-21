import { supabase } from '@/services/supabase';

export async function POST(request: Request) {
  try {
    const { transactionAmount, transactionRecipient, transactionNotes } = await request.json();
    
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
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate input
    if (!transactionAmount || transactionAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const recipientId = transactionRecipient || user.id;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        sender_id: null, // System mint
        recipient_id: recipientId,
        amount: transactionAmount,
        currency: 'LZAR',
        type: 'mint',
        status: 'pending',
        description: transactionNotes || 'Token mint',
      })
      .select()
      .single();

    if (txError) {
      return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process mint using Stablecoin API
    try {
      const stablecoinResponse = await fetch(`${process.env.STABLECOIN_API_URL}/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STABLECOIN_API_KEY}`,
        },
        body: JSON.stringify({
          to: recipientId,
          amount: transactionAmount,
          currency: 'LZAR',
          reference: transaction.id,
        }),
      });

      if (!stablecoinResponse.ok) {
        throw new Error('Stablecoin API mint failed');
      }

      // Update transaction status to completed
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      // Update recipient wallet balance
      await supabase.rpc('update_wallet_balance', {
        user_id: recipientId,
        amount: transactionAmount
      });

    } catch (stablecoinError) {
      console.error('Stablecoin API error:', stablecoinError);
      
      // Update transaction status to failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      return new Response(JSON.stringify({ error: 'Mint processing failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      transaction: {
        ...transaction,
        status: 'completed'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Mint API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}