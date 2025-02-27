'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verificando tu correo electrónico...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No se proporcionó un token de verificación válido.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al verificar el correo electrónico');
        }

        setStatus('success');
        setMessage('¡Tu correo electrónico ha sido verificado correctamente!');
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Error al verificar el correo electrónico');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Verificación de Correo Electrónico</h1>
        
        {status === 'loading' && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
                <circle cx="12" cy="12" r="11" fill="#4caf50" />
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="white" />
              </svg>
            </div>
            <p className={styles.successMessage}>{message}</p>
            <div className={styles.actions}>
              <Link href="/login" className={styles.button}>
                Iniciar Sesión
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.error}>
            <div className={styles.errorIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
                <circle cx="12" cy="12" r="11" fill="#f44336" />
                <path d="M13.41 12l4.3-4.29a1 1 0 1 0-1.42-1.42L12 10.59l-4.29-4.3a1 1 0 0 0-1.42 1.42l4.3 4.29-4.3 4.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4.29-4.3 4.29 4.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z" fill="white" />
              </svg>
            </div>
            <p className={styles.errorMessage}>{message}</p>
            <div className={styles.actions}>
              <Link href="/login" className={styles.button}>
                Volver al Inicio de Sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 