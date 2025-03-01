import { useState } from 'react';
import styles from '../../page.module.css';

const SolicitudForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'CONSULTA',
    priority: 'MEDIA',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h3 className={styles.formTitle}>Nueva Solicitud</h3>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.formLabel}>
            Título <span className={styles.requiredField}>*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`${styles.formInput} ${errors.title ? styles.inputError : ''}`}
            placeholder="Ej: Reparación de llave de agua"
          />
          {errors.title && <p className={styles.errorText}>{errors.title}</p>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="type" className={styles.formLabel}>
            Tipo de Solicitud <span className={styles.requiredField}>*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={styles.formSelect}
          >
            <option value="REPARACION">Reparación</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
            <option value="CONSULTA">Consulta</option>
            <option value="QUEJA">Queja</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="priority" className={styles.formLabel}>
            Prioridad
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={styles.formSelect}
          >
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.formLabel}>
            Descripción <span className={styles.requiredField}>*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`${styles.formTextarea} ${errors.description ? styles.inputError : ''}`}
            placeholder="Describe detalladamente tu solicitud..."
            rows={5}
          />
          {errors.description && <p className={styles.errorText}>{errors.description}</p>}
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
            Enviar Solicitud
          </button>
        </div>
      </form>
    </div>
  );
};

export default SolicitudForm; 