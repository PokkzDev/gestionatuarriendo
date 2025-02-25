'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { 
  FaWater, 
  FaBolt, 
  FaFire, 
  FaWifi, 
  FaHome, 
  FaTools, 
  FaEllipsisH,
  FaPlus,
  FaTrash,
  FaEdit,
  FaExclamationTriangle,
  FaSave,
  FaTimes,
  FaCheck,
  FaBars,
  FaList,
  FaTags
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Reusable expense component
const ExpenseComponent = ({ type, title, icon, chartColor }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [chartOptions, setChartOptions] = useState({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 10,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `Gastos de ${title} en el tiempo`,
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto ($)',
          font: {
            size: 12
          }
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Fecha',
          font: {
            size: 12
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 12
          }
        }
      }
    }
  });
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0] // Keep ISO format for input[type="date"]
  });

  // Update chart options based on window size (client-side only)
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isSmall = window.innerWidth < 576;
      
      setChartOptions({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 10,
              font: {
                size: isMobile ? 10 : 12
              }
            }
          },
          title: {
            display: true,
            text: `Gastos de ${title} en el tiempo`,
            font: {
              size: isMobile ? 14 : 16
            }
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: !isSmall,
              text: 'Monto ($)',
              font: {
                size: isMobile ? 10 : 12
              }
            },
            ticks: {
              font: {
                size: isMobile ? 10 : 12
              }
            }
          },
          x: {
            title: {
              display: !isSmall,
              text: 'Fecha',
              font: {
                size: isMobile ? 10 : 12
              }
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: {
                size: isMobile ? 8 : 12
              }
            }
          }
        }
      });
    };

    // Initial call
    handleResize();
    
    // Add event listener for resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [title]);

  // Fetch expenses of the specified type
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expenses?type=${type}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error al obtener los gastos de ${title.toLowerCase()}`);
      }
      
      const data = await response.json();
      
      // Sort expenses by date, newest first for the table display
      const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(sortedData);
    } catch (err) {
      setError(err.message);
      console.error(`Error al obtener gastos de ${title.toLowerCase()}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [type, title]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle editing input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingExpense(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Start editing an expense
  const startEditing = (expense) => {
    // Format date for the date input (which requires YYYY-MM-DD format)
    const formattedDate = new Date(expense.date).toISOString().split('T')[0];
    setEditingExpense({
      ...expense,
      date: formattedDate
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingExpense(null);
  };

  // Save edited expense
  const saveEditedExpense = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingExpense,
          amount: parseFloat(editingExpense.amount),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al actualizar el gasto');
      }
      
      const updatedExpense = await response.json();
      
      // Update the expenses list with the edited expense and resort
      setExpenses(prev => {
        const updatedList = prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp);
        return [...updatedList].sort((a, b) => new Date(b.date) - new Date(a.date)); // Keep newest first
      });
      
      // Exit editing mode
      setEditingExpense(null);
    } catch (err) {
      console.error('Error al actualizar gasto:', err);
      alert('Error al actualizar gasto: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete confirmation
  const confirmDelete = (expenseId) => {
    setShowDeleteConfirmation(expenseId);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirmation(null);
  };

  // Delete expense
  const deleteExpense = async (expenseId) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar el gasto');
      }
      
      // Remove the expense from the list
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
      
      // Hide confirmation
      setShowDeleteConfirmation(null);
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
      alert('Error al eliminar gasto: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newExpense,
          amount: parseFloat(newExpense.amount),
          type: type,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al agregar el gasto');
      }
      
      const addedExpense = await response.json();
      
      // Add the new expense at the beginning of the list (newest first)
      setExpenses(prev => [addedExpense, ...prev]);
      
      // Reset form
      setNewExpense({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Hide form
      setShowForm(false);
    } catch (err) {
      console.error('Error al agregar gasto:', err);
      alert('Error al agregar gasto: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Format date in DD/MM/YYYY format
  const formatDateDDMMYYYY = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Prepare chart data
  const chartData = {
    labels: [...expenses]
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort chronologically (oldest to newest)
      .map(exp => formatDateDDMMYYYY(exp.date)),
    datasets: [
      {
        label: `Gastos de ${title}`,
        data: [...expenses]
          .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort to match labels
          .map(exp => exp.amount),
        fill: false,
        backgroundColor: `rgba(${chartColor}, 0.2)`,
        borderColor: `rgba(${chartColor}, 1)`,
        tension: 0.1
      }
    ]
  };

  // If there's an authentication error, show a friendly message
  if (error && (error.includes('Unauthorized') || error.includes('401'))) {
    return (
      <div className={styles.expenseTypeContainer}>
        <div className={styles.authErrorContainer}>
          <FaExclamationTriangle className={styles.authErrorIcon} />
          <h2>Autenticación Requerida</h2>
          <p>Por favor, inicia sesión para ver y administrar tus gastos.</p>
          <a href="/login" className={styles.loginButton}>Iniciar Sesión</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.expenseTypeContainer}>
      <h2 className={styles.expenseTypeTitle}>
        {icon} Gastos de {title}
      </h2>
      
      {/* Expense Chart */}
      <div className={styles.chartContainer}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
          </div>
        ) : error ? (
          <p className={styles.errorText}>Error al cargar datos: {error}</p>
        ) : expenses.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p>No hay gastos de {title.toLowerCase()} registrados. Agrega tu primer gasto debajo.</p>
        )}
      </div>
      
      {/* Add Expense Button/Form */}
      <div className={styles.addExpenseSection}>
        {!showForm ? (
          <button 
            className={styles.addButton}
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: `rgba(${chartColor}, 1)` }}
          >
            <FaPlus /> Agregar Gasto de {title}
          </button>
        ) : (
          <form onSubmit={handleSubmit} className={styles.expenseForm}>
            <h3>Agregar Nuevo Gasto de {title}</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="amount">Monto ($)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={newExpense.amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className={styles.formInput}
                disabled={submitting}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description">Descripción</label>
              <input
                type="text"
                id="description"
                name="description"
                value={newExpense.description}
                onChange={handleInputChange}
                required
                className={styles.formInput}
                disabled={submitting}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="date">Fecha</label>
              <input
                type="date"
                id="date"
                name="date"
                value={newExpense.date}
                onChange={handleInputChange}
                required
                className={styles.formInput}
                disabled={submitting}
              />
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.submitButton}
                style={{ backgroundColor: `rgba(${chartColor}, 0.8)` }}
                disabled={submitting}
              >
                {submitting ? (
                  <div className={styles.loadingContainer} style={{ justifyContent: 'center', minHeight: 'auto' }}>
                    <div className={styles.loadingSpinner} style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  </div>
                ) : (
                  'Guardar'
                )}
              </button>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
      
      {/* Expenses List */}
      <div className={styles.expensesList}>
        <h3>Gastos Recientes de {title}</h3>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
          </div>
        ) : error ? (
          <p className={styles.errorText}>Error: {error}</p>
        ) : expenses.length > 0 ? (
          <div className={styles.expensesTable}>
            <div className={styles.expenseHeader}>
              <span>Fecha</span>
              <span>Descripción</span>
              <span>Monto</span>
              <span>Acciones</span>
            </div>
            {expenses.map(expense => (
              <div key={expense.id} className={styles.expenseItem}>
                {editingExpense && editingExpense.id === expense.id ? (
                  // Editing mode
                  <>
                    <span>
                      <input
                        type="date"
                        name="date"
                        value={editingExpense.date}
                        onChange={handleEditInputChange}
                        className={styles.editInput}
                        required
                        disabled={submitting}
                      />
                    </span>
                    <span>
                      <input
                        type="text"
                        name="description"
                        value={editingExpense.description}
                        onChange={handleEditInputChange}
                        className={styles.editInput}
                        required
                        disabled={submitting}
                      />
                    </span>
                    <span>
                      <input
                        type="number"
                        name="amount"
                        value={editingExpense.amount}
                        onChange={handleEditInputChange}
                        className={styles.editInput}
                        min="0"
                        step="0.01"
                        required
                        disabled={submitting}
                      />
                    </span>
                    <span className={styles.expenseActions}>
                      {submitting ? (
                        <div className={styles.loadingSpinner} style={{ width: '20px', height: '20px', borderWidth: '2px', margin: '0 auto' }}></div>
                      ) : (
                        <>
                          <button 
                            className={`${styles.actionButton} ${styles.saveButton}`}
                            onClick={saveEditedExpense}
                            title="Guardar cambios"
                            disabled={submitting}
                          >
                            <FaSave />
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.cancelButton}`}
                            onClick={cancelEditing}
                            title="Cancelar edición"
                            disabled={submitting}
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </span>
                  </>
                ) : showDeleteConfirmation === expense.id ? (
                  // Delete confirmation mode
                  <>
                    <span colSpan="3" className={styles.deleteConfirmation}>
                      ¿Estás seguro que deseas eliminar este gasto?
                    </span>
                    <span className={styles.expenseActions}>
                      {submitting ? (
                        <div className={styles.loadingSpinner} style={{ width: '20px', height: '20px', borderWidth: '2px', margin: '0 auto' }}></div>
                      ) : (
                        <>
                          <button 
                            className={`${styles.actionButton} ${styles.confirmButton}`}
                            onClick={() => deleteExpense(expense.id)}
                            title="Confirmar eliminación"
                            disabled={submitting}
                          >
                            <FaCheck />
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.cancelButton}`}
                            onClick={cancelDelete}
                            title="Cancelar eliminación"
                            disabled={submitting}
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </span>
                  </>
                ) : (
                  // Normal display mode
                  <>
                    <span>{formatDateDDMMYYYY(expense.date)}</span>
                    <span>{expense.description}</span>
                    <span>${expense.amount.toFixed(2)}</span>
                    <span className={styles.expenseActions}>
                      <button 
                        className={styles.actionButton} 
                        onClick={() => startEditing(expense)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className={styles.actionButton} 
                        onClick={() => confirmDelete(expense.id)}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No hay gastos registrados aún.</p>
        )}
      </div>
    </div>
  );
};

// Define expense type components using the reusable component
const GasExpenses = () => (
  <ExpenseComponent 
    type="GAS" 
    title="Gas" 
    icon={<FaFire className={styles.expenseIcon} />}
    chartColor="255, 99, 132"
  />
);

const ElectricityExpenses = () => (
  <ExpenseComponent 
    type="ELECTRICITY" 
    title="Electricidad" 
    icon={<FaBolt className={styles.expenseIcon} />}
    chartColor="255, 206, 86"
  />
);

const WaterExpenses = () => (
  <ExpenseComponent 
    type="WATER" 
    title="Agua" 
    icon={<FaWater className={styles.expenseIcon} />}
    chartColor="54, 162, 235"
  />
);

const InternetExpenses = () => (
  <ExpenseComponent 
    type="INTERNET" 
    title="Internet" 
    icon={<FaWifi className={styles.expenseIcon} />}
    chartColor="75, 192, 192"
  />
);

const RentExpenses = () => (
  <ExpenseComponent 
    type="RENT" 
    title="Arriendo" 
    icon={<FaHome className={styles.expenseIcon} />}
    chartColor="153, 102, 255"
  />
);

const MaintenanceExpenses = () => (
  <ExpenseComponent 
    type="MAINTENANCE" 
    title="Gastos Comunes" 
    icon={<FaTools className={styles.expenseIcon} />}
    chartColor="255, 159, 64"
  />
);

const OtherExpenses = () => (
  <ExpenseComponent 
    type="OTHER" 
    title="Otros" 
    icon={<FaEllipsisH className={styles.expenseIcon} />}
    chartColor="201, 203, 207"
  />
);

export default function MisGastos() {
  const [activeExpenseType, setActiveExpenseType] = useState('GAS');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileView = width <= 768;
      setIsMobile(isMobileView);
      
      // On desktop, always show sidebar
      if (!isMobileView) {
        setShowSidebar(true);
      } else {
        setShowSidebar(false); // Hide sidebar by default on mobile
      }
    };

    // Check on mount
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Handle click outside sidebar to close it on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('expenses-sidebar');
      const menuToggle = document.getElementById('mobile-menu-toggle');
      
      if (sidebar && menuToggle && 
          !sidebar.contains(event.target) && 
          !menuToggle.contains(event.target) &&
          showSidebar) {
        setShowSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, showSidebar]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && showSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, showSidebar]);

  const expenseTypes = [
    { id: 'GAS', label: 'Gas', icon: <FaFire className={styles.expenseIcon} /> },
    { id: 'ELECTRICITY', label: 'Electricidad', icon: <FaBolt className={styles.expenseIcon} /> },
    { id: 'WATER', label: 'Agua', icon: <FaWater className={styles.expenseIcon} /> },
    { id: 'INTERNET', label: 'Internet', icon: <FaWifi className={styles.expenseIcon} /> },
    { id: 'RENT', label: 'Arriendo', icon: <FaHome className={styles.expenseIcon} /> },
    { id: 'MAINTENANCE', label: 'Gastos Comunes', icon: <FaTools className={styles.expenseIcon} /> },
    { id: 'OTHER', label: 'Otros', icon: <FaEllipsisH className={styles.expenseIcon} /> },
  ];

  const renderExpenseContent = () => {
    switch (activeExpenseType) {
      case 'GAS':
        return <GasExpenses />;
      case 'ELECTRICITY':
        return <ElectricityExpenses />;
      case 'WATER':
        return <WaterExpenses />;
      case 'INTERNET':
        return <InternetExpenses />;
      case 'RENT':
        return <RentExpenses />;
      case 'MAINTENANCE':
        return <MaintenanceExpenses />;
      case 'OTHER':
        return <OtherExpenses />;
      default:
        return <GasExpenses />;
    }
  };

  const handleTypeSelect = (typeId) => {
    setActiveExpenseType(typeId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className={`${styles.container} ${showSidebar && isMobile ? styles.sidebarOpen : ''}`}>
      <div 
        id="expenses-sidebar"
        className={`${styles.sidebar} ${showSidebar ? styles.sidebarShow : ''}`}
      >
        <h1 className={styles.title}>Mis Gastos</h1>
        <div className={styles.expenseTypeList}>
          {expenseTypes.map((type) => (
            <button
              key={type.id}
              className={`${styles.expenseTypeButton} ${activeExpenseType === type.id ? styles.active : ''}`}
              onClick={() => handleTypeSelect(type.id)}
            >
              {type.icon}
              <span className={styles.expenseLabel}>{type.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.mainContent}>
        {isMobile && (
          <button 
            id="mobile-menu-toggle"
            onClick={toggleSidebar} 
            className={styles.mobileMenuToggle}
            aria-label={showSidebar ? "Cerrar categorías" : "Ver categorías"}
          >
            {showSidebar ? <FaTimes /> : <FaTags />}
            <span className={styles.toggleLabel}>Categorías</span>
          </button>
        )}
        
        <div className={styles.contentArea}>
          {renderExpenseContent()}
        </div>
      </div>
    </div>
  );
}
