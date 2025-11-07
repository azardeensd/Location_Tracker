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
  const [formData, setFormData] = useState({
    agency_id: '',
    vehicle_number: '',
    vehicle_type: '',
    capacity: '',
    status: 'active'
  });

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

  // Check if user can add vehicles
  const canAddVehicles = () => {
    const currentUser = getCurrentUser();
    return currentUser.role === 'admin' || 
           currentUser.role === 'plant_admin' || 
           currentUser.plant_id;
  };

  // Fetch data on component mount
  useEffect(() => {
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
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  // Toggle vehicle status (active/inactive)
  const toggleVehicleStatus = async (vehicleId, currentStatus) => {
    if (loading) return;
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const confirmMessage = newStatus === 'inactive' 
      ? 'Are you sure you want to deactivate this vehicle? It will not be available for new trips.'
      : 'Are you sure you want to activate this vehicle? It will be available for new trips.';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      console.log(`🔄 Updating vehicle ${vehicleId} status to: ${newStatus}`);
      
      const { data, error } = await supabase
        .from('vehicles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Vehicle status updated:', data);
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agency_id || !formData.vehicle_number.trim() || 
        !formData.vehicle_type.trim() || !formData.capacity) {
      setError('Please fill all required fields');
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
      console.log('✅ Create vehicle response:', response);
      
      if (response.error) {
        setError(response.error.message || 'Failed to create vehicle');
        return;
      }

      setSuccess('Vehicle created successfully!');
      setFormData({ 
        agency_id: '', 
        vehicle_number: '', 
        vehicle_type: '', 
        capacity: '', 
        status: 'active' 
      });
      setShowForm(false);
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
  };

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
    userCanAddVehicles
  });

  return (
    <div className={styles.adminContainer}>
      <AdminNavigation />
      <div className={styles.vehiclesManagement}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Vehicles Management</h1>
            <div className={styles.stats}>
              <span className={styles.statItem}>
                Total: <strong>{vehicles.length}</strong>
              </span>
              <span className={styles.statItem}>
                Active: <strong className={styles.activeStat}>{activeVehiclesCount}</strong>
              </span>
              <span className={styles.statItem}>
                Inactive: <strong className={styles.inactiveStat}>{inactiveVehiclesCount}</strong>
              </span>
            </div>
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

        {/* Add Vehicle Form */}
        {showForm && userCanAddVehicles && (
          <div className={styles.formOverlay}>
            <div className={styles.formCard}>
              <h2>Add New Vehicle</h2>
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
                      Only transporters from your plant are shown
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
                    disabled={loading}
                  />
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
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter capacity in tons"
                    required
                    disabled={loading}
                    min="1"
                  />
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
                    {loading ? 'Creating...' : 'Create Vehicle'}
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
          ) : vehicles.length === 0 ? (
            <div className={styles.noData}>
              {userPlantId 
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
                  {vehicles.map((vehicle) => (
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
                        <button
                          className={`${styles.statusButton} ${
                            vehicle.status === 'active' ? styles.deactivateButton : styles.activateButton
                          }`}
                          onClick={() => toggleVehicleStatus(vehicle.id, vehicle.status)}
                          disabled={loading}
                          title={vehicle.status === 'active' ? 'Deactivate vehicle' : 'Activate vehicle'}
                        >
                          {vehicle.status === 'active' ? '⛔ Deactivate' : '✅ Activate'}
                        </button>
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
