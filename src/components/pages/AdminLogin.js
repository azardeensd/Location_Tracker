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
      const { data, error } = await api.login(formData);
      
      if (error) {
        setError(error.message || 'Login failed. Please try again.');
        return;
      }

      if (data && data.success) {
        // Check if user is admin
        if (data.user.role === 'admin') {
          // Store admin session separately
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('adminData', JSON.stringify(data.user));
          
          // Redirect to admin dashboard
          navigate('/admin/users');
        } else {
          setError('Access denied. Admin privileges required.');
        }
      } else {
        setError('Invalid credentials');
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
            <h1 className={styles.logo}>🔐 Admin Portal</h1>
            <p className={styles.subtitle}>User Management System</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            {error && (
              <div className={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>
                Admin Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter admin username"
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
              {loading ? 'Signing In...' : 'Admin Login'}
            </button>
          </form>

          <div className={styles.footer}>
            <p>Go to <a href="/driver" className={styles.driverLink}>Driver Portal</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;