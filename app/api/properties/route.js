import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// GET /api/properties - Get all properties for the current user
export async function GET(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    let userId = session.user?.id;
    
    if (!userId) {
      // Fallback to first user for development
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json({ error: 'No se encontraron usuarios en la base de datos' }, { status: 404 });
      }
      userId = firstUser.id;
    }
    
    const properties = await prisma.property.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(properties);
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    return NextResponse.json({ error: 'Error al obtener propiedades: ' + error.message }, { status: 500 });
  }
}

// POST /api/properties - Create a new property
export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    let userId = session.user?.id;
    
    if (!userId) {
      // Fallback to first user for development
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json({ error: 'No se encontraron usuarios en la base de datos' }, { status: 404 });
      }
      userId = firstUser.id;
    }
    
    // Get the user to check their account tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    // Check property limits based on account tier
    const propertyCount = user.properties.length;
    let propertyLimit = 1; // Default for FREE
    
    if (user.accountTier === 'PREMIUM') {
      propertyLimit = 3;
    } else if (user.accountTier === 'ELITE') {
      propertyLimit = 10;
    }
    
    if (propertyCount >= propertyLimit) {
      return NextResponse.json({ 
        error: `Has alcanzado el límite de propiedades para tu cuenta ${user.accountTier}. Límite: ${propertyLimit}.` 
      }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.address) {
      return NextResponse.json({ 
        error: 'Los campos nombre y dirección son obligatorios' 
      }, { status: 400 });
    }
    
    const property = await prisma.property.create({
      data: {
        name: data.name,
        address: data.address,
        description: data.description || '',
        propertyType: data.propertyType || 'APARTMENT',
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
        status: data.status || 'AVAILABLE',
        userId: userId,
      },
    });
    
    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Error al crear propiedad:', error);
    return NextResponse.json({ error: 'Error al crear propiedad: ' + error.message }, { status: 500 });
  }
} 