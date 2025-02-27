import { FaHome } from 'react-icons/fa';
import styles from '../../page.module.css';

const NoRentalState = () => {
  return (
    <div className={styles.noRentalContainer}>
      <FaHome className={styles.noRentalIcon} />
      <h2>No tienes arriendos activos</h2>
      <p>Actualmente no tienes ningún arriendo registrado en el sistema.</p>
    </div>
  );
};

export default NoRentalState; 