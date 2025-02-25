'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(mode === 'login' ? true : true);
  const [role, setRole] = useState('ARRENDATARIO');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    if (!isLogin) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            role,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Error en el registro');
        }

        await signIn('credentials', {
          email,
          password,
          callbackUrl: '/dashboard',
        });
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/',
      });
    } catch (error) {
      setError('Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>GestionaTuArriendo</div>
        <nav className={styles.nav}>
          <Link href="/propiedades" className={styles.navLink}>Propiedades</Link>
          <Link href="/arrendatarios" className={styles.navLink}>Arrendatarios</Link>
          <Link href="/pagos" className={styles.navLink}>Pagos</Link>
          <Link href="/register" className={styles.registerButton}>
            Registrarse
          </Link>
          <Link href="/login" className={styles.loginButton}>
            Iniciar Sesión
          </Link>
        </nav>
      </header>

      <div className={styles.imageSection}>
        <div className={styles.imageSectionOverlay}>
          <h1 className={styles.welcomeText}>
            {isLogin ? '¡Bienvenido de nuevo!' : '¡Únete a nosotros!'}
          </h1>
          <p className={styles.welcomeSubtext}>
            {isLogin
              ? 'Gestiona tus propiedades y arriendos de manera eficiente con nuestra plataforma.'
              : 'Simplifica la gestión de tus propiedades y la comunicación con tus arrendatarios.'}
          </p>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.modeSwitch}>
            <button
              className={`${styles.modeSwitchButton} ${isLogin ? styles.active : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Iniciar Sesión
            </button>
            <button
              className={`${styles.modeSwitchButton} ${!isLogin ? styles.active : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Registrarse
            </button>
          </div>

          <h1 className={styles.title}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className={styles.subtitle}>
            {isLogin
              ? 'Ingresa tus credenciales para continuar'
              : 'Completa tus datos para comenzar'}
          </p>

          {!isLogin && (
            <div className={styles.roleSelector}>
              <button
                type="button"
                className={`${styles.roleButton} ${
                  role === 'ARRENDATARIO' ? styles.active : ''
                }`}
                onClick={() => setRole('ARRENDATARIO')}
              >
                Arrendatario
              </button>
              <button
                type="button"
                className={`${styles.roleButton} ${
                  role === 'PROPIETARIO' ? styles.active : ''
                }`}
                onClick={() => setRole('PROPIETARIO')}
              >
                Propietario
              </button>
              <button
                type="button"
                className={`${styles.roleButton} ${
                  role === 'AMBOS' ? styles.active : ''
                }`}
                onClick={() => setRole('AMBOS')}
              >
                Ambos
              </button>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={styles.input}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={styles.input}
                placeholder="••••••••"
              />
            </div>

            {isLogin && (
              <Link href="/recuperar-contrasena" className={styles.forgotPassword}>
                ¿Olvidaste tu contraseña?
              </Link>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading
                ? 'Cargando...'
                : isLogin
                ? 'Iniciar Sesión'
                : 'Crear Cuenta'}
            </button>

            <div className={styles.divider}>
              <span>o</span>
            </div>

            <button 
              type="button" 
              className={styles.googleButton} 
              disabled
              title="Próximamente disponible"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.8055 10.2275C19.8055 9.51508 19.7516 8.83508 19.6516 8.17749H10.2055V11.9525H15.6055C15.3555 13.1525 14.6555 14.2025 13.6055 14.9025V17.3525H16.8055C18.7055 15.6525 19.8055 13.1525 19.8055 10.2275Z"
                  fill="#4285F4"
                />
                <path
                  d="M10.2055 20.0001C12.9055 20.0001 15.2055 19.1001 16.8055 17.3501L13.6055 14.9001C12.7055 15.5001 11.5555 15.8501 10.2055 15.8501C7.60547 15.8501 5.40547 14.1501 4.60547 11.8501H1.30547V14.3501C2.90547 17.7501 6.30547 20.0001 10.2055 20.0001Z"
                  fill="#34A853"
                />
                <path
                  d="M4.60547 11.8499C4.40547 11.2499 4.30547 10.6499 4.30547 9.99994C4.30547 9.34994 4.40547 8.74994 4.60547 8.14994V5.64994H1.30547C0.605469 7.04994 0.205469 8.49994 0.205469 9.99994C0.205469 11.4999 0.605469 12.9499 1.30547 14.3499L4.60547 11.8499Z"
                  fill="#FBBC05"
                />
                <path
                  d="M10.2055 4.14993C11.7055 4.14993 13.0055 4.64993 14.0555 5.64993L16.8555 2.84993C15.2055 1.29993 12.9055 0.299927 10.2055 0.299927C6.30547 0.299927 2.90547 2.54993 1.30547 5.94993L4.60547 8.44993C5.40547 6.14993 7.60547 4.14993 10.2055 4.14993Z"
                  fill="#EA4335"
                />
              </svg>
              Continuar con Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
} 