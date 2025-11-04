import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import styles from './VehiclesManagement.module.css';

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

  // Fetch data on component mount
  useEffect(() => {
    fetchAgencies();
    fetchVehicles();
  }, []);

  const fetchAgencies = async () => {
    try {
      const { data, error } = await api.getAgencies();
      if (error) {
        setError('Failed to fetch agencies');
        return;
      }
      setAgencies(data || []);
    } catch (err) {
      setError('Error fetching agencies');
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      // This would need to be implemented in your api.js
      const { data, error } = await api.getVehicles();
      if (error) {
        setError('Failed to fetch vehicles');
        return;
      }
      setVehicles(data || []);
    } catch (err) {
      setError('Error fetching vehicles');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agency_id || !formData.vehicle_number.trim() || 
        !formData.vehicle_type.trim() || !formData.capacity) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await api.createVehicle(formData);
      
      if (error) {
        setError(error.message || 'Failed to create vehicle');
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
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error creating vehicle');
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

  return (
    <div className={styles.vehiclesManagement}>
      <div className={styles.header}>
        <h1 className={styles.title}>Vehicles Management</h1>
        <button 
          className={styles.addButton}
          onClick={() => setShowForm(true)}
        >
          + Add Vehicle
        </button>
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

      {/* Add Vehicle Form */}
      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formCard}>
            <h2>Add New Vehicle</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="agency_id" className={styles.label}>
                  Agency *
                </label>
                <select
                  id="agency_id"
                  name="agency_id"
                  value={formData.agency_id}
                  onChange={handleChange}
                  className={styles.select}
                  required
                  disabled={loading}
                >
                  <option value="">Select Agency</option>
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
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
              </div>

              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
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
        {loading && !showForm ? (
          <div className={styles.loading}>Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className={styles.noData}>No vehicles found</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  <th>Transporter</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.vehicle_number}</td>
                    <td>{getAgencyName(vehicle.agency_id)}</td>
                    <td>{vehicle.vehicle_type}</td>
                    <td>{vehicle.capacity} tons</td>
                    <td>
                      <span className={`${styles.status} ${vehicle.status === 'active' ? styles.active : styles.inactive}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td>{new Date(vehicle.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehiclesManagement;