import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { generateVerificationToken, getTokenExpiration } from '@/lib/auth';
import { sendEmail } from '@/lib/emailService';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Correo electrónico requerido' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'El correo electrónico ya ha sido verificado' },
        { status: 400 }
      );
    }

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = getTokenExpiration(24); // Token expires in 24 hours

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
          userName: user.name || 'Usuario',
        },
      });
      
      // For development, return the email preview URL
      if (emailResult.previewUrl) {
        return NextResponse.json({
          message: 'Se ha enviado un nuevo correo de verificación.',
          previewUrl: emailResult.previewUrl,
        });
      }
      
      return NextResponse.json({
        message: 'Se ha enviado un nuevo correo de verificación.',
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      
      return NextResponse.json(
        { error: 'Error al enviar el correo de verificación. Por favor intente más tarde.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 