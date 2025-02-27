import { FaListUl, FaBed, FaBath, FaCar, FaRulerCombined, FaDog, FaArchive, FaCouch, FaCheck, FaInfoCircle } from 'react-icons/fa';
import styles from '../page.module.css';

const PropertyCharacteristicsSection = ({ property }) => {
  // Default values in case property doesn't have these attributes
  const characteristics = {
    bedrooms: property?.bedrooms ?? 0,
    bathrooms: property?.bathrooms ?? 0,
    parkingSpots: property?.parkingSpots ?? 0,
    parkingDetails: property?.parkingDetails ?? null,
    hasStorage: property?.hasStorage ?? false,
    storageUnits: property?.storageUnits ?? 0,
    storageDetails: property?.storageDetails ?? null,
    area: property?.area ?? 0,
    petsAllowed: property?.petsAllowed ?? false,
    furnished: property?.furnished ?? false,
    amenities: property?.amenities ?? []
  };

  // Get parking identifier from details if available
  const parkingIdentifier = characteristics.parkingDetails 
    ? (typeof characteristics.parkingDetails === 'string' 
        ? characteristics.parkingDetails 
        : JSON.stringify(characteristics.parkingDetails).replace(/[{}"]/g, ''))
    : '';

  // Extract parking numbers from details
  const extractParkingNumbers = () => {
    if (!characteristics.parkingDetails) return '';
    
    // If parkingDetails is an array
    if (Array.isArray(characteristics.parkingDetails)) {
      return characteristics.parkingDetails.map(spot => {
        // Extract number from each spot object
        if (spot && typeof spot === 'object' && spot.number) {
          return spot.number;
        }
        return '';
      }).filter(Boolean).join(', ');
    } 
    
    // If parkingDetails is a string or object, use regex to extract
    const detailsStr = typeof characteristics.parkingDetails === 'string' 
      ? characteristics.parkingDetails 
      : JSON.stringify(characteristics.parkingDetails);
      
    // Look for multiple number patterns
    const allNumbers = [];
    const numberRegex = /number:(\d+)/g;
    let match;
    
    while ((match = numberRegex.exec(detailsStr)) !== null) {
      allNumbers.push(match[1]);
    }
    
    if (allNumbers.length > 0) {
      return allNumbers.join(', ');
    }
    
    // Fallback to original string if no numbers found
    return parkingIdentifier;
  };

  const parkingNumbers = extractParkingNumbers();

  // Get storage identifier from details if available
  const storageIdentifier = characteristics.storageDetails
    ? (typeof characteristics.storageDetails === 'string'
        ? characteristics.storageDetails
        : JSON.stringify(characteristics.storageDetails).replace(/[{}"]/g, ''))
    : '';

  // Similar function for storage units
  const extractStorageNumbers = () => {
    if (!characteristics.storageDetails) return '';
    
    // If storageDetails is an array
    if (Array.isArray(characteristics.storageDetails)) {
      return characteristics.storageDetails.map(unit => {
        // Extract number from each unit object
        if (unit && typeof unit === 'object' && unit.number) {
          return unit.number;
        }
        return '';
      }).filter(Boolean).join(', ');
    } 
    
    // If storageDetails is a string or object, use regex to extract
    const detailsStr = typeof characteristics.storageDetails === 'string' 
      ? characteristics.storageDetails 
      : JSON.stringify(characteristics.storageDetails);
      
    // Look for multiple number patterns
    const allNumbers = [];
    const numberRegex = /number:(\d+)/g;
    let match;
    
    while ((match = numberRegex.exec(detailsStr)) !== null) {
      allNumbers.push(match[1]);
    }
    
    if (allNumbers.length > 0) {
      return allNumbers.join(', ');
    }
    
    // Fallback to original string if no numbers found
    return storageIdentifier;
  };

  const storageNumbers = extractStorageNumbers();

  // Check if we have any meaningful characteristics data
  const hasBasicCharacteristics = characteristics.bedrooms > 0 || 
                                 characteristics.bathrooms > 0 || 
                                 characteristics.parkingSpots > 0 || 
                                 (characteristics.hasStorage && characteristics.storageUnits > 0) ||
                                 characteristics.area > 0;

  // Check if we have any additional features
  const hasAdditionalFeatures = characteristics.petsAllowed || 
                               characteristics.furnished;

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <FaListUl className={styles.sectionIcon} />
        Características de la Propiedad
      </h2>
      
      <div className={styles.contractDetails}>
        {hasBasicCharacteristics ? (
          <div className={styles.characteristicsGrid}>
            {characteristics.bedrooms > 0 && (
              <div className={styles.characteristicCard}>
                <div className={styles.iconContainer}>
                  <FaBed className={styles.characteristicIcon} />
                </div>
                <div className={styles.characteristicInfo}>
                  <span className={styles.characteristicValue}>{characteristics.bedrooms}</span>
                  <span className={styles.characteristicLabel}>Dormitorios</span>
                </div>
              </div>
            )}
            
            {characteristics.bathrooms > 0 && (
              <div className={styles.characteristicCard}>
                <div className={styles.iconContainer}>
                  <FaBath className={styles.characteristicIcon} />
                </div>
                <div className={styles.characteristicInfo}>
                  <span className={styles.characteristicValue}>{characteristics.bathrooms}</span>
                  <span className={styles.characteristicLabel}>Baños</span>
                </div>
              </div>
            )}
            
            {characteristics.parkingSpots > 0 && (
              <div className={styles.characteristicCard}>
                <div className={styles.iconContainer}>
                  <FaCar className={styles.characteristicIcon} />
                </div>
                <div className={styles.characteristicInfo}>
                  <span className={styles.characteristicValue}>
                    {characteristics.parkingSpots}
                  </span>
                  <span className={styles.characteristicLabel}>Estacionamientos</span>
                  {parkingNumbers && (
                    <span className={styles.detailIdentifier}>
                      {characteristics.parkingSpots === 1 ? 'Número: ' : 'Números: '}
                      {parkingNumbers}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {characteristics.hasStorage && characteristics.storageUnits > 0 && (
              <div className={styles.characteristicCard}>
                <div className={styles.iconContainer}>
                  <FaArchive className={styles.characteristicIcon} />
                </div>
                <div className={styles.characteristicInfo}>
                  <span className={styles.characteristicValue}>
                    {characteristics.storageUnits}
                  </span>
                  <span className={styles.characteristicLabel}>Bodegas</span>
                  {storageNumbers && (
                    <span className={styles.detailIdentifier}>
                      {characteristics.storageUnits === 1 ? 'Número: ' : 'Números: '}
                      {storageNumbers}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {characteristics.area > 0 && (
              <div className={styles.characteristicCard}>
                <div className={styles.iconContainer}>
                  <FaRulerCombined className={styles.characteristicIcon} />
                </div>
                <div className={styles.characteristicInfo}>
                  <span className={styles.characteristicValue}>{characteristics.area} m²</span>
                  <span className={styles.characteristicLabel}>Superficie</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.noDataMessage}>
            <FaInfoCircle className={styles.noDataIcon} />
            <p>No hay información detallada sobre las características básicas de esta propiedad.</p>
          </div>
        )}
        
        <div className={styles.additionalFeatures}>
          <h3 className={styles.subSectionTitle}>Características adicionales</h3>
          
          {hasAdditionalFeatures ? (
            <div className={styles.featuresList}>
              <div className={`${styles.featureItem} ${characteristics.petsAllowed ? styles.featureActive : ''}`}>
                <FaDog className={styles.featureIcon} />
                <span>Mascotas permitidas</span>
              </div>
              <div className={`${styles.featureItem} ${characteristics.furnished ? styles.featureActive : ''}`}>
                <FaCouch className={styles.featureIcon} />
                <span>Amoblado</span>
              </div>
            </div>
          ) : (
            <p className={styles.noFeaturesMessage}>No hay información sobre características adicionales.</p>
          )}
        </div>
        
        {characteristics.amenities && characteristics.amenities.length > 0 ? (
          <div className={styles.amenitiesSection}>
            <h3 className={styles.subSectionTitle}>Comodidades del edificio/condominio</h3>
            <div className={styles.amenitiesList}>
              {characteristics.amenities.map((amenity, index) => (
                <div key={index} className={styles.amenityItem}>
                  <FaCheck className={styles.amenityIcon} />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.amenitiesSection}>
            <h3 className={styles.subSectionTitle}>Comodidades del edificio/condominio</h3>
            <p className={styles.noAmenitiesMessage}>No hay información sobre las comodidades del edificio o condominio.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCharacteristicsSection; 