import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { FaLock, FaExclamationTriangle, FaCheck, FaEye, FaEyeSlash } from 'react-icons/fa';

const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Ingrese una contraseña'
  });

  // Function to check password strength
  const checkPasswordStrength = (password) => {
    // Basic password strength check
    let score = 0;
    let message = '';

    if (!password) {
      setPasswordStrength({ score: 0, message: 'Ingrese una contraseña' });
      return;
    }

    // Length check
    if (password.length < 8) {
      message = 'Contraseña demasiado corta';
    } else {
      score += 1;
      
      // Check for numbers
      if (/\d/.test(password)) score += 1;
      
      // Check for lowercase letters
      if (/[a-z]/.test(password)) score += 1;
      
      // Check for uppercase letters
      if (/[A-Z]/.test(password)) score += 1;
      
      // Check for special characters
      if (/[^A-Za-z0-9]/.test(password)) score += 1;
      
      // Set message based on score
      if (score <= 2) {
        message = 'Débil';
      } else if (score === 3) {
        message = 'Moderada';
      } else if (score === 4) {
        message = 'Fuerte';
      } else {
        message = 'Muy fuerte';
      }
    }

    setPasswordStrength({ score, message });
  };

  // Check if passwords match
  const passwordsMatch = () => {
    if (!confirmPassword) return null;
    return newPassword === confirmPassword;
  };

  useEffect(() => {
    checkPasswordStrength(newPassword);
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validate minimum password strength
    if (passwordStrength.score < 2) {
      setError('La contraseña es demasiado débil. Por favor, utilice una combinación de letras, números y símbolos.');
      setLoading(false);
      return;
    }
    
    try {
      // Call the API endpoint to change the password
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar contraseña');
      }
      
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Get color for password strength indicator
  const getPasswordStrengthColor = () => {
    const { score } = passwordStrength;
    if (score <= 1) return '#ff4d4f'; // Red for weak
    if (score === 2) return '#faad14'; // Yellow/amber for fair
    if (score === 3) return '#52c41a'; // Green for good
    if (score >= 4) return '#1890ff'; // Blue for great
    return '#d9d9d9'; // Default gray
  };

  return (
    <div className={styles.settingSection}>
      <h2 className={styles.sectionTitle}>
        <FaLock className={styles.settingIcon} /> Seguridad
      </h2>
      
      {success && (
        <div className={styles.successMessage}>
          <FaCheck /> Contraseña actualizada correctamente
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="currentPassword" className={styles.formLabel}>Contraseña actual</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={styles.formInput}
            disabled={loading}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="newPassword" className={styles.formLabel}>Nueva contraseña</label>
          <div className={styles.passwordInputContainer}>
            <input
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={styles.formInput}
              disabled={loading}
              required
            />
            <button 
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowNewPassword(!showNewPassword)}
              tabIndex="-1"
              aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className={styles.passwordStrengthContainer}>
            <div 
              className={styles.passwordStrengthBar}
              style={{
                width: `${(passwordStrength.score / 5) * 100}%`,
                backgroundColor: getPasswordStrengthColor()
              }}
            />
          </div>
          <p className={styles.formHelp}>
            Fortaleza: {passwordStrength.message}. Usa al menos 8 caracteres, incluyendo letras, números y símbolos.
          </p>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.formLabel}>Confirmar nueva contraseña</label>
          <div className={styles.passwordInputContainer}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${styles.formInput} ${confirmPassword && (passwordsMatch() ? styles.matchSuccess : styles.matchError)}`}
              disabled={loading}
              required
            />
            <button 
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex="-1"
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch() && (
            <p className={styles.passwordMismatch}>
              <FaExclamationTriangle className={styles.warningIcon} /> Las contraseñas no coinciden
            </p>
          )}
          {confirmPassword && passwordsMatch() && (
            <p className={styles.passwordMatch}>
              <FaCheck className={styles.successIcon} /> Las contraseñas coinciden
            </p>
          )}
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
              'Cambiar Contraseña'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SecuritySettings; 