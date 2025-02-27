'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './navbar.module.css';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
// Import Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faUser, faCog, faHome, faMoneyBill } from '@fortawesome/free-solid-svg-icons';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);
  const mainMenuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // Check if mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Handle clicks outside both menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle user menu clicks
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        !userButtonRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
      
      // Handle main menu clicks
      if (
        isMenuOpen &&
        mainMenuRef.current &&
        !mainMenuRef.current.contains(event.target) &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isMenuOpen]);

  // Custom Link component that closes both menus when clicked
  const MenuLink = ({ href, children, className, icon }) => (
    <Link
      href={href}
      className={className}
      onClick={() => {
        setIsUserMenuOpen(false);
        setIsMenuOpen(false);
      }}
    >
      {icon && <FontAwesomeIcon icon={icon} className={styles.faIcon} />}
      {children}
    </Link>
  );

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logoContainer}>
          <span className={styles.logoText}>GestionaTuArriendo</span>
        </Link>

        <button 
          ref={menuButtonRef}
          className={styles.menuButton} 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <div className={`${styles.menuIcon} ${isMenuOpen ? styles.open : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        <div 
          ref={mainMenuRef}
          className={`${styles.navLinks} ${isMenuOpen ? styles.show : ''}`}
        >
          <div className={styles.mainLinks}>
            {status === 'authenticated' && (
              <>
                {(session.user?.role === 'ARRENDATARIO' || session.user?.role === 'AMBOS') && (
                  <MenuLink href="/mi-arriendo">Mi Arriendo</MenuLink>
                )}
              </>
            )}
            <MenuLink href="/planes">Planes</MenuLink>
          </div>
          
          <div className={styles.userLinks}>
            {status !== 'authenticated' ? (
              <MenuLink href="/login?mode=login" className={styles.authButton}>
                Iniciar Sesión
              </MenuLink>
            ) : (
              !isMobile && (
                // Desktop user menu
                <div className={styles.userMenuContainer}>
                  <button 
                    ref={userButtonRef}
                    className={styles.userMenuButton}
                    onClick={toggleUserMenu}
                    aria-label="User menu"
                  >
                    <div className={styles.userAvatar}>
                      <Image
                        src={session.user?.image || "/default-avatar.png"}
                        alt="User avatar"
                        width={32}
                        height={32}
                        className={styles.avatar}
                      />
                    </div>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div ref={userMenuRef} className={styles.userMenuDropdown}>
                      <div className={styles.userInfo}>
                        <p className={styles.userName}>{session.user?.name || 'Usuario'}</p>
                        <p className={styles.userEmail}>{session.user?.email || 'usuario@example.com'}</p>
                      </div>
                      <div className={styles.userMenuLinks}>
                        <MenuLink href="/profile" icon={faUser}>Mi Perfil</MenuLink>
                        {(session.user?.role === 'PROPIETARIO' || session.user?.role === 'AMBOS') && (
                          <MenuLink href="/mis-propiedades" icon={faHome}>Mis Propiedades</MenuLink>
                        )}
                        <MenuLink href="/mis-gastos" icon={faMoneyBill}>Mis Gastos</MenuLink>
                        <MenuLink href="/mi-cuenta/configuraciones" icon={faCog}>Configuraciones</MenuLink>
                        <button 
                          className={styles.logoutButton}
                          onClick={handleLogout}
                        >
                          <FontAwesomeIcon icon={faSignOutAlt} className={styles.logoutIcon} />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
