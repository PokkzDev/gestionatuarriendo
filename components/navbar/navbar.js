'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './navbar.module.css';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // Handle clicks outside the user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        !userButtonRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Custom Link component that closes the menu when clicked
  const MenuLink = ({ href, children, className }) => (
    <Link
      href={href}
      className={className}
      onClick={() => setIsUserMenuOpen(false)}
    >
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

        <div className={`${styles.navLinks} ${isMenuOpen ? styles.show : ''}`}>
          <div className={styles.mainLinks}>
            <MenuLink href="/properties">Propiedades</MenuLink>
            <MenuLink href="/tenants">Arrendatarios</MenuLink>
            <MenuLink href="/payments">Pagos</MenuLink>
          </div>
          
          <div className={styles.userLinks}>
            {status !== 'authenticated' ? (
              <MenuLink href="/login?mode=login" className={styles.authButton}>
                Iniciar Sesión
              </MenuLink>
            ) : (
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
                      <MenuLink href="/profile">Mi Perfil</MenuLink>
                      <MenuLink href="/settings">Configuración</MenuLink>
                      <button 
                        className={styles.logoutButton}
                        onClick={handleLogout}
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
