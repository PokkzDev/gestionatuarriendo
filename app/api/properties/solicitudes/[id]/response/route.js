import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST: Add a response to a solicitud as a property owner
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const solicitudId = params.id;
    
    // Get the user's email from the session
    const userEmail = session.user.email;
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    // Check if the user is a property owner
    if (user.role !== 'PROPIETARIO' && user.role !== 'AMBOS') {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }
    
    // Find the solicitud
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: {
        propertyTenant: {
          include: {
            property: true
          }
        }
      }
    });
    
    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }
    
    // Verify the property belongs to this owner
    if (solicitud.propertyTenant.property.userId !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para responder a esta solicitud' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.message) {
      return NextResponse.json({ error: 'El mensaje es requerido' }, { status: 400 });
    }
    
    // Create the new response
    const newResponse = await prisma.solicitudResponse.create({
      data: {
        message: body.message,
        solicitudId: solicitudId,
        isFromOwner: true, // This is from the owner
      },
    });
    
    // If status update is requested, update the solicitud status
    if (body.status && ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'RECHAZADA'].includes(body.status)) {
      await prisma.solicitud.update({
        where: { id: solicitudId },
        data: { status: body.status }
      });
    }
    
    return NextResponse.json(newResponse, { status: 201 });
  } catch (error) {
    console.error('Error adding owner response:', error);
    return NextResponse.json({ error: 'Error al agregar la respuesta' }, { status: 500 });
  }
} 