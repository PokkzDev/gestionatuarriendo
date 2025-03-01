'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../page.module.css';
import { FaClock, FaArrowLeft, FaHome } from 'react-icons/fa';

export default function PaymentPending() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get payment details from URL parameters
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  const handleBackToPlans = () => {
    router.push('/planes');
  };

  const handleGoToHome = () => {
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.pendingContainer}>
        <div className={styles.pendingIcon}>
          <FaClock size={60} color="#faad14" />
        </div>
        <h1 className={styles.title}>Pago en Proceso</h1>
        <p className={styles.message}>
          Tu pago está siendo procesado. Te notificaremos cuando se complete.
        </p>
        {paymentId && (
          <p className={styles.paymentId}>
            ID de pago: {paymentId}
          </p>
        )}

        <div className={styles.buttonContainer}>
          <button 
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={handleBackToPlans}
          >
            <FaArrowLeft style={{ marginRight: '8px' }} /> Volver a Planes
          </button>
          
          <button 
            className={styles.button}
            onClick={handleGoToHome}
          >
            <FaHome style={{ marginRight: '8px' }} /> Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}