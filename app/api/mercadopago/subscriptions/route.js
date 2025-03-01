import { MercadoPagoConfig } from 'mercadopago';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize MercadoPago client with SDK v2.x pattern
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

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
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { planId } = await request.json();
    const userId = session.user.id;

    if (!planId || !PLAN_CONFIGS[planId]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }
    
    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const plan = PLAN_CONFIGS[planId];
    const previousTier = user.accountTier || 'FREE';
    
    // Fix double slash issue in webhook URL if present
    let notificationUrl = null;
    if (process.env.NEXT_PUBLIC_WEBHOOK_URL) {
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL.endsWith('/') 
        ? process.env.NEXT_PUBLIC_WEBHOOK_URL.slice(0, -1) 
        : process.env.NEXT_PUBLIC_WEBHOOK_URL;
      
      notificationUrl = `${webhookUrl}/api/mercadopago/webhook`;
    }
    
    // Create plan with all required fields according to Mercado Pago API
    const planData = {
      reason: plan.description,
      external_reference: `${userId}-${planId}`,
      // Use ngrok URL for back_url since localhost is not accepted by Mercado Pago
      back_url: process.env.NEXT_PUBLIC_WEBHOOK_URL 
        ? `${process.env.NEXT_PUBLIC_WEBHOOK_URL.endsWith('/') 
            ? process.env.NEXT_PUBLIC_WEBHOOK_URL.slice(0, -1) 
            : process.env.NEXT_PUBLIC_WEBHOOK_URL}/planes/success`
        : "https://gestionatuarriendo.cl/planes/success", // Fallback to production URL
      auto_recurring: {
        frequency: plan.frequency,
        frequency_type: plan.frequency_type,
        transaction_amount: plan.amount,
        currency_id: "CLP",
        // Add billing day to ensure it's within the valid range (1-28)
        billing_day: 1,
        // Don't charge proportionally for the first period
        billing_day_proportional: false
      },
      payment_methods_allowed: {
        payment_types: [
          { id: "credit_card" },
          { id: "debit_card" }
        ]
      }
    };
    
    // Only add notification URL if available
    if (notificationUrl) {
      planData.notification_url = notificationUrl;
    }

    console.log('Creating subscription plan with data:', JSON.stringify(planData, null, 2));
    
    // Create the subscription plan using direct API call
    console.log('Sending request to Mercado Pago API...');
    const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(planData)
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('MercadoPago API error:', errorData);
      console.error('Request data that caused the error:', JSON.stringify(planData, null, 2));
      throw new Error(`Error from MercadoPago API: ${JSON.stringify(errorData)}`);
    }
    
    const subscriptionPlan = await response.json();
    
    console.log('Subscription plan created:', JSON.stringify(subscriptionPlan, null, 2));

    if (!subscriptionPlan.id) {
      throw new Error('No se recibió un ID de plan de suscripción válido');
    }
    
    // Store metadata in a format that the database can handle
    const metadataToStore = {
      ...user.metadata, // Preserve existing metadata
      subscription_metadata: {
        plan_id: planId,
        previous_tier: previousTier,
        subscription_plan_id: subscriptionPlan.id,
        created_at: new Date().toISOString()
      }
    };
    
    // Mark the user as having a pending subscription
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'pending',
        subscriptionId: subscriptionPlan.id,
        metadata: metadataToStore
      }
    });
    
    // Return the init_point for redirection to Mercado Pago checkout
    return NextResponse.json({
      init_point: subscriptionPlan.init_point,
      sandbox_init_point: subscriptionPlan.sandbox_init_point || subscriptionPlan.init_point,
      preapproval_plan_id: subscriptionPlan.id
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    
    // Log more detailed error information
    if (error.cause?.response?.data) {
      console.error('MercadoPago API error:', error.cause.response.data);
    }
    
    return NextResponse.json(
      { 
        error: 'Error al crear el plan de suscripción', 
        details: error.message,
        cause: error.cause?.response?.data || error.cause || error.stack
      },
      { status: 500 }
    );
  }
}