import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { generateVerificationToken, getTokenExpiration } from '@/lib/auth';
import { sendEmail } from '@/lib/emailService';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, role, invitationId } = body;

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

    // If invitation ID is provided, check if it's valid
    let invitation = null;
    if (invitationId) {
      invitation = await prisma.propertyTenant.findUnique({
        where: { id: invitationId },
        include: { property: true }
      });
      
      if (!invitation) {
        return NextResponse.json(
          { error: 'La invitación no es válida o ha expirado' },
          { status: 400 }
        );
      }
      
      // Verify the email matches the invitation
      if (invitation.tenantEmail !== email) {
        return NextResponse.json(
          { error: 'El correo electrónico no coincide con el de la invitación' },
          { status: 400 }
        );
      }
      
      // Check if invitation is still pending
      if (invitation.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Esta invitación ya ha sido procesada' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = getTokenExpiration(24); // Token expires in 24 hours

    // Create the user - if invitation exists, set role to ARRENDATARIO or AMBOS
    const userRole = invitation ? (role === 'PROPIETARIO' ? 'AMBOS' : 'ARRENDATARIO') : role;
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

    // If invitation exists, link user to invitation but keep status as PENDING
    // (user still needs to verify email and explicitly accept invitation)
    if (invitation) {
      await prisma.propertyTenant.update({
        where: { id: invitationId },
        data: {
          tenantId: user.id,
        },
      });
    }

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
          hasInvitation: Boolean(invitation),
          invitationId: invitation?.id,
          propertyName: invitation?.property?.name,
        },
      });
      
      // For development, return the email preview URL
      if (emailResult.previewUrl) {
        return NextResponse.json({
          message: invitation 
            ? 'Usuario registrado correctamente. Por favor verifica tu correo electrónico para poder aceptar la invitación.'
            : 'Usuario registrado correctamente. Por favor verifica tu correo electrónico.',
          userId: user.id,
          previewUrl: emailResult.previewUrl,
          hasInvitation: Boolean(invitation),
        });
      }
      
      return NextResponse.json({
        message: invitation 
          ? 'Usuario registrado correctamente. Por favor verifica tu correo electrónico para poder aceptar la invitación.'
          : 'Usuario registrado correctamente. Por favor verifica tu correo electrónico.',
        userId: user.id,
        hasInvitation: Boolean(invitation),
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      
      // We still created the user, just couldn't send the email
      return NextResponse.json({
        message: 'Usuario registrado correctamente, pero hubo un problema al enviar el correo de verificación. Por favor contacta al soporte técnico.',
        userId: user.id,
        hasInvitation: Boolean(invitation),
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