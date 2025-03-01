import { MercadoPagoConfig } from 'mercadopago';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize MercadoPago client with SDK v2.x pattern
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Get the subscription plan ID from the query parameters
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('plan_id');

    if (!planId) {
      return NextResponse.json(
        { error: 'ID de plan de suscripción no proporcionado' },
        { status: 400 }
      );
    }

    console.log(`Verifying subscription plan with ID: ${planId}`);

    // Get subscription plan details from MercadoPago
    try {
      // Use direct API call instead of SDK
      const response = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('MercadoPago API error:', errorData);
        throw new Error(`Error from MercadoPago API: ${JSON.stringify(errorData)}`);
      }
      
      const plan = await response.json();
      
      console.log('Subscription plan details:', JSON.stringify(plan, null, 2));
      
      // Check if the plan is in a valid state
      const validStatuses = ['active', 'pending', 'paused'];
      if (!validStatuses.includes(plan.status)) {
        return NextResponse.json({
          error: `El plan de suscripción está en estado "${plan.status}"`,
          details: plan,
          status: plan.status
        }, { status: 400 });
      }
      
      // Return relevant subscription plan information
      return NextResponse.json({
        status: plan.status,
        externalReference: plan.external_reference,
        createdAt: plan.date_created,
        type: 'plan',
        details: plan
      });
    } catch (error) {
      console.error('Error verificando plan de suscripción:', error);
      
      // Log more detailed error information
      if (error.cause?.response?.data) {
        console.error('MercadoPago API error:', error.cause.response.data);
      }
      
      return NextResponse.json(
        { 
          error: `Error al verificar el plan de suscripción: ${error.message || 'Error desconocido'}`,
          details: error.cause?.response?.data || error.cause || error.stack
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error general verificando plan de suscripción:', error);
    return NextResponse.json(
      { 
        error: `Error al verificar el plan de suscripción: ${error.message || 'Error desconocido'}`,
        details: error.cause || error.stack
      },
      { status: 500 }
    );
  }
} 