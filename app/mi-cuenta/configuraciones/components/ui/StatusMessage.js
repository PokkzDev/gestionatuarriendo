import styles from '../../page.module.css';
import { FaExclamationTriangle, FaCheck } from 'react-icons/fa';

const StatusMessage = ({ type, message }) => {
  if (!message) return null;
  
  return (
    <div className={type === 'success' ? styles.successMessage : styles.errorMessage}>
      {type === 'success' ? <FaCheck /> : <FaExclamationTriangle />} {message}
    </div>
  );
};

export default StatusMessage; 