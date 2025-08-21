import { supabase } from '@/services/supabase';
import { createHmac } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    
    // Verify webhook signature
    if (!signature || !process.env.STABLECOIN_WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    const expectedSignature = createHmac('sha256', process.env.STABLECOIN_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== `sha256=${expectedSignature}`) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    
    switch (event.type) {
      case 'transaction.completed':
        await handleTransactionCompleted(event.data);
        break;
      case 'transaction.failed':
        await handleTransactionFailed(event.data);
        break;
      case 'charge.paid':
        await handleChargePaid(event.data);
        break;
      case 'charge.expired':
        await handleChargeExpired(event.data);
        break;
      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleTransactionCompleted(data: any) {
  const { reference, transaction_id } = data;
  
  await supabase
    .from('transactions')
    .update({ 
      status: 'completed',
      external_id: transaction_id
    })
    .eq('id', reference);
}

async function handleTransactionFailed(data: any) {
  const { reference, transaction_id, error_message } = data;
  
  await supabase
    .from('transactions')
    .update({ 
      status: 'failed',
      external_id: transaction_id,
      error_message
    })
    .eq('id', reference);
}

async function handleChargePaid(data: any) {
  const { reference, charge_id, payer_id, amount } = data;
  
  // Update charge status
  await supabase
    .from('charges')
    .update({ 
      status: 'paid',
      payer_id,
      paid_at: new Date().toISOString()
    })
    .eq('id', reference);

  // Create transaction record for the payment
  const { data: charge } = await supabase
    .from('charges')
    .select('user_id, amount, currency')
    .eq('id', reference)
    .single();

  if (charge) {
    await supabase
      .from('transactions')
      .insert({
        sender_id: payer_id,
        recipient_id: charge.user_id,
        amount: charge.amount,
        currency: charge.currency,
        type: 'payment',
        status: 'completed',
        description: 'Charge payment',
        external_id: charge_id
      });

    // Update wallet balances
    await supabase.rpc('update_wallet_balance', {
      user_id: charge.user_id,
      amount: charge.amount
    });
  }
}

async function handleChargeExpired(data: any) {
  const { reference } = data;
  
  await supabase
    .from('charges')
    .update({ status: 'expired' })
    .eq('id', reference);
}