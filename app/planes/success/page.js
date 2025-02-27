'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import { FaCheckCircle } from 'react-icons/fa';

export default function SubscriptionSuccess() {
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
      <div className={styles.successContainer}>
        <FaCheckCircle size={64} color="#52c41a" />
        <h1 className={styles.title}>¡Suscripción Exitosa!</h1>
        <p className={styles.subtitle}>
          Tu suscripción ha sido procesada correctamente. Serás redirigido en unos segundos...
        </p>
      </div>
    </div>
  );
} 