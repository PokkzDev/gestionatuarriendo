import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch all solicitudes for the current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
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
    
    // Fetch all solicitudes for this property tenant
    const solicitudes = await prisma.solicitud.findMany({
      where: {
        propertyTenantId: propertyTenant.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        responses: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    
    return NextResponse.json(solicitudes);
  } catch (error) {
    console.error('Error fetching solicitudes:', error);
    return NextResponse.json({ error: 'Error al obtener las solicitudes' }, { status: 500 });
  }
}

// POST: Create a new solicitud
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
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
    
    // Validate required fields
    if (!body.title || !body.description || !body.type) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    
    // Create the new solicitud
    const newSolicitud = await prisma.solicitud.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        priority: body.priority || 'MEDIA',
        propertyTenantId: propertyTenant.id,
      },
    });
    
    return NextResponse.json(newSolicitud, { status: 201 });
  } catch (error) {
    console.error('Error creating solicitud:', error);
    return NextResponse.json({ error: 'Error al crear la solicitud' }, { status: 500 });
  }
} 