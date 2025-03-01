import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { FaTimes, FaClipboardList } from 'react-icons/fa';
import SolicitudesSection from './SolicitudesSection';

const SolicitudesModal = ({ property, onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '900px', width: '90%' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <FaClipboardList style={{ marginRight: '8px' }} />
            Solicitudes de {property.name}
          </h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.propertyInfo}>
            <p><strong>Dirección:</strong> {property.address}</p>
          </div>
          <SolicitudesSection propertyId={property.id} />
        </div>
        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolicitudesModal; 