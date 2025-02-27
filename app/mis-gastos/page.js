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
  FaTags,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
  FaChartLine,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaBalanceScale,
  FaRegCalendarAlt,
  FaTrophy,
  FaProjectDiagram
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
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';

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

// ExpenseStats component for displaying key metrics
const ExpenseStats = ({ expenses, title, chartColor }) => {
  // Import useSession hook
  const { data: session } = useSession();
  const isFreeTier = !session?.user?.accountTier || session.user.accountTier === 'FREE';
 
  
  // Return null if no expenses
  if (!expenses || expenses.length === 0) {
    return null;
  }
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP' 
    }).format(amount);
  };

  // Helper to safely parse a date without timezone issues
  const parseDate = (dateString) => {
    // Extract date parts and create a date object using local timezone
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    // Month in JS Date is 0-indexed, so subtract 1 from month
    return new Date(year, month - 1, day);
  };
  
  // Helper to get expenses from current month
  const getCurrentMonthExpenses = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = parseDate(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
  };
  
  // Helper to get expenses from previous month
  const getPreviousMonthExpenses = () => {
    const today = new Date();
    let prevMonth = today.getMonth() - 1;
    let prevYear = today.getFullYear();
    
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    
    return expenses.filter(expense => {
      const expenseDate = parseDate(expense.date);
      return expenseDate.getMonth() === prevMonth && 
             expenseDate.getFullYear() === prevYear;
    });
  };

  // Helper to get year-to-date expenses
  const getYearToDateExpenses = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = parseDate(expense.date);
      return expenseDate.getFullYear() === currentYear;
    });
  };

  // Helper to get previous year's expenses for the same period
  const getPreviousYearSamePeriodExpenses = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    const previousYear = today.getFullYear() - 1;
    
    return expenses.filter(expense => {
      const expenseDate = parseDate(expense.date);
      return expenseDate.getFullYear() === previousYear && 
             (expenseDate.getMonth() < currentMonth || 
              (expenseDate.getMonth() === currentMonth && 
               expenseDate.getDate() <= currentDay));
    });
  };

  // Helper to get expenses grouped by month
  const getExpensesByMonth = () => {
    const expensesByMonth = {};
    
    expenses.forEach(expense => {
      const expenseDate = parseDate(expense.date);
      const monthKey = `${expenseDate.getFullYear()}-${expenseDate.getMonth() + 1}`;
      
      if (!expensesByMonth[monthKey]) {
        expensesByMonth[monthKey] = [];
      }
      
      expensesByMonth[monthKey].push(expense);
    });
    
    return expensesByMonth;
  };
  
  // Calculate highest expense ever
  const highestExpense = Math.max(...expenses.map(expense => expense.amount));
  const highestExpenseItem = expenses.find(expense => expense.amount === highestExpense);
  
  // Calculate total spent this month
  const currentMonthExpenses = getCurrentMonthExpenses();
  const totalCurrentMonth = currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
  
  // Calculate monthly comparison
  const previousMonthExpenses = getPreviousMonthExpenses();
  const totalPreviousMonth = previousMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
  
  let monthlyVariation = 0;
  let monthlyVariationPercent = 0;
  
  if (totalPreviousMonth > 0) {
    monthlyVariation = totalCurrentMonth - totalPreviousMonth;
    monthlyVariationPercent = (monthlyVariation / totalPreviousMonth) * 100;
  }
  
  // Calculate average expense amount
  const averageExpense = expenses.length > 0 
    ? expenses.reduce((total, expense) => total + expense.amount, 0) / expenses.length
    : 0;

  // Calculate year-to-date total
  const yearToDateExpenses = getYearToDateExpenses();
  const totalYearToDate = yearToDateExpenses.reduce((total, expense) => total + expense.amount, 0);
  
  // Calculate previous year same period total for comparison
  const previousYearSamePeriodExpenses = getPreviousYearSamePeriodExpenses();
  const totalPreviousYearSamePeriod = previousYearSamePeriodExpenses.reduce((total, expense) => total + expense.amount, 0);
  
  let yearOverYearVariation = 0;
  let yearOverYearVariationPercent = 0;
  
  if (totalPreviousYearSamePeriod > 0) {
    yearOverYearVariation = totalYearToDate - totalPreviousYearSamePeriod;
    yearOverYearVariationPercent = (yearOverYearVariation / totalPreviousYearSamePeriod) * 100;
  }
  
  // Calculate month with highest expenses
  const expensesByMonth = getExpensesByMonth();
  let monthWithHighestExpenses = null;
  let highestMonthlyTotal = 0;
  
  Object.entries(expensesByMonth).forEach(([monthKey, monthExpenses]) => {
    const monthlyTotal = monthExpenses.reduce((total, expense) => total + expense.amount, 0);
    
    if (monthlyTotal > highestMonthlyTotal) {
      highestMonthlyTotal = monthlyTotal;
      monthWithHighestExpenses = monthKey;
    }
  });

  // Format the month with highest expenses for display
  let formattedHighestMonth = 'No data';
  if (monthWithHighestExpenses) {
    const [year, month] = monthWithHighestExpenses.split('-').map(Number);
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    formattedHighestMonth = `${monthNames[month - 1]} ${year}`;
  }

  // Calculate projected monthly expense
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const projectedMonthlyExpense = dayOfMonth > 0 ? (totalCurrentMonth / dayOfMonth) * daysInMonth : 0;

  // Format date in local format for display
  const formatLocalDate = (dateString) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-CL');
  };
  
  return (
    <div className={styles.statsCardsContainer}>
      <div className={styles.statCard}>
        <div className={styles.statCardTitle}>
          <FaMoneyBillWave style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
          Gasto más alto
        </div>
        <div className={styles.statCardValue}>{formatCurrency(highestExpense)}</div>
        <div className={styles.statCardTrend + ' ' + styles.statCardTrendNeutral}>
          {highestExpenseItem ? formatLocalDate(highestExpenseItem.date) : 'N/A'}
        </div>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statCardTitle}>
          <FaCalendarAlt style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
          Total este mes
        </div>
        <div className={styles.statCardValue}>{formatCurrency(totalCurrentMonth)}</div>
        <div className={
          styles.statCardTrend + ' ' + 
          (monthlyVariation > 0 
            ? styles.statCardTrendUp 
            : monthlyVariation < 0 
              ? styles.statCardTrendDown 
              : styles.statCardTrendNeutral)
        }>
          {monthlyVariation > 0 ? (
            <><FaArrowUp style={{ marginRight: '5px' }} /> {monthlyVariationPercent.toFixed(1)}% de aumento</>
          ) : monthlyVariation < 0 ? (
            <><FaArrowDown style={{ marginRight: '5px' }} /> {Math.abs(monthlyVariationPercent).toFixed(1)}% de reducción</>
          ) : (
            <><FaEquals style={{ marginRight: '5px' }} /> Sin cambios</>
          )}
        </div>
      </div>
      
      {isFreeTier ? (
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <FaBalanceScale style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
            Promedio por gasto
          </div>
          <div className={styles.statCardValue} style={{ fontSize: '0.9rem', color: '#666' }}>
            Disponible para cuentas Premium
          </div>
          <div className={styles.statCardTrend + ' ' + styles.statCardTrendNeutral}>
            <Link href="/mi-cuenta/preferencias" style={{ color: '#4a6cf7', textDecoration: 'underline' }}>
              Actualiza tu plan
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <FaBalanceScale style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
            Promedio por gasto
          </div>
          <div className={styles.statCardValue}>{formatCurrency(averageExpense)}</div>
          <div className={styles.statCardTrend + ' ' + styles.statCardTrendNeutral}>
            Basado en {expenses.length} registros
          </div>
        </div>
      )}
      
      {isFreeTier ? (
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <FaChartLine style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
            Comparación mensual
          </div>
          <div className={styles.statCardValue} style={{ fontSize: '0.9rem', color: '#666' }}>
            Disponible para cuentas Premium
          </div>
          <div className={styles.statCardTrend + ' ' + styles.statCardTrendNeutral}>
            <Link href="/mi-cuenta/preferencias" style={{ color: '#4a6cf7', textDecoration: 'underline' }}>
              Actualiza tu plan
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <FaChartLine style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
            Comparación mensual
          </div>
          <div className={styles.statCardValue}>
            {totalPreviousMonth > 0 
              ? `${formatCurrency(totalCurrentMonth)} vs ${formatCurrency(totalPreviousMonth)}` 
              : 'No hay datos del mes anterior'}
          </div>
          <div className={
            styles.statCardTrend + ' ' + 
            (monthlyVariation > 0 
              ? styles.statCardTrendUp 
              : monthlyVariation < 0 
                ? styles.statCardTrendDown 
                : styles.statCardTrendNeutral)
          }>
            {monthlyVariation !== 0 
              ? `${Math.abs(monthlyVariation).toLocaleString('es-CL')} ${monthlyVariation > 0 ? 'más' : 'menos'} que el mes anterior` 
              : 'Mismo gasto que el mes anterior'}
          </div>
        </div>
      )}

      {/* New metrics */}
      {isFreeTier ? (
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <FaRegCalendarAlt style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
            Total año actual
          </div>
          <div className={styles.statCardValue} style={{ fontSize: '0.9rem', color: '#666' }}>
            Disponible para cuentas Premium
          </div>
          <div className={styles.statCardTrend + ' ' + styles.statCardTrendNeutral}>
            <Link href="/mi-cuenta/preferencias" style={{ color: '#4a6cf7', textDecoration: 'underline' }}>
              Actualiza tu plan
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <FaRegCalendarAlt style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
            Total año actual
          </div>
          <div className={styles.statCardValue}>{formatCurrency(totalYearToDate)}</div>
          <div className={
            styles.statCardTrend + ' ' + 
            (yearOverYearVariation > 0 
              ? styles.statCardTrendUp 
              : yearOverYearVariation < 0 
                ? styles.statCardTrendDown 
                : styles.statCardTrendNeutral)
          }>
            {totalPreviousYearSamePeriod > 0 
              ? (yearOverYearVariation > 0 
                  ? <><FaArrowUp style={{ marginRight: '5px' }} /> {yearOverYearVariationPercent.toFixed(1)}% vs año anterior</>
                  : yearOverYearVariation < 0 
                    ? <><FaArrowDown style={{ marginRight: '5px' }} /> {Math.abs(yearOverYearVariationPercent).toFixed(1)}% vs año anterior</>
                  : <><FaEquals style={{ marginRight: '5px' }} /> Igual que el año anterior</>)
              : 'No hay datos del año anterior'}
          </div>
        </div>
      )}

      {isFreeTier ? (
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <FaTrophy style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
            Mes con mayor gasto
          </div>
          <div className={styles.statCardValue} style={{ fontSize: '0.9rem', color: '#666' }}>
            Disponible para cuentas Premium
          </div>
          <div className={styles.statCardTrend + ' ' + styles.statCardTrendNeutral}>
            <Link href="/mi-cuenta/preferencias" style={{ color: '#4a6cf7', textDecoration: 'underline' }}>
              Actualiza tu plan
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <FaTrophy style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
            Mes con mayor gasto
          </div>
          <div className={styles.statCardValue}>{formatCurrency(highestMonthlyTotal)}</div>
          <div className={styles.statCardTrend + ' ' + styles.statCardTrendNeutral}>
            {formattedHighestMonth}
          </div>
        </div>
      )}

      {isFreeTier ? (
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <FaProjectDiagram style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
            Proyección mensual
          </div>
          <div className={styles.statCardValue} style={{ fontSize: '0.9rem', color: '#666' }}>
            Disponible para cuentas Premium
          </div>
          <div className={styles.statCardTrend + ' ' + styles.statCardTrendNeutral}>
            <Link href="/mi-cuenta/preferencias" style={{ color: '#4a6cf7', textDecoration: 'underline' }}>
              Actualiza tu plan
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <FaProjectDiagram style={{ marginRight: '5px', color: `rgba(${chartColor}, 0.8)` }} />
            Proyección mensual
          </div>
          <div className={styles.statCardValue}>{formatCurrency(projectedMonthlyExpense)}</div>
          <div className={
            styles.statCardTrend + ' ' + 
            (projectedMonthlyExpense > totalPreviousMonth && totalPreviousMonth > 0
              ? styles.statCardTrendUp 
              : projectedMonthlyExpense < totalPreviousMonth && totalPreviousMonth > 0
                ? styles.statCardTrendDown 
                : styles.statCardTrendNeutral)
          }>
            Basado en gastos hasta día {dayOfMonth}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable expense component
const ExpenseComponent = ({ type, title, icon, chartColor }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { data: session } = useSession();
  const isFreeTier = !session?.user?.accountTier || session.user.accountTier === 'FREE';
  const expenseLimit = isFreeTier ? 12 : Infinity;
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0] // Keep ISO format for input[type="date"]
  });
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

  // Format date in DD/MM/YYYY format
  const formatDateDDMMYYYY = (dateString) => {
    // Handle date string with timezone correction to prevent date shifts
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  };

  // Format a date string to YYYY-MM-DD format for input[type="date"]
  const formatDateForInput = (dateString) => {
    // Extract only the date part (YYYY-MM-DD) without timezone conversion
    return dateString.split('T')[0];
  };

  // Start editing an expense
  const startEditing = (expense) => {
    // Format date for the date input without timezone conversion
    setEditingExpense({
      ...expense,
      date: formatDateForInput(expense.date)
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

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Check if the user has reached the expense limit for this type
      if (expenses.length >= expenseLimit) {
        setError(`Has alcanzado el límite de ${expenseLimit} gastos de ${title.toLowerCase()} en tu plan actual. Actualiza a un plan Premium o Elite para registrar gastos ilimitados.`);
        return;
      }

      setSubmitting(true);
      
      const expenseData = {
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        date: newExpense.date,
        type: type
      };
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al guardar el gasto');
      }
      
      await fetchExpenses();
      setShowForm(false);
      setNewExpense({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err.message);
      console.error('Error al guardar el gasto:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: [...expenses]
      .sort((a, b) => new Date(a.date.split('T')[0]) - new Date(b.date.split('T')[0])) // Sort chronologically, avoid timezone issues
      .map(exp => formatDateDDMMYYYY(exp.date)),
    datasets: [
      {
        label: `Gastos de ${title}`,
        data: [...expenses]
          .sort((a, b) => new Date(a.date.split('T')[0]) - new Date(b.date.split('T')[0])) // Sort to match labels
          .map(exp => exp.amount),
        fill: false,
        backgroundColor: `rgba(${chartColor}, 0.2)`,
        borderColor: `rgba(${chartColor}, 1)`,
        tension: 0.1
      }
    ]
  };

  // Add this section after your stats section but before your form
  const renderLimitWarning = () => {
    if (!isFreeTier) return null;
    
    const expensesCount = expenses.length;
    const limitReached = expensesCount >= expenseLimit;
    
    return (
      <div className={styles.limitContainer}>
        <div className={styles.counterContainer}>
          <span className={styles.counterLabel}>Gastos registrados:</span>
          <span className={limitReached ? styles.counterLimitReached : styles.counterValue}>
            {expensesCount} / {expenseLimit}
          </span>
        </div>
        {limitReached && (
          <div className={styles.upgradePrompt}>
            <FaExclamationTriangle style={{ color: 'orange', marginRight: '5px' }} />
            Has alcanzado el límite en tu plan gratuito
            <Link href="/planes" className={styles.upgradeButton}>
              Actualizar Plan
            </Link>
          </div>
        )}
      </div>
    );
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
    <div className={styles.expenseContainer}>
      <div className={styles.expenseHeader}>
        <div className={styles.expenseTitle}>
          {icon}
          <h2>{title}</h2>
        </div>
      </div>
      
      {loading && <p className={styles.loadingMessage}>Cargando...</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}
      
      {!loading && !error && (
        <>
          {expenses.length > 0 ? (
            <>
              <ExpenseStats expenses={expenses} title={title} chartColor={chartColor} />
              
              {/* Chart section */}
              <div className={styles.chartContainer}>
                <Line data={chartData} options={chartOptions} />
              </div>
              
              {/* Add the limit counter and warning */}
              {renderLimitWarning()}
            </>
          ) : (
            <div className={styles.noExpensesContainer}>
              <p className={styles.noExpensesMessage}>No hay gastos de {title.toLowerCase()} registrados.</p>
              <button 
                className={`${styles.addButton} ${styles.primaryAddButton}`}
                onClick={() => setShowForm(true)}
                disabled={expenses.length >= expenseLimit && isFreeTier}
              >
                <FaPlus />
                <span>Agregar Primer Gasto</span>
              </button>
            </div>
          )}

          {/* Add Expense Form */}
          {showForm && (
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
              
          {/* Expenses List */}
          <div className={styles.expensesList}>
            <div className={styles.expensesListHeader}>
              <h3>Gastos Recientes de {title}</h3>
              {expenses.length > 0 && (
                <button 
                  className={`${styles.addButton} ${styles.secondaryAddButton}`}
                  onClick={() => setShowForm(true)}
                  disabled={expenses.length >= expenseLimit && isFreeTier}
                >
                  <FaPlus />
                  <span>Agregar Gasto</span>
                </button>
              )}
            </div>
            
            {expenses.length > 0 ? (
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
        </>
      )}
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

function MisGastosContent() {
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

export default function MisGastos() {
  return (
    <RoleGuard 
      allowedRoles={['PROPIETARIO', 'ARRENDATARIO', 'AMBOS']} 
      fallback={
        <div className={styles.unauthorized}>
          <h1>Acceso no autorizado</h1>
          <p>Debes iniciar sesión para ver esta página.</p>
          <Link href="/login" className={styles.backLink}>
            Iniciar sesión
          </Link>
        </div>
      }
    >
      <MisGastosContent />
    </RoleGuard>
  );
}
