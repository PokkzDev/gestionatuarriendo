import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch a specific solicitud by ID
export async function GET(request, { params }) {
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
    
    // Fetch the solicitud
    const solicitud = await prisma.solicitud.findUnique({
      where: {
        id: solicitudId,
        propertyTenantId: propertyTenant.id,
      },
      include: {
        responses: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    
    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(solicitud);
  } catch (error) {
    console.error('Error fetching solicitud:', error);
    return NextResponse.json({ error: 'Error al obtener la solicitud' }, { status: 500 });
  }
}

// PATCH: Update a solicitud's status
export async function PATCH(request, { params }) {
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
    
    // Parse the request body
    const body = await request.json();
    
    // Update the solicitud
    const updatedSolicitud = await prisma.solicitud.update({
      where: {
        id: solicitudId,
        propertyTenantId: propertyTenant.id,
      },
      data: {
        status: body.status,
      },
    });
    
    return NextResponse.json(updatedSolicitud);
  } catch (error) {
    console.error('Error updating solicitud:', error);
    return NextResponse.json({ error: 'Error al actualizar la solicitud' }, { status: 500 });
  }
} 