import { useState } from 'react';
import styles from '../../page.module.css';
import SolicitudResponseForm from './SolicitudResponseForm';

const SolicitudCard = ({ solicitud, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return styles.statusPendiente;
      case 'EN_PROCESO':
        return styles.statusEnProceso;
      case 'COMPLETADA':
        return styles.statusCompletada;
      case 'RECHAZADA':
        return styles.statusRechazada;
      default:
        return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EN_PROCESO':
        return 'En Proceso';
      case 'COMPLETADA':
        return 'Completada';
      case 'RECHAZADA':
        return 'Rechazada';
      default:
        return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'REPARACION':
        return 'Reparación';
      case 'MANTENIMIENTO':
        return 'Mantenimiento';
      case 'CONSULTA':
        return 'Consulta';
      case 'QUEJA':
        return 'Queja';
      case 'OTRO':
        return 'Otro';
      default:
        return type;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'BAJA':
        return 'Baja';
      case 'MEDIA':
        return 'Media';
      case 'ALTA':
        return 'Alta';
      case 'URGENTE':
        return 'Urgente';
      default:
        return priority;
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'BAJA':
        return styles.priorityBaja;
      case 'MEDIA':
        return styles.priorityMedia;
      case 'ALTA':
        return styles.priorityAlta;
      case 'URGENTE':
        return styles.priorityUrgente;
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleAddResponse = async (responseData) => {
    try {
      const response = await fetch(`/api/solicitudes/${solicitud.id}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      });
      
      if (!response.ok) {
        throw new Error('No se pudo agregar la respuesta');
      }
      
      // Hide the form and refresh the solicitudes
      setShowResponseForm(false);
      onUpdate();
    } catch (err) {
      console.error('Error adding response:', err);
      alert('Error al agregar la respuesta: ' + err.message);
    }
  };

  return (
    <div className={`${styles.solicitudCard} ${expanded ? styles.expanded : ''}`}>
      <div 
        className={styles.solicitudHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={styles.solicitudTitle}>
          <h3>{solicitud.title}</h3>
          <div className={styles.solicitudMeta}>
            <span className={styles.solicitudDate}>
              {formatDate(solicitud.createdAt)}
            </span>
            <span className={`${styles.solicitudType} ${styles.badge}`}>
              {getTypeLabel(solicitud.type)}
            </span>
            <span className={`${styles.solicitudPriority} ${styles.badge} ${getPriorityBadgeClass(solicitud.priority)}`}>
              {getPriorityLabel(solicitud.priority)}
            </span>
          </div>
        </div>
        <div className={styles.solicitudStatus}>
          <span className={`${styles.statusBadge} ${getStatusBadgeClass(solicitud.status)}`}>
            {getStatusLabel(solicitud.status)}
          </span>
          <span className={styles.expandIcon}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>
      
      {expanded && (
        <div className={styles.solicitudContent}>
          <div className={styles.solicitudDescription}>
            <h4>Descripción:</h4>
            <p>{solicitud.description}</p>
          </div>
          
          {solicitud.responses && solicitud.responses.length > 0 && (
            <div className={styles.solicitudResponses}>
              <h4>Respuestas:</h4>
              {solicitud.responses.map((response) => (
                <div 
                  key={response.id} 
                  className={`${styles.responseItem} ${response.isFromOwner ? styles.ownerResponse : styles.tenantResponse}`}
                >
                  <div className={styles.responseHeader}>
                    <span className={styles.responseAuthor}>
                      {response.isFromOwner ? 'Arrendador' : 'Tú'}
                    </span>
                    <span className={styles.responseDate}>
                      {formatDate(response.createdAt)}
                    </span>
                  </div>
                  <p className={styles.responseMessage}>{response.message}</p>
                </div>
              ))}
            </div>
          )}
          
          {solicitud.status !== 'COMPLETADA' && solicitud.status !== 'RECHAZADA' && (
            <div className={styles.solicitudActions}>
              {!showResponseForm ? (
                <button 
                  className={styles.secondaryButton}
                  onClick={() => setShowResponseForm(true)}
                >
                  Agregar Respuesta
                </button>
              ) : (
                <SolicitudResponseForm 
                  onSubmit={handleAddResponse}
                  onCancel={() => setShowResponseForm(false)}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SolicitudCard; 