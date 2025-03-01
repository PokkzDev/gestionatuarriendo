import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, planId, subscriptionId, subscriptionType, subscriptionStatus } = await request.json();
    
    console.log('Updating user tier with data:', { userId, planId, subscriptionId, subscriptionType, subscriptionStatus });

    // Security check - only allow users to update their own account or admins
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate planId
    if (!['PREMIUM', 'ELITE'].includes(planId)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    // Calculate subscription expiration (1 month from now)
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    // Get current user data to preserve metadata
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Determine the subscription status to use
    const status = subscriptionStatus || 'active';

    // Update metadata with subscription information
    const metadataToStore = {
      ...user.metadata, // Preserve existing metadata
      subscription_metadata: {
        ...(user.metadata?.subscription_metadata || {}),
        plan_id: planId,
        previous_tier: user.accountTier || 'FREE',
        subscription_id: subscriptionId,
        subscription_type: subscriptionType || 'recurring',
        status: status,
        updated_at: new Date().toISOString()
      }
    };

    // Update user tier
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountTier: planId,
        subscriptionId: subscriptionId || null,
        subscriptionStatus: status,
        subscriptionExpiresAt: expirationDate,
        metadata: metadataToStore
      }
    });

    console.log(`User ${userId} updated to tier ${planId} with subscription ${subscriptionId}`);

    return NextResponse.json({ 
      success: true,
      user: {
        id: updatedUser.id,
        accountTier: updatedUser.accountTier,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionExpiresAt: updatedUser.subscriptionExpiresAt
      }
    });
  } catch (error) {
    console.error('Error updating user tier:', error);
    return NextResponse.json(
      { 
        error: 'Error al actualizar el plan del usuario',
        details: error.message
      },
      { status: 500 }
    );
  }
} 