import { FaFileInvoiceDollar } from 'react-icons/fa';
import styles from '../page.module.css';

const PaymentsSection = ({ payments, formatDate, formatCurrency }) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <FaFileInvoiceDollar className={styles.sectionIcon} />
        Pagos
      </h2>
      
      {payments && payments.length > 0 ? (
        <div className={styles.paymentsTable}>
          <div className={styles.tableHeader}>
            <div className={styles.tableCell}>Fecha</div>
            <div className={styles.tableCell}>Monto</div>
            <div className={styles.tableCell}>Estado</div>
          </div>
          
          {payments.map((payment, index) => (
            <div key={index} className={styles.tableRow}>
              <div className={styles.tableCell}>{formatDate(payment.date)}</div>
              <div className={styles.tableCell}>{formatCurrency(payment.amount)}</div>
              <div className={styles.tableCell}>
                <span className={`${styles.paymentStatus} ${styles[payment.status.toLowerCase()]}`}>
                  {payment.status === 'PAID' ? 'Pagado' : 
                   payment.status === 'PENDING' ? 'Pendiente' : 
                   payment.status === 'OVERDUE' ? 'Atrasado' : payment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.emptyList}>No hay pagos registrados.</p>
      )}
    </div>
  );
};

export default PaymentsSection; 