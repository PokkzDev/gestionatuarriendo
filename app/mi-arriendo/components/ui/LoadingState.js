import { FaSpinner } from 'react-icons/fa';
import styles from '../../page.module.css';

const LoadingState = ({ message = 'Cargando información del arriendo...' }) => {
  return (
    <div className={styles.loadingContainer}>
      <FaSpinner className={styles.spinner} />
      <p>{message}</p>
    </div>
  );
};

export default LoadingState; 