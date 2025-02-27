import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../page.module.css';

// Components
import PropertyCard from './PropertyCard';
import PaymentsSection from './PaymentsSection';
import ContractSection from './ContractSection';
import LoadingState from './ui/LoadingState';
import ErrorState from './ui/ErrorState';
import NoRentalState from './ui/NoRentalState';

// Utils
import { formatCurrency, formatDate } from '../utils/formatters';

const MiArriendoContent = () => {
  const [rental, setRental] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchRentalData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/rentals/my-rental');
        
        if (!response.ok) {
          throw new Error('No se pudo cargar la información del arriendo');
        }
        
        const data = await response.json();
        setRental(data);
      } catch (err) {
        console.error('Error fetching rental data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentalData();
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!rental) {
    return <NoRentalState />;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Mi Arriendo</h1>
      
      <PropertyCard 
        property={rental.property}
        owner={rental.owner}
        startDate={rental.startDate}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
      />
      
      <PaymentsSection 
        payments={rental.payments}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
      />
      
      <ContractSection 
        contract={rental.contract}
        formatDate={formatDate}
      />
    </div>
  );
};

export default MiArriendoContent; 