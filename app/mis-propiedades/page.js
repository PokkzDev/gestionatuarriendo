'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaHome,
  FaExclamationTriangle,
  FaTimes,
  FaUserPlus,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationCircle,
  FaEnvelope,
  FaInfo,
  FaSpinner,
  FaPaperPlane
} from 'react-icons/fa';

function MisPropiedadesContent() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantInviteStatus, setTenantInviteStatus] = useState({ loading: false, error: '', success: false });
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    propertyType: 'APARTMENT',
    bedrooms: 1,
    bathrooms: 1,
    hasParking: false,
    parkingSpots: 0,
    parkingDetails: [],
    hasStorage: false,
    storageUnits: 0,
    storageDetails: [],
    furnished: false,
    totalArea: '',
    rentAmount: '',
    status: 'AVAILABLE'
  });
  const [error, setError] = useState('');
  const { data: session, status } = useSession();
  const [accountTier, setAccountTier] = useState('FREE');
  const [propertyCount, setPropertyCount] = useState(0);

  // Fetch properties when component mounts
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProperties();
      setAccountTier(session.user?.accountTier || 'FREE');
    }
  }, [status, session]);

  // Function to fetch properties from API
  const fetchProperties = async () => {
    setIsLoading(true);
    console.log('Fetching properties...');
    try {
      console.log('Session status:', status);
      console.log('User session:', session);
      const response = await fetch('/api/properties');
      console.log('API response status:', response.status);
      if (!response.ok) {
        throw new Error(`Error al obtener propiedades: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched properties data:', data);
      setProperties(data);
      setPropertyCount(data.length);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('No se pudieron cargar las propiedades. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Function to add a new parking spot
  const handleAddParkingSpot = () => {
    // Create a new parking spot with a default label
    const newSpot = { id: Date.now(), number: `P-${formData.parkingDetails.length + 1}` };
    
    setFormData({
      ...formData,
      parkingSpots: formData.parkingSpots + 1,
      parkingDetails: [...formData.parkingDetails, newSpot]
    });
  };

  // Function to remove a parking spot
  const handleRemoveParkingSpot = (spotId) => {
    const updatedSpots = formData.parkingDetails.filter(spot => spot.id !== spotId);
    
    setFormData({
      ...formData,
      parkingSpots: updatedSpots.length,
      parkingDetails: updatedSpots
    });
  };

  // Function to update a parking spot
  const handleUpdateParkingSpot = (spotId, value) => {
    const updatedSpots = formData.parkingDetails.map(spot => 
      spot.id === spotId ? { ...spot, number: value } : spot
    );
    
    setFormData({
      ...formData,
      parkingDetails: updatedSpots
    });
  };

  // Function to add a new storage unit
  const handleAddStorageUnit = () => {
    // Create a new storage unit with a default label
    const newUnit = { id: Date.now(), number: `B-${formData.storageDetails.length + 1}` };
    
    setFormData({
      ...formData,
      storageUnits: formData.storageUnits + 1,
      storageDetails: [...formData.storageDetails, newUnit]
    });
  };

  // Function to remove a storage unit
  const handleRemoveStorageUnit = (unitId) => {
    const updatedUnits = formData.storageDetails.filter(unit => unit.id !== unitId);
    
    setFormData({
      ...formData,
      storageUnits: updatedUnits.length,
      storageDetails: updatedUnits
    });
  };

  // Function to update a storage unit
  const handleUpdateStorageUnit = (unitId, value) => {
    const updatedUnits = formData.storageDetails.map(unit => 
      unit.id === unitId ? { ...unit, number: value } : unit
    );
    
    setFormData({
      ...formData,
      storageDetails: updatedUnits
    });
  };

  // Function to handle form submission for adding a new property
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear propiedad');
      }

      await fetchProperties();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  // Function to handle form submission for editing a property
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/properties/${currentProperty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar propiedad');
      }

      await fetchProperties();
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  // Function to delete a property
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/properties/${currentProperty.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar propiedad');
      }

      await fetchProperties();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  // Function to open the edit modal and populate form data
  const openEditModal = (property) => {
    setCurrentProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      description: property.description || '',
      propertyType: property.propertyType || 'APARTMENT',
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      hasParking: property.hasParking,
      parkingSpots: property.parkingSpots || 0,
      parkingDetails: property.parkingDetails || [],
      hasStorage: property.hasStorage || false,
      storageUnits: property.storageUnits || 0,
      storageDetails: property.storageDetails || [],
      furnished: property.furnished || false,
      totalArea: property.totalArea || '',
      rentAmount: property.rentAmount || '',
      status: property.status
    });
    setShowEditModal(true);
  };

  // Function to open the delete confirmation modal
  const openDeleteModal = (property) => {
    setCurrentProperty(property);
    setShowDeleteModal(true);
  };

  // Function to reset the form
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      propertyType: 'APARTMENT',
      bedrooms: 1,
      bathrooms: 1,
      hasParking: false,
      parkingSpots: 0,
      parkingDetails: [],
      hasStorage: false,
      storageUnits: 0,
      storageDetails: [],
      furnished: false,
      totalArea: '',
      rentAmount: '',
      status: 'AVAILABLE'
    });
    setError('');
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'No especificado';
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP' 
    }).format(amount);
  };

  // Helper function to get property limit based on account tier
  const getPropertyLimit = () => {
    switch (accountTier) {
      case 'PREMIUM':
        return 3;
      case 'ELITE':
        return 10;
      default:
        return 1;
    }
  };

  // Helper function to get status text and class
  const getStatusInfo = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return { text: 'Disponible', className: styles.statusAvailable };
      case 'OCCUPIED':
        return { text: 'Ocupada', className: styles.statusOccupied };
      case 'UNDER_MAINTENANCE':
        return { text: 'En Mantenimiento', className: styles.statusMaintenance };
      default:
        return { text: 'Desconocido', className: '' };
    }
  };

  // Helper function to get property type text
  const getPropertyTypeText = (type) => {
    switch (type) {
      case 'APARTMENT':
        return 'Departamento';
      case 'HOUSE':
        return 'Casa';
      case 'CONDO':
        return 'Condominio';
      case 'OFFICE':
        return 'Oficina';
      case 'COMMERCIAL':
        return 'Local Comercial';
      case 'LAND':
        return 'Terreno';
      case 'OTHER':
        return 'Otro';
      default:
        return 'Departamento';
    }
  };

  // Helper function to get role text in Spanish
  const getRoleText = (role) => {
    switch (role) {
      case 'ARRENDATARIO':
        return 'Arrendatario';
      case 'PROPIETARIO':
        return 'Propietario';
      case 'AMBOS':
        return 'Arrendatario y Propietario';
      default:
        return 'No especificado';
    }
  };

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Current property:', currentProperty);
    console.log('Property ID:', currentProperty?.id);
    console.log('Tenant email:', tenantEmail);
    
    if (!tenantEmail || !currentProperty) {
      setTenantInviteStatus({
        loading: false,
        error: 'Por favor ingresa un email válido',
        success: false
      });
      return;
    }
    
    setTenantInviteStatus({
      loading: true,
      error: '',
      success: false
    });
    
    const requestData = {
      propertyId: currentProperty.id,
      tenantEmail: tenantEmail,
    };
    
    console.log('Sending invite request with data:', requestData);
    
    try {
      const response = await fetch('/api/properties/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include',
      });
      
      const data = await response.json();
      console.log('Invite API response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la invitación');
      }
      
      setTenantInviteStatus({
        loading: false,
        error: '',
        success: true
      });
      
      // Reset form after successful submission
      setTimeout(() => {
        setShowTenantModal(false);
        setTenantEmail('');
        setTenantInviteStatus({
          loading: false,
          error: '',
          success: false
        });
      }, 2000);
      
    } catch (err) {
      console.error('Invite error:', err);
      setTenantInviteStatus({
        loading: false,
        error: err.message || 'Error al enviar la invitación',
        success: false
      });
    }
  };

  const openTenantModal = (property) => {
    setCurrentProperty(property);
    setTenantEmail('');
    setTenantInviteStatus({
      loading: false,
      error: '',
      success: false
    });
    setShowTenantModal(true);
  };

  // Render loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Cargando...</h1>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status !== 'authenticated') {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Acceso no autorizado</h1>
        <p>Por favor, <Link href="/login?mode=login">inicia sesión</Link> para acceder a esta página.</p>
      </div>
    );
  }

  // Determine if user has reached their property limit
  const propertyLimit = getPropertyLimit();
  const reachedLimit = propertyCount >= propertyLimit;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mis Propiedades</h1>
        <div className={styles.addButtonContainer}>
          <button 
            className={`${styles.addButton} ${reachedLimit ? styles.addButtonDisabled : ''}`}
            onClick={() => {
              if (!reachedLimit) {
                resetForm();
                setShowAddModal(true);
              }
            }}
            disabled={reachedLimit}
            title={reachedLimit ? `Has alcanzado el límite de ${propertyLimit} propiedades para tu cuenta ${accountTier}` : ''}
          >
            <FaPlus className={styles.addButtonIcon} />
            Agregar Propiedad
          </button>
        </div>
      </div>

      {/* Property limit warning */}
      {reachedLimit && (
        <div className={styles.limitWarning}>
          <div className={styles.limitWarningTitle}>
            <FaExclamationTriangle className={styles.limitWarningIcon} />
            Límite de propiedades alcanzado
          </div>
          <p className={styles.limitWarningText}>
            Has alcanzado el límite de {propertyLimit} {propertyLimit === 1 ? 'propiedad' : 'propiedades'} para tu cuenta <strong>{accountTier}</strong>.
          </p>
          {accountTier !== 'ELITE' && (
            <div className={styles.planComparisonContainer}>
              <div className={styles.planInfo}>
                <div className={styles.planTitle}>Tu plan actual: <strong>{accountTier}</strong></div>
                <div className={styles.planLimit}>Límite: {propertyLimit} {propertyLimit === 1 ? 'propiedad' : 'propiedades'}</div>
              </div>
              {accountTier === 'FREE' && (
                <div className={styles.planInfo}>
                  <div className={styles.planTitle}>Plan PREMIUM</div>
                  <div className={styles.planLimit}>Límite: 3 propiedades</div>
                  <Link href="/mi-cuenta/plan" className={styles.upgradePlanButton}>
                    Actualizar a PREMIUM
                  </Link>
                </div>
              )}
              <div className={styles.planInfo}>
                <div className={styles.planTitle}>Plan ELITE</div>
                <div className={styles.planLimit}>Límite: 10 propiedades</div>
                <Link href="/mi-cuenta/plan" className={styles.upgradePlanButton}>
                  Actualizar a ELITE
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className={styles.limitWarning}>
          <div className={styles.limitWarningTitle}>
            <FaExclamationTriangle className={styles.limitWarningIcon} />
            Error
          </div>
          <p className={styles.limitWarningText}>{error}</p>
        </div>
      )}

      {/* Properties list */}
      {properties.length > 0 ? (
        <div className={styles.propertiesList}>
          {properties.map((property) => {
            const statusInfo = getStatusInfo(property.status);
            return (
              <div key={property.id} className={styles.propertyCard}>
                <div className={styles.propertyHeader}>
                  <h3 className={styles.propertyTitle}>{property.name}</h3>
                  <p className={styles.propertyAddress}>{property.address}</p>
                </div>
                <div className={styles.propertyContent}>
                  <div className={styles.propertyDetail}>
                    <span className={styles.propertyDetailLabel}>Tipo:</span>
                    <span className={styles.propertyDetailValue}>{getPropertyTypeText(property.propertyType)}</span>
                  </div>
                  <div className={styles.propertyDetail}>
                    <span className={styles.propertyDetailLabel}>Habitaciones:</span>
                    <span className={styles.propertyDetailValue}>{property.bedrooms}</span>
                  </div>
                  <div className={styles.propertyDetail}>
                    <span className={styles.propertyDetailLabel}>Baños:</span>
                    <span className={styles.propertyDetailValue}>{property.bathrooms}</span>
                  </div>
                  {property.totalArea && (
                    <div className={styles.propertyDetail}>
                      <span className={styles.propertyDetailLabel}>Área total:</span>
                      <span className={styles.propertyDetailValue}>{property.totalArea} m²</span>
                    </div>
                  )}
                  {property.rentAmount && (
                    <div className={styles.propertyDetail}>
                      <span className={styles.propertyDetailLabel}>Valor arriendo:</span>
                      <span className={styles.propertyDetailValue}>{formatCurrency(property.rentAmount)}</span>
                    </div>
                  )}
                  {property.hasParking && (
                    <div className={styles.propertyDetail}>
                      <span className={styles.propertyDetailLabel}>Estacionamiento:</span>
                      <span className={styles.propertyDetailValue}>
                        {property.parkingSpots > 1 ? `${property.parkingSpots} estacionamientos` : '1 estacionamiento'}
                      </span>
                    </div>
                  )}
                  {property.hasStorage && (
                    <div className={styles.propertyDetail}>
                      <span className={styles.propertyDetailLabel}>Bodega:</span>
                      <span className={styles.propertyDetailValue}>
                        {property.storageUnits > 1 ? `${property.storageUnits} bodegas` : 'Sí'}
                      </span>
                    </div>
                  )}
                  {property.furnished && (
                    <div className={styles.propertyDetail}>
                      <span className={styles.propertyDetailLabel}>Amoblado:</span>
                      <span className={styles.propertyDetailValue}>Sí</span>
                    </div>
                  )}
                  <div className={styles.propertyDetail}>
                    <span className={styles.propertyDetailLabel}>Estado:</span>
                    <span className={`${styles.propertyStatus} ${statusInfo.className}`}>{statusInfo.text}</span>
                  </div>
                  
                  {/* Mostrar información del arrendatario si ha aceptado la invitación */}
                  {property.tenants && property.tenants.length > 0 && property.tenants[0].status === 'ACCEPTED' && property.tenants[0].tenantUser && (
                    <div className={styles.tenantSection}>
                      <div className={styles.tenantHeader}>
                        <FaCheckCircle className={styles.tenantIcon} style={{ color: '#4caf50' }} />
                        <h4 className={styles.tenantTitle}>Arrendatario actual</h4>
                      </div>
                      <div className={styles.tenantDetails}>
                        <div className={styles.propertyDetail}>
                          <span className={styles.propertyDetailLabel}>Nombre:</span>
                          <span className={styles.propertyDetailValue}>{property.tenants[0].tenantUser.name}</span>
                        </div>
                        <div className={styles.propertyDetail}>
                          <span className={styles.propertyDetailLabel}>Email:</span>
                          <span className={styles.propertyDetailValue}>{property.tenants[0].tenantEmail}</span>
                        </div>
                        <div className={styles.propertyDetail}>
                          <span className={styles.propertyDetailLabel}>Estado:</span>
                          <span className={styles.propertyDetailValue} style={{ color: '#4caf50', fontWeight: 'bold' }}>Invitación aceptada</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.propertyActions}>
                  <button 
                    className={`${styles.actionButton} ${property.tenants && property.tenants.length > 0 && property.tenants[0].status === 'ACCEPTED' && property.tenants[0].tenantUser ? styles.tenantAcceptedButton : styles.tenantButton}`}
                    onClick={() => openTenantModal(property)}
                    title={property.tenants && property.tenants.length > 0 && property.tenants[0].status === 'ACCEPTED' && property.tenants[0].tenantUser ? "Gestionar Arrendatario" : "Agregar Arrendatario"}
                  >
                    {property.tenants && property.tenants.length > 0 && property.tenants[0].status === 'ACCEPTED' && property.tenants[0].tenantUser ? 
                      <FaUserPlus style={{ color: '#4caf50' }} /> : 
                      <FaUserPlus />
                    }
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => openEditModal(property)}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => openDeleteModal(property)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <FaHome className={styles.emptyStateIcon} />
          <p className={styles.emptyStateText}>Aún no has registrado ninguna propiedad.</p>
          <button 
            className={styles.emptyStateButton}
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FaPlus style={{ marginRight: '8px' }} />
            Agregar tu primera propiedad
          </button>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Agregar Propiedad</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAddModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="name">Nombre de la propiedad *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={styles.formInput}
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="address">Dirección *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className={styles.formInput}
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="description">Descripción</label>
                  <textarea
                    id="description"
                    name="description"
                    className={styles.formTextarea}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="propertyType">Tipo de propiedad</label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    className={styles.formSelect}
                    value={formData.propertyType}
                    onChange={handleInputChange}
                  >
                    <option value="APARTMENT">Departamento</option>
                    <option value="HOUSE">Casa</option>
                    <option value="CONDO">Condominio</option>
                    <option value="OFFICE">Oficina</option>
                    <option value="COMMERCIAL">Local Comercial</option>
                    <option value="LAND">Terreno</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formColumn}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="bedrooms">Habitaciones</label>
                      <input
                        type="number"
                        id="bedrooms"
                        name="bedrooms"
                        className={styles.formInput}
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className={styles.formColumn}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="bathrooms">Baños</label>
                      <input
                        type="number"
                        id="bathrooms"
                        name="bathrooms"
                        className={styles.formInput}
                        value={formData.bathrooms}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formColumn}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="totalArea">Área total (m²)</label>
                      <input
                        type="number"
                        id="totalArea"
                        name="totalArea"
                        className={styles.formInput}
                        value={formData.totalArea}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className={styles.formColumn}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="rentAmount">Valor arriendo (CLP)</label>
                      <input
                        type="number"
                        id="rentAmount"
                        name="rentAmount"
                        className={styles.formInput}
                        value={formData.rentAmount}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="status">Estado</label>
                  <select
                    id="status"
                    name="status"
                    className={styles.formSelect}
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="OCCUPIED">Ocupada</option>
                    <option value="UNDER_MAINTENANCE">En Mantenimiento</option>
                  </select>
                </div>
                <div className={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    id="hasParking"
                    name="hasParking"
                    className={styles.formCheckboxInput}
                    checked={formData.hasParking}
                    onChange={handleInputChange}
                  />
                  <label className={styles.formCheckboxLabel} htmlFor="hasParking">Incluye estacionamiento</label>
                </div>
                
                {formData.hasParking && (
                  <div className={styles.detailsContainer} style={{ marginTop: '8px' }}>
                    <div className={styles.detailsHeader}>
                      <h4 className={styles.detailsTitle}>Estacionamientos</h4>
                      <button 
                        type="button" 
                        className={styles.addDetailButton}
                        onClick={handleAddParkingSpot}
                      >
                        + Agregar estacionamiento
                      </button>
                    </div>
                    
                    {formData.parkingDetails.length === 0 ? (
                      <p className={styles.noDetailsMessage}>
                        No hay estacionamientos especificados. Haga clic en &quot;Agregar estacionamiento&quot; para añadir uno.
                      </p>
                    ) : (
                      <div className={styles.detailsList}>
                        {formData.parkingDetails.map((spot, index) => (
                          <div key={spot.id} className={styles.detailItem}>
                            <input
                              type="text"
                              value={spot.number}
                              onChange={(e) => handleUpdateParkingSpot(spot.id, e.target.value)}
                              className={styles.detailInput}
                              placeholder="Número/Identificador"
                            />
                            <button 
                              type="button" 
                              className={styles.removeDetailButton}
                              onClick={() => handleRemoveParkingSpot(spot.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={styles.formCheckbox} style={{ marginTop: '16px' }}>
                  <input
                    type="checkbox"
                    id="hasStorage"
                    name="hasStorage"
                    className={styles.formCheckboxInput}
                    checked={formData.hasStorage}
                    onChange={handleInputChange}
                  />
                  <label className={styles.formCheckboxLabel} htmlFor="hasStorage">Incluye bodega</label>
                </div>
                
                {formData.hasStorage && (
                  <div className={styles.detailsContainer} style={{ marginTop: '8px' }}>
                    <div className={styles.detailsHeader}>
                      <h4 className={styles.detailsTitle}>Bodegas</h4>
                      <button 
                        type="button" 
                        className={styles.addDetailButton}
                        onClick={handleAddStorageUnit}
                      >
                        + Agregar bodega
                      </button>
                    </div>
                    
                    {formData.storageDetails.length === 0 ? (
                      <p className={styles.noDetailsMessage}>
                        No hay bodegas especificadas. Haga clic en &quot;Agregar bodega&quot; para añadir una.
                      </p>
                    ) : (
                      <div className={styles.detailsList}>
                        {formData.storageDetails.map((unit, index) => (
                          <div key={unit.id} className={styles.detailItem}>
                            <input
                              type="text"
                              value={unit.number}
                              onChange={(e) => handleUpdateStorageUnit(unit.id, e.target.value)}
                              className={styles.detailInput}
                              placeholder="Número/Identificador"
                            />
                            <button 
                              type="button" 
                              className={styles.removeDetailButton}
                              onClick={() => handleRemoveStorageUnit(unit.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={styles.formCheckbox} style={{ marginTop: '16px' }}>
                  <input
                    type="checkbox"
                    id="furnished"
                    name="furnished"
                    className={styles.formCheckboxInput}
                    checked={formData.furnished}
                    onChange={handleInputChange}
                  />
                  <label className={styles.formCheckboxLabel} htmlFor="furnished">Amoblado</label>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Editar Propiedad</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="edit-name">Nombre de la propiedad *</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    className={styles.formInput}
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="edit-address">Dirección *</label>
                  <input
                    type="text"
                    id="edit-address"
                    name="address"
                    className={styles.formInput}
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="edit-description">Descripción</label>
                  <textarea
                    id="edit-description"
                    name="description"
                    className={styles.formTextarea}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="edit-propertyType">Tipo de propiedad</label>
                  <select
                    id="edit-propertyType"
                    name="propertyType"
                    className={styles.formSelect}
                    value={formData.propertyType}
                    onChange={handleInputChange}
                  >
                    <option value="APARTMENT">Departamento</option>
                    <option value="HOUSE">Casa</option>
                    <option value="CONDO">Condominio</option>
                    <option value="OFFICE">Oficina</option>
                    <option value="COMMERCIAL">Local Comercial</option>
                    <option value="LAND">Terreno</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formColumn}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="edit-bedrooms">Habitaciones</label>
                      <input
                        type="number"
                        id="edit-bedrooms"
                        name="bedrooms"
                        className={styles.formInput}
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className={styles.formColumn}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="edit-bathrooms">Baños</label>
                      <input
                        type="number"
                        id="edit-bathrooms"
                        name="bathrooms"
                        className={styles.formInput}
                        value={formData.bathrooms}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formColumn}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="edit-totalArea">Área total (m²)</label>
                      <input
                        type="number"
                        id="edit-totalArea"
                        name="totalArea"
                        className={styles.formInput}
                        value={formData.totalArea}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className={styles.formColumn}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="edit-rentAmount">Valor arriendo (CLP)</label>
                      <input
                        type="number"
                        id="edit-rentAmount"
                        name="rentAmount"
                        className={styles.formInput}
                        value={formData.rentAmount}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="edit-status">Estado</label>
                  <select
                    id="edit-status"
                    name="status"
                    className={styles.formSelect}
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="OCCUPIED">Ocupada</option>
                    <option value="UNDER_MAINTENANCE">En Mantenimiento</option>
                  </select>
                </div>
                <div className={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    id="edit-hasParking"
                    name="hasParking"
                    className={styles.formCheckboxInput}
                    checked={formData.hasParking}
                    onChange={handleInputChange}
                  />
                  <label className={styles.formCheckboxLabel} htmlFor="edit-hasParking">Incluye estacionamiento</label>
                </div>
                
                {formData.hasParking && (
                  <div className={styles.detailsContainer} style={{ marginTop: '8px' }}>
                    <div className={styles.detailsHeader}>
                      <h4 className={styles.detailsTitle}>Estacionamientos</h4>
                      <button 
                        type="button" 
                        className={styles.addDetailButton}
                        onClick={handleAddParkingSpot}
                      >
                        + Agregar estacionamiento
                      </button>
                    </div>
                    
                    {formData.parkingDetails.length === 0 ? (
                      <p className={styles.noDetailsMessage}>
                        No hay estacionamientos especificados. Haga clic en &quot;Agregar estacionamiento&quot; para añadir uno.
                      </p>
                    ) : (
                      <div className={styles.detailsList}>
                        {formData.parkingDetails.map((spot, index) => (
                          <div key={spot.id} className={styles.detailItem}>
                            <input
                              type="text"
                              value={spot.number}
                              onChange={(e) => handleUpdateParkingSpot(spot.id, e.target.value)}
                              className={styles.detailInput}
                              placeholder="Número/Identificador"
                            />
                            <button 
                              type="button" 
                              className={styles.removeDetailButton}
                              onClick={() => handleRemoveParkingSpot(spot.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={styles.formCheckbox} style={{ marginTop: '16px' }}>
                  <input
                    type="checkbox"
                    id="edit-hasStorage"
                    name="hasStorage"
                    className={styles.formCheckboxInput}
                    checked={formData.hasStorage}
                    onChange={handleInputChange}
                  />
                  <label className={styles.formCheckboxLabel} htmlFor="edit-hasStorage">Incluye bodega</label>
                </div>
                
                {formData.hasStorage && (
                  <div className={styles.detailsContainer} style={{ marginTop: '8px' }}>
                    <div className={styles.detailsHeader}>
                      <h4 className={styles.detailsTitle}>Bodegas</h4>
                      <button 
                        type="button" 
                        className={styles.addDetailButton}
                        onClick={handleAddStorageUnit}
                      >
                        + Agregar bodega
                      </button>
                    </div>
                    
                    {formData.storageDetails.length === 0 ? (
                      <p className={styles.noDetailsMessage}>
                        No hay bodegas especificadas. Haga clic en &quot;Agregar bodega&quot; para añadir una.
                      </p>
                    ) : (
                      <div className={styles.detailsList}>
                        {formData.storageDetails.map((unit, index) => (
                          <div key={unit.id} className={styles.detailItem}>
                            <input
                              type="text"
                              value={unit.number}
                              onChange={(e) => handleUpdateStorageUnit(unit.id, e.target.value)}
                              className={styles.detailInput}
                              placeholder="Número/Identificador"
                            />
                            <button 
                              type="button" 
                              className={styles.removeDetailButton}
                              onClick={() => handleRemoveStorageUnit(unit.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={styles.formCheckbox} style={{ marginTop: '16px' }}>
                  <input
                    type="checkbox"
                    id="edit-furnished"
                    name="furnished"
                    className={styles.formCheckboxInput}
                    checked={formData.furnished}
                    onChange={handleInputChange}
                  />
                  <label className={styles.formCheckboxLabel} htmlFor="edit-furnished">Amoblado</label>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Eliminar Propiedad</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowDeleteModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className={styles.deleteModalContent}>
              <p className={styles.deleteModalMessage}>
                ¿Estás seguro que deseas eliminar la propiedad &quot;{currentProperty?.name}&quot;? Esta acción no se puede deshacer.
              </p>
              <div className={styles.deleteModalButtons}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className={styles.deleteConfirmButton}
                  onClick={handleDelete}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Modal */}
      {showTenantModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {currentProperty && currentProperty.tenants && currentProperty.tenants.length > 0 && 
                 currentProperty.tenants[0].status === 'ACCEPTED' && currentProperty.tenants[0].tenantUser
                  ? "Gestionar Arrendatario"
                  : "Agregar Arrendatario"}
              </h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowTenantModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            {currentProperty && currentProperty.tenants && currentProperty.tenants.length > 0 && currentProperty.tenants[0].status === 'ACCEPTED' && currentProperty.tenants[0].tenantUser ? (
              <div className={styles.modalBody}>
                <div className={styles.currentTenantInfo}>
                  <div className={styles.currentTenantHeader}>
                    <FaCheckCircle className={styles.tenantIcon} style={{ color: '#4caf50' }} />
                    <h4 className={styles.currentTenantTitle}>Arrendatario actual</h4>
                  </div>
                  
                  <div className={styles.currentTenantDetails}>
                    <div className={styles.tenantInfoRow}>
                      <span className={styles.tenantInfoLabel}>Nombre:</span>
                      <span className={styles.tenantInfoValue}>{currentProperty.tenants[0].tenantUser.name}</span>
                    </div>
                    <div className={styles.tenantInfoRow}>
                      <span className={styles.tenantInfoLabel}>Email:</span>
                      <span className={styles.tenantInfoValue}>{currentProperty.tenants[0].tenantEmail}</span>
                    </div>
                    <div className={styles.tenantInfoRow}>
                      <span className={styles.tenantInfoLabel}>Estado:</span>
                      <span className={styles.tenantInfoValue} style={{ color: '#4caf50', fontWeight: 'bold' }}>Invitación aceptada</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.tenantActionSection}>
                  <h4 className={styles.changeTenantTitle}>¿Deseas cambiar el arrendatario?</h4>
                  <p className={styles.changeTenantDescription}>
                    Puedes enviar una invitación a un nuevo arrendatario. Esto reemplazará al arrendatario actual.
                  </p>
                  
                  <form onSubmit={handleTenantSubmit} className={styles.tenantForm}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="tenantEmail">Email del nuevo arrendatario</label>
                      <input
                        type="email"
                        id="tenantEmail"
                        name="tenantEmail"
                        className={styles.formInput}
                        value={tenantEmail}
                        onChange={(e) => setTenantEmail(e.target.value)}
                        placeholder="Ingrese el email del nuevo arrendatario"
                        required
                      />
                    </div>
                    
                    {tenantInviteStatus.error && (
                      <div className={styles.errorMessage}>
                        <FaExclamationCircle style={{ marginRight: '8px' }} />
                        {tenantInviteStatus.error}
                      </div>
                    )}
                    
                    {tenantInviteStatus.success && (
                      <div className={styles.successMessage}>
                        <FaCheckCircle style={{ marginRight: '8px' }} />
                        Invitación enviada exitosamente
                      </div>
                    )}
                    
                    <div className={styles.modalActions}>
                      <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={tenantInviteStatus.loading}
                      >
                        {tenantInviteStatus.loading ? (
                          <>
                            <FaSpinner className={styles.loadingIcon} />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane style={{ marginRight: '8px' }} />
                            Enviar invitación
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTenantSubmit} className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="tenantEmail">Email del arrendatario</label>
                  <input
                    type="email"
                    id="tenantEmail"
                    name="tenantEmail"
                    className={styles.formInput}
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                    placeholder="Ingrese el email del arrendatario"
                    required
                  />
                </div>
                
                {tenantInviteStatus.error && (
                  <div className={styles.errorMessage}>
                    <FaExclamationCircle style={{ marginRight: '8px' }} />
                    {tenantInviteStatus.error}
                  </div>
                )}
                
                {tenantInviteStatus.success && (
                  <div className={styles.successMessage}>
                    <FaCheckCircle style={{ marginRight: '8px' }} />
                    Invitación enviada exitosamente
                  </div>
                )}
                
                <div className={styles.modalActions}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={tenantInviteStatus.loading}
                  >
                    {tenantInviteStatus.loading ? (
                      <>
                        <FaSpinner className={styles.loadingIcon} />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane style={{ marginRight: '8px' }} />
                        Enviar invitación
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MisPropiedades() {
  return (
    <RoleGuard 
      allowedRoles={['PROPIETARIO', 'AMBOS']} 
      fallback={
        <div className={styles.unauthorized}>
          <h1>Acceso no autorizado</h1>
          <p>No tienes permiso para ver esta página.</p>
          <Link href="/" className={styles.backLink}>
            Volver al inicio
          </Link>
        </div>
      }
    >
      <MisPropiedadesContent />
    </RoleGuard>
  );
} 