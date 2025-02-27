import { FaHome } from 'react-icons/fa';
import styles from '../page.module.css';

const PropertyCard = ({ property, owner, startDate, formatDate, formatCurrency }) => {
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
        
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Valor del arriendo:</span>
          <span className={styles.detailValue}>{property?.rentAmount ? formatCurrency(property.rentAmount) : 'No disponible'}</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard; 