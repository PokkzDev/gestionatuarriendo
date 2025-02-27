import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');
    
    if (!invitationId) {
      return NextResponse.json(
        { error: 'ID de invitación no proporcionado' },
        { status: 400 }
      );
    }
    
    // Find the invitation
    const invitation = await prisma.propertyTenant.findUnique({
      where: { id: invitationId },
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
    
    // Get the property details
    const property = await prisma.property.findUnique({
      where: { id: invitation.propertyId },
      select: {
        id: true,
        name: true,
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        tenantEmail: invitation.tenantEmail,
        status: invitation.status,
        createdAt: invitation.createdAt,
      },
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
        owner: property.user ? {
          id: property.user.id,
          name: property.user.name || 'Propietario',
          email: property.user.email,
        } : null,
      },
    });
    
  } catch (error) {
    console.error('Error al verificar invitación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 