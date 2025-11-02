import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import styles from './UserManagement.module.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    agency_id: '',
    role: 'driver',
    is_active: true
  });

  useEffect(() => {
    // Check if user is admin
    const adminData = localStorage.getItem('adminData');
    if (!adminData) {
      navigate('/admin');
      return;
    }

    loadUsers();
    loadAgencies();
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

  // Add the missing loadAgencies function
  const loadAgencies = async () => {
    try {
      const { data, error } = await api.getAgencies();
      if (!error && data) {
        setAgencies(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load agencies' });
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
      setMessage({ type: 'error', text: 'Error loading agencies' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!userForm.username || !userForm.password || !userForm.agency_id) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data, error } = await api.createUser(userForm);
      
      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to create user' });
      } else {
        setMessage({ type: 'success', text: 'User created successfully!' });
        setUserForm({
          username: '',
          password: '',
          agency_id: '',
          role: 'driver',
          is_active: true
        });
        setShowCreateForm(false);
        loadUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage({ type: 'error', text: 'Error creating user' });
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

  const getAgencyName = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency ? agency.name : 'N/A';
  };

  const getPlantName = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency ? agency.plant : 'N/A';
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin');
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <div className={styles.headerLeft}>
          <h1>🔐 Admin Dashboard</h1>
          <p>User Management System</p>
        </div>
        <div className={styles.headerRight}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Admin Logout
          </button>
        </div>
      </div>

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
                  onClick={() => setShowCreateForm(false)}
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
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Agency *</label>
                  <select
                    name="agency_id"
                    value={userForm.agency_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Agency</option>
                    {agencies.map(agency => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name} ({agency.plant})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Role</label>
                  <select
                    name="role"
                    value={userForm.role}
                    onChange={handleInputChange}
                  >
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={userForm.is_active}
                      onChange={handleInputChange}
                    />
                    Active User
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setShowCreateForm(false)}
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
                    <th>Username</th>
                    <th>Agency</th>
                    <th>Plant</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{getAgencyName(user.agency_id)}</td>
                      <td>{user.plant || getPlantName(user.agency_id)}</td>
                      <td>
                        <span className={`${styles.role} ${styles[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.status} ${user.is_active ? styles.active : styles.inactive}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
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