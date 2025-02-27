import { useState } from 'react';
import styles from '../page.module.css';
import { FaBell, FaExclamationTriangle, FaCheck } from 'react-icons/fa';

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    expenses: true,
    updates: false,
    reminders: true
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // API call would go here
      // const response = await fetch('/api/user/notifications', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notifications),
      // });
      
      // if (!response.ok) throw new Error('Error al guardar preferencias');
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Error al guardar preferencias');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.settingSection}>
      <h2 className={styles.sectionTitle}>
        <FaBell className={styles.settingIcon} /> Notificaciones
      </h2>
      
      {success && (
        <div className={styles.successMessage}>
          <FaCheck /> Preferencias guardadas correctamente
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label className={styles.formLabel}>Notificaciones por correo</label>
            <p className={styles.formHelp}>Recibe actualizaciones importantes por correo electrónico</p>
          </div>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={notifications.email} 
              onChange={() => handleToggle('email')}
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
        
        <div className={styles.formGroup} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label className={styles.formLabel}>Alertas de gastos</label>
            <p className={styles.formHelp}>Notificaciones sobre nuevos gastos registrados</p>
          </div>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={notifications.expenses} 
              onChange={() => handleToggle('expenses')}
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
        
        <div className={styles.formGroup} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label className={styles.formLabel}>Actualizaciones del sistema</label>
            <p className={styles.formHelp}>Información sobre nuevas funciones y mejoras</p>
          </div>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={notifications.updates} 
              onChange={() => handleToggle('updates')}
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
        
        <div className={styles.formGroup} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label className={styles.formLabel}>Recordatorios</label>
            <p className={styles.formHelp}>Recordatorios para actualizar tus datos de gastos</p>
          </div>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={notifications.reminders} 
              onChange={() => handleToggle('reminders')}
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
        
        <div>
          <button 
            type="submit" 
            className={styles.saveButton}
            disabled={loading}
          >
            {loading ? (
              <div className={styles.loadingSpinner} style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
            ) : (
              'Guardar Preferencias'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings; 