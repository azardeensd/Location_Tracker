// App.js - CORRECTED VERSION
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from './components/AdminRoute'; // Import from separate file
import PlantAdminRoute from './components/PlantAdminRoute'; // Import from separate file

// Import your page components
import AdminLogin from './components/pages/AdminLogin';
import UserManagement from './components/pages/UserManagement';
import VehiclesManagement from './components/pages/VehiclesManagement';
import AgenciesManagement from './components/pages/AgenciesManagement';
import Login from './components/pages/login';
import Driver from './components/pages/DriverPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* Driver Route */}
        <Route path="/driver" element={<Driver />} />
        
        {/* Admin Only Routes - Full Access */}
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/agencies" 
          element={
            <AdminRoute>
              <AgenciesManagement />
            </AdminRoute>
          } 
        />
        
        {/* Plant Admin & Admin Routes - Vehicles Access */}
        <Route 
          path="/vehicles" 
          element={
            <PlantAdminRoute>
              <VehiclesManagement />
            </PlantAdminRoute>
          } 
        />
        
        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin-login" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
