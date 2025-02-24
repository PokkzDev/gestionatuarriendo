'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './navbar.module.css';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
            <Link href="/properties">Propiedades</Link>
            <Link href="/tenants">Arrendatarios</Link>
            <Link href="/payments">Pagos</Link>
          </div>
          
          <div className={styles.userLinks}>
            <Link href="/register" className={styles.authButton}>
              Registrarse
            </Link>
            <Link href="/login" className={`${styles.authButton} ${styles.loginButton}`}>
              Iniciar Sesión
            </Link>
            
        
          </div>
        </div>
      </div>
    </nav>
  );
}
