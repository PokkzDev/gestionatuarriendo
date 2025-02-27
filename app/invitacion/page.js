'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './page.module.css';

export default function InvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [invitation, setInvitation] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const invitationId = searchParams.get('id');
  
  useEffect(() => {
    if (!invitationId) {
      setError('ID de invitación no proporcionado');
      setLoading(false);
      return;
    }
    
    const checkInvitation = async () => {
      try {
        const response = await fetch(`/api/properties/invite/verify?id=${invitationId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al verificar la invitación');
        }
        
        setInvitation(data.invitation);
        setProperty(data.property);
        setLoading(false);
      } catch (err) {
        console.error('Error checking invitation:', err);
        setError(err.message || 'Error al verificar la invitación');
        setLoading(false);
      }
    };
    
    checkInvitation();
  }, [invitationId]);
  
  const handleAcceptInvitation = async () => {
    if (!session || !invitation) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/properties/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationId: invitation.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al aceptar la invitación');
      }
      
      setSuccess(true);
      
      // Redirect to mi-arriendo page after a short delay
      setTimeout(() => {
        router.push('/mi-arriendo');
      }, 3000);
      
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Error al aceptar la invitación');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Procesando invitación...</h1>
          <p className={styles.message}>Por favor espera mientras verificamos tu invitación.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Error</h1>
          <p className={styles.errorMessage}>{error}</p>
          <Link href="/" className={styles.link}>Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>¡Invitación aceptada!</h1>
          <p className={styles.message}>Has aceptado exitosamente la invitación para acceder a los detalles de esta propiedad.</p>
          <p className={styles.message}>Serás redirigido a tu página de Mi Arriendo...</p>
        </div>
      </div>
    );
  }

  if (!invitation || !property) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Invitación no encontrada</h1>
          <p className={styles.errorMessage}>Esta invitación no existe o ha expirado.</p>
          <Link href="/" className={styles.link}>Volver al inicio</Link>
        </div>
      </div>
    );
  }

  // If user is not logged in, show login/register prompt
  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Invitación para acceder a una propiedad</h1>
          <p className={styles.message}>Has recibido una invitación para vincularte como arrendatario a la propiedad <strong>{property.name}</strong> ubicada en <strong>{property.address}</strong>.</p>
          <p className={styles.message}>Para continuar, debes iniciar sesión o registrarte:</p>
          <div className={styles.actions}>
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/invitacion?id=${invitationId}`)}`} className={styles.button}>Iniciar sesión</Link>
            <Link href={`/registro?callbackUrl=${encodeURIComponent(`/invitacion?id=${invitationId}`)}&email=${encodeURIComponent(invitation.tenantEmail)}`} className={styles.button}>Registrarme</Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in but email doesn't match invitation
  if (session && session.user && session.user.email !== invitation.tenantEmail) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Usuario incorrecto</h1>
          <p className={styles.errorMessage}>Esta invitación fue enviada a <strong>{invitation.tenantEmail}</strong>, pero has iniciado sesión con <strong>{session.user.email}</strong>.</p>
          <p className={styles.message}>Para continuar, debes cerrar sesión e iniciar sesión con la cuenta correcta.</p>
          <Link href="/api/auth/signout" className={styles.button}>Cerrar sesión</Link>
        </div>
      </div>
    );
  }

  // If everything is correct, show accept invitation button
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Invitación para acceder a una propiedad</h1>
        <p className={styles.message}>Has recibido una invitación para vincularte como arrendatario a la propiedad <strong>{property.name}</strong> ubicada en <strong>{property.address}</strong>.</p>
        <p className={styles.description}>Al aceptar esta invitación, podrás ver los detalles de la propiedad en la plataforma.</p>
        <button 
          className={styles.button}
          onClick={handleAcceptInvitation}
          disabled={loading}
        >
          {loading ? 'Procesando...' : 'Aceptar invitación'}
        </button>
      </div>
    </div>
  );
} 