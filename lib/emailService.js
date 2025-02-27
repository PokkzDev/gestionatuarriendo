import nodemailer from 'nodemailer';

// Create transporter with environment variables or test account
const createTransporter = async () => {
  // For production, use real email service
  if (process.env.EMAIL_SERVER && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_SERVER,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false
      }
    });
  }
  
  // For development, use Ethereal for testing
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

// Email templates
const emailTemplates = {
  verification: (token, userName = 'Usuario') => ({
    subject: 'Verificación de cuenta - GestionaTuArriendo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #333;">GestionaTuArriendo</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
          <h2 style="color: #333;">Hola ${userName},</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Gracias por registrarte en GestionaTuArriendo. Para completar tu registro y comenzar a utilizar nuestra plataforma, por favor verifica tu dirección de correo electrónico haciendo clic en el botón a continuación:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/verificar-email?token=${token}" 
               style="display: inline-block; padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; font-weight: bold; border-radius: 4px;">
              Verificar mi correo electrónico
            </a>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
          </p>
          <p style="font-size: 14px; background-color: #e0e0e0; padding: 10px; border-radius: 3px; word-break: break-all;">
            ${process.env.NEXT_PUBLIC_APP_URL}/verificar-email?token=${token}
          </p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Si no has creado una cuenta en GestionaTuArriendo, puedes ignorar este correo.
          </p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            ¡Gracias!<br />
            Equipo de GestionaTuArriendo
          </p>
        </div>
        <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} GestionaTuArriendo. Todos los derechos reservados.</p>
        </div>
      </div>
    `,
    text: `
      Hola ${userName},
      
      Gracias por registrarte en GestionaTuArriendo. Para completar tu registro y comenzar a utilizar nuestra plataforma, por favor verifica tu dirección de correo electrónico visitando el siguiente enlace:
      
      ${process.env.NEXT_PUBLIC_APP_URL}/verificar-email?token=${token}
      
      Si no has creado una cuenta en GestionaTuArriendo, puedes ignorar este correo.
      
      ¡Gracias!
      Equipo de GestionaTuArriendo
    `,
  }),
};

// Send email function with template
export async function sendEmail({ to, template, data, subject, html, text }) {
  const transporter = await createTransporter();
  
  let emailContent;
  
  // If using a template
  if (template && emailTemplates[template]) {
    emailContent = emailTemplates[template](data.token, data.userName);
  } 
  // If using custom content
  else if (subject && (html || text)) {
    emailContent = {
      subject,
      html,
      text
    };
  } else {
    throw new Error('Either a valid template or custom content (subject, html/text) must be provided');
  }
  
  const info = await transporter.sendMail({
    from: `"GestionaTuArriendo" <${process.env.EMAIL_FROM || 'noreply@gestionatuarriendo.com'}>`,
    to,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  });
  
  // For development with Ethereal, return the preview URL
  if (info.messageId && !process.env.EMAIL_SERVER) {
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return {
      success: true,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  }
  
  return { success: true };
}

export default { sendEmail }; 