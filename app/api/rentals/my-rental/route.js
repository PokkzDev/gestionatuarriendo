import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No has iniciado sesión' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Check if the user is an arrendatario (tenant)
    if (user.role !== 'ARRENDATARIO' && user.role !== 'AMBOS') {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta información' },
        { status: 403 }
      );
    }

    // Find the property tenant relation where user is a tenant
    const propertyTenant = await prisma.propertyTenant.findFirst({
      where: {
        tenantEmail: user.email,
        status: 'ACCEPTED'
      },
      include: {
        property: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
    });

    // If no property tenant relation found
    if (!propertyTenant) {
      return NextResponse.json(null, { status: 200 });
    }

    // Transform the data to match the expected rental structure
    const rental = {
      id: propertyTenant.id,
      tenantId: user.id,
      startDate: propertyTenant.createdAt,
      property: propertyTenant.property,
      owner: propertyTenant.property.user,
      // Mock contract data since it doesn't exist in the schema
      contract: null,
      // Mock payments data since it doesn't exist in the schema
      payments: []
    };

    return NextResponse.json(rental, { status: 200 });
  } catch (error) {
    console.error('Error fetching rental data:', error);
    return NextResponse.json(
      { error: 'Error al obtener la información del arriendo' },
      { status: 500 }
    );
  }
} 