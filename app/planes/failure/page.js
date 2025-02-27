'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import { FaTimesCircle } from 'react-icons/fa';

export default function SubscriptionFailure() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to planes page after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/planes');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.failureContainer}>
        <FaTimesCircle size={64} color="#ff4d4f" />
        <h1 className={styles.title}>Error en la Suscripción</h1>
        <p className={styles.subtitle}>
          Hubo un problema al procesar tu suscripción. Por favor, intenta nuevamente.
        </p>
      </div>
    </div>
  );
} 