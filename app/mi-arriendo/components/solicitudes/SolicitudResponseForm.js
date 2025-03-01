import { useState } from 'react';
import styles from '../../page.module.css';

const SolicitudResponseForm = ({ onSubmit, onCancel }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('El mensaje es requerido');
      return;
    }
    
    onSubmit({ message });
  };

  return (
    <div className={styles.responseFormContainer}>
      <h4>Agregar Respuesta</h4>
      
      <form onSubmit={handleSubmit} className={styles.responseForm}>
        <div className={styles.formGroup}>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            className={`${styles.formTextarea} ${error ? styles.inputError : ''}`}
            placeholder="Escribe tu respuesta..."
            rows={3}
          />
          {error && <p className={styles.errorText}>{error}</p>}
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={onCancel}
            className={styles.secondaryButton}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className={styles.button}
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};

export default SolicitudResponseForm; 