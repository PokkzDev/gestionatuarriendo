import { useState } from 'react';
import styles from '../page.module.css';
import { 
  FaUser, 
  FaSignOutAlt, 
  FaExclamationTriangle,
  FaFileAlt
} from 'react-icons/fa';

const AccountSettings = () => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDeleteAccount = async () => {
    setLoading(true);
    
    try {
      // API call would go here
      // const response = await fetch('/api/user/account', {
      //   method: 'DELETE',
      // });
      
      // if (!response.ok) throw new Error('Error al eliminar cuenta');
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to homepage or logout
      window.location.href = '/';
    } catch (err) {
      alert('Error al eliminar cuenta: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.settingSection}>
      <h2 className={styles.sectionTitle}>
        <FaUser className={styles.settingIcon} /> Cuenta
      </h2>
      
      <div className={styles.formGroup}>
        <button 
          className={styles.actionButton}
          style={{ color: '#4a6cf7', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => window.location.href = '/'}
        >
          <FaFileAlt /> Ver términos y condiciones
        </button>
      </div>
      
      <div className={styles.formGroup}>
        <button 
          className={styles.actionButton}
          style={{ color: '#4a6cf7', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => window.location.href = '/api/auth/signout'}
        >
          <FaSignOutAlt /> Cerrar sesión
        </button>
      </div>
      
      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>
          <FaExclamationTriangle /> Zona de peligro
        </h3>
        
        <p>Esta acción no puede deshacerse. Perderá permanentemente todos sus datos.</p>
        
        {!showDeleteConfirm ? (
          <button 
            className={styles.dangerButton}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Eliminar cuenta
          </button>
        ) : (
          <div>
            <p>Por favor, escriba &ldquo;ELIMINAR&rdquo; para confirmar:</p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className={styles.formInput}
              style={{ marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={styles.dangerButton}
                disabled={confirmText !== 'ELIMINAR' || loading}
                onClick={handleDeleteAccount}
              >
                {loading ? (
                  <div className={styles.loadingSpinner} style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
                ) : (
                  'Confirmar Eliminación'
                )}
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmText('');
                }}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings; 