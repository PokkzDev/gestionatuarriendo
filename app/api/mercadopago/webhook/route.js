import { MercadoPagoConfig } from 'mercadopago';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import crypto from 'crypto';


// Initialize MercadoPago client with SDK v2.x pattern
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

async function verifyWebhookSignature(request) {
  const signature = request.headers.get('x-signature');
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('❌ MP_WEBHOOK_SECRET environment variable is not set');
    return process.env.NODE_ENV !== 'production'; // Allow in development
  }
  
  if (!signature) {
    console.warn('⚠️ No signature provided in webhook');
    return process.env.NODE_ENV !== 'production'; // Allow in development for testing with ngrok
  }
  
  try {
    const rawBody = await request.text();
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    
    const isValid = signature === generatedSignature;
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      console.error('Received:', signature);
      console.error('Generated:', generatedSignature);
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return process.env.NODE_ENV !== 'production';
  }
}

async function triggerSessionUpdate(userId) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_WEBHOOK_URL;
    const sessionUpdateResponse = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'session',
        trigger: 'update'
      })
    });

    if (sessionUpdateResponse.ok) {
      console.log('✨ Session update triggered successfully');
    } else {
      console.warn('⚠️ Session update request failed, client will need to refresh');
    }
  } catch (sessionError) {
    console.error('❌ Error triggering session update:', sessionError);
  }
}

