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

// Import Components
import PersonalInfoSettings from './components/PersonalInfoSettings';
import SecuritySettings from './components/SecuritySettings';
import NotificationSettings from './components/NotificationSettings';
import AppearanceSettings from './components/AppearanceSettings';
import AccountSettings from './components/AccountSettings';

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
        <h1 className={styles.title}>Preferencias</h1>
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
  );
} 