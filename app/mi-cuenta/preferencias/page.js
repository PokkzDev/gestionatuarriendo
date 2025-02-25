'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { 
  FaUser, 
  FaLock, 
  FaEnvelope, 
  FaBell, 
  FaPalette, 
  FaShieldAlt,
  FaExclamationTriangle,
  FaBars,
  FaTimes,
  FaCheck,
  FaCog,
  FaSignOutAlt,
  FaTrash,
  FaFileAlt,
  FaMobileAlt,
  FaLanguage,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Settings Sections Components
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
    // Fetch the latest user data on component mount
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
        
        // If onUpdate is provided, update the parent component's user state
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
      
      // Update local state with the response
      setUserData(data);
      
      // Update name changes info
      setNameChangesInfo({
        count: data.nameChangesCount || 0,
        remaining: data.nameChangesRemaining || 0
      });
      
      // Update global user state if needed
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

export default function MiCuentaPreferencias() {
  const { data: session } = useSession();
  const [activeSettingCategory, setActiveSettingCategory] = useState('personal');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Only fetch user data when authenticated
    if (session) {
      const fetchUserData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/user/profile');
          if (!response.ok) {
            throw new Error('Error al obtener datos de usuario');
          }
          const data = await response.json();
          setUser(data);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setLoadError(err.message || 'Error al cargar datos de usuario');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserData();
    }
  }, [session]);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileView = width <= 768;
      setIsMobile(isMobileView);
      
      // On desktop, always show sidebar
      if (!isMobileView) {
        setShowSidebar(true);
      } else {
        setShowSidebar(false); // Hide sidebar by default on mobile
      }
    };

    // Check on mount
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Handle click outside sidebar to close it on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('settings-sidebar');
      const menuToggle = document.getElementById('mobile-menu-toggle');
      
      if (sidebar && menuToggle && 
          !sidebar.contains(event.target) && 
          !menuToggle.contains(event.target) &&
          showSidebar) {
        setShowSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, showSidebar]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && showSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, showSidebar]);

  const settingCategories = [
    { id: 'personal', label: 'Información Personal', icon: <FaUser className={styles.settingIcon} /> },
    { id: 'security', label: 'Seguridad', icon: <FaLock className={styles.settingIcon} /> },
    { id: 'notifications', label: 'Notificaciones', icon: <FaBell className={styles.settingIcon} /> },
    { id: 'appearance', label: 'Apariencia', icon: <FaPalette className={styles.settingIcon} /> },
    { id: 'account', label: 'Cuenta', icon: <FaShieldAlt className={styles.settingIcon} /> },
  ];

  const handleCategorySelect = (categoryId) => {
    setActiveSettingCategory(categoryId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const renderSettingContent = () => {
    // Show loading state while fetching user data
    if (isLoading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando información...</p>
        </div>
      );
    }
    
    // Show error message if user data couldn't be loaded
    if (loadError) {
      return (
        <div className={styles.errorContainer}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <p>Error: {loadError}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      );
    }
    
    // Only render content when user data is available
    if (!user) {
      return (
        <div className={styles.errorContainer}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <p>No se ha podido cargar la información del usuario. Por favor, inicia sesión nuevamente.</p>
          <Link href="/login" className={styles.loginButton}>
            Iniciar Sesión
          </Link>
        </div>
      );
    }
    
    switch (activeSettingCategory) {
      case 'personal':
        return <PersonalInfoSettings user={user} onUpdate={setUser} />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'account':
        return <AccountSettings />;
      default:
        return <PersonalInfoSettings user={user} onUpdate={setUser} />;
    }
  };

  return (
    <div className={`${styles.container} ${showSidebar && isMobile ? styles.sidebarOpen : ''}`}>
      <div 
        id="settings-sidebar"
        className={`${styles.sidebar} ${showSidebar ? styles.sidebarShow : ''}`}
      >
        <h1 className={styles.title}>Mi Cuenta</h1>
        <div className={styles.settingsCategoryList}>
          {settingCategories.map((category) => (
            <button
              key={category.id}
              className={`${styles.settingsCategoryButton} ${activeSettingCategory === category.id ? styles.active : ''}`}
              onClick={() => handleCategorySelect(category.id)}
            >
              {category.icon}
              <span className={styles.settingsLabel}>{category.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.mainContent}>
        {isMobile && (
          <button 
            id="mobile-menu-toggle"
            onClick={toggleSidebar} 
            className={styles.mobileMenuToggle}
            aria-label={showSidebar ? "Cerrar categorías" : "Ver categorías"}
          >
            {showSidebar ? <FaTimes /> : <FaCog />}
            <span className={styles.toggleLabel}>Categorías</span>
          </button>
        )}
        
        <div className={styles.contentArea}>
          {renderSettingContent()}
        </div>
      </div>
    </div>
  )
} 