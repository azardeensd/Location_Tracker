// src/components/Dashboard.js
import React, { useState, useEffect, useRef } from 'react';
import api from './services/api';
import styles from './Dashboard.module.css';
import AdminNavigation from './AdminNavigation';

const Dashboard = () => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    pendingTrips: 0,
    inProgressTrips: 0,
    totalDistance: 0
  });
  const [currentUser, setCurrentUser] = useState({});
  const tableRef = useRef();

  // Date filter states
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [filterActive, setFilterActive] = useState(false);

  // Get current user with plant data
  const getCurrentUser = () => {
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const plantAdminData = JSON.parse(localStorage.getItem('plantAdminData') || '{}');
      
      if (adminData.role === 'admin') {
        return { ...adminData, role: 'admin' };
      }
      if (plantAdminData.id) {
        return { ...plantAdminData, role: 'plant_admin' };
      }
      return {};
    } catch (error) {
      console.error('Error getting current user:', error);
      return {};
    }
  };

  // Get user's plant ID
  const getUserPlantId = () => {
    const user = getCurrentUser();
    if (user.role === 'admin') {
      return null; // Admin can see all
    }
    return user.plant_id || user.plantid;
  };

  // Get user's plant name
  const getUserPlantName = () => {
    const user = getCurrentUser();
    if (user.role === 'admin') return 'All Plants';
    return user.plant_name || user.plant?.name || user.plant || 'Your Plant';
  };

  // Fetch trips data
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const userPlantId = getUserPlantId();
      console.log('🔄 Fetching trips for plant ID:', userPlantId);

      let response;
      
      if (userPlantId) {
        // Fetch trips for specific plant
        response = await api.getTripsByPlant(userPlantId);
      } else {
        // Fetch all trips for admin
        response = await api.getAllTrips();
      }

      console.log('✅ Trips response:', response);

      if (response.error) {
        setError(response.error.message || 'Failed to fetch trips');
        return;
      }

      const tripsData = response.data || [];
      console.log('📊 Raw trips data:', tripsData);
      setTrips(tripsData);
      setFilteredTrips(tripsData); // Initialize filtered trips

      // Calculate statistics
      calculateStats(tripsData);

    } catch (err) {
      console.error('❌ Error fetching trips:', err);
      setError('Error fetching trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Apply date filter
  const applyDateFilter = () => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
      setFilteredTrips(trips);
      setFilterActive(false);
      calculateStats(trips);
      return;
    }

    const filtered = trips.filter(trip => {
      const tripDate = trip.Start_Date || trip.created_at?.split('T')[0];
      if (!tripDate) return false;

      const tripDateObj = new Date(tripDate);
      
      if (dateFilter.startDate && dateFilter.endDate) {
        const startDateObj = new Date(dateFilter.startDate);
        const endDateObj = new Date(dateFilter.endDate);
        return tripDateObj >= startDateObj && tripDateObj <= endDateObj;
      } else if (dateFilter.startDate) {
        const startDateObj = new Date(dateFilter.startDate);
        return tripDateObj >= startDateObj;
      } else if (dateFilter.endDate) {
        const endDateObj = new Date(dateFilter.endDate);
        return tripDateObj <= endDateObj;
      }
      
      return true;
    });

    setFilteredTrips(filtered);
    setFilterActive(true);
    calculateStats(filtered);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter({
      startDate: '',
      endDate: ''
    });
    setFilteredTrips(trips);
    setFilterActive(false);
    calculateStats(trips);
  };

  // Calculate dashboard statistics
  const calculateStats = (tripsData) => {
    const totalTrips = tripsData.length;
    const completedTrips = tripsData.filter(trip => 
      trip.status === 'completed' || trip.status === 'Completed'
    ).length;
    const pendingTrips = tripsData.filter(trip => 
      trip.status === 'pending' || trip.status === 'Pending'
    ).length;
    const inProgressTrips = tripsData.filter(trip => 
      trip.status === 'active' || trip.status === 'in_progress' || trip.status === 'In Progress'
    ).length;
    
    const totalDistance = tripsData.reduce((sum, trip) => {
      return sum + (parseFloat(trip.distance_km) || 0);
    }, 0);

    setStats({
      totalTrips,
      completedTrips,
      pendingTrips,
      inProgressTrips,
      totalDistance: Math.round(totalDistance * 100) / 100
    });
  };

  // Format Trip ID - FIXED: Handle different ID types
  const formatTripId = (id) => {
    if (!id) return 'N/A';
    
    // Convert to string first
    const idString = String(id);
    
    // If it's a UUID, take last 8 characters
    if (idString.length > 8) {
      return `#${idString.slice(-8)}`;
    }
    
    return `#${idString}`;
  };

  // Format date from YYYY-MM-DD format
  const formatDate = (dateString) => {
    // Check for null/undefined/empty
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'N/A';
    }

    console.log('🔍 Processing date:', dateString, 'Type:', typeof dateString);

    try {
      // Handle string dates in YYYY-MM-DD format
      if (typeof dateString === 'string') {
        const cleanString = dateString.trim();
        
        // Validate YYYY-MM-DD format
        if (cleanString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = cleanString.split('-');
          const date = new Date(year, month - 1, day); // month is 0-indexed in JS
          
          // Check if date is valid
          if (isNaN(date.getTime())) {
            console.log('❌ Invalid date for:', dateString);
            return 'N/A';
          }

          // Format the date
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          console.log('✅ Formatted date:', formattedDate, 'from original:', dateString);
          return formattedDate;
        } else {
          console.log('❌ Date not in YYYY-MM-DD format:', dateString);
          return 'N/A';
        }
      }
      // Handle numbers (unlikely for YYYY-MM-DD, but just in case)
      else if (typeof dateString === 'number') {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return 'N/A';
        }
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      // Unknown type
      else {
        console.log('❌ Unknown date type:', typeof dateString, dateString);
        return 'N/A';
      }

    } catch (error) {
      console.log('❌ Error formatting date:', error, 'Input:', dateString);
      return 'N/A';
    }
  };

  // Simple function to extract and display time from Supabase timestamp
  const formatTime = (dateString) => {
    // Check for null/undefined/empty
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'N/A';
    }

    console.log('🔍 Processing time:', dateString, 'Type:', typeof dateString);

    let date;

    try {
      // Handle string dates
      if (typeof dateString === 'string') {
        // Remove any extra spaces
        const cleanString = dateString.trim();
        
        // Case 1: PostgreSQL timestamp "2024-01-15 14:30:45"
        if (cleanString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
          date = new Date(cleanString.replace(' ', 'T') + 'Z');
        }
        // Case 2: ISO format "2024-01-15T14:30:45.123Z"
        else if (cleanString.includes('T')) {
          date = new Date(cleanString);
        }
        // Case 3: Just time "14:30:45"
        else if (cleanString.match(/^\d{1,2}:\d{2}/)) {
          // Create a date with today's date but the time from string
          const today = new Date();
          const [hours, minutes, seconds] = cleanString.split(':');
          today.setHours(parseInt(hours), parseInt(minutes), seconds ? parseInt(seconds) : 0);
          date = today;
        }
        // Case 4: Try direct parsing
        else {
          date = new Date(cleanString);
        }
      }
      // Handle numbers (timestamps)
      else if (typeof dateString === 'number') {
        date = new Date(dateString);
      }
      // Handle Date objects
      else if (dateString instanceof Date) {
        date = dateString;
      }
      // Unknown type
      else {
        console.log('❌ Unknown date type:', typeof dateString, dateString);
        return 'N/A';
      }

      // Check if date is valid
      if (!date || isNaN(date.getTime())) {
        console.log('❌ Invalid date for:', dateString);
        return 'N/A';
      }

      // Format the time
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      console.log('✅ Formatted time:', formattedTime);
      return formattedTime;

    } catch (error) {
      console.log('❌ Error formatting time:', error, 'Input:', dateString);
      return 'N/A';
    }
  };

  // Get transporter name
  const getTransporterName = (trip) => {
    return trip.agencies?.name || 
           trip.agency?.name || 
           trip.transporter_name || 
           'N/A';
  };

  // Get start location
  const getStartLocation = (trip) => {
    return trip.start_address || 
           (trip.start_lat && trip.start_lng ? 
            `Lat: ${trip.start_lat}, Lng: ${trip.start_lng}` : 'N/A');
  };

  // Get end location
  const getEndLocation = (trip) => {
    if (trip.status === 'completed' || trip.status === 'Completed') {
      return trip.end_address || 
             (trip.end_lat && trip.end_lng ? 
              `Lat: ${trip.end_lat}, Lng: ${trip.end_lng}` : 'N/A');
    }
    return 'In Progress';
  };

  // Get distance
  const getDistance = (trip) => {
    return trip.distance_km ? `${trip.distance_km} km` : 'N/A';
  };

  // Get status badge class
  const getStatusClass = (status) => {
    if (!status) return styles.statusDefault;
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return styles.statusCompleted;
      case 'active':
      case 'in_progress':
      case 'in progress':
        return styles.statusInProgress;
      case 'pending':
        return styles.statusPending;
      default:
        return styles.statusDefault;
    }
  };

  // Get display status
  const getDisplayStatus = (status) => {
    if (!status) return 'Unknown';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'active':
        return 'In Progress';
      case 'in_progress':
        return 'In Progress';
      default:
        return status.replace('_', ' ');
    }
  };

  // Print functionality
  const handlePrint = () => {
    const printContent = tableRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    const filterInfo = filterActive ? 
      `Date Range: ${dateFilter.startDate || 'Any'} to ${dateFilter.endDate || 'Any'}` : 
      'All Dates';
    
    document.body.innerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trips Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .print-header h1 { margin: 0; color: #333; }
          .print-header p { margin: 5px 0; color: #666; }
          .print-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .print-table th { background-color: #f5f5f5; font-weight: bold; }
          .print-footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Trips Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Plant: ${getUserPlantName()}</p>
          <p>Filter: ${filterInfo}</p>
        </div>
        ${printContent}
        <div class="print-footer">
          <p>Total Trips: ${stats.totalTrips} | Completed: ${stats.completedTrips} | In Progress: ${stats.inProgressTrips}</p>
        </div>
      </body>
      </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Trip ID',
      'Plant',
      'Vehicle',
      'Transporter',
      'Driver',
      'Start Location',
      'End Location',
      'Start Date',
      'Start Time',
      'End Date', 
      'End Time',
      'Distance (km)',
      'Status'
    ];

    const csvData = filteredTrips.map(trip => [
      trip.id || 'N/A',
      trip.plant?.name || trip.plant_name || trip.plant || 'N/A',
      trip.vehicle?.vehicle_number || trip.vehicle_number || 'N/A',
      getTransporterName(trip),
      trip.driver_name || 'N/A',
      getStartLocation(trip),
      getEndLocation(trip),
      trip.Start_Date || 'N/A',
      formatTime(trip.start_time),
      trip.End_Date || 'N/A',
      formatTime(trip.end_time),
      trip.distance_km || '0',
      getDisplayStatus(trip.status)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const filterInfo = filterActive ? 
      `_${dateFilter.startDate || 'all'}_to_${dateFilter.endDate || 'all'}` : 
      '_all_dates';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trips-report${filterInfo}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Initialize component
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    fetchTrips();
  }, []);

  const userPlantName = getUserPlantName();
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className={styles.adminContainer}>
      <AdminNavigation />
      <div className={styles.dashboard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Trips Dashboard</h1>
            <p className={styles.subtitle}>
              {isAdmin ? '' : ``}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.refreshButton}
              onClick={fetchTrips}
              disabled={loading}
            >
              🔄 {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button 
              className={styles.printButton}
              onClick={handlePrint}
              disabled={filteredTrips.length === 0}
            >
              🖨️ Print
            </button>
            <button 
              className={styles.exportButton}
              onClick={handleExportCSV}
              disabled={filteredTrips.length === 0}
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            ⚠️ {error}
            <button onClick={() => setError('')} className={styles.dismissError}>×</button>
          </div>
        )}

        {/* Stats and Filter Row */}
        <div className={styles.statsFilterRow}>
          {/* Stats Cards - Left Side */}
          <div className={styles.statsContainer}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statNumber}>{stats.totalTrips}</h3>
                  <p className={styles.statLabel}>Total Trips</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statNumber}>{stats.completedTrips}</h3>
                  <p className={styles.statLabel}>Completed</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔄</div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statNumber}>{stats.inProgressTrips}</h3>
                  <p className={styles.statLabel}>In Progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Date Filter - Right Side */}
          <div className={styles.filterContainer}>
            <div className={styles.dateFilters}>
              <div className={styles.dateInputGroup}>
                <label>From Date:</label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.dateInputGroup}>
                <label>To Date:</label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({
                    ...prev,
                    endDate: e.target.value
                  }))}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.filterActions}>
                <button
                  className={styles.applyFilterButton}
                  onClick={applyDateFilter}
                  disabled={loading}
                >
                  🔍 Apply Filter
                </button>
                <button
                  className={styles.clearFilterButton}
                  onClick={clearDateFilter}
                  disabled={!filterActive}
                >
                  🗑️ Clear
                </button>
              </div>
            </div>
            {filterActive && (
              <div className={styles.filterInfo}>
                <p>
                  Showing trips from <strong>{dateFilter.startDate || 'Any'}</strong> to <strong>{dateFilter.endDate || 'Any'}</strong>
                  {' '}({filteredTrips.length} of {trips.length} total trips)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Trips Table */}
        <div className={styles.recentTrips}>
          <div className={styles.sectionHeader}>
            <h2>Recent Trips</h2>
            <span className={styles.tripCount}>
              Showing {filteredTrips.length} trips
              {filterActive && ` (filtered from ${trips.length} total)`}
            </span>
          </div>

          {loading ? (
            <div className={styles.loading}>Loading trips...</div>
          ) : filteredTrips.length === 0 ? (
            <div className={styles.noData}>
              <p>No trips found</p>
              {filterActive ? (
                <p className={styles.helperText}>
                  No trips match your date filter. Try adjusting the date range or{' '}
                  <button 
                    onClick={clearDateFilter}
                    className={styles.clearFilterLink}
                  >
                    clear the filter
                  </button>
                </p>
              ) : (
                isAdmin && (
                  <p className={styles.helperText}>
                    Trips will appear here once they are created
                  </p>
                )
              )}
            </div>
          ) : (
            <div className={styles.tableContainer} ref={tableRef}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Trip ID</th>
                    <th>Plant</th>
                    <th>Vehicle</th>
                    <th>Transporter</th>
                    <th>Driver</th>
                    <th>Start Location</th>
                    <th>End Location</th>
                    <th>Start Date</th>
                    <th>Start Time</th>
                    <th>End Date</th>
                    <th>End Time</th>
                    <th>Distance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td className={styles.tripId}>
                        {formatTripId(trip.id)}
                      </td>
                      { (
                        <td>
                          {trip.plant?.name || trip.plant_name || trip.plant || 'N/A'}
                        </td>
                      )}
                      
                      <td>
                        {trip.vehicle?.vehicle_number || trip.vehicle_number || 'N/A'}
                      </td>
                      <td>{getTransporterName(trip)}</td>
                      <td>{trip.driver_name || 'N/A'}</td>
                      <td className={styles.locationCell}>{getStartLocation(trip)}</td>
                      <td className={styles.locationCell}>{getEndLocation(trip)}</td>
                      <td>{formatDate(trip.Start_Date)}</td>
                      <td>{formatTime(trip.start_time)}</td>
                      <td>{formatDate(trip.End_Date)}</td>
                      <td>{formatTime(trip.end_time)}</td>
                      <td className={styles.distanceCell}>{getDistance(trip)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(trip.status)}`}>
                          {getDisplayStatus(trip.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
