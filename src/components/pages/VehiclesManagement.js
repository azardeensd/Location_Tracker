import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import supabase from '../services/api';
import styles from './VehiclesManagement.module.css';
import AdminNavigation from '../AdminNavigation';

const VehiclesManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    agency_id: '',
    vehicle_number: '',
    vehicle_type: '',
    capacity: '',
    status: 'active'
  });

  // Enhanced helper function to normalize vehicle number
const normalizeVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber) return '';
  
  return vehicleNumber
    .replace(/[^a-zA-Z0-9]/g, '') // Remove all special characters and spaces
    .toUpperCase()
    .trim();
};

  // Get current user with plant data
  const getCurrentUser = () => {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const plantAdminData = JSON.parse(localStorage.getItem('plantAdminData') || '{}');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Return user with highest privileges
    if (adminData.id) return { ...adminData, role: 'admin' };
    if (plantAdminData.id) return { ...plantAdminData, role: 'plant_admin' };
    if (userData.id) return { ...userData, role: userData.role || 'user' };
    
    return {};
  };

  // Helper functions - MOVED BEFORE SEARCH FILTER
  const getAgencyName = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency ? agency.name : 'Unknown Agency';
  };

  const getPlantInfo = (vehicle) => {
    // If vehicle has agency info with plant
    if (vehicle.agency && vehicle.agency.plant) {
      return `${vehicle.agency.plant.name} - ${vehicle.agency.plant.location}`;
    }
    // If agencies is populated and has plant info
    const agency = agencies.find(a => a.id === vehicle.agency_id);
    if (agency && agency.plant) {
      return `${agency.plant.name} - ${agency.plant.location}`;
    }
    if (agency && agency.plants) {
      return `${agency.plants.name} - ${agency.plants.location}`;
    }
    return 'N/A';
  };

  // Search functionality
  const filteredVehicles = vehicles.filter(vehicle => {
    const searchLower = searchTerm.toLowerCase();
    const normalizedVehicleNumber = normalizeVehicleNumber(vehicle.vehicle_number);
    const normalizedSearchTerm = normalizeVehicleNumber(searchTerm);
    
    return (
      vehicle.vehicle_number.toLowerCase().includes(searchLower) ||
      normalizedVehicleNumber.includes(normalizedSearchTerm) ||
      vehicle.vehicle_type.toLowerCase().includes(searchLower) ||
      getAgencyName(vehicle.agency_id).toLowerCase().includes(searchLower) ||
      vehicle.capacity.toString().includes(searchLower) ||
      vehicle.status.toLowerCase().includes(searchLower) ||
      getPlantInfo(vehicle).toLowerCase().includes(searchLower)
    );
  });

  // Duplicate vehicle validation with normalized comparison
  const isDuplicateVehicle = (formData, editingId = null) => {
    const normalizedInputNumber = normalizeVehicleNumber(formData.vehicle_number);
    
    return vehicles.some(vehicle => {
      // Skip the vehicle being edited
      if (editingId && vehicle.id === editingId) return false;
      
      // Normalize existing vehicle number and compare
      const normalizedExistingNumber = normalizeVehicleNumber(vehicle.vehicle_number);
      return normalizedExistingNumber === normalizedInputNumber;
    });
  };

  // Check if user can add vehicles
  const canAddVehicles = () => {
    const currentUser = getCurrentUser();
    return currentUser.role === 'admin' || 
           currentUser.role === 'plant_admin' || 
           currentUser.plant_id;
  };

  // Check admin status
  const checkAdminStatus = () => {
    try {
      const currentUser = getCurrentUser();
      console.log('🛠️ Current user in VehiclesManagement:', currentUser);
      
      // Check if user has admin role
      const userIsAdmin = currentUser?.role === 'admin';
      console.log('🛠️ Is user admin?:', userIsAdmin);
      
      setIsAdmin(userIsAdmin);
      
      // Store in localStorage for consistency
      if (currentUser?.role) {
        localStorage.setItem('isAdmin', userIsAdmin);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      // Fallback
      const storedAdminStatus = localStorage.getItem('isAdmin');
      if (storedAdminStatus) {
        setIsAdmin(storedAdminStatus === 'true');
      }
    }
  };

  // Get user's plant ID
  const getUserPlantId = () => {
    const user = getCurrentUser();
    console.log('👤 Current user:', user);
    
    if (user.role === 'admin') {
      return null; // Admin can see all
    }
    
    // Get plant_id from user data
    const plant_id = user.plant_id || user.plantid;
    console.log('🏭 User plant ID:', plant_id);
    return plant_id;
  };

  // Get user's plant name
  const getUserPlantName = () => {
    const user = getCurrentUser();
    if (user.role === 'admin') return null;
    
    return user.plant_name || user.plant?.name || user.plant || 'Your Plant';
  };

  // Fetch data on component mount
  useEffect(() => {
    checkAdminStatus();
    fetchAgencies();
    fetchVehicles();
  }, []);

  // Fetch agencies based on user's plant
  const fetchAgencies = async () => {
    try {
      const userPlantId = getUserPlantId();
      console.log('🔄 Fetching agencies for plant ID:', userPlantId);
      
      let agenciesData;
      
      if (userPlantId) {
        // Fetch only agencies for the user's specific plant
        const response = await api.getAgenciesByPlant(userPlantId);
        console.log('📦 Agencies by plant response:', response);
        
        if (response.error) {
          setError('Failed to fetch agencies: ' + response.error.message);
          return;
        }
        agenciesData = response.data || [];
      } else {
        // Fetch all agencies for admin users
        const response = await api.getAgencies();
        console.log('📦 All agencies response:', response);
        
        if (response.error) {
          setError('Failed to fetch agencies: ' + response.error.message);
          return;
        }
        agenciesData = response.data || [];
      }
      
      console.log('✅ Setting agencies:', agenciesData);
      setAgencies(agenciesData);
    } catch (err) {
      console.error('❌ Error fetching agencies:', err);
      setError('Error fetching agencies: ' + err.message);
    }
  };

  // Fetch vehicles based on user's plant
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const userPlantId = getUserPlantId();
      console.log('🔄 Fetching vehicles for plant ID:', userPlantId);
      
      let vehiclesData;
      
      if (userPlantId) {
        // Use the alternative method that fetches agencies first, then vehicles
        const response = await api.getVehiclesByPlantAlternative(userPlantId);
        console.log('🚚 Vehicles by plant response:', response);
        
        if (response.error) {
          setError('Failed to fetch vehicles: ' + response.error.message);
          return;
        }
        vehiclesData = response.data || [];
      } else {
        // Fetch all vehicles for admin users
        const response = await api.getVehicles();
        console.log('🚚 All vehicles response:', response);
        
        if (response.error) {
          setError('Failed to fetch vehicles: ' + response.error.message);
          return;
        }
        vehiclesData = response.data || [];
      }
      
      console.log('✅ Setting vehicles:', vehiclesData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('❌ Error fetching vehicles:', err);
      setError('Error fetching vehicles: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-format vehicle number as user types (remove extra spaces)
    if (name === 'vehicle_number') {
      // Remove multiple spaces and trim
      const formattedValue = value.replace(/\s+/g, ' ').trim();
      setFormData({
        ...formData,
        [name]: formattedValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    setError('');
  };

  // Handle edit vehicle
  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      agency_id: vehicle.agency_id.toString(),
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      capacity: vehicle.capacity,
      status: vehicle.status
    });
    setShowForm(true);
  };

  // Handle update vehicle
  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    
    if (!formData.agency_id || !formData.vehicle_number.trim() || 
        !formData.vehicle_type.trim() || !formData.capacity) {
      setError('Please fill all required fields');
      return;
    }

    // Check for duplicates (excluding current vehicle being edited)
    if (isDuplicateVehicle(formData, editingVehicle?.id)) {
      const normalizedNumber = normalizeVehicleNumber(formData.vehicle_number);
      setError(`A vehicle with number "${normalizedNumber}" already exists in the system (spaces are ignored in comparison)`);
      return;
    }

    // Convert agency_id to number to fix type mismatch
    const processedData = {
      ...formData,
      agency_id: Number(formData.agency_id)
    };

    console.log('🎯 UPDATE FORM DATA:', processedData);

    // Additional validation for plant users
    const userPlantId = getUserPlantId();
    if (userPlantId) {
      // Verify that the selected agency belongs to the user's plant
      const selectedAgency = agencies.find(agency => agency.id === processedData.agency_id);
      console.log('🔍 Selected agency:', selectedAgency);
      
      if (!selectedAgency) {
        setError('Selected agency not found');
        return;
      }
      
      // Check if agency belongs to user's plant
      const agencyPlantId = selectedAgency.plant_id;
      console.log('🏭 Agency plant ID:', agencyPlantId, 'User plant ID:', userPlantId);
      
      if (agencyPlantId !== userPlantId) {
        setError('You can only update vehicles for agencies in your plant');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      console.log('📤 Updating vehicle with data:', processedData);
      const response = await api.updateVehicle(editingVehicle.id, processedData);
      console.log('✅ Update vehicle response:', response);
      
      if (response.error) {
        setError(response.error.message || 'Failed to update vehicle');
        return;
      }

      setSuccess('Vehicle updated successfully!');
      resetForm();
      fetchVehicles(); // Refresh the list
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Error updating vehicle:', err);
      setError('Error updating vehicle: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      console.log('🗑️ Deleting vehicle:', vehicleId);
      const response = await api.deleteVehicle(vehicleId);
      console.log('✅ Delete vehicle response:', response);
      
      if (response.error) {
        setError(response.error.message || 'Failed to delete vehicle');
        return;
      }

      setSuccess('Vehicle deleted successfully!');
      fetchVehicles(); // Refresh the list
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Error deleting vehicle:', err);
      setError('Error deleting vehicle: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle vehicle status (active/inactive) - FIXED VERSION
  const toggleVehicleStatus = async (vehicleId, currentStatus) => {
  if (loading) return;
  
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const confirmMessage = newStatus === 'inactive' 
    ? 'Are you sure you want to deactivate this vehicle? It will not be available for new trips but existing trips will remain.'
    : 'Are you sure you want to activate this vehicle? It will be available for new trips.';
  
  if (!window.confirm(confirmMessage)) {
    return;
  }

  setLoading(true);
  try {
    console.log(`🔄 Updating vehicle ${vehicleId} status to: ${newStatus}`);
    
    // First check if vehicle has active trips when trying to deactivate
    if (newStatus === 'inactive') {
      const hasActiveTrips = await checkVehicleHasActiveTrips(vehicleId);
      if (hasActiveTrips) {
        const proceed = window.confirm(
          'This vehicle has active trips. Deactivating will prevent it from being assigned to new trips. Do you want to continue?'
        );
        if (!proceed) {
          setLoading(false);
          return;
        }
      }
    }
    
    // Use the correct Supabase method - IMPORTANT CHANGE HERE
    const response = await api.updateVehicle(vehicleId, { 
      status: newStatus,
      updated_at: new Date().toISOString()
    });
    
    if (response.error) {
      // Handle foreign key constraint error specifically
      if (response.error.code === '23503') {
        setError('Cannot deactivate vehicle with active trips. Please complete or reassign trips first.');
        return;
      }
      throw new Error(response.error.message || 'Failed to update vehicle status');
    }
    
    console.log('✅ Vehicle status updated:', response);
    
    // Update local state
    setVehicles(prevVehicles => 
      prevVehicles.map(vehicle => 
        vehicle.id === vehicleId 
          ? { ...vehicle, status: newStatus }
          : vehicle
      )
    );
    
    setSuccess(`Vehicle ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    setTimeout(() => setSuccess(''), 3000);
    
  } catch (err) {
    console.error('❌ Error updating vehicle status:', err);
    setError('Error updating vehicle status: ' + err.message);
  } finally {
    setLoading(false);
  }
};

// Helper function to check if vehicle has active trips
const checkVehicleHasActiveTrips = async (vehicleId) => {
  try {
    // Check for active trips (status not 'completed' or 'cancelled')
    const response = await api.getTripsByVehicle(vehicleId);
    if (response.error) {
      console.error('Error checking vehicle trips:', response.error);
      return false;
    }
    
    // Filter for active trips
    const activeTrips = response.data?.filter(trip => 
      !['completed', 'cancelled'].includes(trip.status?.toLowerCase())
    ) || [];
    
    return activeTrips.length > 0;
  } catch (err) {
    console.error('Error checking vehicle trips:', err);
    return false;
  }
};

    const handleSubmit = async (e) => {
      if (editingVehicle) {
        await handleUpdateVehicle(e);
      } else {
        await handleCreateVehicle(e);
      }
    };

    const handleCreateVehicle = async (e) => {
      e.preventDefault();
      
      if (!formData.agency_id || !formData.vehicle_number.trim() || 
          !formData.vehicle_type.trim() || !formData.capacity) {
        setError('Please fill all required fields');
        return;
      }

    // Check for duplicates
    if (isDuplicateVehicle(formData)) {
      const normalizedNumber = normalizeVehicleNumber(formData.vehicle_number);
      setError(`A vehicle with number "${normalizedNumber}" already exists in the system (spaces are ignored in comparison)`);
      return;
    }

    // Convert agency_id to number to fix type mismatch
    const processedData = {
      ...formData,
      agency_id: Number(formData.agency_id)
    };

    console.log('🎯 SUBMIT FORM DATA:', processedData);

    // Additional validation for plant users
    const userPlantId = getUserPlantId();
    if (userPlantId) {
      // Verify that the selected agency belongs to the user's plant
      const selectedAgency = agencies.find(agency => agency.id === processedData.agency_id);
      console.log('🔍 Selected agency:', selectedAgency);
      
      if (!selectedAgency) {
        setError('Selected agency not found');
        return;
      }
      
      // Check if agency belongs to user's plant
      const agencyPlantId = selectedAgency.plant_id;
      console.log('🏭 Agency plant ID:', agencyPlantId, 'User plant ID:', userPlantId);
      
      if (agencyPlantId !== userPlantId) {
        setError('You can only add vehicles for agencies in your plant');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      console.log('📤 Creating vehicle with data:', processedData);
      const response = await api.createVehicle(processedData);
      console.log('✅ Add vehicle response:', response);
      
      if (response.error) {
        setError(response.error.message || 'Failed to Add vehicle');
        return;
      }

      setSuccess('Vehicle added successfully!');
      resetForm();
      fetchVehicles(); // Refresh the list
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Error creating vehicle:', err);
      setError('Error creating vehicle: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      agency_id: '', 
      vehicle_number: '', 
      vehicle_type: '', 
      capacity: '', 
      status: 'active' 
    });
    setError('');
    setShowForm(false);
    setEditingVehicle(null);
  };

  // Filter active vehicles count
  const activeVehiclesCount = vehicles.filter(v => v.status === 'active').length;
  const inactiveVehiclesCount = vehicles.filter(v => v.status === 'inactive').length;

  const currentUser = getCurrentUser();
  const userPlantId = getUserPlantId();
  const userPlantName = getUserPlantName();
  const userCanAddVehicles = canAddVehicles();

  console.log('🎯 Current State:', {
    user: currentUser,
    userPlantId,
    userPlantName,
    agenciesCount: agencies.length,
    vehiclesCount: vehicles.length,
    activeVehiclesCount,
    inactiveVehiclesCount,
    userCanAddVehicles,
    isAdmin
  });

  return (
    <div className={styles.adminContainer}>
      <AdminNavigation />
      <div className={styles.vehiclesManagement}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Vehicles Management</h1>
            <div className={styles.stats}>
            
            </div>
          </div>
          <div className={styles.headerActions}>
            {/* Search Bar */}
            <div className={styles.searchBox}>
  <input
    className={styles.searchInput}
    type="text"
    placeholder="Search by Vehicle Number"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <button className={styles.searchButton}>
    <i className="material-icons">
      search
    </i>
  </button>
</div>
            
            {userCanAddVehicles && (
              <button 
                className={styles.addButton}
                onClick={() => setShowForm(true)}
                disabled={agencies.length === 0}
              >
                + Add Vehicle
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            ✅ {success}
          </div>
        )}

        {userPlantId && agencies.length === 0 && (
          <div className={styles.warningMessage}>
            ℹ️ No transporters found for your plant. Please contact administrator to add transporters to your plant.
          </div>
        )}

        {!userCanAddVehicles && (
          <div className={styles.infoMessage}>
            ℹ️ You have view-only access to vehicles. Contact administrator for modification rights.
          </div>
        )}

        {/* Search Results Info */}
        {searchTerm && (
          <div className={styles.searchInfo}>
            <p className={styles.searchResults}>
              Showing {filteredVehicles.length} of {vehicles.length} vehicles matching your search
            </p>
          </div>
        )}

        {/* Add/Edit Vehicle Form */}
        {showForm && userCanAddVehicles && (
          <div className={styles.formOverlay}>
            <div className={styles.formCard}>
              <h2>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="agency_id" className={styles.label}>
                    Transporter *
                  </label>
                  <select
                    id="agency_id"
                    name="agency_id"
                    value={formData.agency_id}
                    onChange={handleChange}
                    className={styles.select}
                    required
                    disabled={loading || agencies.length === 0}
                  >
                    <option value="">Select Transporter</option>
                    {agencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                        {agency.plants && ` - ${agency.plants.name}`}
                      </option>
                    ))}
                  </select>
                  {agencies.length === 0 && (
                    <div className={styles.helpText}>
                      No transporters available for your plant
                    </div>
                  )}
                  {userPlantId && agencies.length > 0 && (
                    <div className={styles.helpText}>
                  
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="vehicle_number" className={styles.label}>
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    id="vehicle_number"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter vehicle number"
                    required
                    disabled={loading || editingVehicle}
                  />
                  {editingVehicle && (
    <div className={styles.helpText}>
      Vehicle number cannot be edited once created
    </div>
  )}
                  
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="vehicle_type" className={styles.label}>
                    Vehicle Type *
                  </label>
                  <input
                    type="text"
                    id="vehicle_type"
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="e.g., Truck, Lorry, Container"
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
  <label htmlFor="capacity" className={styles.label}>
    Capacity (tons) *
  </label>
  <select
    id="capacity"
    name="capacity"
    value={formData.capacity}
    onChange={handleChange}
    className={styles.input}
    required
    disabled={loading}
  >
    <option value="">Select Capacity</option>
    {/* From 0.5 to 5.5 with 0.5 increments */}
    {[...Array(11)].map((_, i) => {
      const value = 0.5 + i * 0.5;
      return (
        <option key={value} value={value}>
          {value} Ton
        </option>
      );
    })}
    {/* From 6 to 30 with 1 increments */}
    {[...Array(25)].map((_, i) => {
      const value = 6 + i;
      return (
        <option key={value} value={value}>
          {value} Ton
        </option>
      );
    })}
  </select>
</div>

                <div className={styles.formGroup}>
                  <label htmlFor="status" className={styles.label}>
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={styles.select}
                    required
                    disabled={loading}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className={styles.helpText}>
                    Inactive vehicles won't be available for new trips
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={loading || agencies.length === 0}
                  >
                    {loading ? (editingVehicle ? 'Updating...' : 'Creating...') : (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')}
                  </button>
                  
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vehicles List */}
        <div className={styles.vehiclesList}>
          {loading ? (
            <div className={styles.loading}>Loading vehicles...</div>
          ) : filteredVehicles.length === 0 ? (
            <div className={styles.noData}>
              {searchTerm 
                ? 'No vehicles found matching your search'
                : userPlantId 
                  ? `No vehicles found for ${userPlantName}`
                  : 'No vehicles found'
              }
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vehicle Number</th>
                    <th>Transporter</th>
                    {currentUser.role === 'admin' && <th>Plant</th>}
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className={vehicle.status === 'inactive' ? styles.inactiveRow : ''}>
                      <td>{vehicle.vehicle_number}</td>
                      <td>{getAgencyName(vehicle.agency_id)}</td>
                      {currentUser.role === 'admin' && (
                        <td>{getPlantInfo(vehicle)}</td>
                      )}
                      <td>{vehicle.vehicle_type}</td>
                      <td>{vehicle.capacity} tons</td>
                      <td>
                        <span className={`${styles.status} ${vehicle.status === 'active' ? styles.active : styles.inactive}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td>{new Date(vehicle.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          {/* Edit Button - Only for admin users */}
                          {isAdmin && (
                            <button
                              className={styles.editButton}
                              onClick={() => handleEditVehicle(vehicle)}
                              disabled={loading}
                              title="Edit vehicle"
                            >
                              Edit
                            </button>
                          )}
                          
                          {/* Status Toggle Button */}
                          <button
                            className={`${styles.statusButton} ${
                              vehicle.status === 'active' ? styles.deactivateButton : styles.activateButton
                            }`}
                            onClick={() => toggleVehicleStatus(vehicle.id, vehicle.status)}
                            disabled={loading}
                            title={vehicle.status === 'active' ? 'Deactivate vehicle' : 'Activate vehicle'}
                          >
                            {vehicle.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          {/* Delete Button - Only for admin users */}
                          {isAdmin && (
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                              disabled={loading}
                              title="Delete vehicle"
                            >
                              Delete
                            </button>
                          )}
                        </div>
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

export default VehiclesManagement;
