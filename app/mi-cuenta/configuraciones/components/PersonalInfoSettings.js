import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { FaUser, FaExclamationTriangle, FaCheck } from 'react-icons/fa';

const PersonalInfoSettings = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [nameChangesInfo, setNameChangesInfo] = useState({
    count: user?.nameChangesCount || 0,
    remaining: user ? 3 - (user.nameChangesCount || 0) : 3
  });
  const [userData, setUserData] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          throw new Error('Error al obtener datos de usuario');
        }
        const data = await response.json();
        setUserData(data);
        setFormData({
          name: data.name || '',
        });
        setNameChangesInfo({
          count: data.nameChangesCount || 0,
          remaining: 3 - (data.nameChangesCount || 0)
        });
        
        if (onUpdate) onUpdate(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Error al cargar datos de usuario');
      } finally {
        setInitialLoad(false);
      }
    };

    if (initialLoad) {
      fetchUserData();
    }
  }, [initialLoad, onUpdate]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
      });
      setNameChangesInfo({
        count: user.nameChangesCount || 0,
        remaining: 3 - (user.nameChangesCount || 0)
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error && data.error.includes('correo electrónico ya está en uso')) {
          throw new Error('Este correo electrónico ya está en uso por otro usuario. Por favor utilice otro.');
        }
        throw new Error(data.error || 'Error al actualizar perfil');
      }
      
      setUserData(data);
      
      setNameChangesInfo({
        count: data.nameChangesCount || 0,
        remaining: data.nameChangesRemaining || 0
      });
      
      if (onUpdate) onUpdate(data);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const isNameChanged = userData && formData.name !== userData.name;

  return (
    <div className={styles.settingSection}>
      <h2 className={styles.sectionTitle}>
        <FaUser className={styles.settingIcon} /> Información Personal
      </h2>
      
      {success && (
        <div className={styles.successMessage}>
          <FaCheck /> Información actualizada correctamente
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.formLabel}>Nombre completo</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={styles.formInput}
            disabled={loading || nameChangesInfo.remaining <= 0}
            required
          />
          <div className={styles.nameChangesInfo}>
            <p className={styles.formHelp}>
              {nameChangesInfo.remaining > 0 
                ? `Cambios de nombre restantes: ${nameChangesInfo.remaining} de 3` 
                : 'Has alcanzado el límite de cambios de nombre permitidos.'}
            </p>
            {isNameChanged && nameChangesInfo.remaining > 0 && (
              <p className={styles.warningText}>
                <FaExclamationTriangle className={styles.warningIcon} /> 
                {nameChangesInfo.remaining === 1 
                  ? '¡Atención! Este es tu último cambio de nombre disponible.' 
                  : `Al guardar, utilizarás 1 de tus ${nameChangesInfo.remaining} cambios de nombre restantes.`}
              </p>
            )}
          </div>
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
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfoSettings; 