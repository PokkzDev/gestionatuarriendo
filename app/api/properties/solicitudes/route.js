import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch all solicitudes for properties owned by the current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
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
    
    // Get the property ID from query params if provided
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    
    // Base query to find properties owned by this user
    const baseQuery = {
      where: { userId: user.id },
      include: {
        tenants: {
          where: { status: 'ACCEPTED' },
          include: {
            solicitudes: {
              include: {
                responses: {
                  orderBy: { createdAt: 'asc' },
                },
                propertyTenant: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        name: true,
                        address: true,
                      }
                    }
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
            }
          }
        }
      }
    };
    
    // If propertyId is provided, filter by that property
    if (propertyId) {
      baseQuery.where.id = propertyId;
    }
    
    // Fetch properties with their tenants and solicitudes
    const properties = await prisma.property.findMany(baseQuery);
    
    // Flatten the solicitudes array for easier consumption by the frontend
    const allSolicitudes = [];
    
    properties.forEach(property => {
      property.tenants.forEach(tenant => {
        if (tenant.solicitudes && tenant.solicitudes.length > 0) {
          // Add property and tenant info to each solicitud
          const solicitudesWithContext = tenant.solicitudes.map(solicitud => ({
            ...solicitud,
            property: {
              id: property.id,
              name: property.name,
              address: property.address
            },
            tenant: {
              id: tenant.id,
              email: tenant.tenantEmail
            }
          }));
          
          allSolicitudes.push(...solicitudesWithContext);
        }
      });
    });
    
    return NextResponse.json(allSolicitudes);
  } catch (error) {
    console.error('Error fetching solicitudes for owner:', error);
    return NextResponse.json({ error: 'Error al obtener las solicitudes' }, { status: 500 });
  }
} 