async function handlePaymentUpdate(paymentId) {
  try {
    console.log(`🔍 Fetching payment details for ID: ${paymentId}`);
    
    // Fetch payment details from MercadoPago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      }
    });
    
    const payment = await paymentResponse.json();
    console.log('💳 Payment details:', JSON.stringify(payment, null, 2));
    
    if (!payment || !payment.external_reference) {
      console.error('❌ Invalid payment data received:', payment);
      return false;
    }
    
    // Extract user and plan info from external_reference
    // Format: userId-PLANID (the userId might contain hyphens)
    const parts = payment.external_reference.split('-');
    const planId = parts.pop(); // Get the last part (PREMIUM)
    const userId = parts.join('-'); // Rejoin the rest (in case userId contains hyphens)
    
    console.log(`👤 Processing for User ID: ${userId}, Plan: ${planId}`);
    
    if (!userId || !planId) {
      console.error('❌ Invalid external_reference format:', payment.external_reference);
      return false;
    }

    // Use metadata if available (preferred) or fallback to external_reference parsing
    const metadata = payment.metadata || {};
    const finalUserId = metadata.user_id || userId;
    const finalPlanId = metadata.plan_id || planId;
    const previousTier = metadata.previous_tier || 'FREE';
    
    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: finalUserId }
    });
    
    if (!user) {
      console.error(`❌ User ${finalUserId} not found`);
      return false;
    }
    
    console.log(`📊 Current user status: ${user.subscriptionStatus}, tier: ${user.accountTier}`);
    
    // Handle different payment statuses
    switch (payment.status) {
      case 'approved':
        // Calculate subscription expiration (1 month from now)
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        
        console.log(`✨ Upgrading user to ${finalPlanId}, expires: ${expirationDate}`);
        
        // Create subscription payment record
        await prisma.subscriptionPayment.create({
          data: {
            userId: finalUserId,
            amount: new Prisma.Decimal(payment.transaction_amount),
            currency: payment.currency_id,
            status: 'COMPLETED',
            paymentMethod: payment.payment_method.type || 'mercadopago',
            paymentType: 'SUBSCRIPTION',
            planId: finalPlanId,
            transactionId: payment.id.toString(),
            merchantTransactionId: payment.order.id?.toString(),
            description: `Suscripción ${finalPlanId}`,
            metadata: metadata,
            billingName: user.name,
            billingEmail: user.email,
            subscriptionPeriodStart: new Date(),
            subscriptionPeriodEnd: expirationDate,
            taxAmount: new Prisma.Decimal(payment.taxes_amount || 0),
            taxPercentage: payment.taxes_amount ? new Prisma.Decimal((payment.taxes_amount / payment.transaction_amount) * 100) : null
          }
        });
        
        // Update user with new plan and status
        const subscriptionId = metadata.subscription_id || payment.id.toString();
        console.log(`✨ Setting subscription ID to: ${subscriptionId} (${metadata.subscription_id ? 'from metadata' : 'from payment ID'})`);
        
        await prisma.user.update({
          where: { id: finalUserId },
          data: {
            accountTier: finalPlanId,
            subscriptionStatus: 'active',
            subscriptionExpiresAt: expirationDate,
            subscriptionId: subscriptionId
          }
        });
        
        console.log(`✅ Subscription activated for user ${finalUserId} with plan ${finalPlanId}`);
        break;
        
      case 'pending':
        console.log(`⏳ Payment still pending for user ${finalUserId}`);
        // Create pending payment record
        await prisma.subscriptionPayment.create({
          data: {
            userId: finalUserId,
            amount: new Prisma.Decimal(payment.transaction_amount),
            currency: payment.currency_id,
            status: 'PENDING',
            paymentMethod: payment.payment_method.type || 'mercadopago',
            paymentType: 'SUBSCRIPTION',
            planId: finalPlanId,
            transactionId: payment.id.toString(),
            merchantTransactionId: payment.order.id?.toString(),
            description: `Suscripción ${finalPlanId} (Pendiente)`,
            metadata: metadata,
            billingName: user.name,
            billingEmail: user.email
          }
        });
        
        // Update user status to pending
        await prisma.user.update({
          where: { id: finalUserId },
          data: {
            subscriptionStatus: 'pending',
            subscriptionId: metadata.subscription_id || payment.id.toString()
          }
        });
        break;
        
      case 'rejected':
      case 'cancelled':
      case 'refunded':
        console.log(`↩️ Reverting user ${finalUserId} to ${previousTier}`);
        
        // Create failed/cancelled/refunded payment record
        await prisma.subscriptionPayment.create({
          data: {
            userId: finalUserId,
            amount: new Prisma.Decimal(payment.transaction_amount),
            currency: payment.currency_id,
            status: payment.status === 'refunded' ? 'REFUNDED' : 'FAILED',
            paymentMethod: payment.payment_method.type || 'mercadopago',
            paymentType: 'SUBSCRIPTION',
            planId: finalPlanId,
            transactionId: payment.id.toString(),
            merchantTransactionId: payment.order.id?.toString(),
            description: `Suscripción ${finalPlanId} (${payment.status})`,
            metadata: metadata,
            billingName: user.name,
            billingEmail: user.email
          }
        });
        
        // Revert to previous state
        await prisma.user.update({
          where: { id: finalUserId },
          data: {
            subscriptionStatus: 'cancelled',
            accountTier: previousTier,
            subscriptionExpiresAt: null
          }
        });
        
        console.log(`❌ Subscription cancelled for user ${finalUserId}, reverted to ${previousTier}`);
        break;
        
      default:
        console.warn(`⚠️ Unhandled payment status: ${payment.status}`);
        break;
    }

    // Always trigger a session update after any status change
    await triggerSessionUpdate(finalUserId);
    
    return true;
  } catch (error) {
    console.error('❌ Error processing payment update:', error);
    return false;
  }
}

async function handleSubscriptionAuthorizedPayment(data) {
  try {
    console.log('🔄 Processing subscription authorized payment:', data);
    
    const paymentId = data.id;
    // Handle like a regular payment but ensure it's marked as a recurring payment
    const success = await handlePaymentUpdate(paymentId);
    if (success) {
      console.log('✅ Subscription payment processed successfully');
    }
    return success;
  } catch (error) {
    console.error('❌ Error processing subscription payment:', error);
    return false;
  }
}

