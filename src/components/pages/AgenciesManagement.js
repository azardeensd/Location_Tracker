import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AdminHeader from '../common/AdminHeader';
import styles from './AgenciesManagement.module.css';

const AgenciesManagement = () => {
  const [agencies, setAgencies] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAgencyForm, setShowAgencyForm] = useState(false);
  const [showPlantForm, setShowPlantForm] = useState(false);
  const [activeTab, setActiveTab] = useState('agencies'); // 'agencies' or 'plants'
  
  const [agencyForm, setAgencyForm] = useState({
    name: '',
    email: '',
    plant_id: ''
  });

  const [plantForm, setPlantForm] = useState({
    name: '',
    location: '',
    code: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchAgencies();
    fetchPlants();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.getAgencies();
      if (error) {
        setError('Failed to fetch agencies');
        return;
      }
      setAgencies(data || []);
    } catch (err) {
      setError('Error fetching agencies');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      // You'll need to create this API endpoint
      const { data, error } = await api.getPlants();
      if (error) {
        console.error('Failed to fetch plants');
        return;
      }
      setPlants(data || []);
    } catch (err) {
      console.error('Error fetching plants');
    }
  };

  const handleAgencyChange = (e) => {
    setAgencyForm({
      ...agencyForm,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handlePlantChange = (e) => {
    setPlantForm({
      ...plantForm,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleCreateAgency = async (e) => {
    e.preventDefault();
    
    if (!agencyForm.name.trim() || !agencyForm.email.trim() || !agencyForm.plant_id) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await api.createAgency(agencyForm);
      
      if (error) {
        setError(error.message || 'Failed to create agency');
        return;
      }

      setSuccess('Agency created successfully!');
      setAgencyForm({ name: '', email: '', plant_id: '' });
      setShowAgencyForm(false);
      fetchAgencies();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error creating agency');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlant = async (e) => {
    e.preventDefault();
    
    if (!plantForm.name.trim() || !plantForm.location.trim() || !plantForm.code.trim()) {
      setError('Please fill all plant fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // You'll need to create this API endpoint
      const { data, error } = await api.createPlant(plantForm);
      
      if (error) {
        setError(error.message || 'Failed to create plant');
        return;
      }

      setSuccess('Plant created successfully!');
      setPlantForm({ name: '', location: '', code: '' });
      setShowPlantForm(false);
      fetchPlants();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error creating plant');
    } finally {
      setLoading(false);
    }
  };

  const resetAgencyForm = () => {
    setAgencyForm({ name: '', email: '', plant_id: '' });
    setError('');
    setShowAgencyForm(false);
  };

  const resetPlantForm = () => {
    setPlantForm({ name: '', location: '', code: '' });
    setError('');
    setShowPlantForm(false);
  };

  const getPlantName = (plantId) => {
    const plant = plants.find(p => p.id === plantId);
    return plant ? plant.name : 'Unknown Plant';
  };

  const getPlantLocation = (plantId) => {
    const plant = plants.find(p => p.id === plantId);
    return plant ? plant.location : 'Unknown Location';
  };

  return (
    <div className={styles.agenciesManagement}>
      {/* Header with Tabs */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Transporter & Plants Management</h1>
          <div className={styles.headerActions}>
            {activeTab === 'agencies' && (
              <button 
                className={styles.addButton}
                onClick={() => setShowAgencyForm(true)}
              >
                + Add Transporter
              </button>
            )}
            {activeTab === 'plants' && (
              <button 
                className={styles.addButton}
                onClick={() => setShowPlantForm(true)}
              >
                + Add Plant
              </button>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button 
            className={`${styles.tab} ${activeTab === 'agencies' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('agencies')}
          >
            🏢 Transporter
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'plants' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('plants')}
          >
            🏭 Plants
          </button>
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

      {/* Add Agency Form */}
      {showAgencyForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formCard}>
            <h2>Add New Agency</h2>
            <form onSubmit={handleCreateAgency}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Agency Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={agencyForm.name}
                  onChange={handleAgencyChange}
                  className={styles.input}
                  placeholder="Enter Transporter name"
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={agencyForm.email}
                  onChange={handleAgencyChange}
                  className={styles.input}
                  placeholder="Enter Transporter email"
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="plant_id" className={styles.label}>
                  Plant *
                </label>
                <select
                  id="plant_id"
                  name="plant_id"
                  value={agencyForm.plant_id}
                  onChange={handleAgencyChange}
                  className={styles.select}
                  required
                  disabled={loading}
                >
                  <option value="">Select Plant</option>
                  {plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name} - {plant.location} ({plant.code})
                    </option>
                  ))}
                </select>
                {plants.length === 0 && (
                  <p className={styles.helperText}>
                    No plants available. Please add plants first.
                  </p>
                )}
              </div>

              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading || plants.length === 0}
                >
                  {loading ? 'Creating...' : 'Create Transporter'}
                </button>
                
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={resetAgencyForm}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plant Form */}
      {showPlantForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formCard}>
            <h2>Add New Plant</h2>
            <form onSubmit={handleCreatePlant}>
              <div className={styles.formGroup}>
                <label htmlFor="plant_name" className={styles.label}>
                  Plant Name *
                </label>
                <input
                  type="text"
                  id="plant_name"
                  name="name"
                  value={plantForm.name}
                  onChange={handlePlantChange}
                  className={styles.input}
                  placeholder="Enter plant name"
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="location" className={styles.label}>
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={plantForm.location}
                  onChange={handlePlantChange}
                  className={styles.input}
                  placeholder="Enter plant location"
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="code" className={styles.label}>
                  Plant Code *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={plantForm.code}
                  onChange={handlePlantChange}
                  className={styles.input}
                  placeholder="Enter plant code (e.g., PLT001)"
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Plant'}
                </button>
                
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={resetPlantForm}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      <div className={styles.content}>
        {activeTab === 'agencies' ? (
          /* Agencies List */
          <div className={styles.agenciesList}>
            {loading && !showAgencyForm ? (
              <div className={styles.loading}>Loading Transporter...</div>
            ) : agencies.length === 0 ? (
              <div className={styles.noData}>
                <p>No Transporter found</p>
                <button 
                  className={styles.addButton}
                  onClick={() => setShowAgencyForm(true)}
                >
                  + Create Your First Transporter
                </button>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Transporter Name</th>
                      <th>Email</th>
                      <th>Plant</th>
                      <th>Plant Location</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agencies.map((agency) => (
                      <tr key={agency.id}>
                        <td>{agency.name}</td>
                        <td>{agency.email}</td>
                        <td>{getPlantName(agency.plant_id)}</td>
                        <td>{getPlantLocation(agency.plant_id)}</td>
                        <td>{new Date(agency.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Plants List */
          <div className={styles.plantsList}>
            {loading && !showPlantForm ? (
              <div className={styles.loading}>Loading plants...</div>
            ) : plants.length === 0 ? (
              <div className={styles.noData}>
                <p>No plants found</p>
                <button 
                  className={styles.addButton}
                  onClick={() => setShowPlantForm(true)}
                >
                  + Create Your First Plant
                </button>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Plant Name</th>
                      <th>Location</th>
                      <th>Plant Code</th>
                      <th>Associated Transporter</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plants.map((plant) => {
                      const associatedAgencies = agencies.filter(agency => agency.plant_id === plant.id);
                      return (
                        <tr key={plant.id}>
                          <td>{plant.name}</td>
                          <td>{plant.location}</td>
                          <td>
                            <span className={styles.plantCode}>
                              {plant.code}
                            </span>
                          </td>
                          <td>
                            {associatedAgencies.length > 0 ? (
                              <span className={styles.agencyCount}>
                                {associatedAgencies.length} Transporter(s)
                              </span>
                            ) : (
                              <span className={styles.noAgencies}>No Transporter</span>
                            )}
                          </td>
                          <td>{new Date(plant.created_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgenciesManagement;
