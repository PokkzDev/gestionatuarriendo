'use client';

import styles from './page.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTwitter, 
  faInstagram, 
  faFacebook 
} from '@fortawesome/free-brands-svg-icons';
import { 
  faHome,
  faUsers,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/login?mode=registro');
  };

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Gestiona Tu Arriendo</h1>
          <p>
            Simplifica la gestión de tus propiedades y mejora la comunicación entre 
            arrendadores y arrendatarios. Una plataforma integral para administrar 
            arriendos de manera eficiente y transparente.
          </p>
          <div className={styles.socialLinks}>
            <a href="#" aria-label="Twitter">
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a href="#" aria-label="Instagram">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="#" aria-label="Facebook">
              <FontAwesomeIcon icon={faFacebook} />
            </a>
          </div>
          <button className={styles.learnMore} onClick={handleGetStarted}>
            Comenzar Ahora
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statCard}>
          <FontAwesomeIcon icon={faHome} size="2x" style={{ color: '#1e293b', marginBottom: '1rem' }} />
          <h2>Arrendadores</h2>
          <p>Gestiona tus propiedades y mantén un seguimiento efectivo de ingresos y gastos</p>
        </div>
        <div className={styles.statCard}>
          <FontAwesomeIcon icon={faUsers} size="2x" style={{ color: '#1e293b', marginBottom: '1rem' }} />
          <h2>Arrendatarios</h2>
          <p>Comunícate directamente y gestiona tus pagos y solicitudes en un solo lugar</p>
        </div>
        <div className={styles.statCard}>
          <FontAwesomeIcon icon={faClipboardList} size="2x" style={{ color: '#1e293b', marginBottom: '1rem' }} />
          <h2>Gestión Simple</h2>
          <p>Todo lo que necesitas para administrar tu arriendo en una plataforma</p>
        </div>
      </section>
    </main>
  );
}
