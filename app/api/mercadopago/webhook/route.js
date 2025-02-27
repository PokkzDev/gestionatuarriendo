import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { NextResponse } from 'next/server';
import prisma  from '@/lib/prisma';
import crypto from 'crypto';

// Initialize MercadoPago client with SDK v2.x pattern
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preapprovalClient = new PreApproval(client);

export async function POST(request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-signature');
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('MP_WEBHOOK_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // Verify signature if provided
    if (signature) {
      const generatedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
      
      if (signature !== generatedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      // For development purposes, you might want to allow requests without signatures
      // but in production, you should require signatures
      if (process.env.NODE_ENV === 'production') {
        console.error('Missing webhook signature in production environment');
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        );
      }
      console.warn('Proceeding without signature verification - NOT RECOMMENDED FOR PRODUCTION');
    }
    
    if (body.type === 'subscription_preapproval') {
      const preapprovalId = body.data.id;
      // Use the new SDK pattern to find the subscription
      const subscription = await preapprovalClient.get({ id: preapprovalId });
      
      const { external_reference, status } = subscription;
      const [userId, planId] = external_reference.split('-');

      // Update user's subscription status in your database
      if (status === 'authorized') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            accountTier: planId,
            subscriptionId: preapprovalId,
            subscriptionStatus: 'active'
          }
        });
      } else if (status === 'cancelled' || status === 'paused') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            accountTier: 'FREE',
            subscriptionStatus: status
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}