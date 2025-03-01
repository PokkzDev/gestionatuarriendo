'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../page.module.css';
import { FaCheckCircle, FaArrowLeft, FaCreditCard } from 'react-icons/fa';

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [updateAttempted, setUpdateAttempted] = useState(false);

  // Get subscription details from URL parameters
  const subscriptionId = searchParams.get('subscription_id');
  const preapprovalId = searchParams.get('preapproval_id');
  const preapprovalPlanId = searchParams.get('preapproval_plan_id');
  const externalReference = searchParams.get('external_reference');
  const paymentId = searchParams.get('payment_id');
  const paymentStatus = searchParams.get('status');
  
  // Use whatever ID MercadoPago provides
  const actualSubscriptionId = subscriptionId || preapprovalId || preapprovalPlanId || paymentId;

  // Log all parameters for debugging
  useEffect(() => {
    console.log('Success page parameters:', {
      subscriptionId,
      preapprovalId,
      preapprovalPlanId,
      externalReference,
      paymentId,
      paymentStatus,
      actualSubscriptionId
    });
  }, [subscriptionId, preapprovalId, preapprovalPlanId, externalReference, paymentId, paymentStatus, actualSubscriptionId]);

  // Listen for session updates via WebSocket
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SESSION_UPDATE') {
        console.log('🔄 Received session update notification');
        await update({ force: true });
      }
    };

    // Clean up on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [update]);

  useEffect(() => {
    const verifySubscription = async () => {
      if (!actualSubscriptionId && !externalReference) {
        setError('No se recibió información de suscripción válida.');
        setLoading(false);
        return;
      }

      // Prevent multiple update attempts
      if (updateAttempted) {
        setLoading(false);
        return;
      }

      try {
        // Mark that we've attempted an update
        setUpdateAttempted(true);

        // Updated direct payment verification logic
        if (paymentId && paymentStatus === 'approved' && externalReference) {
          console.log('Processing direct payment with ID:', paymentId);
          const parts = externalReference.split('-');
          if (parts.length >= 2) {
            const extractedPlanId = parts[parts.length - 1];
            setPaymentInfo({
              planId: extractedPlanId,
              status: 'approved'
            });
            try {
              const updateResponse = await fetch('/api/user/update-tier', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: parts.slice(0, -1).join('-'), // Handle user IDs with hyphens
                  planId: extractedPlanId,
                  subscriptionId: paymentId,
                  subscriptionType: 'recurring',
                  subscriptionStatus: 'active'
                }),
              });
              
              if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                console.error('Update via API failed:', errorData);
                console.log('Webhook will handle the update');
              } else {
                const responseData = await updateResponse.json();
                console.log('Update successful:', responseData);
              }
            } catch (updateError) {
              console.error('Error updating subscription:', updateError);
            }
          }
        }
        // For subscription verification with ID (legacy flow)
        else if (actualSubscriptionId) {
          console.log('Verifying subscription with ID:', actualSubscriptionId);
          
          let response;
          
          // Determine which endpoint to use based on the ID type
          if (preapprovalPlanId) {
            // For new plan-based approach
            try {
              // Use direct API call instead of going through our API
              response = await fetch(`https://api.mercadopago.com/preapproval_plan/${actualSubscriptionId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              });
            } catch (directError) {
              console.error('Error with direct API call, falling back to our API:', directError);
              response = await fetch(`/api/mercadopago/verify-subscription?plan_id=${actualSubscriptionId}`);
            }
          } else {
            // For legacy subscription approach
            response = await fetch(`/api/mercadopago/verify-subscription?subscription_id=${actualSubscriptionId}`);
          }
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Subscription verification failed:', errorData);
            throw new Error(`Error verificando la suscripción: ${errorData.error || 'Error desconocido'}`);
          }
          
          const data = await response.json();
          console.log('Subscription verification response:', data);
          
          if (data.status === 'active' || data.status === 'authorized' || data.status === 'pending') {
            const extRef = data.externalReference || externalReference;
            
            if (extRef) {
              const parts = extRef.split('-');
              const extractedPlanId = parts.pop(); // Get the last part (PREMIUM)
              const userId = parts.join('-'); // Rejoin the rest (in case userId contains hyphens)
              
              setPaymentInfo({
                planId: extractedPlanId,
                subscriptionId: actualSubscriptionId,
                status: data.status,
                type: data.type
              });
              
              // Update user tier if needed
              if (session?.user?.accountTier !== extractedPlanId) {
                try {
                  const updateResponse = await fetch('/api/user/update-tier', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userId,
                      planId: extractedPlanId,
                      subscriptionId: actualSubscriptionId,
                      subscriptionType: 'recurring',
                      subscriptionStatus: data.status
                    }),
                  });
                  
                  if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    console.error('Update via API failed:', errorData);
                    console.warn('Fallback subscription update failed, will rely on webhook processing');
                  } else {
                    const responseData = await updateResponse.json();
                    console.log('Update successful:', responseData);
                  }
                } catch (updateError) {
                  console.error('Error updating subscription:', updateError);
                }
              }
            }
          } else {
            setError(`La suscripción está en estado "${data.status || 'desconocido'}". Por favor contacta a soporte.`);
          }
        }

        // Force refresh the session only once
        await update({ force: true });
      } catch (err) {
        console.error('Error verifying subscription:', err);
        setError('Hubo un problema al verificar tu suscripción. El equipo de soporte ha sido notificado.');
      } finally {
        setLoading(false);
      }
    };

    if (!updateAttempted) {
      verifySubscription();
    }
  }, [actualSubscriptionId, externalReference, update, updateAttempted, paymentId, paymentStatus, session]);

  const handleBackToPlans = () => {
    router.push('/planes');
  };

  const handleGoToAccount = () => {
    router.push('/mi-cuenta');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Verificando tu suscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.successContainer}>
        {error ? (
          <>
            <div className={styles.errorIcon}>❌</div>
            <h1 className={styles.title}>Hubo un problema</h1>
            <p className={styles.message}>{error}</p>
          </>
        ) : (
          <>
            <div className={styles.successIcon}>
              <FaCheckCircle size={60} color="#52c41a" />
            </div>
            <h1 className={styles.title}>¡Suscripción Exitosa!</h1>
            <p className={styles.message}>
              Tu suscripción al plan {paymentInfo?.planId || 'Premium/Elite'} ha sido {paymentInfo?.status === 'pending' ? 'iniciada' : 'activada'} correctamente.
            </p>
            
            <div className={styles.subscriptionBadge}>
              <FaCreditCard style={{ marginRight: '8px' }} />
              Suscripción Recurrente Mensual
            </div>
            
            {actualSubscriptionId && (
              <p className={styles.paymentId}>
                ID de suscripción: {actualSubscriptionId}
              </p>
            )}
            
            {paymentInfo?.status === 'pending' && (
              <p className={styles.pendingMessage}>
                Tu suscripción está en proceso. Pronto tendrás acceso a todas las funcionalidades.
              </p>
            )}
          </>
        )}

        <div className={styles.buttonContainer}>
          <button 
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={handleBackToPlans}
          >
            <FaArrowLeft style={{ marginRight: '8px' }} /> Volver a Planes
          </button>
          
          {!error && (
            <button 
              className={styles.button}
              onClick={handleGoToAccount}
            >
              Ir a Mi Cuenta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}