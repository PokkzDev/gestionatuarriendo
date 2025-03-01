import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../page.module.css';

// Components
import PropertyCard from './PropertyCard';
import PropertyCharacteristicsSection from './PropertyCharacteristicsSection';
// Import commented out temporarily
import PaymentsSection from './PaymentsSection';
// import ContractSection from './ContractSection';
import LoadingState from './ui/LoadingState';
import ErrorState from './ui/ErrorState';
import NoRentalState from './ui/NoRentalState';
import SolicitudesSection from './solicitudes/SolicitudesSection';

// Utils
import { formatCurrency, formatDate } from '../utils/formatters';

const MiArriendoContent = () => {
  const [rental, setRental] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('informacion');
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
        
        // Ensure we have the data structure we need, but don't override real data
        if (data && data.property) {
          // Just make sure property has the expected fields, initialize with 0 or false if not present
          data.property = {
            // Preserve all existing property data
            ...data.property,
            // Only set these if they're missing in the API response
            bedrooms: data.property.bedrooms ?? 0,
            bathrooms: data.property.bathrooms ?? 0,
            parkingSpots: data.property.parkingSpots ?? 0,
            parkingDetails: data.property.parkingDetails ?? null,
            hasStorage: data.property.hasStorage ?? false,
            storageUnits: data.property.storageUnits ?? 0,
            storageDetails: data.property.storageDetails ?? null,
            area: data.property.area ?? 0,
            petsAllowed: data.property.petsAllowed ?? false,
            furnished: data.property.furnished ?? false,
            paymentDueDay: data.property.paymentDueDay ?? 1,
            amenities: data.property.amenities ?? []
          };
        }
        
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacion':
        return (
          <>
            <PropertyCard 
              property={rental.property}
              owner={rental.owner}
              startDate={rental.startDate}
              paymentDueDay={rental.property?.paymentDueDay}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
            
            <PropertyCharacteristicsSection property={rental.property} />
            
            {/* PaymentsSection hidden temporarily
            <PaymentsSection 
              payments={rental.payments}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
            */}
            
            {/* ContractSection hidden temporarily
            <ContractSection 
              contract={rental.contract}
              formatDate={formatDate}
            />
            */}
          </>
        );
      case 'solicitudes':
        return <SolicitudesSection />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Mi Arriendo</h1>
      
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'informacion' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('informacion')}
        >
          Información
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'solicitudes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('solicitudes')}
        >
          Solicitudes
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MiArriendoContent; 