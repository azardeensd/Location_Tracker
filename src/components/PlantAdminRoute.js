// src/components/PlantAdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PlantAdminRoute = ({ children }) => {
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const plantAdminData = JSON.parse(localStorage.getItem('plantAdminData') || '{}');
  
  // Allow both admin and plant_admin roles
  if (adminData.role === 'admin' || plantAdminData.role === 'plant_admin') {
    return children;
  }
  
  // If no valid role, redirect to login
  return <Navigate to="/admin" replace />;
};

export default PlantAdminRoute;