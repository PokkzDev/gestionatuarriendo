import { FaHome, FaPhoneAlt, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import styles from '../page.module.css';

const PropertyCard = ({ property, owner, startDate, paymentDueDay, formatDate, formatCurrency }) => {
  return (
    <div className={styles.propertyCard}>
      <div className={styles.propertyHeader}>
        <FaHome className={styles.propertyIcon} />
        <h2>{property?.name || 'Propiedad'}</h2>
      </div>
      
      <div className={styles.propertyDetails}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Dirección:</span>
          <span className={styles.detailValue}>{property?.address || 'No disponible'}</span>
        </div>
        
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Propietario:</span>
          <span className={styles.detailValue}>{owner?.name || 'No disponible'}</span>
        </div>
        
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Fecha de inicio:</span>
          <span className={styles.detailValue}>{startDate ? formatDate(startDate) : 'No disponible'}</span>
        </div>
        
        {paymentDueDay && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>
              <FaCalendarAlt className={styles.detailIcon} /> Día de pago mensual:
            </span>
            <span className={styles.detailValue}>
              <strong>{paymentDueDay}</strong> de cada mes
            </span>
          </div>
        )}
        
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Valor del arriendo:</span>
          <span className={styles.detailValue}>{property?.rentAmount ? formatCurrency(property.rentAmount) : 'No disponible'}</span>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button className={styles.button} onClick={() => alert('Contactar propietario')}>
            <FaPhoneAlt style={{ marginRight: '8px' }} /> Contactar propietario
          </button>
          <button className={styles.secondaryButton} onClick={() => alert('Enviar mensaje')}>
            <FaEnvelope style={{ marginRight: '8px' }} /> Enviar mensaje
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard; 