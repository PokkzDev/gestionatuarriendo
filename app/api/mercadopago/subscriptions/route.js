import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { NextResponse } from 'next/server';

// Initialize MercadoPago client with SDK v2.x pattern
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preapprovalClient = new PreApproval(client);

const PLAN_CONFIGS = {
  PREMIUM: {
    id: 'PREMIUM',
    amount: 9990,
    frequency: 1,
    frequency_type: 'months',
    description: 'Plan Premium - Gestiona tu Arriendo'
  },
  ELITE: {
    id: 'ELITE',
    amount: 19990,
    frequency: 1,
    frequency_type: 'months',
    description: 'Plan Elite - Gestiona tu Arriendo'
  }
};

export async function POST(request) {
  try {
    const { planId, userId } = await request.json();
    
    if (!planId || !PLAN_CONFIGS[planId]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const plan = PLAN_CONFIGS[planId];

    // Create a preference with MercadoPago
    const preference = {
      reason: plan.description,
      auto_recurring: {
        frequency: plan.frequency,
        frequency_type: plan.frequency_type,
        transaction_amount: plan.amount,
        currency_id: 'CLP'
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/planes/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/planes/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/planes/pending`
      },
      external_reference: `${userId}-${planId}`,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/webhook`
    };

    const subscription = await preapprovalClient.create(preference);
    
    return NextResponse.json({
      init_point: subscription.init_point,
      preapproval_id: subscription.id
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Error al crear la suscripción' },
      { status: 500 }
    );
  }
}