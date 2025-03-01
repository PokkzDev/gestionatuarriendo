import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { userId } = await request.json();

    // Security check - only allow users to cancel their own subscription
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Get user's current subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionId: true,
        accountTier: true,
        subscriptionStatus: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!user.subscriptionId || user.subscriptionStatus !== 'active') {
      return NextResponse.json({ error: 'No hay suscripción activa' }, { status: 400 });
    }

    // Cancel subscription in MercadoPago
    const cancelResponse = await fetch(`https://api.mercadopago.com/preapproval/${user.subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });

    if (!cancelResponse.ok) {
      console.error('Error cancelling subscription in MercadoPago:', await cancelResponse.text());
      return NextResponse.json(
        { error: 'Error al cancelar la suscripción en MercadoPago' },
        { status: 500 }
      );
    }

    // Record cancellation in our database
    await prisma.subscriptionPayment.create({
      data: {
        userId,
        status: 'CANCELLED',
        paymentMethod: 'mercadopago',
        paymentType: 'SUBSCRIPTION',
        planId: user.accountTier,
        description: 'Cancelación de suscripción por usuario',
        transactionId: user.subscriptionId
      }
    });

    // Update user's subscription status
    // Note: We don't immediately revert to FREE tier, it will happen when current period expires
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'cancelled_pending_expiration',
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tu suscripción será cancelada al final del período actual'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Error al cancelar la suscripción' },
      { status: 500 }
    );
  }
} 