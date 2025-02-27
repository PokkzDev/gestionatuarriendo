import { FaFileInvoiceDollar, FaHistory } from 'react-icons/fa';
import styles from '../page.module.css';

const PaymentsSection = ({ payments, formatDate, formatCurrency }) => {
  // Helper function to format status text
  const getStatusText = (status) => {
    switch(status) {
      case 'PAID': return 'Pagado';
      case 'PENDING': return 'Pendiente';
      case 'OVERDUE': return 'Atrasado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <FaFileInvoiceDollar className={styles.sectionIcon} />
        Pagos
      </h2>
      
      {payments && payments.length > 0 ? (
        <>
          <div className={styles.paymentsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Fecha de Vencimiento</div>
              <div className={styles.tableCell}>Fecha de Pago</div>
              <div className={styles.tableCell}>Monto</div>
              <div className={styles.tableCell}>Estado</div>
            </div>
            
            {payments.map((payment, index) => (
              <div key={payment.id || index} className={styles.tableRow}>
                <div className={styles.tableCell}>{formatDate(payment.dueDate)}</div>
                <div className={styles.tableCell}>{payment.paidDate ? formatDate(payment.paidDate) : '-'}</div>
                <div className={styles.tableCell}>{formatCurrency(payment.amount)}</div>
                <div className={styles.tableCell}>
                  <span className={`${styles.paymentStatus} ${styles[payment.status.toLowerCase()]}`}>
                    {getStatusText(payment.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
            <button className={styles.button} onClick={() => alert('Ver historial completo')}>
              <FaHistory style={{ marginRight: '8px' }} /> Ver historial completo
            </button>
          </div>
        </>
      ) : (
        <p className={styles.emptyList}>No hay pagos registrados.</p>
      )}
    </div>
  );
};

export default PaymentsSection; 