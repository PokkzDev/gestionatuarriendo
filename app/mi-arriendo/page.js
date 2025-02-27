'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { useSession } from 'next-auth/react';
import RoleGuard from '@/components/RoleGuard';
import { FaHome, FaFileInvoiceDollar, FaCalendarAlt, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

function MiArriendoContent() {
  const [rental, setRental] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchRentalData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/rentals/my-rental');
        
        if (!response.ok) {
          throw new Error('No se pudo cargar la información del arriendo');
        }
        
        const data = await response.json();
        setRental(data);
      } catch (err) {
        console.error('Error fetching rental data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentalData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL').format(date);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.spinner} />
        <p>Cargando información del arriendo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FaExclamationCircle className={styles.errorIcon} />
        <h2>Error al cargar la información</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className={styles.noRentalContainer}>
        <FaHome className={styles.noRentalIcon} />
        <h2>No tienes arriendos activos</h2>
        <p>Actualmente no tienes ningún arriendo registrado en el sistema.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Mi Arriendo</h1>
      
      <div className={styles.propertyCard}>
        <div className={styles.propertyHeader}>
          <FaHome className={styles.propertyIcon} />
          <h2>{rental.property?.name || 'Propiedad'}</h2>
        </div>
        
        <div className={styles.propertyDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Dirección:</span>
            <span className={styles.detailValue}>{rental.property?.address || 'No disponible'}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Propietario:</span>
            <span className={styles.detailValue}>{rental.owner?.name || 'No disponible'}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Fecha de inicio:</span>
            <span className={styles.detailValue}>{rental.startDate ? formatDate(rental.startDate) : 'No disponible'}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Valor del arriendo:</span>
            <span className={styles.detailValue}>{rental.property?.rentAmount ? formatCurrency(rental.property.rentAmount) : 'No disponible'}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FaFileInvoiceDollar className={styles.sectionIcon} />
          Pagos
        </h2>
        
        {rental.payments && rental.payments.length > 0 ? (
          <div className={styles.paymentsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Fecha</div>
              <div className={styles.tableCell}>Monto</div>
              <div className={styles.tableCell}>Estado</div>
            </div>
            
            {rental.payments.map((payment, index) => (
              <div key={index} className={styles.tableRow}>
                <div className={styles.tableCell}>{formatDate(payment.date)}</div>
                <div className={styles.tableCell}>{formatCurrency(payment.amount)}</div>
                <div className={styles.tableCell}>
                  <span className={`${styles.paymentStatus} ${styles[payment.status.toLowerCase()]}`}>
                    {payment.status === 'PAID' ? 'Pagado' : 
                     payment.status === 'PENDING' ? 'Pendiente' : 
                     payment.status === 'OVERDUE' ? 'Atrasado' : payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyList}>No hay pagos registrados.</p>
        )}
      </div>
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FaCalendarAlt className={styles.sectionIcon} />
          Información del Contrato
        </h2>
        
        <div className={styles.contractDetails}>
          {rental.contract ? (
            <>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Número de contrato:</span>
                <span className={styles.detailValue}>{rental.contract.number || 'No disponible'}</span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Fecha de inicio:</span>
                <span className={styles.detailValue}>{formatDate(rental.contract.startDate)}</span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Fecha de término:</span>
                <span className={styles.detailValue}>{formatDate(rental.contract.endDate)}</span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Duración:</span>
                <span className={styles.detailValue}>{rental.contract.duration} {rental.contract.duration === 1 ? 'mes' : 'meses'}</span>
              </div>
            </>
          ) : (
            <p className={styles.emptyList}>No hay información del contrato disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MiArriendo() {
  return (
    <RoleGuard allowedRoles={['ARRENDATARIO', 'AMBOS']} redirectTo="/">
      <MiArriendoContent />
    </RoleGuard>
  );
} 