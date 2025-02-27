'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './page.module.css';
import { FaCrown, FaGem, FaCheck, FaTimes, FaMedal, FaArrowRight } from 'react-icons/fa';

export default function Planes() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const userTier = session?.user?.accountTier || 'FREE';

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
      buttonText: 'Plan Actual',
      recommended: false,
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
      buttonText: 'Elegir Plan',
      recommended: true,
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
      buttonText: 'Elegir Plan',
      recommended: false,
    },
  ];

  const handleUpgrade = async (planId) => {
    if (planId === userTier) return;

    setSelectedPlan(planId);
    setLoading(true);

    try {
      const response = await fetch('/api/mercadopago/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: session?.user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la suscripción');
      }

      // Redirect to MercadoPago checkout
      window.location.href = data.init_point;
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al procesar tu solicitud. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Planes de Suscripción</h1>
      <p className={styles.subtitle}>
        Elige el plan que mejor se adapte a tus necesidades
      </p>

      <div className={styles.plansContainer}>
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`${styles.planCard} ${plan.recommended ? styles.recommended : ''} ${plan.id === userTier ? styles.currentPlan : ''}`}
            style={{ borderColor: plan.id === userTier ? plan.color : undefined }}
          >
            {plan.recommended && (
              <div className={styles.recommendedBadge} style={{ backgroundColor: plan.color }}>
                Recomendado
              </div>
            )}
            
            <div className={styles.planHeader} style={{ color: plan.color }}>
              {plan.icon}
              <h2 className={styles.planName}>{plan.name}</h2>
            </div>
            
            <div className={styles.planPrice}>
              <span className={styles.currency}>$</span>
              <span className={styles.amount}>{plan.price}</span>
              <span className={styles.period}>/mes</span>
            </div>
            
            <p className={styles.planDescription}>{plan.description}</p>
            
            <ul className={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <li key={index} className={styles.featureItem}>
                  {feature.included ? (
                    <FaCheck className={styles.featureIncluded} />
                  ) : (
                    <FaTimes className={styles.featureExcluded} />
                  )}
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            
            <button 
              className={styles.planButton}
              style={{ 
                backgroundColor: plan.id === userTier ? '#f5f5f5' : plan.color,
                color: plan.id === userTier ? '#333' : 'white',
                cursor: plan.id === userTier ? 'default' : 'pointer'
              }}
              onClick={() => handleUpgrade(plan.id)}
              disabled={plan.id === userTier || loading}
            >
              {plan.id === userTier ? 'Plan Actual' : (
                <>
                  {plan.buttonText} <FaArrowRight style={{ marginLeft: '5px' }} />
                </>
              )}
            </button>
            
            {plan.id === userTier && (
              <div className={styles.currentPlanBadge}>
                Tu plan actual
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 