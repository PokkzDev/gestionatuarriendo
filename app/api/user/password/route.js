import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import bcrypt from 'bcrypt';

// Use global to prevent multiple instances of Prisma Client in development
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// PUT /api/user/password - Change password
export async function PUT(request) {
  try {
    // Get session data
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Get the current user ID from the session
    const userId = session.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario no encontrado en la sesión' }, { status: 401 });
    }
    
    // Get the password data from the request
    const { currentPassword, newPassword } = await request.json();
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Contraseña actual y nueva contraseña son requeridas'
      }, { status: 400 });
    }
    
    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'La nueva contraseña debe tener al menos 8 caracteres'
      }, { status: 400 });
    }
    
    // Get the current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: 'La contraseña actual es incorrecta'
      }, { status: 400 });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });
    
    return NextResponse.json({ 
      message: 'Contraseña actualizada correctamente' 
    });
    
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return NextResponse.json({ 
      error: 'Error al cambiar contraseña: ' + error.message 
    }, { status: 500 });
  }
} 