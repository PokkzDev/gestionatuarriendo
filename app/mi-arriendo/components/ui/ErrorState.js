import { FaExclamationCircle } from 'react-icons/fa';
import styles from '../../page.module.css';

const ErrorState = ({ error }) => {
  return (
    <div className={styles.errorContainer}>
      <FaExclamationCircle className={styles.errorIcon} />
      <h2>Error al cargar la información</h2>
      <p>{error}</p>
    </div>
  );
};

export default ErrorState; 