import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch a specific solicitud by ID for a property owner
export async function GET(request, { params }) {
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
      return NextResponse.json({ error: 'No tienes permisos para ver esta información' }, { status: 403 });
    }
    
    // Find the solicitud with property and tenant information
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: {
        responses: {
          orderBy: { createdAt: 'asc' },
        },
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
      return NextResponse.json({ error: 'No tienes permiso para ver esta solicitud' }, { status: 403 });
    }
    
    // Add property and tenant info to the response
    const solicitudWithContext = {
      ...solicitud,
      property: {
        id: solicitud.propertyTenant.property.id,
        name: solicitud.propertyTenant.property.name,
        address: solicitud.propertyTenant.property.address
      },
      tenant: {
        id: solicitud.propertyTenant.id,
        email: solicitud.propertyTenant.tenantEmail
      }
    };
    
    return NextResponse.json(solicitudWithContext);
  } catch (error) {
    console.error('Error fetching solicitud for owner:', error);
    return NextResponse.json({ error: 'Error al obtener la solicitud' }, { status: 500 });
  }
}

// PATCH: Update a solicitud's status as a property owner
export async function PATCH(request, { params }) {
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
      return NextResponse.json({ error: 'No tienes permiso para actualizar esta solicitud' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Validate the status
    if (!body.status || !['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'RECHAZADA'].includes(body.status)) {
      return NextResponse.json({ error: 'Estado de solicitud inválido' }, { status: 400 });
    }
    
    // Update the solicitud
    const updatedSolicitud = await prisma.solicitud.update({
      where: { id: solicitudId },
      data: { status: body.status },
      include: {
        responses: {
          orderBy: { createdAt: 'asc' },
        },
        propertyTenant: {
          include: {
            property: true
          }
        }
      }
    });
    
    // Add property and tenant info to the response
    const updatedSolicitudWithContext = {
      ...updatedSolicitud,
      property: {
        id: updatedSolicitud.propertyTenant.property.id,
        name: updatedSolicitud.propertyTenant.property.name,
        address: updatedSolicitud.propertyTenant.property.address
      },
      tenant: {
        id: updatedSolicitud.propertyTenant.id,
        email: updatedSolicitud.propertyTenant.tenantEmail
      }
    };
    
    return NextResponse.json(updatedSolicitudWithContext);
  } catch (error) {
    console.error('Error updating solicitud status:', error);
    return NextResponse.json({ error: 'Error al actualizar el estado de la solicitud' }, { status: 500 });
  }
} 