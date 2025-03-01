import { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import SolicitudCard from './SolicitudCard';
import SolicitudForm from './SolicitudForm';
import LoadingState from '../ui/LoadingState';

const SolicitudesSection = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/solicitudes');
      
      if (!response.ok) {
        throw new Error('No se pudieron cargar las solicitudes');
      }
      
      const data = await response.json();
      setSolicitudes(data);
    } catch (err) {
      console.error('Error fetching solicitudes:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSolicitud = async (newSolicitud) => {
    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSolicitud),
      });
      
      if (!response.ok) {
        throw new Error('No se pudo crear la solicitud');
      }
      
      // Refresh the list of solicitudes
      fetchSolicitudes();
      // Hide the form
      setShowForm(false);
    } catch (err) {
      console.error('Error creating solicitud:', err);
      setError(err.message);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📋</span>
          Solicitudes
        </h2>
        <button 
          className={styles.button}
          onClick={() => setShowForm(true)}
        >
          Nueva Solicitud
        </button>
      </div>

      {showForm && (
        <SolicitudForm 
          onSubmit={handleCreateSolicitud} 
          onCancel={() => setShowForm(false)} 
        />
      )}

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && solicitudes.length === 0 && !showForm && (
        <div className={styles.emptyList}>
          <p>No hay solicitudes disponibles en este momento.</p>
          <p>Haz clic en "Nueva Solicitud" para crear una solicitud para tu arrendador.</p>
        </div>
      )}

      {solicitudes.length > 0 && (
        <div className={styles.solicitudesList}>
          {solicitudes.map((solicitud) => (
            <SolicitudCard 
              key={solicitud.id} 
              solicitud={solicitud} 
              onUpdate={fetchSolicitudes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SolicitudesSection; 