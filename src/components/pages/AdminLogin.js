import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import styles from './AdminLogin.module.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting admin login with:', formData);
      
      const { data, error: apiError } = await api.adminLogin(formData);
      
      console.log('API Response:', { data, apiError });
      
      if (apiError) {
        setError(apiError.message || 'Login failed. Please try again.');
        return;
      }

      // Check if we have valid data
      if (data) {
        const userData = data.user || data;
        const token = data.token;
        
        console.log('User data:', userData);

        // Check for admin or plant_admin role
        if (userData.role === 'admin' || userData.role === 'plant_admin') {
          // Store session based on role
          if (userData.role === 'admin') {
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminData', JSON.stringify(userData));
            navigate('/admin/users');
          } else if (userData.role === 'plant_admin') {
            localStorage.setItem('plantAdminToken', token);
            localStorage.setItem('plantAdminData', JSON.stringify(userData));
            navigate('/vehicles'); // Redirect to vehicles management
          }
        } else {
          setError('Access denied. Admin privileges required.');
          // Clear any existing admin data
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          localStorage.removeItem('plantAdminToken');
          localStorage.removeItem('plantAdminData');
        }
      } else {
        setError('Invalid credentials or server error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adminLoginPage}>
      <div className={styles.adminLoginContainer}>
        <div className={styles.adminLoginCard}>
          <div className={styles.logoSection}>
            <h1 className={styles.logo}>🔐 Market Vehicle Admin Console</h1>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            {error && (
              <div className={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter username"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className={styles.loginButton}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Login'}
            </button>
          </form>

          <div className={styles.footer}>
            <p>🔗Go to <a href="/login" className={styles.driverLink}>Driver Portal</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
