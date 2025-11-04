import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './AdminHeader.module.css';

const AdminHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={styles.adminHeader}>
      <div className={styles.headerContainer}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🚚</span>
            <span className={styles.logoText}>Transporter Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ''}`}>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link 
                to="/admin/users" 
                className={`${styles.navLink} ${isActiveRoute('/admin/users') ? styles.active : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className={styles.navIcon}>👥</span>
                User Management
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link 
                to="/admin/vehicles" 
                className={`${styles.navLink} ${isActiveRoute('/admin/vehicles') ? styles.active : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className={styles.navIcon}>🚛</span>
                Vehicles Management
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link 
                to="/admin/agencies" 
                className={`${styles.navLink} ${isActiveRoute('/admin/agencies') ? styles.active : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className={styles.navIcon}>🏢</span>
                Agencies Management
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Actions */}
        <div className={styles.actionsSection}>
          <div className={styles.adminInfo}>
            <span className={styles.adminBadge}>Admin</span>
          </div>
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
            title="Logout"
          >
            <span className={styles.logoutIcon}>🚪</span>
            <span className={styles.logoutText}>Logout</span>
          </button>

          {/* Mobile Menu Button */}
          <button 
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;