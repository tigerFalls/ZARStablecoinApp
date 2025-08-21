import { supabase } from '@/services/supabase';

export async function POST(request: Request) {
  try {
    const { userId, amount } = await request.json();
    
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
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check user balance
    const { data: userWallet, error: balanceError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (balanceError || !userWallet) {
      return new Response(JSON.stringify({ error: 'Wallet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (userWallet.balance < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        sender_id: userId,
        recipient_id: null, // System redeem
        amount: amount,
        currency: 'LZAR',
        type: 'redeem',
        status: 'pending',
        description: 'Token redemption',
      })
      .select()
      .single();

    if (txError) {
      return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process redeem using Stablecoin API
    try {
      const stablecoinResponse = await fetch(`${process.env.STABLECOIN_API_URL}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STABLECOIN_API_KEY}`,
        },
        body: JSON.stringify({
          from: userId,
          amount: amount,
          currency: 'LZAR',
          reference: transaction.id,
        }),
      });

      if (!stablecoinResponse.ok) {
        throw new Error('Stablecoin API redeem failed');
      }

      // Update transaction status to completed
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      // Update user wallet balance
      await supabase.rpc('update_wallet_balance', {
        user_id: userId,
        amount: -amount
      });

    } catch (stablecoinError) {
      console.error('Stablecoin API error:', stablecoinError);
      
      // Update transaction status to failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      return new Response(JSON.stringify({ error: 'Redeem processing failed' }), {
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
    console.error('Redeem API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}