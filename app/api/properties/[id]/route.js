import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// GET /api/properties/:id - Get a single property by ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Properly await params object before accessing id
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const property = await prisma.property.findUnique({
      where: { id },
    });
    
    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }
    
    // Get user ID from email (more reliable)
    let userId = null;
    if (session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      
      if (user) {
        userId = user.id;
      }
    } else if (session.user?.id) {
      userId = session.user.id;
    }
    
    if (!userId) {
      // Fallback for development
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      }
    }
    
    // Check if the property belongs to the authenticated user
    if (property.userId !== userId) {
      return NextResponse.json({ error: 'No tienes permiso para ver esta propiedad' }, { status: 403 });
    }
    
    return NextResponse.json(property);
  } catch (error) {
    console.error('Error al obtener propiedad:', error);
    return NextResponse.json({ error: 'Error al obtener propiedad: ' + error.message }, { status: 500 });
  }
}

// PUT /api/properties/:id - Update a property
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Properly await params object before accessing id
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.address) {
      return NextResponse.json({ 
        error: 'Los campos nombre y dirección son obligatorios' 
      }, { status: 400 });
    }
    
    // Check if the property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });
    
    if (!existingProperty) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }
    
    // Get user ID from email (more reliable)
    let userId = null;
    if (session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      
      if (user) {
        userId = user.id;
      }
    } else if (session.user?.id) {
      userId = session.user.id;
    }
    
    if (!userId) {
      // Fallback for development
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      }
    }
    
    // Check if the property belongs to the authenticated user
    if (existingProperty.userId !== userId) {
      return NextResponse.json({ 
        error: 'No tienes permiso para editar esta propiedad' 
      }, { status: 403 });
    }
    
    // Update the property
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        description: data.description,
        propertyType: data.propertyType,
        bedrooms: parseInt(data.bedrooms) || 1,
        bathrooms: parseInt(data.bathrooms) || 1,
        hasParking: Boolean(data.hasParking),
        parkingSpots: data.hasParking ? (data.parkingDetails?.length || 0) : 0,
        parkingDetails: data.hasParking && data.parkingDetails?.length ? data.parkingDetails : [],
        hasStorage: Boolean(data.hasStorage),
        storageUnits: data.hasStorage ? (data.storageDetails?.length || 0) : 0,
        storageDetails: data.hasStorage && data.storageDetails?.length ? data.storageDetails : [],
        furnished: Boolean(data.furnished),
        totalArea: data.totalArea ? parseFloat(data.totalArea) : null,
        rentAmount: data.rentAmount ? parseFloat(data.rentAmount) : null,
        status: data.status,
      },
    });
    
    return NextResponse.json(updatedProperty);
  } catch (error) {
    console.error('Error al actualizar propiedad:', error);
    return NextResponse.json({ 
      error: 'Error al actualizar propiedad: ' + error.message 
    }, { status: 500 });
  }
}

// DELETE /api/properties/:id - Delete a property
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Properly await params object before accessing id
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Check if the property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      include: {
        tenants: true, // Include tenants to check if there are any associations
      },
    });
    
    if (!existingProperty) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }
    
    // Debug session information
    console.log('Session user:', session.user);
    console.log('Session user ID:', session.user?.id);
    console.log('Session user email:', session.user?.email);
    
    // Get user ID from email (more reliable)
    let userId = null;
    if (session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      
      if (user) {
        userId = user.id;
        console.log('Found user ID from email:', userId);
      }
    } else if (session.user?.id) {
      userId = session.user.id;
      console.log('Using session user ID:', userId);
    }
    
    if (!userId) {
      // Fallback for development
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
        console.log('Using fallback user ID:', userId);
      }
    }
    
    console.log('Property user ID:', existingProperty.userId);
    console.log('Checking if IDs match:', existingProperty.userId === userId);
    
    // Check if the property belongs to the authenticated user
    if (existingProperty.userId !== userId) {
      return NextResponse.json({ 
        error: 'No tienes permiso para eliminar esta propiedad' 
      }, { status: 403 });
    }

    // Use a transaction to ensure atomicity when deleting property and related tenants
    await prisma.$transaction(async (tx) => {
      // First delete any tenant associations (although Prisma should handle this with cascade)
      if (existingProperty.tenants && existingProperty.tenants.length > 0) {
        await tx.propertyTenant.deleteMany({
          where: { 
            propertyId: id 
          },
        });
      }
      
      // Then delete the property
      await tx.property.delete({
        where: { id },
      });
    });
    
    return NextResponse.json({ 
      message: 'Propiedad eliminada correctamente' 
    });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    return NextResponse.json({ 
      error: 'Error al eliminar propiedad: ' + error.message 
    }, { status: 500 });
  }
} 