import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import styles from './UserManagement.module.css';
import AdminNavigation from '../AdminNavigation';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [plants, setPlants] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    agency_id: '',
    plant_id: '',
    role: 'driver',
    is_active: true
  });

  // Get current user to check permissions
  const getCurrentUser = () => {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const plantAdminData = JSON.parse(localStorage.getItem('plantAdminData') || '{}');
    return adminData.role === 'admin' ? adminData : plantAdminData;
  };

  useEffect(() => {
    // Check if user is admin or plant_admin
    const currentUser = getCurrentUser();
    if (!currentUser || (!currentUser.role && !currentUser.id)) {
      navigate('/admin');
      return;
    }

    loadUsers();
    loadAgencies();
    loadPlants();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const { data, error } = await api.getUsers();
      if (!error && data) {
        setUsers(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load users' });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Error loading users' });
    }
  };

  const loadAgencies = async () => {
    try {
      const currentUser = getCurrentUser();
      let agenciesData;

      if (currentUser.role === 'plant_admin' && currentUser.plant_id) {
        // Plant admin can only see agencies from their plant
        const response = await api.getAgenciesByPlant(currentUser.plant_id);
        if (response.error) {
          setMessage({ type: 'error', text: 'Failed to load agencies' });
          return;
        }
        agenciesData = response.data || [];
      } else {
        // Admin can see all agencies
        const response = await api.getAgencies();
        if (response.error) {
          setMessage({ type: 'error', text: 'Failed to load agencies' });
          return;
        }
        agenciesData = response.data || [];
      }

      setAgencies(agenciesData);
    } catch (error) {
      console.error('Error loading agencies:', error);
      setMessage({ type: 'error', text: 'Error loading agencies' });
    }
  };

  const loadPlants = async () => {
    try {
      const currentUser = getCurrentUser();
      let plantsData;

      if (currentUser.role === 'plant_admin' && currentUser.plant_id) {
        // Plant admin can only see their own plant
        const response = await api.getPlantById(currentUser.plant_id);
        if (response.error) {
          console.error('Failed to load plant:', response.error);
          return;
        }
        plantsData = response.data ? [response.data] : [];
      } else {
        // Admin can see all plants
        const response = await api.getPlants();
        if (response.error) {
          console.error('Failed to load plants:', response.error);
          return;
        }
        plantsData = response.data || [];
      }

      console.log('Loaded plants:', plantsData);
      setPlants(plantsData);
    } catch (error) {
      console.error('Error loading plants:', error);
      setMessage({ type: 'error', text: 'Error loading plants' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const newValue = type === 'checkbox' ? checked : value;
    
    setUserForm(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Auto-assign plant_id when agency is selected
    if (name === 'agency_id' && newValue) {
      const selectedAgency = agencies.find(agency => agency.id === newValue);
      if (selectedAgency && selectedAgency.plant_id) {
        console.log('Auto-assigning plant_id from agency:', selectedAgency.plant_id);
        setUserForm(prev => ({
          ...prev,
          plant_id: selectedAgency.plant_id
        }));
      }
    }

    // Clear agency_id if role is plant_admin and plant is manually selected
    if (name === 'plant_id' && userForm.role === 'plant_admin' && newValue) {
      setUserForm(prev => ({
        ...prev,
        agency_id: '' // Clear agency for plant admin
      }));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!userForm.username || !userForm.password) {
      setMessage({ type: 'error', text: 'Username and password are required' });
      return;
    }

    // For drivers, agency is required
    if (userForm.role === 'driver' && !userForm.agency_id) {
      setMessage({ type: 'error', text: 'Transporter is required for drivers' });
      return;
    }

    // For plant_admin, plant is required
    if (userForm.role === 'plant_admin' && !userForm.plant_id) {
      setMessage({ type: 'error', text: 'Plant is required for Plant Admin role' });
      return;
    }

    // FIXED: Validate plant_id exists in plants table - handle UUID comparison
    if (userForm.plant_id) {
      const selectedPlant = plants.find(plant => {
        // Compare UUIDs directly - no parseInt needed
        return plant.id === userForm.plant_id;
      });
      
      console.log('Selected plant ID:', userForm.plant_id);
      console.log('Available plants:', plants);
      console.log('Found plant:', selectedPlant);
      
      if (!selectedPlant) {
        setMessage({ type: 'error', text: `Selected plant does not exist. Available plants: ${plants.map(p => p.name).join(', ')}` });
        return;
      }
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare user data for API - no need to parse UUIDs
      const userData = {
        username: userForm.username.trim(),
        password: userForm.password,
        role: userForm.role,
        is_active: userForm.is_active,
        agency_id: userForm.agency_id || null,
        plant_id: userForm.plant_id || null
      };

      console.log('Creating user with data:', userData);

      const { data, error } = await api.createUser(userData);
      
      if (error) {
        console.error('API Error:', error);
        setMessage({ type: 'error', text: error.message || 'Failed to create user' });
      } else {
        setMessage({ type: 'success', text: 'User created successfully!' });
        resetForm();
        setShowCreateForm(false);
        loadUsers(); // Refresh the list
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage({ type: 'error', text: 'Error creating user: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const { error } = await api.updateUser(userId, {
        is_active: !currentStatus
      });

      if (error) {
        setMessage({ type: 'error', text: 'Failed to update user' });
      } else {
        setMessage({ type: 'success', text: 'User updated successfully!' });
        loadUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ type: 'error', text: 'Error updating user' });
    }
  };

  const resetForm = () => {
    setUserForm({
      username: '',
      password: '',
      agency_id: '',
      plant_id: '',
      role: 'driver',
      is_active: true
    });
  };

  const handleCloseForm = () => {
    resetForm();
    setShowCreateForm(false);
  };

  const getAgencyName = (agencyId) => {
    if (!agencyId) return 'N/A';
    const agency = agencies.find(a => a.id === agencyId);
    return agency ? agency.name : 'N/A';
  };

  const getPlantName = (plantId) => {
    if (!plantId) return 'N/A';
    // Compare UUIDs directly
    const plant = plants.find(p => p.id === plantId);
    return plant ? plant.name : 'N/A';
  };

  const getPlantLocation = (plantId) => {
    if (!plantId) return 'N/A';
    // Compare UUIDs directly
    const plant = plants.find(p => p.id === plantId);
    return plant ? plant.location : 'N/A';
  };

  const getAgencyPlantName = (agencyId) => {
    if (!agencyId) return 'N/A';
    const agency = agencies.find(a => a.id === agencyId);
    if (!agency || !agency.plant_id) return 'N/A';
    return getPlantName(agency.plant_id);
  };

  const getAgencyPlantLocation = (agencyId) => {
    if (!agencyId) return 'N/A';
    const agency = agencies.find(a => a.id === agencyId);
    if (!agency || !agency.plant_id) return 'N/A';
    return getPlantLocation(agency.plant_id);
  };

  const currentUser = getCurrentUser();

  return (
    <div className={styles.adminContainer}>
      <AdminNavigation />
      <div className={styles.userManagement}>
        <div className={styles.header}>
          <h1>User Management</h1>
          <button 
            className={styles.createBtn}
            onClick={() => setShowCreateForm(true)}
          >
            + Add New User
          </button>
        </div>

        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

       
        {/* Create User Form */}
        {showCreateForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2>Create New User</h2>
                <button 
                  className={styles.closeBtn}
                  onClick={handleCloseForm}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={userForm.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={userForm.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Role *</label>
                  <select
                    name="role"
                    value={userForm.role}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="driver">Driver</option>
                    <option value="plant_admin">Plant Admin</option>
                    {currentUser.role === 'admin' && (
                      <option value="admin">Super Admin</option>
                    )}
                  </select>
                </div>

                {/* Transporter Selection */}
                <div className={styles.formGroup}>
                  <label>
                    Transporter {userForm.role === 'driver' && '*'}
                  </label>
                  <select
                    name="agency_id"
                    value={userForm.agency_id}
                    onChange={handleInputChange}
                    required={userForm.role === 'driver'}
                    disabled={loading || userForm.role === 'plant_admin'}
                  >
                    <option value="">Select Transporter</option>
                    {agencies.map(agency => {
                      const plant = plants.find(p => p.id === agency.plant_id);
                      return (
                        <option key={agency.id} value={agency.id}>
                          {agency.name} {plant ? `- ${plant.name}` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {userForm.role === 'driver' && (
                    <small className={styles.helperText}>
                      Required for drivers - will auto-assign plant from transporter
                    </small>
                  )}
                  {userForm.role === 'plant_admin' && (
                    <small className={styles.helperText}>
                      Not applicable for Plant Admin role
                    </small>
                  )}
                </div>

                {/* Plant Selection */}
                <div className={styles.formGroup}>
                  <label>
                    Plant {userForm.role === 'plant_admin' && '*'}
                  </label>
                  <select
                    name="plant_id"
                    value={userForm.plant_id}
                    onChange={handleInputChange}
                    required={userForm.role === 'plant_admin'}
                    disabled={loading || (userForm.role === 'driver' && userForm.agency_id)}
                  >
                    <option value="">Select Plant</option>
                    {plants.map(plant => (
                      <option key={plant.id} value={plant.id}>
                        {plant.location}
                      </option>
                    ))}
                  </select>
                  {userForm.role === 'plant_admin' && (
                    <small className={styles.helperText}>
                      Required for Plant Admin role
                    </small>
                  )}
                  {userForm.role === 'driver' && userForm.agency_id && (
                    <small className={styles.helperText}>
                      Plant auto-assigned from selected transporter: {getPlantName(userForm.plant_id)}
                    </small>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={userForm.is_active}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    Active User
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={handleCloseForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users List */}
<div className={styles.usersList}>
  <h2>Existing Users</h2>
  {users.length === 0 ? (
    <p className={styles.noUsers}>No users found</p>
  ) : (
    <div className={styles.tableContainer}>
      <table className={styles.usersTable}>
        <thead>
          <tr>
            <th>Username</th> {/* Added username column */}
            <th>Plant Code</th>
            <th>Plant Name</th>
            <th>Transporter</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              {/* Username */}
              <td>
                <span className={styles.username}>
                  {user.username || 'N/A'}
                </span>
              </td>
              
              {/* Plant */}
              <td>
                {user.plant_id 
                  ? getPlantName(user.plant_id) 
                  : getAgencyPlantName(user.agency_id)
                }
              </td>
              
              {/* Plant Location */}
              <td>
                {user.plant_id 
                  ? getPlantLocation(user.plant_id) 
                  : getAgencyPlantLocation(user.agency_id)
                }
              </td>
              
              {/* Transporter */}
              <td>{getAgencyName(user.agency_id)}</td>
              
              {/* Role */}
              <td>
                <span className={`${styles.role} ${styles[user.role]}`}>
                  {user.role === 'plant_admin' ? 'Plant Admin' : 
                   user.role === 'admin' ? 'Super Admin' : 'Driver'}
                </span>
              </td>
              
              {/* Status */}
              <td>
                <span className={`${styles.status} ${user.is_active ? styles.active : styles.inactive}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              
              {/* Actions */}
              <td>
                <button
                  className={`${styles.toggleBtn} ${user.is_active ? styles.deactivate : styles.activate}`}
                  onClick={() => handleToggleActive(user.id, user.is_active)}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
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

export default UserManagement;

//old code//
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { api } from '../services/api';
// import styles from './UserManagement.module.css';
// import AdminNavigation from '../AdminNavigation';

// const UserManagement = () => {
//   const [users, setUsers] = useState([]);
//   const [agencies, setAgencies] = useState([]);
//   const [plants, setPlants] = useState([]);
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', text: '' });
//   const navigate = useNavigate();

//   const [userForm, setUserForm] = useState({
//     username: '',
//     password: '',
//     agency_id: '',
//     role: 'driver',
//     is_active: true
//   });

//   useEffect(() => {
//     // Check if user is admin
//     const adminData = localStorage.getItem('adminData');
//     if (!adminData) {
//       navigate('/admin');
//       return;
//     }

//     loadUsers();
//     loadAgencies();
//     loadPlants();
//   }, [navigate]);

//   const loadUsers = async () => {
//     try {
//       const { data, error } = await api.getUsers();
//       if (!error && data) {
//         setUsers(data);
//       } else {
//         setMessage({ type: 'error', text: 'Failed to load users' });
//       }
//     } catch (error) {
//       console.error('Error loading users:', error);
//       setMessage({ type: 'error', text: 'Error loading users' });
//     }
//   };

//   const loadAgencies = async () => {
//     try {
//       const { data, error } = await api.getAgencies();
//       if (!error && data) {
//         setAgencies(data);
//       } else {
//         setMessage({ type: 'error', text: 'Failed to load agencies' });
//       }
//     } catch (error) {
//       console.error('Error loading agencies:', error);
//       setMessage({ type: 'error', text: 'Error loading agencies' });
//     }
//   };

//   const loadPlants = async () => {
//     try {
//       const { data, error } = await api.getPlants();
//       if (!error && data) {
//         setPlants(data);
//       } else {
//         console.error('Failed to load plants:', error);
//       }
//     } catch (error) {
//       console.error('Error loading plants:', error);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setUserForm(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleCreateUser = async (e) => {
//     e.preventDefault();
    
//     if (!userForm.username || !userForm.password || !userForm.agency_id) {
//       setMessage({ type: 'error', text: 'Please fill all required fields' });
//       return;
//     }

//     setLoading(true);
//     setMessage({ type: '', text: '' });

//     try {
//       const { data, error } = await api.createUser(userForm);
      
//       if (error) {
//         setMessage({ type: 'error', text: error.message || 'Failed to create user' });
//       } else {
//         setMessage({ type: 'success', text: 'User created successfully!' });
//         setUserForm({
//           username: '',
//           password: '',
//           agency_id: '',
//           role: 'driver',
//           is_active: true
//         });
//         setShowCreateForm(false);
//         loadUsers(); // Refresh the list
//       }
//     } catch (error) {
//       console.error('Error creating user:', error);
//       setMessage({ type: 'error', text: 'Error creating user' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggleActive = async (userId, currentStatus) => {
//     try {
//       const { error } = await api.updateUser(userId, {
//         is_active: !currentStatus
//       });

//       if (error) {
//         setMessage({ type: 'error', text: 'Failed to update user' });
//       } else {
//         setMessage({ type: 'success', text: 'User updated successfully!' });
//         loadUsers(); // Refresh the list
//       }
//     } catch (error) {
//       console.error('Error updating user:', error);
//       setMessage({ type: 'error', text: 'Error updating user' });
//     }
//   };

//   const getAgencyName = (agencyId) => {
//     const agency = agencies.find(a => a.id === agencyId);
//     return agency ? agency.name : 'N/A';
//   };

//   const getPlantName = (agencyId) => {
//     const agency = agencies.find(a => a.id === agencyId);
//     if (!agency || !agency.plant_id) return 'N/A';
    
//     const plant = plants.find(p => p.id === agency.plant_id);
//     return plant ? plant.name : 'N/A';
//   };

//   const getPlantLocation = (agencyId) => {
//     const agency = agencies.find(a => a.id === agencyId);
//     if (!agency || !agency.plant_id) return 'N/A';
    
//     const plant = plants.find(p => p.id === agency.plant_id);
//     return plant ? plant.location : 'N/A';
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('adminToken');
//     localStorage.removeItem('adminData');
//     navigate('/admin');
//   };

//   return (
//     <div className={styles.adminContainer}>
//     <AdminNavigation />
//     <div className={styles.adminContainer}>
//       <div className={styles.userManagement}>
//         <div className={styles.header}>
//           <h1>User Management</h1>
//           <button 
//             className={styles.createBtn}
//             onClick={() => setShowCreateForm(true)}
//           >
//             + Add New User
//           </button>
//         </div>

//         {message.text && (
//           <div className={`${styles.message} ${styles[message.type]}`}>
//             {message.text}
//           </div>
//         )}

//         {/* Create User Form */}
//         {showCreateForm && (
//           <div className={styles.modalOverlay}>
//             <div className={styles.modal}>
//               <div className={styles.modalHeader}>
//                 <h2>Create New User</h2>
//                 <button 
//                   className={styles.closeBtn}
//                   onClick={() => setShowCreateForm(false)}
//                 >
//                   ✕
//                 </button>
//               </div>

//               <form onSubmit={handleCreateUser} className={styles.form}>
//                 <div className={styles.formGroup}>
//                   <label>Username *</label>
//                   <input
//                     type="text"
//                     name="username"
//                     value={userForm.username}
//                     onChange={handleInputChange}
//                     placeholder="Enter username"
//                     required
//                   />
//                 </div>

//                 <div className={styles.formGroup}>
//                   <label>Password *</label>
//                   <input
//                     type="password"
//                     name="password"
//                     value={userForm.password}
//                     onChange={handleInputChange}
//                     placeholder="Enter password"
//                     required
//                   />
//                 </div>

//                 <div className={styles.formGroup}>
//                   <label>Transporter *</label>
//                   <select
//                     name="agency_id"
//                     value={userForm.agency_id}
//                     onChange={handleInputChange}
//                     required
//                   >
//                     <option value="">Select Transporter</option>
//                     {agencies.map(agency => {
//                       const plant = plants.find(p => p.id === agency.plant_id);
//                       return (
//                         <option key={agency.id} value={agency.id}>
//                           {agency.name} {plant ? `- ${plant.name} (${plant.location})` : ''}
//                         </option>
//                       );
//                     })}
//                   </select>
//                 </div>

//                 <div className={styles.formGroup}>
//   <label>Role</label>
//   <select
//     name="role"
//     value={userForm.role}
//     onChange={handleInputChange}
//   >
//     <option value="driver">Driver</option>
//     <option value="plant_admin">Plant Admin</option>
//     <option value="admin">Super Admin</option>
//   </select>
// </div>

//                 <div className={styles.formGroup}>
//                   <label className={styles.checkboxLabel}>
//                     <input
//                       type="checkbox"
//                       name="is_active"
//                       checked={userForm.is_active}
//                       onChange={handleInputChange}
//                     />
//                     Active User
//                   </label>
//                 </div>

//                 <div className={styles.formActions}>
//                   <button 
//                     type="button"
//                     className={styles.cancelBtn}
//                     onClick={() => setShowCreateForm(false)}
//                   >
//                     Cancel
//                   </button>
//                   <button 
//                     type="submit"
//                     className={styles.submitBtn}
//                     disabled={loading}
//                   >
//                     {loading ? 'Creating...' : 'Create User'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {/* Users List */}
//         <div className={styles.usersList}>
//           <h2>Existing Users</h2>
//           {users.length === 0 ? (
//             <p className={styles.noUsers}>No users found</p>
//           ) : (
//             <div className={styles.tableContainer}>
//               <table className={styles.usersTable}>
//                 <thead>
//                   <tr>
//                     <th>Username</th>
//                     <th>Transporter</th>
//                     <th>Plant</th>
//                     <th>Plant Location</th>
//                     <th>Role</th>
//                     <th>Status</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {users.map(user => (
//                     <tr key={user.id}>
//                       <td>{user.username}</td>
//                       <td>{getAgencyName(user.agency_id)}</td>
//                       <td>{getPlantName(user.agency_id)}</td>
//                       <td>{getPlantLocation(user.agency_id)}</td>
//                       <td>
//                         <span className={`${styles.role} ${styles[user.role]}`}>
//                           {user.role}
//                         </span>
//                       </td>
//                       <td>
//                         <span className={`${styles.status} ${user.is_active ? styles.active : styles.inactive}`}>
//                           {user.is_active ? 'Active' : 'Inactive'}
//                         </span>
//                       </td>
//                       <td>
//                         <button
//                           className={`${styles.toggleBtn} ${user.is_active ? styles.deactivate : styles.activate}`}
//                           onClick={() => handleToggleActive(user.id, user.is_active)}
//                         >
//                           {user.is_active ? 'Deactivate' : 'Activate'}
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//     </div>
//   );
// };

// export default UserManagement;