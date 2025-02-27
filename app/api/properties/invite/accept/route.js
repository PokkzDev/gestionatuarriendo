import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { invitationId } = data;
    
    if (!invitationId) {
      return NextResponse.json(
        { error: 'ID de invitación no proporcionado' },
        { status: 400 }
      );
    }
    
    // Find the invitation
    const invitation = await prisma.propertyTenant.findUnique({
      where: { id: invitationId },
      include: {
        property: true,
      },
    });
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }
    
    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta invitación ya ha sido procesada' },
        { status: 400 }
      );
    }
    
    // Check if the user's email matches the invitation email
    if (session.user.email !== invitation.tenantEmail) {
      return NextResponse.json(
        { error: 'Esta invitación fue enviada a otra dirección de correo electrónico' },
        { status: 403 }
      );
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Update the invitation status and link it to the user
    const updatedInvitation = await prisma.propertyTenant.update({
      where: { id: invitationId },
      data: {
        status: 'ACCEPTED',
        tenantId: user.id,
      },
    });
    
    // If user is only ARRENDATARIO, make them AMBOS
    if (user.role === 'ARRENDATARIO') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'AMBOS' },
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Invitación aceptada exitosamente',
      invitation: updatedInvitation,
    });
    
  } catch (error) {
    console.error('Error al aceptar invitación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 