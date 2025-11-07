// src/components/AdminNavigation.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './AdminNavigation.css'; // We'll create this CSS file

const AdminNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user data from localStorage
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const plantAdminData = JSON.parse(localStorage.getItem('plantAdminData') || '{}');
  
  const userData = adminData.role === 'admin' ? adminData : plantAdminData;
  const currentRole = userData.role;

  const handleLogout = () => {
    // Clear all admin-related storage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('plantAdminToken');
    localStorage.removeItem('plantAdminData');
    navigate('/admin');
  };

  const isActiveLink = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="admin-navigation">
      {/* Left side - Brand and Navigation Links */}
      <div className="nav-left">
        <div className="nav-brand">
          <h2>🚛 Transporter Admin</h2>
        </div>
        
        <div className="nav-links">
          {/* Show all links for admin role */}
          {currentRole === 'admin' && (
            <>
              <Link 
                to="/admin/users" 
                className={`nav-link ${isActiveLink('/admin/users')}`}
              >
                👥 User Management
              </Link>
              <Link 
                to="/admin/agencies" 
                className={`nav-link ${isActiveLink('/admin/agencies')}`}
              >
                🏢 Transporter & Plants
              </Link>
              
              {/* Show vehicles link ONLY for admin role */}
              <Link 
                to="/vehicles" 
                className={`nav-link ${isActiveLink('/vehicles')}`}
              >
                🚛 Vehicle Management
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Right side - User Info and Logout */}
      <div className="nav-right">
        <div className="user-info">
          <span className="username">{userData.username}</span>
          <span className={`role-badge ${currentRole}`}>
            {currentRole === 'admin' ? 'Super Admin' : 'Plant Admin'}
          </span>
        </div>
        
        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </div>
    </nav>
  );
};

export default AdminNavigation;