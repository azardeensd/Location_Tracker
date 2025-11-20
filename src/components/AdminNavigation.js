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

  // Determine header title based on role
  const getHeaderTitle = () => {
    if (currentRole === 'admin') {
      return '🚛 Transporter Admin';
    } else if (currentRole === 'plant_admin') {
      return '🏭 Plant Admin Console';
    } else {
      return '🚛 Transporter Admin';
    }
  };

  const handleLogout = () => {
    // Clear all admin-related storage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('plantAdminToken');
    localStorage.removeItem('plantAdminData');
    localStorage.removeItem('isAdmin');
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
          <h2>{getHeaderTitle()}</h2>
        </div>
        
        {/* Show navigation links for both admin and plant_admin roles */}
        {(currentRole === 'admin' || currentRole === 'plant_admin') && (
          <div className="nav-links">
            {/* Dashboard Link - Show for both roles */}
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActiveLink('/dashboard')}`}
            >
              📊 Dashboard
            </Link>
            
            {/* Show admin-only links */}
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
                <Link 
                  to="/vehicles" 
                  className={`nav-link ${isActiveLink('/vehicles')}`}
                >
                  🚛 Vehicle Management
                </Link>
              </>
            )}
            
            {/* Show plant_admin specific links if needed */}
            {currentRole === 'plant_admin' && (
              <>
                {/* <Link 
                  to="/plant/trips" 
                  className={`nav-link ${isActiveLink('/plant/trips')}`}
                >
                  🗺️ Plant Trips
                </Link> */}
                <Link 
                  to="/vehicles" 
                  className={`nav-link ${isActiveLink('/vehicles')}`}
                >
                  🚚 Plant Vehicles
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right side - User Info and Logout */}
      <div className="nav-right">
        <div className="user-info">
          <span className="username">
            {userData.username || userData.name || userData.email}
          </span>
          <span className={`role-badge ${currentRole}`}>
            {currentRole === 'admin' ? 'Super Admin' : 
             currentRole === 'plant_admin' ? 'Plant Admin' : 'User'}
          </span>
          {/* Show plant name for plant admin */}
          {currentRole === 'plant_admin' && userData.plant_name && (
            <span className="plant-name">
              {userData.plant_name}
            </span>
          )}
        </div>
        
        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </div>
    </nav>
  );
};

export default AdminNavigation;

// // src/components/AdminNavigation.js
// import React from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import './AdminNavigation.css'; // We'll create this CSS file

// const AdminNavigation = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   // Get user data from localStorage
//   const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
//   const plantAdminData = JSON.parse(localStorage.getItem('plantAdminData') || '{}');
  
//   const userData = adminData.role === 'admin' ? adminData : plantAdminData;
//   const currentRole = userData.role;

//   // Determine header title based on role
//   const getHeaderTitle = () => {
//     if (currentRole === 'admin') {
//       return '🚛 Transporter Admin';
//     } else if (currentRole === 'plant_admin') {
//       return '🏭 Plant Admin Console';
//     } else {
//       return '🚛 Transporter Admin';
//     }
//   };

//   const handleLogout = () => {
//     // Clear all admin-related storage
//     localStorage.removeItem('adminToken');
//     localStorage.removeItem('adminData');
//     localStorage.removeItem('plantAdminToken');
//     localStorage.removeItem('plantAdminData');
//     localStorage.removeItem('isAdmin');
//     navigate('/admin');
//   };

//   const isActiveLink = (path) => {
//     return location.pathname === path ? 'active' : '';
//   };

//   return (
//     <nav className="admin-navigation">
//       {/* Left side - Brand and Navigation Links */}
//       <div className="nav-left">
//         <div className="nav-brand">
//           <h2>{getHeaderTitle()}</h2>
//         </div>
        
//         {/* Show navigation links ONLY for admin role */}
//         {currentRole === 'admin' && (
//           <div className="nav-links">
//             <Link 
//               to="/admin/users" 
//               className={`nav-link ${isActiveLink('/admin/users')}`}
//             >
//               👥 User Management
//             </Link>
//             <Link 
//               to="/admin/agencies" 
//               className={`nav-link ${isActiveLink('/admin/agencies')}`}
//             >
//               🏢 Transporter & Plants
//             </Link>
//             <Link 
//               to="/vehicles" 
//               className={`nav-link ${isActiveLink('/vehicles')}`}
//             >
//               🚛 Vehicle Management
//             </Link>
//           </div>
//         )}
//       </div>

//       {/* Right side - User Info and Logout */}
//       <div className="nav-right">
//         <div className="user-info">
//           <span className="username">
//             {userData.username || userData.name || userData.email}
//           </span>
//           <span className={`role-badge ${currentRole}`}>
//             {currentRole === 'admin' ? 'Super Admin' : 
//              currentRole === 'plant_admin' ? 'Plant Admin' : 'User'}
//           </span>
//           {/* Show plant name for plant admin */}
//           {currentRole === 'plant_admin' && userData.plant_name && (
//             <span className="plant-name">
//               {userData.plant_name}
//             </span>
//           )}
//         </div>
        
//         <button onClick={handleLogout} className="logout-btn">
//           🚪 Logout
//         </button>
//       </div>
//     </nav>
//   );
// };

// export default AdminNavigation;

// // // src/components/AdminNavigation.js
// // import React from 'react';
// // import { Link, useNavigate, useLocation } from 'react-router-dom';
// // import './AdminNavigation.css'; // We'll create this CSS file

// // const AdminNavigation = () => {
// //   const navigate = useNavigate();
// //   const location = useLocation();
  
// //   // Get user data from localStorage
// //   const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
// //   const plantAdminData = JSON.parse(localStorage.getItem('plantAdminData') || '{}');
  
// //   const userData = adminData.role === 'admin' ? adminData : plantAdminData;
// //   const currentRole = userData.role;

// //   const handleLogout = () => {
// //     // Clear all admin-related storage
// //     localStorage.removeItem('adminToken');
// //     localStorage.removeItem('adminData');
// //     localStorage.removeItem('plantAdminToken');
// //     localStorage.removeItem('plantAdminData');
// //     navigate('/admin');
// //   };

// //   const isActiveLink = (path) => {
// //     return location.pathname === path ? 'active' : '';
// //   };

// //   return (
// //     <nav className="admin-navigation">
// //       {/* Left side - Brand and Navigation Links */}
// //       <div className="nav-left">
// //         <div className="nav-brand">
// //           <h2>🚛 Transporter Admin</h2>
// //         </div>
        
// //         <div className="nav-links">
// //           {/* Show all links for admin role */}
// //           {currentRole === 'admin' && (
// //             <>
// //               <Link 
// //                 to="/admin/users" 
// //                 className={`nav-link ${isActiveLink('/admin/users')}`}
// //               >
// //                 👥 User Management
// //               </Link>
// //               <Link 
// //                 to="/admin/agencies" 
// //                 className={`nav-link ${isActiveLink('/admin/agencies')}`}
// //               >
// //                 🏢 Transporter & Plants
// //               </Link>
              
// //               {/* Show vehicles link ONLY for admin role */}
// //               <Link 
// //                 to="/vehicles" 
// //                 className={`nav-link ${isActiveLink('/vehicles')}`}
// //               >
// //                 🚛 Vehicle Management
// //               </Link>
// //             </>
// //           )}
// //         </div>
// //       </div>

// //       {/* Right side - User Info and Logout */}
// //       <div className="nav-right">
// //         <div className="user-info">
// //           <span className="username">{userData.username}</span>
// //           <span className={`role-badge ${currentRole}`}>
// //             {currentRole === 'admin' ? 'Super Admin' : 'Plant Admin'}
// //           </span>
// //         </div>
        
// //         <button onClick={handleLogout} className="logout-btn">
// //           🚪 Logout
// //         </button>
// //       </div>
// //     </nav>
// //   );
// // };

// // export default AdminNavigation;