async function handleSubscriptionPreapproval(data) {
  try {
    const preapprovalId = data.id;
    console.log(`🔍 Fetching preapproval details for ID: ${preapprovalId}`);
    
    // Fetch preapproval details from MercadoPago
    const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      }
    });
    
    const preapproval = await preapprovalResponse.json();
    console.log('📝 Preapproval details:', JSON.stringify(preapproval, null, 2));
    
    if (!preapproval || !preapproval.external_reference) {
      console.error('❌ Invalid preapproval data received:', preapproval);
      return false;
    }
    
    // Extract user and plan info from external_reference
    // Format: userId-PLANID (the userId might contain hyphens)
    const parts = preapproval.external_reference.split('-');
    const planId = parts.pop(); // Get the last part (PREMIUM)
    const userId = parts.join('-'); // Rejoin the rest (in case userId contains hyphens)
    
    console.log(`👤 Processing for User ID: ${userId}, Plan: ${planId}`);
    
    if (!userId || !planId) {
      console.error('❌ Invalid external_reference format:', preapproval.external_reference);
      return false;
    }

    // Use metadata if available (preferred) or fallback to external_reference parsing
    const metadata = preapproval.metadata || {};
    const finalUserId = metadata.user_id || userId;
    const finalPlanId = metadata.plan_id || planId;
    const previousTier = metadata.previous_tier || 'FREE';
    
    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: finalUserId }
    });
    
    if (!user) {
      console.error(`❌ User ${finalUserId} not found`);
      return false;
    }
    
    console.log(`📊 Current user status: ${user.subscriptionStatus}, tier: ${user.accountTier}`);
    
    // Handle different preapproval statuses
    switch (preapproval.status) {
      case 'authorized':
        // Calculate subscription expiration (1 month from now)
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        
        console.log(`✨ Upgrading user to ${finalPlanId}, expires: ${expirationDate}`);
        
        // Create subscription payment record
        await prisma.subscriptionPayment.create({
          data: {
            userId: finalUserId,
            amount: new Prisma.Decimal(preapproval.auto_recurring.transaction_amount),
            currency: preapproval.auto_recurring.currency_id,
            status: 'COMPLETED',
            paymentMethod: 'mercadopago',
            paymentType: 'SUBSCRIPTION',
            planId: finalPlanId,
            transactionId: preapprovalId,
            description: `Suscripción ${finalPlanId}`,
            metadata: {
              ...metadata,
              preapproval_id: preapprovalId
            },
            billingName: user.name,
            billingEmail: user.email,
            subscriptionPeriodStart: new Date(),
            subscriptionPeriodEnd: expirationDate
          }
        });
        
        // Update user with new plan and status
        await prisma.user.update({
          where: { id: finalUserId },
          data: {
            accountTier: finalPlanId,
            subscriptionStatus: 'active',
            subscriptionExpiresAt: expirationDate,
            subscriptionId: preapprovalId,
            metadata: {
              ...user.metadata,
              subscription_metadata: {
                plan_id: finalPlanId,
                previous_tier: previousTier,
                subscription_id: preapprovalId,
                status: 'active',
                updated_at: new Date().toISOString()
              }
            }
          }
        });
        
        console.log(`✅ Subscription activated for user ${finalUserId} with plan ${finalPlanId}`);
        break;
        
      case 'pending':
        console.log(`⏳ Subscription still pending for user ${finalUserId}`);
        // Update user status to pending if not already
        if (user.subscriptionStatus !== 'pending') {
          await prisma.user.update({
            where: { id: finalUserId },
            data: {
              subscriptionStatus: 'pending',
              subscriptionId: preapprovalId,
              metadata: {
                ...user.metadata,
                subscription_metadata: {
                  ...(user.metadata?.subscription_metadata || {}),
                  status: 'pending',
                  updated_at: new Date().toISOString()
                }
              }
            }
          });
        }
        break;
        
      case 'cancelled':
      case 'paused':
        console.log(`↩️ Reverting user ${finalUserId} to ${previousTier}`);
        
        // Create cancelled payment record
        await prisma.subscriptionPayment.create({
          data: {
            userId: finalUserId,
            amount: new Prisma.Decimal(preapproval.auto_recurring.transaction_amount),
            currency: preapproval.auto_recurring.currency_id,
            status: 'CANCELLED',
            paymentMethod: 'mercadopago',
            paymentType: 'SUBSCRIPTION',
            planId: finalPlanId,
            transactionId: preapprovalId,
            description: `Suscripción ${finalPlanId} (${preapproval.status})`,
            metadata: {
              ...metadata,
              preapproval_id: preapprovalId
            },
            billingName: user.name,
            billingEmail: user.email
          }
        });
        
        // Revert to previous state
        await prisma.user.update({
          where: { id: finalUserId },
          data: {
            subscriptionStatus: 'cancelled',
            accountTier: previousTier,
            subscriptionExpiresAt: null,
            metadata: {
              ...user.metadata,
              subscription_metadata: {
                ...(user.metadata?.subscription_metadata || {}),
                status: 'cancelled',
                updated_at: new Date().toISOString()
              }
            }
          }
        });
        
        console.log(`❌ Subscription cancelled for user ${finalUserId}, reverted to ${previousTier}`);
        break;
        
      default:
        console.warn(`⚠️ Unhandled preapproval status: ${preapproval.status}`);
        break;
    }

    // Always trigger a session update after any status change
    await triggerSessionUpdate(finalUserId);
    
    return true;
  } catch (error) {
    console.error('❌ Error processing preapproval update:', error);
    return false;
  }
}

