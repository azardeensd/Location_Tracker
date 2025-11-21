import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import styles from './AgenciesManagement.module.css';
import AdminNavigation from '../AdminNavigation';

const AgenciesManagement = () => {
  const [agencies, setAgencies] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAgencyForm, setShowAgencyForm] = useState(false);
  const [showPlantForm, setShowPlantForm] = useState(false);
  const [activeTab, setActiveTab] = useState('agencies');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [editingPlant, setEditingPlant] = useState(null);
  
  // Search states
  const [agencySearchTerm, setAgencySearchTerm] = useState('');
  const [plantSearchTerm, setPlantSearchTerm] = useState('');
  
  const [agencyForm, setAgencyForm] = useState({
    name: '',
    code: '',
    email: '',
    plant_id: ''
  });

  const [plantForm, setPlantForm] = useState({
    name: '',
    location: '',
    code: ''
  });

  // Get current user to check permissions
  const getCurrentUser = () => {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const plantAdminData = JSON.parse(localStorage.getItem('plantAdminData') || '{}');
    return adminData.role === 'admin' ? adminData : plantAdminData;
  };

  // Helper functions - MOVED BEFORE SEARCH FILTERS
  const getPlantName = (plantId) => {
    const plant = plants.find(p => p.id === plantId);
    return plant ? plant.code : 'Unknown Location';
  };

  const getPlantLocation = (plantId) => {
    const plant = plants.find(p => p.id === plantId);
    return plant ? plant.location : 'Unknown Location';
  };

  // Fetch data and check admin status on component mount
  useEffect(() => {
    checkAdminStatus();
    fetchAgencies();
    fetchPlants();
  }, []);

  const checkAdminStatus = () => {
    try {
      const currentUser = getCurrentUser();
      console.log('🛠️ Current user in AgenciesManagement:', currentUser);
      
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

  // Search functionality - NOW AFTER HELPER FUNCTIONS
  const filteredAgencies = agencies.filter(agency => {
    const searchLower = agencySearchTerm.toLowerCase();
    return (
      agency.name.toLowerCase().includes(searchLower) ||
      agency.code.toLowerCase().includes(searchLower) ||
      agency.email.toLowerCase().includes(searchLower) ||
      getPlantName(agency.plant_id).toLowerCase().includes(searchLower) ||
      getPlantLocation(agency.plant_id).toLowerCase().includes(searchLower)
    );
  });

  const filteredPlants = plants.filter(plant => {
    const searchLower = plantSearchTerm.toLowerCase();
    return (
      plant.name.toLowerCase().includes(searchLower) ||
      plant.location.toLowerCase().includes(searchLower) ||
      plant.code.toLowerCase().includes(searchLower)
    );
  });

  // Duplicate validation functions
  const isDuplicateAgency = (formData, editingId = null) => {
    return agencies.some(agency => {
      // Skip the agency being edited
      if (editingId && agency.id === editingId) return false;
      
      // Check for duplicate code or email
      return (
        agency.code.toLowerCase() === formData.code.toLowerCase() ||
        agency.email.toLowerCase() === formData.email.toLowerCase()
      );
    });
  };

  const isDuplicatePlant = (formData, editingId = null) => {
    return plants.some(plant => {
      // Skip the plant being edited
      if (editingId && plant.id === editingId) return false;
      
      // Check for duplicate code
      return plant.code.toLowerCase() === formData.code.toLowerCase();
    });
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
    
    if (!agencyForm.name.trim() || !agencyForm.email.trim() || !agencyForm.plant_id || !agencyForm.code.trim()) {
      setError('Please fill all fields');
      return;
    }

    // Check for duplicates
    if (isDuplicateAgency(agencyForm)) {
      setError('A transporter with this code or email already exists');
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

      setSuccess('Transporter created successfully!');
      setAgencyForm({ name: '', code: '', email: '', plant_id: '' });
      setShowAgencyForm(false);
      fetchAgencies();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error creating transporter');
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

    // Check for duplicates
    if (isDuplicatePlant(plantForm)) {
      setError('A plant with this code already exists');
      return;
    }

    setLoading(true);
    setError('');

    try {
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

  const handleEditAgency = (agency) => {
    setEditingAgency(agency);
    setAgencyForm({
      name: agency.name,
      code: agency.code,
      email: agency.email,
      plant_id: agency.plant_id
    });
    setShowAgencyForm(true);
  };

  const handleEditPlant = (plant) => {
    setEditingPlant(plant);
    setPlantForm({
      name: plant.name,
      location: plant.location,
      code: plant.code
    });
    setShowPlantForm(true);
  };

  const handleUpdateAgency = async (e) => {
    e.preventDefault();
    
    if (!agencyForm.name.trim() || !agencyForm.email.trim() || !agencyForm.plant_id || !agencyForm.code.trim()) {
      setError('Please fill all fields');
      return;
    }

    // Check for duplicates (excluding current agency being edited)
    if (isDuplicateAgency(agencyForm, editingAgency?.id)) {
      setError('A transporter with this code or email already exists');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await api.updateAgency(editingAgency.id, agencyForm);
      
      if (error) {
        setError(error.message || 'Failed to update agency');
        return;
      }

      setSuccess('Transporter updated successfully!');
      setAgencyForm({ name: '', code: '', email: '', plant_id: '' });
      setShowAgencyForm(false);
      setEditingAgency(null);
      fetchAgencies();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error updating transporter');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlant = async (e) => {
    e.preventDefault();
    
    if (!plantForm.name.trim() || !plantForm.location.trim() || !plantForm.code.trim()) {
      setError('Please fill all plant fields');
      return;
    }

    // Check for duplicates (excluding current plant being edited)
    if (isDuplicatePlant(plantForm, editingPlant?.id)) {
      setError('A plant with this code already exists');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await api.updatePlant(editingPlant.id, plantForm);
      
      if (error) {
        setError(error.message || 'Failed to update plant');
        return;
      }

      setSuccess('Plant updated successfully!');
      setPlantForm({ name: '', location: '', code: '' });
      setShowPlantForm(false);
      setEditingPlant(null);
      fetchPlants();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error updating plant');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgency = async (agencyId) => {
    if (!window.confirm('Are you sure you want to delete this transporter?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await api.deleteAgency(agencyId);
      
      if (error) {
        setError(error.message || 'Failed to delete agency');
        return;
      }

      setSuccess('Transporter deleted successfully!');
      fetchAgencies();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error deleting transporter');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlant = async (plantId) => {
    if (!window.confirm('Are you sure you want to delete this plant?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await api.deletePlant(plantId);
      
      if (error) {
        setError(error.message || 'Failed to delete plant');
        return;
      }

      setSuccess('Plant deleted successfully!');
      fetchPlants();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error deleting plant');
    } finally {
      setLoading(false);
    }
  };

  const resetAgencyForm = () => {
    setAgencyForm({ name: '', code: '', email: '', plant_id: '' });
    setError('');
    setShowAgencyForm(false);
    setEditingAgency(null);
  };

  const resetPlantForm = () => {
    setPlantForm({ name: '', location: '', code: '' });
    setError('');
    setShowPlantForm(false);
    setEditingPlant(null);
  };

  // Get current user for debugging
  const currentUser = getCurrentUser();

  return (
    <div className={styles.adminContainer}>
      <AdminNavigation />
      <div className={styles.agenciesManagement}>
        {/* Header with Tabs */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Transporter & Plants Management</h1>
            <div className={styles.headerActions}>
              {activeTab === 'agencies' && isAdmin && (
                <button 
                  className={styles.addButton}
                  onClick={() => setShowAgencyForm(true)}
                >
                  + Add Transporter
                </button>
              )}
              {activeTab === 'plants' && isAdmin && (
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

        {/* Search Bars */}
        <div className={styles.searchSection}>
          {activeTab === 'agencies' && (
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search transporters"
                value={agencySearchTerm}
                onChange={(e) => setAgencySearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
          )}
          
          {activeTab === 'plants' && (
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search plants"
                value={plantSearchTerm}
                onChange={(e) => setPlantSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
          )}
        </div>

        {/* Add/Edit Agency Form */}
        {showAgencyForm && (
          <div className={styles.formOverlay}>
            <div className={styles.formCard}>
              <h2>{editingAgency ? 'Edit Transporter' : 'Add New Transporter'}</h2>
              <form onSubmit={editingAgency ? handleUpdateAgency : handleCreateAgency}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    Transporter Name *
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
                  <label htmlFor="code" className={styles.label}>
                    Transporter Code *
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={agencyForm.code}
                    onChange={handleAgencyChange}
                    className={styles.input}
                    placeholder="Enter Transporter code (e.g., TRN001)"
                    required
                    disabled={loading || editingAgency} // Added editingAgency condition here
  />
  {editingAgency && (
    <div className={styles.helpText}>
      Transporter code cannot be edited once created
    </div>
  )}

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
                        {plant.location} ({plant.code})
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
                    {loading ? (editingAgency ? 'Updating...' : 'Creating...') : (editingAgency ? 'Update Transporter' : 'Create Transporter')}
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

        {/* Add/Edit Plant Form */}
        {showPlantForm && (
          <div className={styles.formOverlay}>
            <div className={styles.formCard}>
              <h2>{editingPlant ? 'Edit Plant' : 'Add New Plant'}</h2>
              <form onSubmit={editingPlant ? handleUpdatePlant : handleCreatePlant}>
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
                    disabled={loading || editingPlant} // Added editingPlant condition here
                  />
                  {editingPlant && (
    <div className={styles.helpText}>
      Plant code cannot be edited once created
    </div>
  )}
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? (editingPlant ? 'Updating...' : 'Creating...') : (editingPlant ? 'Update Plant' : 'Create Plant')}
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
              ) : filteredAgencies.length === 0 ? (
                <div className={styles.noData}>
                  <p>
                    {agencySearchTerm ? 'No transporters found matching your search' : 'No Transporter found'}
                  </p>
                  {isAdmin && !agencySearchTerm && (
                    <button 
                      className={styles.addButton}
                      onClick={() => setShowAgencyForm(true)}
                    >
                      + Create Your First Transporter
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <div className={styles.searchInfo}>
                    {agencySearchTerm && (
                      <p className={styles.searchResults}>
                        Showing {filteredAgencies.length} of {agencies.length} transporters
                      </p>
                    )}
                  </div>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Plant Code</th>
                        <th>Plant Name</th>
                        <th>Transporter Code</th>
                        <th>Transporter Name</th>
                        <th>Email</th>
                        {isAdmin && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgencies.map((agency) => (
                        <tr key={agency.id}>
                          <td>{getPlantName(agency.plant_id)}</td>
                          <td>{getPlantLocation(agency.plant_id)}</td>
                          <td>
                            <span className={styles.transporterCode}>
                              {agency.code}
                            </span>
                          </td>
                          <td>{agency.name}</td>
                          <td>{agency.email}</td>
                          {isAdmin && (
                            <td>
                              <div className={styles.actionButtons}>
                                <button
                                  className={styles.editButton}
                                  onClick={() => handleEditAgency(agency)}
                                  disabled={loading}
                                >
                                  Edit
                                </button>
                                <button
                                  className={styles.deleteButton}
                                  onClick={() => handleDeleteAgency(agency.id)}
                                  disabled={loading}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
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
              ) : filteredPlants.length === 0 ? (
                <div className={styles.noData}>
                  <p>
                    {plantSearchTerm ? 'No plants found matching your search' : 'No plants found'}
                  </p>
                  {isAdmin && !plantSearchTerm && (
                    <button 
                      className={styles.addButton}
                      onClick={() => setShowPlantForm(true)}
                    >
                      + Create Your First Plant
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <div className={styles.searchInfo}>
                    {plantSearchTerm && (
                      <p className={styles.searchResults}>
                        Showing {filteredPlants.length} of {plants.length} plants
                      </p>
                    )}
                  </div>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Plant Code</th>
                        <th>Plant Location</th>
                        <th>Plant Name</th>
                        {isAdmin && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlants.map((plant) => (
                        <tr key={plant.id}>
                          <td>
                            <span className={styles.plantCode}>
                              {plant.code}
                            </span>
                          </td>
                          <td>{plant.location}</td>
                          <td>{plant.name}</td>
                          {isAdmin && (
                            <td>
                              <div className={styles.actionButtons}>
                                <button
                                  className={styles.editButton}
                                  onClick={() => handleEditPlant(plant)}
                                  disabled={loading}
                                >
                                  Edit
                                </button>
                                <button
                                  className={styles.deleteButton}
                                  onClick={() => handleDeletePlant(plant.id)}
                                  disabled={loading}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgenciesManagement;  
