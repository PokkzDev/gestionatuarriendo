import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Use global to prevent multiple instances of Prisma Client in development
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// GET /api/user/profile - Get user profile
export async function GET(request) {
  try {
    // Pass auth options to getServerSession
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Get the current user ID from the session
    let userId = session.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario no encontrado en la sesión' }, { status: 401 });
    }
    
    // Fetch the user details without using select to ensure all fields are available
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    // Create a sanitized version of the user object to return
    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      nameChangesCount: user.nameChangesCount || 0,
      role: user.role,
      createdAt: user.createdAt,
    };
    
    return NextResponse.json(sanitizedUser);
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    return NextResponse.json({ error: 'Error al obtener perfil de usuario: ' + error.message }, { status: 500 });
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request) {
  try {
    // Pass auth options to getServerSession
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Get the current user ID from the session
    let userId = session.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario no encontrado en la sesión' }, { status: 401 });
    }
    
    // Get the user data from the request
    const data = await request.json();
    
    // Fetch the current user to check current name and name change count
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    // Prepare update data
    const updateData = {};
    
    // Only update email if it has changed
    if (data.email && data.email !== currentUser.email) {
      // Check if the email is already in use
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      
      if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
        return NextResponse.json({ 
          error: 'Este correo electrónico ya está en uso por otro usuario.'
        }, { status: 400 });
      }
      
      updateData.email = data.email;
    }
    
    // Add phone number if provided
    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }
    
    // Check if name is being changed
    if (data.name && data.name !== currentUser.name) {
      // Check if the user has reached the limit of name changes
      const nameChangesCount = currentUser.nameChangesCount || 0;
      if (nameChangesCount >= 3) {
        return NextResponse.json({ 
          error: 'Has alcanzado el límite de 3 cambios de nombre permitidos.',
          nameChangesRemaining: 0
        }, { status: 403 });
      }
      
      // Update the name and increment name changes count
      updateData.name = data.name;
      updateData.nameChangesCount = nameChangesCount + 1;
    }
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    
    // Create a sanitized response
    const response = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      nameChangesCount: updatedUser.nameChangesCount || 0,
      image: updatedUser.image,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      nameChangesRemaining: 3 - (updatedUser.nameChangesCount || 0)
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al actualizar perfil de usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar perfil de usuario: ' + error.message }, { status: 500 });
  }
} 