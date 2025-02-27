import styles from '../../page.module.css';

const LoadingButton = ({ isLoading, text, onClick, disabled, className, type = 'button' }) => {
  return (
    <button
      type={type}
      className={className || styles.saveButton}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className={styles.loadingSpinner} style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
      ) : (
        text
      )}
    </button>
  );
};

export default LoadingButton; 