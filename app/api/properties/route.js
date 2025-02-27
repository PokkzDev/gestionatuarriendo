import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/properties - Get all properties for the current user
export async function GET(request) {
  try {
    console.log('API: Properties GET request received');
    const session = await getServerSession(authOptions);
    
    console.log('API: Session data:', session ? 'Session exists' : 'No session', session?.user?.email || 'No email');
    
    if (!session || !session.user) {
      console.log('API: No authorized session found');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Find user by email from session
    console.log('API: Looking for user with email:', session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      console.log('API: User not found for email:', session.user.email);
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    console.log('API: Found user with ID:', user.id);
    const properties = await prisma.property.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`API: Fetched ${properties.length} properties for user ID ${user.id}`);
    
    return NextResponse.json(properties);
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    return NextResponse.json({ error: 'Error al obtener propiedades: ' + error.message }, { status: 500 });
  }
}

// POST /api/properties - Create a new property
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Get user by email which is more reliable than id in the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    const userId = user.id;
    
    // Get the property count separately
    const propertyCount = await prisma.property.count({
      where: { userId: userId }
    });
    
    // Check property limits based on account tier
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
        userId: user.id,
      },
    });
    
    console.log(`Property created successfully for user ${user.email} (ID: ${user.id})`);
    
    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Error al crear propiedad:', error);
    return NextResponse.json({ error: 'Error al crear propiedad: ' + error.message }, { status: 500 });
  }
} 