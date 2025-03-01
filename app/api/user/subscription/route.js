import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get user's subscription details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionId: true,
        subscriptionStatus: true,
        accountTier: true,
        subscriptionExpiresAt: true,
        subscriptionType: true
      }
    });

    console.log('User subscription details:', user);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // If user has no subscription, return basic info
    if (user.accountTier === 'FREE') {
      return NextResponse.json({
        accountTier: user.accountTier
      });
    }

    const response = {
      accountTier: user.accountTier,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionId: user.subscriptionId,
      subscriptionExpiresAt: user.subscriptionExpiresAt
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalles de suscripción' },
      { status: 500 }
    );
  }
} 