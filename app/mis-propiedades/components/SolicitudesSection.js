import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { 
  FaClipboardList, 
  FaExclamationTriangle, 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaHourglassHalf, 
  FaTools, 
  FaEnvelope, 
  FaPaperPlane,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';

const SolicitudesSection = ({ propertyId }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSolicitudId, setExpandedSolicitudId] = useState(null);
  const [responseData, setResponseData] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    fetchSolicitudes();
  }, [propertyId]);

  const fetchSolicitudes = async () => {
    try {
      setIsLoading(true);
      const url = propertyId 
        ? `/api/properties/solicitudes?propertyId=${propertyId}` 
        : '/api/properties/solicitudes';
      
      const response = await fetch(url);
      
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

  const handleToggleExpand = (solicitudId) => {
    setExpandedSolicitudId(expandedSolicitudId === solicitudId ? null : solicitudId);
    
    // Initialize response data for this solicitud if it doesn't exist
    if (!responseData[solicitudId]) {
      setResponseData({
        ...responseData,
        [solicitudId]: { message: '', status: '' }
      });
    }
  };

  const handleResponseChange = (solicitudId, field, value) => {
    setResponseData({
      ...responseData,
      [solicitudId]: {
        ...responseData[solicitudId],
        [field]: value
      }
    });
  };

  const handleSubmitResponse = async (solicitudId) => {
    try {
      setSubmitting({ ...submitting, [solicitudId]: true });
      
      const response = await fetch(`/api/properties/solicitudes/${solicitudId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: responseData[solicitudId].message,
          status: responseData[solicitudId].status || undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error('No se pudo enviar la respuesta');
      }
      
      // Clear the response form
      setResponseData({
        ...responseData,
        [solicitudId]: { message: '', status: '' }
      });
      
      // Refresh the solicitudes
      await fetchSolicitudes();
    } catch (err) {
      console.error('Error submitting response:', err);
      setError(err.message);
    } finally {
      setSubmitting({ ...submitting, [solicitudId]: false });
    }
  };

  const handleUpdateStatus = async (solicitudId, newStatus) => {
    try {
      setSubmitting({ ...submitting, [solicitudId]: true });
      
      const response = await fetch(`/api/properties/solicitudes/${solicitudId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });
      
      if (!response.ok) {
        throw new Error('No se pudo actualizar el estado');
      }
      
      // Refresh the solicitudes
      await fetchSolicitudes();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
    } finally {
      setSubmitting({ ...submitting, [solicitudId]: false });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return { 
          text: 'Pendiente', 
          icon: <FaHourglassHalf />, 
          className: styles.statusPending 
        };
      case 'EN_PROCESO':
        return { 
          text: 'En Proceso', 
          icon: <FaTools />, 
          className: styles.statusInProgress 
        };
      case 'COMPLETADA':
        return { 
          text: 'Completada', 
          icon: <FaCheckCircle />, 
          className: styles.statusCompleted 
        };
      case 'RECHAZADA':
        return { 
          text: 'Rechazada', 
          icon: <FaTimesCircle />, 
          className: styles.statusRejected 
        };
      default:
        return { 
          text: 'Desconocido', 
          icon: <FaExclamationTriangle />, 
          className: '' 
        };
    }
  };

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'BAJA':
        return { text: 'Baja', className: styles.priorityLow };
      case 'MEDIA':
        return { text: 'Media', className: styles.priorityMedium };
      case 'ALTA':
        return { text: 'Alta', className: styles.priorityHigh };
      case 'URGENTE':
        return { text: 'Urgente', className: styles.priorityUrgent };
      default:
        return { text: 'Media', className: styles.priorityMedium };
    }
  };

  const getTypeText = (type) => {
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingIcon} />
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <p>Error: {error}</p>
        <button 
          className={styles.retryButton}
          onClick={fetchSolicitudes}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.solicitudesSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <FaClipboardList className={styles.sectionIcon} />
          Solicitudes de Mantenimiento
        </h3>
      </div>

      {solicitudes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay solicitudes de mantenimiento para esta propiedad.</p>
        </div>
      ) : (
        <div className={styles.solicitudesList}>
          {solicitudes.map((solicitud) => {
            const statusInfo = getStatusInfo(solicitud.status);
            const priorityInfo = getPriorityInfo(solicitud.priority);
            const isExpanded = expandedSolicitudId === solicitud.id;
            
            return (
              <div 
                key={solicitud.id} 
                className={`${styles.solicitudCard} ${isExpanded ? styles.expanded : ''}`}
              >
                <div 
                  className={styles.solicitudHeader}
                  onClick={() => handleToggleExpand(solicitud.id)}
                >
                  <div className={styles.solicitudInfo}>
                    <h4 className={styles.solicitudTitle}>{solicitud.title}</h4>
                    <div className={styles.solicitudMeta}>
                      <span className={styles.solicitudDate}>
                        {formatDate(solicitud.createdAt)}
                      </span>
                      <span className={styles.solicitudType}>
                        {getTypeText(solicitud.type)}
                      </span>
                      <span className={`${styles.solicitudPriority} ${priorityInfo.className}`}>
                        {priorityInfo.text}
                      </span>
                    </div>
                  </div>
                  <div className={styles.solicitudStatus}>
                    <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                      {statusInfo.icon}
                      {statusInfo.text}
                    </span>
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className={styles.solicitudContent}>
                    <div className={styles.solicitudProperty}>
                      <strong>Propiedad:</strong> {solicitud.property.name} ({solicitud.property.address})
                    </div>
                    <div className={styles.solicitudTenant}>
                      <strong>Arrendatario:</strong> {solicitud.tenant.email}
                    </div>
                    <div className={styles.solicitudDescription}>
                      <h4>Descripción:</h4>
                      <p>{solicitud.description}</p>
                    </div>
                    
                    {solicitud.responses && solicitud.responses.length > 0 && (
                      <div className={styles.solicitudResponses}>
                        <h4>Conversación:</h4>
                        {solicitud.responses.map((response) => (
                          <div 
                            key={response.id} 
                            className={`${styles.responseItem} ${response.isFromOwner ? styles.ownerResponse : styles.tenantResponse}`}
                          >
                            <div className={styles.responseHeader}>
                              <span className={styles.responseAuthor}>
                                {response.isFromOwner ? 'Tú (Propietario)' : 'Arrendatario'}
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
                    
                    <div className={styles.solicitudActions}>
                      {solicitud.status !== 'COMPLETADA' && solicitud.status !== 'RECHAZADA' && (
                        <div className={styles.responseForm}>
                          <h4>Responder:</h4>
                          <textarea
                            className={styles.responseTextarea}
                            placeholder="Escribe tu respuesta aquí..."
                            value={responseData[solicitud.id]?.message || ''}
                            onChange={(e) => handleResponseChange(solicitud.id, 'message', e.target.value)}
                          />
                          
                          <div className={styles.responseActions}>
                            <div className={styles.statusUpdateSection}>
                              <label htmlFor={`status-${solicitud.id}`}>Actualizar estado:</label>
                              <select
                                id={`status-${solicitud.id}`}
                                className={styles.statusSelect}
                                value={responseData[solicitud.id]?.status || ''}
                                onChange={(e) => handleResponseChange(solicitud.id, 'status', e.target.value)}
                              >
                                <option value="">No cambiar</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="EN_PROCESO">En Proceso</option>
                                <option value="COMPLETADA">Completada</option>
                                <option value="RECHAZADA">Rechazada</option>
                              </select>
                            </div>
                            
                            <button
                              className={styles.sendButton}
                              onClick={() => handleSubmitResponse(solicitud.id)}
                              disabled={!responseData[solicitud.id]?.message || submitting[solicitud.id]}
                            >
                              {submitting[solicitud.id] ? (
                                <>
                                  <FaSpinner className={styles.spinnerIcon} />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <FaPaperPlane />
                                  Enviar Respuesta
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {(solicitud.status !== 'COMPLETADA' && solicitud.status !== 'RECHAZADA') && (
                        <div className={styles.quickActions}>
                          <h4>Acciones rápidas:</h4>
                          <div className={styles.statusButtons}>
                            {solicitud.status !== 'EN_PROCESO' && (
                              <button
                                className={`${styles.statusButton} ${styles.inProgressButton}`}
                                onClick={() => handleUpdateStatus(solicitud.id, 'EN_PROCESO')}
                                disabled={submitting[solicitud.id]}
                              >
                                <FaTools />
                                Marcar En Proceso
                              </button>
                            )}
                            
                            <button
                              className={`${styles.statusButton} ${styles.completedButton}`}
                              onClick={() => handleUpdateStatus(solicitud.id, 'COMPLETADA')}
                              disabled={submitting[solicitud.id]}
                            >
                              <FaCheckCircle />
                              Marcar Completada
                            </button>
                            
                            <button
                              className={`${styles.statusButton} ${styles.rejectedButton}`}
                              onClick={() => handleUpdateStatus(solicitud.id, 'RECHAZADA')}
                              disabled={submitting[solicitud.id]}
                            >
                              <FaTimesCircle />
                              Rechazar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SolicitudesSection; 