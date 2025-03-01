import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST: Add a response to a solicitud
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const solicitudId = params.id;
    
    // Get the user's email from the session
    const userEmail = session.user.email;
    
    // Find the property tenant record for this user
    const propertyTenant = await prisma.propertyTenant.findFirst({
      where: {
        tenantEmail: userEmail,
        status: 'ACCEPTED',
      },
    });
    
    if (!propertyTenant) {
      return NextResponse.json({ error: 'No se encontró un arriendo activo' }, { status: 404 });
    }
    
    // Verify the solicitud belongs to this tenant
    const solicitud = await prisma.solicitud.findUnique({
      where: {
        id: solicitudId,
        propertyTenantId: propertyTenant.id,
      },
    });
    
    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
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
        isFromOwner: false, // Tenant responses are not from the owner
      },
    });
    
    return NextResponse.json(newResponse, { status: 201 });
  } catch (error) {
    console.error('Error adding response:', error);
    return NextResponse.json({ error: 'Error al agregar la respuesta' }, { status: 500 });
  }
} 