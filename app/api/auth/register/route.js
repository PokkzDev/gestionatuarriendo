import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { generateVerificationToken, getTokenExpiration } from '@/lib/auth';
import { sendEmail } from '@/lib/emailService';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Correo y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = getTokenExpiration(24); // Token expires in 24 hours

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    // Create verification token record
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: expiresAt,
      },
    });

    // Send verification email
    try {
      const emailResult = await sendEmail({
        to: email,
        template: 'verification',
        data: {
          token: verificationToken,
        },
      });
      
      // For development, return the email preview URL
      if (emailResult.previewUrl) {
        return NextResponse.json({
          message: 'Usuario registrado correctamente. Por favor verifica tu correo electrónico.',
          userId: user.id,
          previewUrl: emailResult.previewUrl,
        });
      }
      
      return NextResponse.json({
        message: 'Usuario registrado correctamente. Por favor verifica tu correo electrónico.',
        userId: user.id,
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      
      // We still created the user, just couldn't send the email
      return NextResponse.json({
        message: 'Usuario registrado correctamente, pero hubo un problema al enviar el correo de verificación. Por favor contacta al soporte técnico.',
        userId: user.id,
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
} 