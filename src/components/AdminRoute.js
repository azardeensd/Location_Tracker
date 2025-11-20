// src/components/AdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  
  // Only allow admin role
  if (adminData.role === 'admin') {
    return children;
  }
  
  // Redirect to appropriate page based on role
  const plantAdminData = JSON.parse(localStorage.getItem('plantAdminData') || '{}');
  if (plantAdminData.role === 'plant_admin') {
    return <Navigate to="/vehicles" replace />;
  }
  
  // If no valid role, redirect to login
  return <Navigate to="/admin" replace />;
};

export default AdminRoute;