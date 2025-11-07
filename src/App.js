import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import AdminHeader from './components/common/AdminHeader';
import Login from './components/pages/login';
import DriverPage from './components/pages/DriverPage';
import AdminLogin from './components/pages/AdminLogin';
import UserManagement from './components/pages/UserManagement';
import VehiclesManagement from './components/pages/VehiclesManagement';
import AgenciesManagement from './components/pages/AgenciesManagement';
import './App.css';

// Protected Route Component for drivers
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  return token ? children : <Navigate to="/login" />;
};


// Admin Route Component
const AdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  
  return adminToken && adminData.role === 'admin' ? children : <Navigate to="/admin" />;
};

// Layout component for protected routes that need Header
const MainLayout = ({ children }) => {
  return (
    <div className="App">
      <Header />
      {children}
    </div>
  );
};

const AdminLayout = ({ children }) => {
  return (
    <div className="App">
      <AdminHeader />
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* Driver Routes */}
        <Route 
          path="/driver" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <DriverPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes with AdminHeader */}
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/vehicles" 
          element={
            <AdminRoute>
              <AdminLayout>
                <VehiclesManagement />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/agencies" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AgenciesManagement />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
} 

export default App;
