import { useState } from 'react';
import styles from '../page.module.css';
import { FaPalette, FaExclamationTriangle, FaCheck } from 'react-icons/fa';

const AppearanceSettings = () => {
  const [preferences, setPreferences] = useState({
    language: 'es',
    displayMode: 'light',
    fontSize: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // API call would go here
      // const response = await fetch('/api/user/appearance', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(preferences),
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
        <FaPalette className={styles.settingIcon} /> Apariencia
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
        <div className={styles.formGroup}>
          <label htmlFor="language" className={styles.formLabel}>Idioma</label>
          <select
            id="language"
            name="language"
            value={preferences.language}
            onChange={handleChange}
            className={styles.formSelect}
            disabled={loading}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="displayMode" className={styles.formLabel}>Modo de visualización</label>
          <select
            id="displayMode"
            name="displayMode"
            value={preferences.displayMode}
            onChange={handleChange}
            className={styles.formSelect}
            disabled={loading}
          >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="system">Sistema</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="fontSize" className={styles.formLabel}>Tamaño de fuente</label>
          <select
            id="fontSize"
            name="fontSize"
            value={preferences.fontSize}
            onChange={handleChange}
            className={styles.formSelect}
            disabled={loading}
          >
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="large">Grande</option>
          </select>
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

export default AppearanceSettings; 