async function handleSubscriptionPlan(data) {
  try {
    console.log('📝 Processing subscription plan update:', data);
    
    const planId = data.id;
    // Fetch plan details from MercadoPago
    const planResponse = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      }
    });
    
    const plan = await planResponse.json();
    console.log('📋 Plan details:', JSON.stringify(plan, null, 2));
    
    // Log plan changes but don't take action as this is just plan metadata
    console.log(`ℹ️ Subscription plan ${planId} updated: ${plan.status}`);
    return true;
  } catch (error) {
    console.error('❌ Error processing subscription plan update:', error);
    return false;
  }
}

export async function POST(request) {
  try {
    // Clone the request to read the body twice (once for verification, once for processing)
    const requestClone = request.clone();
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(requestClone);
    if (!isValid && process.env.NODE_ENV === 'production') {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Parse the webhook data
    const data = await request.json();
    console.log('📩 Webhook received:', JSON.stringify(data, null, 2));
    
    // Extract the action and resource type
    const { action, type, data: resourceData } = data;
    
    // Handle different webhook types
    let success = false;
    
    if (type === 'payment' && action === 'payment.updated') {
      // Handle payment updates
      const paymentId = resourceData.id;
      success = await handlePaymentUpdate(paymentId);
    } else if (type === 'mp-connect' && action === 'application.deauthorized') {
      // Handle MP Connect deauthorization
      console.log('⚠️ MP Connect application deauthorized');
      success = true; // Nothing to do here for now
    } else if (type === 'preapproval' && action === 'preapproval.updated') {
      // Handle subscription updates
      const preapprovalId = resourceData.id;
      success = await handleSubscriptionPreapproval(preapprovalId);
    } else if (type === 'preapproval_plan' && action === 'preapproval_plan.updated') {
      // Handle plan updates
      const planId = resourceData.id;
      success = await handleSubscriptionPlan(planId);
    } else {
      console.warn(`⚠️ Unhandled webhook type: ${type}, action: ${action}`);
    }
    
    if (success) {
      return NextResponse.json({ status: 'ok' });
    } else {
      return NextResponse.json({ status: 'error', message: 'Failed to process webhook' }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// MercadoPago sends OPTIONS requests to verify the webhook endpoint
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Signature',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}