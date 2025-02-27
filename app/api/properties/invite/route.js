import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/emailService';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user || (user.role !== 'PROPIETARIO' && user.role !== 'AMBOS')) {
      return NextResponse.json(
        { error: 'Solo propietarios pueden invitar arrendatarios' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const { propertyId, tenantEmail } = data;
    
    if (!propertyId || !tenantEmail) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }
    
    // Check if property exists and belongs to the user
    console.log('Checking property with ID:', propertyId);
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    
    console.log('Property found:', property ? 'Yes' : 'No');
    if (property) {
      console.log('Property userId:', property.userId);
      console.log('Current userId:', user.id);
      console.log('Match:', property.userId === user.id ? 'Yes' : 'No');
    }
    
    if (!property || property.userId !== user.id) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o no pertenece al usuario' },
        { status: 404 }
      );
    }
    
    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: tenantEmail },
    });
    
    // Check if an invitation already exists
    const existingInvitation = await prisma.propertyTenant.findUnique({
      where: {
        propertyId_tenantEmail: {
          propertyId: propertyId,
          tenantEmail: tenantEmail,
        },
      },
    });
    
    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Ya se ha enviado una invitación a este email' },
        { status: 400 }
      );
    }
    
    // Create invitation record
    const invitation = await prisma.propertyTenant.create({
      data: {
        propertyId: propertyId,
        tenantEmail: tenantEmail,
        tenantId: existingUser ? existingUser.id : null,
        status: 'PENDING',
      },
    });
    
    // Generate invitation URL
    const invitationUrl = `${process.env.NEXTAUTH_URL}/invitacion?id=${invitation.id}`;
    
    // Email template depending on if user exists
    let emailSubject, emailBody;
    
    if (existingUser) {
      emailSubject = `Invitación para acceder a detalles de propiedad`;
      emailBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitación a Gestiona Tu Arriendo</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 1px solid #eaeaea;
            }
            .logo {
              max-width: 180px;
              margin-bottom: 20px;
            }
            h1 {
              color: #1976d2;
              margin-top: 0;
              font-size: 24px;
            }
            .content {
              padding: 20px 0;
            }
            p {
              margin-bottom: 15px;
            }
            .button {
              display: inline-block;
              background-color: #1976d2;
              color: #ffffff !important;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .button:hover {
              background-color: #1565c0;
            }
            .property-details {
              background-color: #f8fafc;
              border-left: 4px solid #1976d2;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #eaeaea;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Gestiona Tu Arriendo</h1>
            </div>
            <div class="content">
              <h2>Has recibido una invitación a una propiedad</h2>
              <p>Hola ${existingUser.name || tenantEmail},</p>
              <p>${user.name || 'El propietario'} te ha invitado a vincularte como arrendatario a su propiedad.</p>
              
              <div class="property-details">
                <p><strong>Propiedad:</strong> ${property.name}</p>
                <p><strong>Dirección:</strong> ${property.address}</p>
              </div>
              
              <p>Al aceptar esta invitación, podrás ver los detalles de la propiedad en la plataforma.</p>
              <p>Para aceptar la invitación, haz clic en el siguiente botón:</p>
              
              <div style="text-align: center;">
                <a href="${invitationUrl}" class="button">Aceptar invitación</a>
              </div>
              
              <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all;">${invitationUrl}</p>
            </div>
            <div class="footer">
              <p>Saludos cordiales,</p>
              <p>El equipo de Gestiona Tu Arriendo</p>
              <p>&copy; ${new Date().getFullYear()} Gestiona Tu Arriendo. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Create registration URL with correct parameters
      const registrationUrl = `${process.env.NEXTAUTH_URL}/login?mode=registro&email=${encodeURIComponent(tenantEmail)}&invitationId=${invitation.id}`;
      
      emailSubject = `Invitación para acceder a detalles de propiedad en Gestiona Tu Arriendo`;
      emailBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitación a Gestiona Tu Arriendo</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 1px solid #eaeaea;
            }
            .logo {
              max-width: 180px;
              margin-bottom: 20px;
            }
            h1 {
              color: #1976d2;
              margin-top: 0;
              font-size: 24px;
            }
            .content {
              padding: 20px 0;
            }
            p {
              margin-bottom: 15px;
            }
            .button {
              display: inline-block;
              background-color: #1976d2;
              color: #ffffff !important;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .button:hover {
              background-color: #1565c0;
            }
            .property-details {
              background-color: #f8fafc;
              border-left: 4px solid #1976d2;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #eaeaea;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Gestiona Tu Arriendo</h1>
            </div>
            <div class="content">
              <h2>Has recibido una invitación en Gestiona Tu Arriendo</h2>
              <p>Hola,</p>
              <p>${user.name || 'Un propietario'} te ha invitado a vincularte como arrendatario a su propiedad.</p>
              
              <div class="property-details">
                <p><strong>Propiedad:</strong> ${property.name}</p>
                <p><strong>Dirección:</strong> ${property.address}</p>
              </div>
              
              <p>Para aceptar esta invitación, primero debes crear una cuenta en nuestra plataforma. Una vez registrado, podrás ver los detalles de la propiedad.</p>
              
              <div style="text-align: center;">
                <a href="${registrationUrl}" class="button">Registrarme y aceptar invitación</a>
              </div>
              
              <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all;">${registrationUrl}</p>
            </div>
            <div class="footer">
              <p>Saludos cordiales,</p>
              <p>El equipo de Gestiona Tu Arriendo</p>
              <p>&copy; ${new Date().getFullYear()} Gestiona Tu Arriendo. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    
    // Send email
    try {
      await sendEmail({
        to: tenantEmail,
        subject: emailSubject,
        html: emailBody,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Invitación enviada exitosamente',
        invitation: invitation,
      });
    } catch (emailError) {
      console.error('Error al enviar el correo:', emailError);
      // Delete the invitation if the email fails
      await prisma.propertyTenant.delete({
        where: { id: invitation.id },
      });
      
      return NextResponse.json(
        { error: 'Error al enviar el correo electrónico' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error al enviar invitación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 