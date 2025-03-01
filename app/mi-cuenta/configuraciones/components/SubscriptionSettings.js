import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { FaCrown, FaExclamationTriangle, FaCheck, FaMedal, FaGem, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const plans = [
  {
    id: 'FREE',
    name: 'Gratis',
    price: '0',
    color: '#52c41a',
    icon: <FaMedal size={24} />,
    features: [
      { text: 'Registro de propiedades básico', included: true },
      { text: 'Hasta 12 gastos por categoría', included: true },
      { text: 'Sin acceso a estadísticas avanzadas', included: false },
      { text: 'Sin acceso a reportes personalizados', included: false },
    ],
    description: 'Ideal para comenzar a organizar tus propiedades y gastos.',
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: '9.990',
    color: '#1890ff',
    icon: <FaCrown size={24} />,
    features: [
      { text: 'Todas las características del plan Gratis', included: true },
      { text: 'Gastos ilimitados por categoría', included: true },
      { text: 'Estadísticas avanzadas', included: true },
      { text: 'Reportes mensuales', included: true },
    ],
    description: 'Perfecto para arrendatarios y propietarios que desean un control completo.',
  },
  {
    id: 'ELITE',
    name: 'Elite',
    price: '19.990',
    color: '#722ed1',
    icon: <FaGem size={24} />,
    features: [
      { text: 'Todas las características del plan Premium', included: true },
      { text: 'Reportes personalizados', included: true },
      { text: 'Gestión de múltiples propiedades', included: true },
      { text: 'Soporte prioritario', included: true },
    ],
    description: 'Para profesionales y propietarios de múltiples propiedades.',
  },
];

const SubscriptionSettings = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'No disponible';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        
        const response = await fetch('/api/user/subscription');
        if (!response.ok) {
          throw new Error('Error al obtener detalles de suscripción');
        }
        const data = await response.json();
        setSubscriptionDetails(data);
      } catch (err) {
        console.error('Error fetching subscription details:', err);
        setError('No se pudieron cargar los detalles de la suscripción');
      }
    };

    
    
    if (session?.user?.accountTier !== 'FREE') {
      fetchSubscriptionDetails();
    }
  }, [session]);

  const handleCancelSubscription = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cancelar la suscripción');
      }

      const data = await response.json();
      setSuccess(true);
      setShowCancelConfirm(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Error al cancelar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = plans.find(p => p.id === session?.user?.accountTier) || plans[0];
  const isPaidTier = currentPlan.id !== 'FREE';
  const isCancelled = session?.user?.subscriptionStatus === 'cancelled_pending_expiration';

  return (
    <div className={styles.settingSection}>
      <h2 className={styles.sectionTitle}>
        <FaCrown className={styles.settingIcon} /> Suscripción
      </h2>

      {success && (
        <div className={styles.successMessage}>
          <FaCheck /> Tu suscripción será cancelada al final del período actual
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle /> {error}
        </div>
      )}

      <div className={styles.planInfo}>
        <div className={styles.planHeader} style={{ color: currentPlan.color }}>
          {currentPlan.icon}
          <h3 className={styles.planTitle}>{currentPlan.name}</h3>
        </div>

        {currentPlan.id !== 'FREE' && (
          <div className={styles.subscriptionDetails}>
            <div className={styles.subscriptionItem}>
              <FaCreditCard className={styles.subscriptionIcon} />
              <div>
                <span className={styles.subscriptionLabel}>Precio mensual</span>
                <span className={styles.subscriptionValue}>${currentPlan.price}</span>
              </div>
            </div>

            {subscriptionDetails && (
              <>
                <div className={styles.subscriptionItem}>
                  <FaCalendarAlt className={styles.subscriptionIcon} />
                  <div>
                    <span className={styles.subscriptionLabel}>Fecha de expiración</span>
                    <span className={styles.subscriptionValue}>
                      {subscriptionDetails?.subscriptionExpiresAt ? 
                        formatDate(subscriptionDetails.subscriptionExpiresAt) : 
                        'No disponible'}
                    </span>
                  </div>
                </div>

                {subscriptionDetails.subscriptionId && (
                  <div className={styles.subscriptionId}>
                    ID de suscripción: {subscriptionDetails.subscriptionId}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className={styles.planFeatures}>
          <h4>Características incluidas:</h4>
          <ul>
            {currentPlan.features.map((feature, index) => (
              <li key={index} className={feature.included ? styles.featureIncluded : styles.featureExcluded}>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        {isCancelled && (
          <div className={styles.warningText}>
            <FaExclamationTriangle className={styles.warningIcon} />
            Tu suscripción ha sido cancelada y expirará el {formatDate(subscriptionDetails?.subscriptionExpiresAt)}
          </div>
        )}

        {isPaidTier && !isCancelled && (
          <button 
            className={styles.dangerButton}
            onClick={() => setShowCancelConfirm(true)}
            style={{ marginTop: '20px' }}
          >
            Detener renovación automática
          </button>
        )}

        {showCancelConfirm && (
          <div className={styles.confirmationBox}>
            <p>¿Estás seguro de que deseas detener la renovación automática?</p>
            <p>Tu suscripción seguirá activa hasta el {formatDate(subscriptionDetails?.subscriptionExpiresAt)}, pero no se renovará automáticamente después de esa fecha.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button 
                className={styles.dangerButton}
                onClick={handleCancelSubscription}
                disabled={loading}
              >
                {loading ? (
                  <div className={styles.loadingSpinner} style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
                ) : (
                  'Confirmar'
                )}
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowCancelConfirm(false)}
                disabled={loading}
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {!isPaidTier && session?.user?.accountTier === 'FREE' && (
          <button 
            className={styles.upgradeButton}
            onClick={() => router.push('/planes')}
            style={{ marginTop: '20px' }}
          >
            Mejorar plan
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSettings; 