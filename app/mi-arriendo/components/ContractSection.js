import { FaCalendarAlt } from 'react-icons/fa';
import styles from '../page.module.css';

const ContractSection = ({ contract, formatDate }) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <FaCalendarAlt className={styles.sectionIcon} />
        Información del Contrato
      </h2>
      
      <div className={styles.contractDetails}>
        {contract ? (
          <>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Número de contrato:</span>
              <span className={styles.detailValue}>{contract.number || 'No disponible'}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Fecha de inicio:</span>
              <span className={styles.detailValue}>{formatDate(contract.startDate)}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Fecha de término:</span>
              <span className={styles.detailValue}>{formatDate(contract.endDate)}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Duración:</span>
              <span className={styles.detailValue}>{contract.duration} {contract.duration === 1 ? 'mes' : 'meses'}</span>
            </div>
          </>
        ) : (
          <p className={styles.emptyList}>No hay información del contrato disponible.</p>
        )}
      </div>
    </div>
  );
};

export default ContractSection; 