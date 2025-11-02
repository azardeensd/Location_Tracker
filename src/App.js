// import React from 'react';
// import Header from './components/common/Header';
// import DriverPage from './components/pages/DriverPage';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <Header />
//       <DriverPage />
//     </div>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import Login from './components/pages/login';
import DriverPage from './components/pages/DriverPage';
import AdminLogin from './components/pages/AdminLogin'; // Add this
import UserManagement from './components/pages/UserManagement'; // Keep this
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
        
        {/* Admin Routes (No Header) */}
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          } 
        />
        
        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
