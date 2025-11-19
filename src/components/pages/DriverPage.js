// DriverPage.js - UPDATED WITH COMMON CONTAINER AND HEADER
// DriverPage.js - UPDATED WITH COMMON CONTAINER AND HEADER
import React, { useState, useEffect } from 'react';
import { api, getAddressFromCoordinates, getDeviceId } from '../services/api';
import { api, getAddressFromCoordinates, getDeviceId } from '../services/api';
import styles from './DriverPage.module.css';
import { sendTripEmail, initEmailJS } from '../services/email';
import Header from '../common/Header';
import { sendTripEmail, initEmailJS } from '../services/email';
import Header from '../common/Header';

const DriverPage = () => {
  const [agencies, setAgencies] = useState([]);
  const [filteredAgencies, setFilteredAgencies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [plants, setPlants] = useState([]);
  const [filteredAgencies, setFilteredAgencies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [plants, setPlants] = useState([]);
  const [showStartPopup, setShowStartPopup] = useState(false);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  // Form states
  // Update the startForm initial state
const [startForm, setStartForm] = useState({
  plant: '',
  plant_id: '', // ✅ ADD THIS
  agency_id: '',
  vehicle_id: '',
  driver_name: '',
  driver_contact: '',
  start_lat: '',
  start_lng: '',
  start_address: ''
});

  const [endForm, setEndForm] = useState({
    end_lat: '',
    end_lng: '',
    end_address: ''
    end_lng: '',
    end_address: ''
  });

  useEffect(() => {
    initializeApp();
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Get device ID first
      const currentDeviceId = getDeviceId();
      setDeviceId(currentDeviceId);
      console.log('Device ID:', currentDeviceId);

      // Then load other data
      await loadUserData();
      await loadAgenciesAndPlants();
      await checkActiveTrip();
      initEmailJS();
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const checkActiveTrip = async () => {
    try {
      const { data, error } = await api.getActiveTrip();
      if (!error && data) {
        setActiveTrip(data);
        console.log('Active trip found:', data);
      } else {
        setActiveTrip(null);
      }
    } catch (error) {
      console.error('Error checking active trip:', error);
    }
  };

  // Optimized loadUserData from old version
  const loadUserData = () => {
    return new Promise((resolve) => {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        try {
          const user = JSON.parse(userDataString);
          console.log('Loaded user data:', user);
          
          // Only update state if data actually changed
          setUserData(prevUser => {
            if (JSON.stringify(prevUser) === JSON.stringify(user)) {
              return prevUser;
            }
            return user;
          });
          
          // Pre-fill the form with user data
          setStartForm(prev => {
            const newForm = {
              ...prev,
              plant: user.plant || '',
              agency_id: user.agency_id ? user.agency_id.toString() : ''
            };
            
            // Only update if something actually changed
            if (JSON.stringify(prev) === JSON.stringify(newForm)) {
              return prev;
            }
            return newForm;
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
      resolve();
    });
  };

  // Optimized loadAgenciesAndPlants from old version
  const loadAgenciesAndPlants = async () => {
  try {
    const { data, error } = await api.getAgencies();
    if (!error && data) {
      setAgencies(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data)) {
          return prev;
        }
        return data;
      });
      
      const userDataString = localStorage.getItem('userData');
      const currentUser = userDataString ? JSON.parse(userDataString) : null;
      
      if (currentUser && currentUser.agency_id) {
        const userAgency = data.find(agency => agency.id === currentUser.agency_id);
        console.log('Found user agency:', userAgency);
        
        if (userAgency) {
          setFilteredAgencies(prev => {
            if (JSON.stringify(prev) === JSON.stringify([userAgency])) {
              return prev;
            }
            return [userAgency];
          });
          
          // Load vehicles for user's agency
          await loadVehicles(userAgency.id);
          
          // UPDATE: Get plant_id from agency
          const plantId = userAgency.plant_id;
          const plantName = userAgency.plants?.name || currentUser.plant || '';
          
          // Update form with agency data including plant_id
          setStartForm(prev => {
            const newForm = {
              ...prev,
              plant: plantName,
              plant_id: plantId, // ✅ ADD THIS
              agency_id: userAgency.id.toString()
            };
            
            if (JSON.stringify(prev) === JSON.stringify(newForm)) {
              return prev;
            }
            return newForm;
          });
        }
      } else {
          // Admin view - extract plants
          const uniquePlants = [...new Set(data.map(agency => agency.plant))]
            .filter(plant => plant && plant.trim() !== '')
            .map((plant, index) => ({ 
              id: index + 1, 
              name: plant 
            }));
          
          setPlants(prev => {
            if (JSON.stringify(prev) === JSON.stringify(uniquePlants)) {
              return prev;
            }
            return uniquePlants;
          });
        }
      }
    } catch (error) {
      console.error('Error loading agencies and plants:', error);
      console.error('Error loading agencies and plants:', error);
    }
  };

  // UPDATED: Load only active vehicles
  const loadVehicles = async (agencyId) => {
  // UPDATED: Load only active vehicles
  const loadVehicles = async (agencyId) => {
    try {
      if (!agencyId) {
        setVehicles([]);
        return;
      }
      
      const { data, error } = await api.getVehiclesByAgency(agencyId);
      if (!agencyId) {
        setVehicles([]);
        return;
      }
      
      const { data, error } = await api.getVehiclesByAgency(agencyId);
      if (!error && data) {
        // Filter only active vehicles
        const activeVehicles = data.filter(vehicle => vehicle.status === 'active');
        console.log(`📊 Vehicles loaded: ${data.length} total, ${activeVehicles.length} active`);
        setVehicles(activeVehicles);
      } else {
        setVehicles([]);
        // Filter only active vehicles
        const activeVehicles = data.filter(vehicle => vehicle.status === 'active');
        console.log(`📊 Vehicles loaded: ${data.length} total, ${activeVehicles.length} active`);
        setVehicles(activeVehicles);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    }
  };

  // Enhanced getCurrentLocation from old version with better error handling
  const getCurrentLocation = async (type) => {
  // Enhanced getCurrentLocation from old version with better error handling
  const getCurrentLocation = async (type) => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    let position = null;

    try {
      position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use the imported function from api.js
      const address = await getAddressFromCoordinates(latitude, longitude);
      
      if (type === 'start') {
        setStartForm(prev => ({
          ...prev,
          start_lat: latitude.toFixed(6),
          start_lng: longitude.toFixed(6),
          start_address: address
        }));
      } else {
        setEndForm(prev => ({
          ...prev,
          end_lat: latitude.toFixed(6),
          end_lng: longitude.toFixed(6),
          end_address: address
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Error getting location. Please try again or check your connection.');
      
      if (position && position.coords) {
        const { latitude, longitude } = position.coords;
        if (type === 'start') {
          setStartForm(prev => ({
            ...prev,
            start_lat: latitude.toFixed(6),
            start_lng: longitude.toFixed(6),
            start_address: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
        } else {
          setEndForm(prev => ({
            ...prev,
            end_lat: latitude.toFixed(6),
            end_lng: longitude.toFixed(6),
            end_address: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
        }
      } else {
        if (type === 'start') {
          setStartForm(prev => ({
            ...prev,
            start_address: 'Location access denied or unavailable'
          }));
        } else {
          setEndForm(prev => ({
            ...prev,
            end_address: 'Location access denied or unavailable'
          }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (startLat, startLng, endLat, endLng) => {
    const R = 6371; // Earth's radius in km
    const dLat = (endLat - startLat) * Math.PI / 180;
    const dLng = (endLng - startLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  // Enhanced handleStartTrip with device validation
  const handleStartTrip = async (e) => {
  e.preventDefault();
  
  // Validate contact number
  if (startForm.driver_contact.length !== 10) {
    alert('Please enter a valid 10-digit contact number');
    return;
  }
  
  // Validate driver name
  if (!/^[A-Za-z\s]+$/.test(startForm.driver_name.trim())) {
    alert('Please enter a valid driver name (letters and spaces only)');
    return;
  }

  setLoading(true);

  try {
    // Check if device already has active trip
    const { data: existingTrip, error: checkError } = await api.checkDeviceActiveTrip(deviceId);
    if (!checkError && existingTrip) {
      alert('You already have an active trip. Please end it before starting a new one.');
      setLoading(false);
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === parseInt(startForm.vehicle_id));
    
    // UPDATE: Include plant_id in trip data
    const tripData = {
      ...startForm,
      status: "active",
      agency_id: parseInt(startForm.agency_id),
      vehicle_id: parseInt(startForm.vehicle_id),
      vehicle_number: selectedVehicle?.vehicle_number,
      plant: startForm.plant,
      plant_id: startForm.plant_id, // ✅ ADD THIS
      start_lat: parseFloat(startForm.start_lat),
      start_lng: parseFloat(startForm.start_lng),
      start_address: startForm.start_address,
      start_time: new Date().toISOString()
    };

    console.log('Starting trip with plant_id:', startForm.plant_id); // Debug log

    const { data, error } = await api.startTrip(tripData);
    
    if (!error && data) {
      setActiveTrip(data);
      setShowStartPopup(false);
      // UPDATE: Reset form including plant_id
      setStartForm({ 
        plant: userData ? startForm.plant : '',
        plant_id: userData ? startForm.plant_id : '', // ✅ ADD THIS
        agency_id: userData ? startForm.agency_id : '',
        vehicle_id: '', 
        driver_name: '', 
        driver_contact: '', 
        start_lat: '', 
        start_lng: '',
        start_address: '' 
      });
      setVehicles([]);
      alert('Trip started successfully!');
    } else {
      alert('Error starting trip: ' + error?.message);
    }
  } catch (error) {
    alert('Error starting trip: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const handleEndTrip = async (e) => {
  const handleEndTrip = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endTime = new Date().toISOString();
      const distance = calculateDistance(
        activeTrip.start_lat,
        activeTrip.start_lng,
        activeTrip.start_lat,
        activeTrip.start_lng,
        parseFloat(endForm.end_lat),
        parseFloat(endForm.end_lng)
      );

      const endData = {
        end_lat: parseFloat(endForm.end_lat),
        end_lng: parseFloat(endForm.end_lng),
        end_address: endForm.end_address,
        end_address: endForm.end_address,
        end_time: endTime,
        distance_km: parseFloat(distance),
        status: 'completed'
      };

      const { data, error } = await api.endTrip(activeTrip.id, endData);
      const { data, error } = await api.endTrip(activeTrip.id, endData);
      
      if (!error && data) {
        const emailResult = await sendCompletionEmail(data, distance, endTime);
        
        setActiveTrip(null);
        const emailResult = await sendCompletionEmail(data, distance, endTime);
        
        setActiveTrip(null);
        setShowEndPopup(false);
        setEndForm({ end_lat: '', end_lng: '', end_address: '' });
        setEndForm({ end_lat: '', end_lng: '', end_address: '' });
        
        if (emailResult.success) {
          alert(`Trip completed! Distance: ${distance} km\nEmail notification has been sent successfully.`);
        } else {
          alert(`Trip completed! Distance: ${distance} km\nBut email failed to send: ${emailResult.message}`);
        }
      } else {
        alert('Error ending trip: ' + error?.message);
      }
    } catch (error) {
      alert('Error ending trip: ' + error.message);
      alert('Error ending trip: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendCompletionEmail = async (tripData, distance, endTime) => {
    try {
      const agency = agencies.find(a => a.id === tripData.agency_id);
      
      if (!agency) {
        return { success: false, message: 'Agency not found' };
      }

      if (!agency.email) {
        return { success: false, message: 'Agency email not available' };
      }

      // Calculate duration
      const startTime = new Date(tripData.start_time);
      const endTimeDate = new Date(endTime);
      const durationMs = endTimeDate - startTime;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const duration = `${hours}h ${minutes}m`;

      // Format dates
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      };

      const emailData = {
        agency_email: agency.email,
        subject: `MANUAL TRIP-MARKET VEHICLE-${tripData.vehicle_number || 'N/A'}`,
        agency_name: agency.name,
        plant: tripData.plant,
        vehicle_number: tripData.vehicle_number || 'N/A',
        driver_name: tripData.driver_name,
        driver_contact: tripData.driver_contact,
        start_time: formatDate(tripData.start_time),
        end_time: formatDate(endTime),
        start_lat: tripData.start_lat,
        start_lng: tripData.start_lng,
        end_lat: tripData.end_lat,
        end_lng: tripData.end_lng,
        start_address: tripData.start_address,
        end_address: tripData.end_address,
        distance: distance,
        duration: duration,
        trip_id: tripData.id.toString(),
        current_date: new Date().toLocaleDateString('en-GB')
      };

      console.log('Sending email with data:', emailData);
      const result = await sendTripEmail(emailData);
      return result;

    } catch (error) {
      console.error('Error in sendCompletionEmail:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  };

  const sendCompletionEmail = async (tripData, distance, endTime) => {
    try {
      const agency = agencies.find(a => a.id === tripData.agency_id);
      
      if (!agency) {
        return { success: false, message: 'Agency not found' };
      }

      if (!agency.email) {
        return { success: false, message: 'Agency email not available' };
      }

      // Calculate duration
      const startTime = new Date(tripData.start_time);
      const endTimeDate = new Date(endTime);
      const durationMs = endTimeDate - startTime;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const duration = `${hours}h ${minutes}m`;

      // Format dates
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      };

      const emailData = {
        agency_email: agency.email,
        subject: `MANUAL TRIP-MARKET VEHICLE-${tripData.vehicle_number || 'N/A'}`,
        agency_name: agency.name,
        plant: tripData.plant,
        vehicle_number: tripData.vehicle_number || 'N/A',
        driver_name: tripData.driver_name,
        driver_contact: tripData.driver_contact,
        start_time: formatDate(tripData.start_time),
        end_time: formatDate(endTime),
        start_lat: tripData.start_lat,
        start_lng: tripData.start_lng,
        end_lat: tripData.end_lat,
        end_lng: tripData.end_lng,
        start_address: tripData.start_address,
        end_address: tripData.end_address,
        distance: distance,
        duration: duration,
        trip_id: tripData.id.toString(),
        current_date: new Date().toLocaleDateString('en-GB')
      };

      console.log('Sending email with data:', emailData);
      const result = await sendTripEmail(emailData);
      return result;

    } catch (error) {
      console.error('Error in sendCompletionEmail:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <div className={styles.driverPage}>
        <div className={styles.container}>
          {/* Device info for debugging */}
          {process.env.NODE_ENV === 'development' && deviceId && (
            <div style={{ padding: '5px', marginBottom: '10px', borderRadius: '5px', fontSize: '12px' }}>
              {/* <strong>Device ID:</strong> {deviceId} */}
            </div>
          )}
          
          <div className={styles.statusCard}>
            <h2 className={styles.statusTitle}>
              {activeTrip ? '🚗 Trip in Progress' : '✅ Ready to Start'}
            </h2>
            
            {activeTrip ? (
              <div className={styles.activeTripDetails}>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Plant :</span>
                  <span className={styles.value}>{activeTrip.plant}</span>
                </div>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Transporter :</span>
                  <span className={styles.value}>
                    {agencies.find(a => a.id === activeTrip.agency_id)?.name}
                  </span>
                </div>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Vehicle No :</span>
                  <span className={styles.value}>{activeTrip.vehicle_number}</span>
                </div>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Driver :</span>
                  <span className={styles.value}>{activeTrip.driver_name}</span>
                </div>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Start Date & Time :</span>
                  <span className={styles.value}>
                    {new Date(activeTrip.start_time).toLocaleString()}
                  </span>
                </div>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Start Location :</span>
                  <span className={styles.value}>{activeTrip.start_address}</span>
                </div>
              </div>
            ) : (
              <p className={styles.statusText}>
                {/* Empty state text if needed */}
              </p>
            )}
          </div>
    <div className={styles.pageWrapper}>
      <Header />
      <div className={styles.driverPage}>
        <div className={styles.container}>
          {/* Device info for debugging */}
          {process.env.NODE_ENV === 'development' && deviceId && (
            <div style={{ padding: '5px', marginBottom: '10px', borderRadius: '5px', fontSize: '12px' }}>
              {/* <strong>Device ID:</strong> {deviceId} */}
            </div>
          )}
          
          <div className={styles.statusCard}>
            <h2 className={styles.statusTitle}>
              {activeTrip ? '🚗 Trip in Progress' : '✅ Ready to Start'}
            </h2>
            
            {activeTrip ? (
              <div className={styles.activeTripDetails}>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Plant :</span>
                  <span className={styles.value}>{activeTrip.plant}</span>
                </div>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Transporter :</span>
                  <span className={styles.value}>
                    {agencies.find(a => a.id === activeTrip.agency_id)?.name}
                  </span>
                </div>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Vehicle No :</span>
                  <span className={styles.value}>{activeTrip.vehicle_number}</span>
                </div>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Driver :</span>
                  <span className={styles.value}>{activeTrip.driver_name}</span>
                </div>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Start Date & Time :</span>
                  <span className={styles.value}>
                    {new Date(activeTrip.start_time).toLocaleString()}
                  </span>
                </div>
                <div className={styles.statusLine}>
                  <span className={styles.label}>Start Location :</span>
                  <span className={styles.value}>{activeTrip.start_address}</span>
                </div>
              </div>
            ) : (
              <p className={styles.statusText}>
                {/* Empty state text if needed */}
              </p>
            )}
          </div>

          <div className={styles.controls}>
            {!activeTrip ? (
              <button 
                className={`${styles.btn} ${styles.startBtn}`}
                onClick={() => setShowStartPopup(true)}
                disabled={loading}
              >
                🚗 Start Trip
              </button>
            ) : (
              <button 
                className={`${styles.btn} ${styles.endBtn}`}
                onClick={() => setShowEndPopup(true)}
                disabled={loading}
              >
                🏁 End Trip
              </button>
            )}
          </div>
          <div className={styles.controls}>
            {!activeTrip ? (
              <button 
                className={`${styles.btn} ${styles.startBtn}`}
                onClick={() => setShowStartPopup(true)}
                disabled={loading}
              >
                🚗 Start Trip
              </button>
            ) : (
              <button 
                className={`${styles.btn} ${styles.endBtn}`}
                onClick={() => setShowEndPopup(true)}
                disabled={loading}
              >
                🏁 End Trip
              </button>
            )}
          </div>

          {/* Start Trip Popup */}
          {showStartPopup && (
            <div className={styles.popupOverlay}>
              <div className={styles.popup}>
                <div className={styles.popupHeader}>
                  <h3>Start New Trip</h3>
                  <button 
                    className={styles.closeBtn}
                    onClick={() => {
                      setShowStartPopup(false);
                      setVehicles([]);
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleStartTrip} className={styles.form}>
                  {/* 1. Plant - Auto-filled and read-only */}
                  <div className={styles.formGroup}>
                    
                    <input 
                      type="text"
                      value={startForm.plant}
                      readOnly
                      className={styles.readonlyInput}
                      placeholder="Plant will be auto-filled"
                    />
                  </div>

                  {/* 2. Transporter (Agency) - Auto-filled and read-only */}
                  <div className={styles.formGroup}>
                    
                    <input 
                      type="text"
                      value={filteredAgencies.find(a => a.id === parseInt(startForm.agency_id))?.name || ''}
                      readOnly
                      className={styles.readonlyInput}
                      placeholder="Transporter will be auto-filled"
                    />
                  </div>

                  {/* 3. Vehicle Number - User selects from their agency's ACTIVE vehicles */}
                  <div className={styles.formGroup}>
                    
                    <select 
                      value={startForm.vehicle_id}
                      onChange={(e) => setStartForm(prev => ({...prev, vehicle_id: e.target.value}))}
                      required
                      disabled={!startForm.agency_id || vehicles.length === 0}
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_number} {vehicle.status === 'inactive' ? '(Inactive)' : ''}
                        </option>
                      ))}
                    </select>
                    {startForm.agency_id && vehicles.length === 0 && (
                      <p className={styles.noData}>No active vehicles found for your agency</p>
                    )}
                    
                  </div>
          {/* Start Trip Popup */}
          {showStartPopup && (
            <div className={styles.popupOverlay}>
              <div className={styles.popup}>
                <div className={styles.popupHeader}>
                  <h3>Start New Trip</h3>
                  <button 
                    className={styles.closeBtn}
                    onClick={() => {
                      setShowStartPopup(false);
                      setVehicles([]);
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleStartTrip} className={styles.form}>
                  {/* 1. Plant - Auto-filled and read-only */}
                  <div className={styles.formGroup}>
                    
                    <input 
                      type="text"
                      value={startForm.plant}
                      readOnly
                      className={styles.readonlyInput}
                      placeholder="Plant will be auto-filled"
                    />
                  </div>

                  {/* 2. Transporter (Agency) - Auto-filled and read-only */}
                  <div className={styles.formGroup}>
                    
                    <input 
                      type="text"
                      value={filteredAgencies.find(a => a.id === parseInt(startForm.agency_id))?.name || ''}
                      readOnly
                      className={styles.readonlyInput}
                      placeholder="Transporter will be auto-filled"
                    />
                  </div>

                  {/* 3. Vehicle Number - User selects from their agency's ACTIVE vehicles */}
                  <div className={styles.formGroup}>
                    
                    <select 
                      value={startForm.vehicle_id}
                      onChange={(e) => setStartForm(prev => ({...prev, vehicle_id: e.target.value}))}
                      required
                      disabled={!startForm.agency_id || vehicles.length === 0}
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_number} {vehicle.status === 'inactive' ? '(Inactive)' : ''}
                        </option>
                      ))}
                    </select>
                    {startForm.agency_id && vehicles.length === 0 && (
                      <p className={styles.noData}>No active vehicles found for your agency</p>
                    )}
                    
                  </div>

                  {/* 4. Driver Name - User enters */}
                  <div className={styles.formGroup}>
                    
                    <input 
                      type="text"
                      value={startForm.driver_name}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow only letters and spaces
                        if (/^[A-Za-z\s]*$/.test(value)) {
                          setStartForm(prev => ({...prev, driver_name: value}));
                        }
                      }}
                      placeholder="Enter driver name"
                      required
                      pattern="[A-Za-z\s]+"
                      title="Please enter only letters and spaces"
                    />
                    {startForm.driver_name && !/^[A-Za-z\s]+$/.test(startForm.driver_name) && (
                      <p className={styles.errorText}>Only letters and spaces are allowed</p>
                    )}
                  </div>

                  {/* 5. Contact Number - User enters */}
                  <div className={styles.formGroup}>
                    
                    <input 
                      type="tel"
                      value={startForm.driver_contact}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Remove any non-digit characters
                        value = value.replace(/\D/g, '');
                        // Limit to 10 digits
                        if (value.length <= 10) {
                          setStartForm(prev => ({...prev, driver_contact: value}));
                        }
                      }}
                      placeholder="Enter mobile number"
                      required
                      maxLength="10"
                    />
                  </div>

                  {/* 6. Get Geo Location Button */}
                  <div className={styles.formGroup}>
                    
                    <button 
                      type="button"
                      className={styles.locationBtn}
                      onClick={() => getCurrentLocation('start')}
                      disabled={loading}
                    >
                      📍 Get Current Location
                    </button>
                    
                    <div className={styles.coordinatesDisplay}>
                      <div className={styles.coordinateField}>
                        <span className={styles.coordinateLabel}>Address:</span>
                        <textarea 
                          value={startForm.start_address}
                          readOnly
                          className={styles.addressInput}
                          placeholder="Address will appear here after getting location"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 6. Get Geo Location Button */}
                  <div className={styles.formGroup}>
                    
                    <button 
                      type="button"
                      className={styles.locationBtn}
                      onClick={() => getCurrentLocation('start')}
                      disabled={loading}
                    >
                      📍 Get Current Location
                    </button>
                    
                    <div className={styles.coordinatesDisplay}>
                      <div className={styles.coordinateField}>
                        <span className={styles.coordinateLabel}>Address:</span>
                        <textarea 
                          value={startForm.start_address}
                          readOnly
                          className={styles.addressInput}
                          placeholder="Address will appear here after getting location"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className={styles.formActions}>
                    <button 
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loading || !startForm.start_lat || !startForm.start_lng || startForm.driver_contact.length !== 10 || !startForm.vehicle_id}
                    >
                      {loading ? 'Starting...' : 'Start Trip'}
                    </button>
                  
                  </div>
                </form>
              </div>
            </div>
          )}
                  {/* Form Actions */}
                  <div className={styles.formActions}>
                    <button 
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loading || !startForm.start_lat || !startForm.start_lng || startForm.driver_contact.length !== 10 || !startForm.vehicle_id}
                    >
                      {loading ? 'Starting...' : 'Start Trip'}
                    </button>
                  
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* End Trip Popup */}
          {showEndPopup && activeTrip && (
            <div className={styles.popupOverlay}>
              <div className={styles.popup}>
                <div className={styles.popupHeader}>
                  <h3>End Trip</h3>
                  <button 
                    className={styles.closeBtn}
                    onClick={() => setShowEndPopup(false)}
                  >
                    ✕
                  </button>
                </div>
          {/* End Trip Popup */}
          {showEndPopup && activeTrip && (
            <div className={styles.popupOverlay}>
              <div className={styles.popup}>
                <div className={styles.popupHeader}>
                  <h3>End Trip</h3>
                  <button 
                    className={styles.closeBtn}
                    onClick={() => setShowEndPopup(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.TripInfo}>
                  <p><strong>Driver:</strong> {activeTrip.driver_name}</p>
                  <p><strong>Contact:</strong> {activeTrip.driver_contact}</p>
                  <p><strong>Vehicle:</strong> {activeTrip.vehicle_number}</p>
                  <p><strong>Agency:</strong> {agencies.find(a => a.id === activeTrip.agency_id)?.name}</p>
                  <p><strong>Plant:</strong> {activeTrip.plant}</p>
                  <p><strong>Start Time:</strong> {new Date(activeTrip.start_time).toLocaleString()}</p>
                </div>
                
                <form onSubmit={handleEndTrip} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label>End Location</label>
                    <div className={styles.coordinatesDisplay}>
                      <div className={styles.coordinateField}>
                        <span className={styles.coordinateLabel}>Address:</span>
                        <textarea 
                          value={endForm.end_address}
                          readOnly
                          className={styles.addressInput}
                          placeholder="Address will appear here after getting location"
                          rows="3"
                        />
                      </div>
                    </div>
                    <button 
                      type="button"
                      className={styles.locationBtn}
                      onClick={() => getCurrentLocation('end')}
                      disabled={loading}
                    >
                      📍 Get Current Location
                    </button>
                  </div>
                <div className={styles.TripInfo}>
                  <p><strong>Driver:</strong> {activeTrip.driver_name}</p>
                  <p><strong>Contact:</strong> {activeTrip.driver_contact}</p>
                  <p><strong>Vehicle:</strong> {activeTrip.vehicle_number}</p>
                  <p><strong>Agency:</strong> {agencies.find(a => a.id === activeTrip.agency_id)?.name}</p>
                  <p><strong>Plant:</strong> {activeTrip.plant}</p>
                  <p><strong>Start Time:</strong> {new Date(activeTrip.start_time).toLocaleString()}</p>
                </div>
                
                <form onSubmit={handleEndTrip} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label>End Location</label>
                    <div className={styles.coordinatesDisplay}>
                      <div className={styles.coordinateField}>
                        <span className={styles.coordinateLabel}>Address:</span>
                        <textarea 
                          value={endForm.end_address}
                          readOnly
                          className={styles.addressInput}
                          placeholder="Address will appear here after getting location"
                          rows="3"
                        />
                      </div>
                    </div>
                    <button 
                      type="button"
                      className={styles.locationBtn}
                      onClick={() => getCurrentLocation('end')}
                      disabled={loading}
                    >
                      📍 Get Current Location
                    </button>
                  </div>

                  <div className={styles.formActions}>
                    <button 
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setShowEndPopup(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loading || !endForm.end_lat || !endForm.end_lng}
                    >
                      {loading ? 'Ending...' : 'End Trip'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
                  <div className={styles.formActions}>
                    <button 
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setShowEndPopup(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loading || !endForm.end_lat || !endForm.end_lng}
                    >
                      {loading ? 'Ending...' : 'End Trip'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverPage;

// // DriverPage.js - UPDATED DEVICE ID VERSION
// import React, { useState, useEffect } from 'react';
// import { api, getAddressFromCoordinates, getDeviceId } from '../services/api';
// import styles from './DriverPage.module.css';
// import { sendTripEmail, initEmailJS } from '../services/email';

// const DriverPage = () => {
//   const [agencies, setAgencies] = useState([]);
//   const [filteredAgencies, setFilteredAgencies] = useState([]);
//   const [vehicles, setVehicles] = useState([]);
//   const [plants, setPlants] = useState([]);
//   const [showStartPopup, setShowStartPopup] = useState(false);
//   const [showEndPopup, setShowEndPopup] = useState(false);
//   const [activeTrip, setActiveTrip] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [userData, setUserData] = useState(null);
//   const [deviceId, setDeviceId] = useState(null);

//   // Form states
//   const [startForm, setStartForm] = useState({
//     plant: '',
//     agency_id: '',
//     vehicle_id: '',
//     driver_name: '',
//     driver_contact: '',
//     start_lat: '',
//     start_lng: '',
//     start_address: ''
//   });

//   const [endForm, setEndForm] = useState({
//     end_lat: '',
//     end_lng: '',
//     end_address: ''
//   });

//   useEffect(() => {
//     initializeApp();
//   }, []);

//   const initializeApp = async () => {
//     try {
//       // Get device ID first
//       const currentDeviceId = getDeviceId();
//       setDeviceId(currentDeviceId);
//       console.log('Device ID:', currentDeviceId);

//       // Then load other data
//       await loadUserData();
//       await loadAgenciesAndPlants();
//       await checkActiveTrip();
//       initEmailJS();
//     } catch (error) {
//       console.error('Error initializing app:', error);
//     }
//   };

//   const checkActiveTrip = async () => {
//     try {
//       const { data, error } = await api.getActiveTrip();
//       if (!error && data) {
//         setActiveTrip(data);
//         console.log('Active trip found:', data);
//       } else {
//         setActiveTrip(null);
//       }
//     } catch (error) {
//       console.error('Error checking active trip:', error);
//     }
//   };

//   const loadUserData = () => {
//     const userDataString = localStorage.getItem('userData');
//     if (userDataString) {
//       const user = JSON.parse(userDataString);
//       setUserData(user);
//     }
//   };

//   const loadAgenciesAndPlants = async () => {
//     try {
//       const { data, error } = await api.getAgencies();
//       if (!error && data) {
//         setAgencies(data);
        
//         if (userData && userData.agency_id) {
//           const userAgency = data.find(agency => agency.id === userData.agency_id);
//           if (userAgency) {
//             setStartForm(prev => ({
//               ...prev,
//               plant: userAgency.plant,
//               agency_id: userAgency.id.toString()
//             }));
//             setFilteredAgencies([userAgency]);
//             loadVehicles(userAgency.id);
//           }
//         } else {
//           const uniquePlants = [...new Set(data.map(agency => agency.plant))]
//             .filter(plant => plant && plant.trim() !== '')
//             .map((plant, index) => ({ 
//               id: index + 1, 
//               name: plant 
//             }));
//           setPlants(uniquePlants);
//         }
//       }
//     } catch (error) {
//       console.error('Error loading agencies and plants:', error);
//     }
//   };

//   const loadVehicles = async (agencyId) => {
//     try {
//       if (!agencyId) {
//         setVehicles([]);
//         return;
//       }
      
//       const { data, error } = await api.getVehiclesByAgency(agencyId);
//       if (!error && data) {
//         setVehicles(data);
//       } else {
//         setVehicles([]);
//       }
//     } catch (error) {
//       console.error('Error loading vehicles:', error);
//       setVehicles([]);
//     }
//   };

//   const getCurrentLocation = async (type) => {
//     setLoading(true);
//     if (!navigator.geolocation) {
//       alert('Geolocation is not supported by your browser');
//       setLoading(false);
//       return;
//     }

//     try {
//       const position = await new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 15000,
//           maximumAge: 0
//         });
//       });

//       const { latitude, longitude } = position.coords;
//       const address = await getAddressFromCoordinates(latitude, longitude);
      
//       if (type === 'start') {
//         setStartForm(prev => ({
//           ...prev,
//           start_lat: latitude.toFixed(6),
//           start_lng: longitude.toFixed(6),
//           start_address: address
//         }));
//       } else {
//         setEndForm(prev => ({
//           ...prev,
//           end_lat: latitude.toFixed(6),
//           end_lng: longitude.toFixed(6),
//           end_address: address
//         }));
//       }
//     } catch (error) {
//       console.error('Error getting location:', error);
//       alert('Error getting location. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateDistance = (startLat, startLng, endLat, endLng) => {
//     const R = 6371;
//     const dLat = (endLat - startLat) * Math.PI / 180;
//     const dLng = (endLng - startLng) * Math.PI / 180;
//     const a = 
//       Math.sin(dLat/2) * Math.sin(dLat/2) +
//       Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
//       Math.sin(dLng/2) * Math.sin(dLng/2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     return (R * c).toFixed(2);
//   };

//   const handleStartTrip = async (e) => {
//     e.preventDefault();
    
//     if (startForm.driver_contact.length !== 10) {
//       alert('Please enter a valid 10-digit contact number');
//       return;
//     }
    
//     if (!/^[A-Za-z\s]+$/.test(startForm.driver_name.trim())) {
//       alert('Please enter a valid driver name (letters and spaces only)');
//       return;
//     }

//     setLoading(true);

//     try {
//       // Check if device already has active trip
//       const { data: existingTrip, error: checkError } = await api.checkDeviceActiveTrip(deviceId);
//       if (!checkError && existingTrip) {
//         alert('You already have an active trip. Please end it before starting a new one.');
//         setLoading(false);
//         return;
//       }

//       const selectedVehicle = vehicles.find(v => v.id === parseInt(startForm.vehicle_id));
      
//       const tripData = {
//         ...startForm,
//         agency_id: parseInt(startForm.agency_id),
//         vehicle_id: parseInt(startForm.vehicle_id),
//         vehicle_number: selectedVehicle?.vehicle_number,
//         plant: startForm.plant,
//         start_lat: parseFloat(startForm.start_lat),
//         start_lng: parseFloat(startForm.start_lng),
//         start_address: startForm.start_address,
//         start_time: new Date().toISOString()
//       };

//       const { data, error } = await api.startTrip(tripData);
      
//       if (!error && data) {
//         setActiveTrip(data);
//         setShowStartPopup(false);
//         setStartForm({ 
//           plant: userData ? startForm.plant : '',
//           agency_id: userData ? startForm.agency_id : '',
//           vehicle_id: '', 
//           driver_name: '', 
//           driver_contact: '', 
//           start_lat: '', 
//           start_lng: '',
//           start_address: '' 
//         });
//         setVehicles([]);
//         alert('Trip started successfully!');
//       } else {
//         alert('Error starting trip: ' + error?.message);
//       }
//     } catch (error) {
//       alert('Error starting trip: ' + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEndTrip = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const endTime = new Date().toISOString();
//       const distance = calculateDistance(
//         activeTrip.start_lat,
//         activeTrip.start_lng,
//         parseFloat(endForm.end_lat),
//         parseFloat(endForm.end_lng)
//       );

//       const endData = {
//         end_lat: parseFloat(endForm.end_lat),
//         end_lng: parseFloat(endForm.end_lng),
//         end_address: endForm.end_address,
//         end_time: endTime,
//         distance_km: parseFloat(distance),
//         status: 'completed'
//       };

//       const { data, error } = await api.endTrip(activeTrip.id, endData);
      
//       if (!error && data) {
//         const emailResult = await sendCompletionEmail(data, distance, endTime);
        
//         setActiveTrip(null);
//         setShowEndPopup(false);
//         setEndForm({ end_lat: '', end_lng: '', end_address: '' });
        
//         if (emailResult.success) {
//           alert(`Trip completed! Distance: ${distance} km\nEmail notification has been sent successfully.`);
//         } else {
//           alert(`Trip completed! Distance: ${distance} km\nBut email failed to send: ${emailResult.message}`);
//         }
//       } else {
//         alert('Error ending trip: ' + error?.message);
//       }
//     } catch (error) {
//       alert('Error ending trip: ' + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const sendCompletionEmail = async (tripData, distance, endTime) => {
//     // Your existing email function
//     try {
//       const agency = agencies.find(a => a.id === tripData.agency_id);
//       if (!agency || !agency.email) {
//         return { success: false, message: 'Agency email not available' };
//       }

//       const startTime = new Date(tripData.start_time);
//       const endTimeDate = new Date(endTime);
//       const durationMs = endTimeDate - startTime;
//       const hours = Math.floor(durationMs / (1000 * 60 * 60));
//       const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
//       const duration = `${hours}h ${minutes}m`;

//       const formatDate = (dateString) => {
//         const date = new Date(dateString);
//         return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { 
//           hour: '2-digit', 
//           minute: '2-digit' 
//         });
//       };

//       const emailData = {
//         agency_email: agency.email,
//         subject: `MANUAL TRIP-MARKET VEHICLE-${tripData.vehicle_number || 'N/A'}`,
//         agency_name: agency.name,
//         plant: tripData.plant,
//         vehicle_number: tripData.vehicle_number || 'N/A',
//         driver_name: tripData.driver_name,
//         driver_contact: tripData.driver_contact,
//         start_time: formatDate(tripData.start_time),
//         end_time: formatDate(endTime),
//         start_lat: tripData.start_lat,
//         start_lng: tripData.start_lng,
//         end_lat: tripData.end_lat,
//         end_lng: tripData.end_lng,
//         start_address: tripData.start_address,
//         end_address: tripData.end_address,
//         distance: distance,
//         duration: duration,
//         trip_id: tripData.id.toString(),
//         current_date: new Date().toLocaleDateString('en-GB')
//       };

//       console.log('Sending email with data:', emailData);
//       const result = await sendTripEmail(emailData);
//       return result;

//     } catch (error) {
//       console.error('Error in sendCompletionEmail:', error);
//       return { 
//         success: false, 
//         message: error.message 
//       };
//     }
//   };

//   return (
//     <div className={styles.driverPage}>
//       <div className={styles.container}>
//         {/* Device info for debugging */}
//         {process.env.NODE_ENV === 'development' && deviceId && (
//           <div style={{ background: '#f0f0f0', padding: '5px', marginBottom: '10px', borderRadius: '5px', fontSize: '12px' }}>
//             <strong>Device ID:</strong> {deviceId}
//           </div>
//         )}
        
//         <div className={styles.statusCard}>
//           <h2 className={styles.statusTitle}>
//             {activeTrip ? '🚗 Trip in Progress' : '✅ Ready to Start'}
//           </h2>
          
//           {activeTrip ? (
//             <div className={styles.activeTripDetails}>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Plant:</span>
//                 <span className={styles.value}>{activeTrip.plant}</span>
//               </div>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Transporter:</span>
//                 <span className={styles.value}>
//                   {agencies.find(a => a.id === activeTrip.agency_id)?.name}
//                 </span>
//               </div>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Vehicle No:</span>
//                 <span className={styles.value}>{activeTrip.vehicle_number}</span>
//               </div>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Driver:</span>
//                 <span className={styles.value}>{activeTrip.driver_name}</span>
//               </div>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Start time:</span>
//                 <span className={styles.value}>
//                   {new Date(activeTrip.start_time).toLocaleTimeString()}
//                 </span>
//               </div>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Status:</span>
//                 <span className={`${styles.value} ${styles.activeStatus}`}>
//                   ● Active
//                 </span>
//               </div>
//             </div>
//           ) : (
//             <p className={styles.statusText}>
//               Click Start to begin a new trip.
//             </p>
//           )}
//         </div>

//         <div className={styles.controls}>
//           {!activeTrip ? (
//             <button 
//               className={`${styles.btn} ${styles.startBtn}`}
//               onClick={() => setShowStartPopup(true)}
//               disabled={loading}
//             >
//               🚗 Start Trip
//             </button>
//           ) : (
//             <button 
//               className={`${styles.btn} ${styles.endBtn}`}
//               onClick={() => setShowEndPopup(true)}
//               disabled={loading}
//             >
//               🏁 End Trip
//             </button>
//           )}
//         </div>

//         {/* Your existing popup components remain the same */}
//         {showStartPopup && (
//           <div className={styles.popupOverlay}>
//             <div className={styles.popup}>
//               <div className={styles.popupHeader}>
//                 <h3>Start New Trip</h3>
//                 <button 
//                   className={styles.closeBtn}
//                   onClick={() => {
//                     setShowStartPopup(false);
//                     setVehicles([]);
//                   }}
//                 >
//                   ✕
//                 </button>
//               </div>
              
//               <form onSubmit={handleStartTrip} className={styles.form}>
//                 <div className={styles.formGroup}>
//                   <label>Plant</label>
//                   <input 
//                     type="text"
//                     value={startForm.plant}
//                     readOnly
//                     className={styles.readonlyInput}
//                     placeholder="Plant will be auto-filled"
//                   />
//                 </div>

//                 <div className={styles.formGroup}>
//                   <label>Transporter</label>
//                   <input 
//                     type="text"
//                     value={filteredAgencies.find(a => a.id === parseInt(startForm.agency_id))?.name || ''}
//                     readOnly
//                     className={styles.readonlyInput}
//                     placeholder="Transporter will be auto-filled"
//                   />
//                 </div>

//                 <div className={styles.formGroup}>
//                   <label>Vehicle Number</label>
//                   <select 
//                     value={startForm.vehicle_id}
//                     onChange={(e) => setStartForm(prev => ({...prev, vehicle_id: e.target.value}))}
//                     required
//                     disabled={!startForm.agency_id || vehicles.length === 0}
//                   >
//                     <option value="">Select Vehicle</option>
//                     {vehicles.map(vehicle => (
//                       <option key={vehicle.id} value={vehicle.id}>
//                         {vehicle.vehicle_number}
//                       </option>
//                     ))}
//                   </select>
//                   {startForm.agency_id && vehicles.length === 0 && (
//                     <p className={styles.noData}>No vehicles found for your agency</p>
//                   )}
//                 </div>

//                 <div className={styles.formGroup}>
//                   <label>Driver Name</label>
//                   <input 
//                     type="text"
//                     value={startForm.driver_name}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       if (/^[A-Za-z\s]*$/.test(value)) {
//                         setStartForm(prev => ({...prev, driver_name: value}));
//                       }
//                     }}
//                     placeholder="Enter driver name"
//                     required
//                     pattern="[A-Za-z\s]+"
//                     title="Please enter only letters and spaces"
//                   />
//                 </div>

//                 <div className={styles.formGroup}>
//                   <label>Contact Number</label>
//                   <input 
//                     type="tel"
//                     value={startForm.driver_contact}
//                     onChange={(e) => {
//                       let value = e.target.value;
//                       value = value.replace(/\D/g, '');
//                       if (value.length <= 10) {
//                         setStartForm(prev => ({...prev, driver_contact: value}));
//                       }
//                     }}
//                     placeholder="Enter mobile number"
//                     required
//                     maxLength="10"
//                   />
//                 </div>

//                 <div className={styles.formGroup}>
//                   <label>Start Location</label>
//                   <button 
//                     type="button"
//                     className={styles.locationBtn}
//                     onClick={() => getCurrentLocation('start')}
//                     disabled={loading}
//                   >
//                     📍 Get Current Location
//                   </button>
                  
//                   <div className={styles.coordinatesDisplay}>
//                     <div className={styles.coordinateField}>
//                       <span className={styles.coordinateLabel}>Address:</span>
//                       <textarea 
//                         value={startForm.start_address}
//                         readOnly
//                         className={styles.addressInput}
//                         placeholder="Address will appear here after getting location"
//                         rows="3"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div className={styles.formActions}>
//                   <button 
//                     type="submit"
//                     className={styles.submitBtn}
//                     disabled={loading || !startForm.start_lat || !startForm.start_lng || startForm.driver_contact.length !== 10 || !startForm.vehicle_id}
//                   >
//                     {loading ? 'Starting...' : 'Start Trip'}
//                   </button>
//                   <button 
//                     type="button"
//                     className={styles.cancelBtn}
//                     onClick={() => {
//                       setShowStartPopup(false);
//                       setVehicles([]);
//                     }}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {showEndPopup && activeTrip && (
//           <div className={styles.popupOverlay}>
//             <div className={styles.popup}>
//               <div className={styles.popupHeader}>
//                 <h3>End Trip</h3>
//                 <button 
//                   className={styles.closeBtn}
//                   onClick={() => setShowEndPopup(false)}
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div className={styles.TripInfo}>
//                 <p><strong>Driver:</strong> {activeTrip.driver_name}</p>
//                 <p><strong>Contact:</strong> {activeTrip.driver_contact}</p>
//                 <p><strong>Vehicle:</strong> {activeTrip.vehicle_number}</p>
//                 <p><strong>Agency:</strong> {agencies.find(a => a.id === activeTrip.agency_id)?.name}</p>
//                 <p><strong>Plant:</strong> {activeTrip.plant}</p>
//                 <p><strong>Start Time:</strong> {new Date(activeTrip.start_time).toLocaleString()}</p>
//               </div>
              
//               <form onSubmit={handleEndTrip} className={styles.form}>
//                 <div className={styles.formGroup}>
//                   <label>End Location</label>
//                   <div className={styles.coordinatesDisplay}>
//                     <div className={styles.coordinateField}>
//                       <span className={styles.coordinateLabel}>Address:</span>
//                       <textarea 
//                         value={endForm.end_address}
//                         readOnly
//                         className={styles.addressInput}
//                         placeholder="Address will appear here after getting location"
//                         rows="3"
//                       />
//                     </div>
//                   </div>
//                   <button 
//                     type="button"
//                     className={styles.locationBtn}
//                     onClick={() => getCurrentLocation('end')}
//                     disabled={loading}
//                   >
//                     📍 Get Current Location
//                   </button>
//                 </div>

//                 <div className={styles.formActions}>
//                   <button 
//                     type="button"
//                     className={styles.cancelBtn}
//                     onClick={() => setShowEndPopup(false)}
//                   >
//                     Cancel
//                   </button>
//                   <button 
//                     type="submit"
//                     className={styles.submitBtn}
//                     disabled={loading || !endForm.end_lat || !endForm.end_lng}
//                   >
//                     {loading ? 'Ending...' : 'End Trip'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DriverPage;

//old Driver//
// import React, { useState, useEffect } from 'react';
// import { api, getAddressFromCoordinates } from '../services/api';
// import styles from './DriverPage.module.css';
// import { sendTripEmail, initEmailJS } from '../services/email';


// const DriverPage = () => {
//   const [agencies, setAgencies] = useState([]);
//   const [filteredAgencies, setFilteredAgencies] = useState([]);
//   const [vehicles, setVehicles] = useState([]);
//   const [plants, setPlants] = useState([]);
//   const [showStartPopup, setShowStartPopup] = useState(false);
//   const [showEndPopup, setShowEndPopup] = useState(false);
//   const [activeTrip, setActiveTrip] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [userData, setUserData] = useState(null);

//   // Form states with address fields
//   const [startForm, setStartForm] = useState({
//     plant: '',
//     agency_id: '',
//     vehicle_id: '',
//     driver_name: '',
//     driver_contact: '',
//     start_lat: '',
//     start_lng: '',
//     start_address: ''
//   });

//   const [endForm, setEndForm] = useState({
//     end_lat: '',
//     end_lng: '',
//     end_address: ''
//   });

//   useEffect(() => {
//   const initializeApp = async () => {
//     await loadUserData();
//     await loadAgenciesAndPlants();
//     await checkActiveTrip();
//     initEmailJS();
//   };

//   initializeApp();
// }, []);

//   // Load user data from localStorage
//   const loadUserData = () => {
//   return new Promise((resolve) => {
//     const userDataString = localStorage.getItem('userData');
//     if (userDataString) {
//       try {
//         const user = JSON.parse(userDataString);
//         console.log('Loaded user data:', user);
        
//         // Only update state if data actually changed
//         setUserData(prevUser => {
//           if (JSON.stringify(prevUser) === JSON.stringify(user)) {
//             return prevUser;
//           }
//           return user;
//         });
        
//         // Pre-fill the form with user data
//         setStartForm(prev => {
//           const newForm = {
//             ...prev,
//             plant: user.plant || '',
//             agency_id: user.agency_id ? user.agency_id.toString() : ''
//           };
          
//           // Only update if something actually changed
//           if (JSON.stringify(prev) === JSON.stringify(newForm)) {
//             return prev;
//           }
//           return newForm;
//         });
//       } catch (error) {
//         console.error('Error parsing user data:', error);
//       }
//     }
//     resolve();
//   });
// };

// // Update loadAgenciesAndPlants to be more efficient
// const loadAgenciesAndPlants = async () => {
//   try {
//     const { data, error } = await api.getAgencies();
//     if (!error && data) {
//       // Use functional updates to prevent unnecessary re-renders
//       setAgencies(prev => {
//         if (JSON.stringify(prev) === JSON.stringify(data)) {
//           return prev;
//         }
//         return data;
//       });
      
//       // If user is logged in, find their specific agency
//       const userDataString = localStorage.getItem('userData');
//       const currentUser = userDataString ? JSON.parse(userDataString) : null;
      
//       if (currentUser && currentUser.agency_id) {
//         const userAgency = data.find(agency => agency.id === currentUser.agency_id);
//         console.log('Found user agency:', userAgency);
        
//         if (userAgency) {
//           setFilteredAgencies(prev => {
//             if (JSON.stringify(prev) === JSON.stringify([userAgency])) {
//               return prev;
//             }
//             return [userAgency];
//           });
          
//           // Load vehicles for user's agency
//           await loadVehicles(userAgency.id);
          
//           // Update form with agency data
//           setStartForm(prev => {
//             const newForm = {
//               ...prev,
//               plant: userAgency.plant || currentUser.plant || '',
//               agency_id: userAgency.id.toString()
//             };
            
//             if (JSON.stringify(prev) === JSON.stringify(newForm)) {
//               return prev;
//             }
//             return newForm;
//           });
//         }
//       } else {
//         // Admin view - extract plants
//         const uniquePlants = [...new Set(data.map(agency => agency.plant))]
//           .filter(plant => plant && plant.trim() !== '')
//           .map((plant, index) => ({ 
//             id: index + 1, 
//             name: plant 
//           }));
        
//         setPlants(prev => {
//           if (JSON.stringify(prev) === JSON.stringify(uniquePlants)) {
//             return prev;
//           }
//           return uniquePlants;
//         });
//       }
//     }
//   } catch (error) {
//     console.error('Error loading agencies and plants:', error);
//   }
// };

//   const loadVehicles = async (agencyId) => {
//     try {
//       if (!agencyId) {
//         setVehicles([]);
//         return;
//       }
      
//       const { data, error } = await api.getVehiclesByAgency(agencyId);
//       if (!error && data) {
//         setVehicles(data);
//       } else {
//         setVehicles([]);
//       }
//     } catch (error) {
//       console.error('Error loading vehicles:', error);
//       setVehicles([]);
//     }
//   };

//   const checkActiveTrip = async () => {
//     try {
//       const { data, error } = await api.getActiveTrip();
//       if (!error && data) {
//         setActiveTrip(data);
//       }
//     } catch (error) {
//       console.error('Error checking active trip:', error);
//     }
//   };

//   const getCurrentLocation = async (type) => {
//     setLoading(true);
//     if (!navigator.geolocation) {
//       alert('Geolocation is not supported by your browser');
//       setLoading(false);
//       return;
//     }

//     let position = null;

//     try {
//       position = await new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 15000,
//           maximumAge: 0
//         });
//       });

//       const { latitude, longitude } = position.coords;
      
//       // Use the imported function from api.js
//       const address = await getAddressFromCoordinates(latitude, longitude);
      
//       if (type === 'start') {
//         setStartForm(prev => ({
//           ...prev,
//           start_lat: latitude.toFixed(6),
//           start_lng: longitude.toFixed(6),
//           start_address: address
//         }));
//       } else {
//         setEndForm(prev => ({
//           ...prev,
//           end_lat: latitude.toFixed(6),
//           end_lng: longitude.toFixed(6),
//           end_address: address
//         }));
//       }
//     } catch (error) {
//       console.error('Error getting location:', error);
//       alert('Error getting location. Please try again or check your connection.');
      
//       if (position && position.coords) {
//         const { latitude, longitude } = position.coords;
//         if (type === 'start') {
//           setStartForm(prev => ({
//             ...prev,
//             start_lat: latitude.toFixed(6),
//             start_lng: longitude.toFixed(6),
//             start_address: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
//           }));
//         } else {
//           setEndForm(prev => ({
//             ...prev,
//             end_lat: latitude.toFixed(6),
//             end_lng: longitude.toFixed(6),
//             end_address: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
//           }));
//         }
//       } else {
//         if (type === 'start') {
//           setStartForm(prev => ({
//             ...prev,
//             start_address: 'Location access denied or unavailable'
//           }));
//         } else {
//           setEndForm(prev => ({
//             ...prev,
//             end_address: 'Location access denied or unavailable'
//           }));
//         }
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateDistance = (startLat, startLng, endLat, endLng) => {
//     const R = 6371; // Earth's radius in km
//     const dLat = (endLat - startLat) * Math.PI / 180;
//     const dLng = (endLng - startLng) * Math.PI / 180;
//     const a = 
//       Math.sin(dLat/2) * Math.sin(dLat/2) +
//       Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
//       Math.sin(dLng/2) * Math.sin(dLng/2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     return (R * c).toFixed(2);
//   };

//   // Remove handlePlantChange and handleAgencyChange since they're auto-selected now

//   const handleStartTrip = async (e) => {
//     e.preventDefault();
    
//     // Validate contact number
//     if (startForm.driver_contact.length !== 10) {
//       alert('Please enter a valid 10-digit contact number');
//       return;
//     }
    
//     // Validate driver name
//     if (!/^[A-Za-z\s]+$/.test(startForm.driver_name.trim())) {
//       alert('Please enter a valid driver name (letters and spaces only)');
//       return;
//     }

//     setLoading(true);

//     try {
//       const selectedVehicle = vehicles.find(v => v.id === parseInt(startForm.vehicle_id));
      
//       const tripData = {
//         ...startForm,
//         agency_id: parseInt(startForm.agency_id),
//         vehicle_id: parseInt(startForm.vehicle_id),
//         vehicle_number: selectedVehicle?.vehicle_number,
//         plant: startForm.plant,
//         start_lat: parseFloat(startForm.start_lat),
//         start_lng: parseFloat(startForm.start_lng),
//         start_address: startForm.start_address,
//         start_time: new Date().toISOString()
//       };

//       console.log('Starting trip with data:', tripData);

//       const { data, error } = await api.startTrip(tripData);
      
//       if (!error && data) {
//         setActiveTrip(data);
//         setShowStartPopup(false);
//         setStartForm({ 
//           plant: userData ? startForm.plant : '', // Keep plant if user is logged in
//           agency_id: userData ? startForm.agency_id : '', // Keep agency if user is logged in
//           vehicle_id: '', 
//           driver_name: '', 
//           driver_contact: '', 
//           start_lat: '', 
//           start_lng: '',
//           start_address: '' 
//         });
//         setVehicles([]);
//         alert('Trip started successfully!');
//       } else {
//         alert('Error starting trip: ' + error?.message);
//       }
//     } catch (error) {
//       alert('Error starting trip: ' + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEndTrip = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const endTime = new Date().toISOString();
//       const distance = calculateDistance(
//         activeTrip.start_lat,
//         activeTrip.start_lng,
//         parseFloat(endForm.end_lat),
//         parseFloat(endForm.end_lng)
//       );

//       const endData = {
//         end_lat: parseFloat(endForm.end_lat),
//         end_lng: parseFloat(endForm.end_lng),
//         end_address: endForm.end_address,
//         end_time: endTime,
//         distance_km: parseFloat(distance),
//         status: 'completed'
//       };

//       const { data, error } = await api.endTrip(activeTrip.id, endData);
      
//       if (!error && data) {
//         const emailResult = await sendCompletionEmail(data, distance, endTime);
        
//         setActiveTrip(null);
//         setShowEndPopup(false);
//         setEndForm({ end_lat: '', end_lng: '', end_address: '' });
        
//         if (emailResult.success) {
//           alert(`Trip completed! Distance: ${distance} km\nEmail notification has been sent successfully.`);
//         } else {
//           alert(`Trip completed! Distance: ${distance} km\nBut email failed to send: ${emailResult.message}`);
//         }
//       } else {
//         alert('Error ending trip: ' + error?.message);
//       }
//     } catch (error) {
//       alert('Error ending trip: ' + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const sendCompletionEmail = async (tripData, distance, endTime) => {
//     try {
//       const agency = agencies.find(a => a.id === tripData.agency_id);
      
//       if (!agency) {
//         return { success: false, message: 'Agency not found' };
//       }

//       if (!agency.email) {
//         return { success: false, message: 'Agency email not available' };
//       }

//       // Calculate duration
//       const startTime = new Date(tripData.start_time);
//       const endTimeDate = new Date(endTime);
//       const durationMs = endTimeDate - startTime;
//       const hours = Math.floor(durationMs / (1000 * 60 * 60));
//       const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
//       const duration = `${hours}h ${minutes}m`;

//       // Format dates
//       const formatDate = (dateString) => {
//         const date = new Date(dateString);
//         return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { 
//           hour: '2-digit', 
//           minute: '2-digit' 
//         });
//       };

//       const emailData = {
//         agency_email: agency.email,
//         subject: `MANUAL TRIP-MARKET VEHICLE-${tripData.vehicle_number || 'N/A'}`,
//         agency_name: agency.name,
//         plant: tripData.plant,
//         vehicle_number: tripData.vehicle_number || 'N/A',
//         driver_name: tripData.driver_name,
//         driver_contact: tripData.driver_contact,
//         start_time: formatDate(tripData.start_time),
//         end_time: formatDate(endTime),
//         start_lat: tripData.start_lat,
//         start_lng: tripData.start_lng,
//         end_lat: tripData.end_lat,
//         end_lng: tripData.end_lng,
//         start_address: tripData.start_address,
//         end_address: tripData.end_address,
//         distance: distance,
//         duration: duration,
//         trip_id: tripData.id.toString(),
//         current_date: new Date().toLocaleDateString('en-GB')
//       };

//       console.log('Sending email with data:', emailData);
//       const result = await sendTripEmail(emailData);
//       return result;

//     } catch (error) {
//       console.error('Error in sendCompletionEmail:', error);
//       return { 
//         success: false, 
//         message: error.message 
//       };
//     }
//   };

//   return (
//     <div className={styles.driverPage}>
//       <div className={styles.container}>
//         <div className={styles.statusCard}>
//           <h2 className={styles.statusTitle}>
//             {activeTrip ? '🚗 Trip in Progress' : '✅ Ready to Start'}
//           </h2>
          
//           {activeTrip ? (
//             <div className={styles.activeTripDetails}>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Plant :</span>
//                 <span className={styles.value}>{activeTrip.plant}</span>
//               </div>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Transporter :</span>
//                 <span className={styles.value}>
//                   {agencies.find(a => a.id === activeTrip.agency_id)?.name}
//                 </span>
//               </div>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Vehicle No :</span>
//                 <span className={styles.value}>{activeTrip.vehicle_number}</span>
//               </div>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Driver :</span>
//                 <span className={styles.value}>{activeTrip.driver_name}</span>
//               </div>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Start time :</span>
//                 <span className={styles.value}>
//                   {new Date(activeTrip.start_time).toLocaleTimeString()}
//                 </span>
//               </div>
//               <div className={styles.statusLine}>
//                 <span className={styles.label}>Status :</span>
//                 <span className={`${styles.value} ${styles.activeStatus}`}>
//                   ● Active
//                 </span>
//               </div>
//             </div>
//           ) : (
//             <p className={styles.statusText}>
//               Click Start to begin a new trip.
//             </p>
//           )}
//         </div>

//         <div className={styles.controls}>
//           {!activeTrip ? (
//             <button 
//               className={`${styles.btn} ${styles.startBtn}`}
//               onClick={() => setShowStartPopup(true)}
//               disabled={loading}
//             >
//               🚗 Start Trip
//             </button>
//           ) : (
//             <button 
//               className={`${styles.btn} ${styles.endBtn}`}
//               onClick={() => setShowEndPopup(true)}
//               disabled={loading}
//             >
//               🏁 End Trip
//             </button>
//           )}
//         </div>

//         {/* Start Trip Popup */}
//         {showStartPopup && (
//           <div className={styles.popupOverlay}>
//             <div className={styles.popup}>
//               <div className={styles.popupHeader}>
//                 <h3>Start New Trip</h3>
//                 <button 
//                   className={styles.closeBtn}
//                   onClick={() => {
//                     setShowStartPopup(false);
//                     setVehicles([]);
//                   }}
//                 >
//                   ✕
//                 </button>
//               </div>
              
//               <form onSubmit={handleStartTrip} className={styles.form}>
//                 {/* 1. Plant - Auto-filled and read-only */}
//                 <div className={styles.formGroup}>
//                   <label>Plant</label>
//                   <input 
//                     type="text"
//                     value={startForm.plant}
//                     readOnly
//                     className={styles.readonlyInput}
//                     placeholder="Plant will be auto-filled"
//                   />
//                 </div>

//                 {/* 2. Transporter (Agency) - Auto-filled and read-only */}
//                 <div className={styles.formGroup}>
//                   <label>Transporter</label>
//                   <input 
//                     type="text"
//                     value={filteredAgencies.find(a => a.id === parseInt(startForm.agency_id))?.name || ''}
//                     readOnly
//                     className={styles.readonlyInput}
//                     placeholder="Transporter will be auto-filled"
//                   />
//                 </div>

//                 {/* 3. Vehicle Number - User selects from their agency's vehicles */}
//                 <div className={styles.formGroup}>
//                   <label>Vehicle Number</label>
//                   <select 
//                     value={startForm.vehicle_id}
//                     onChange={(e) => setStartForm(prev => ({...prev, vehicle_id: e.target.value}))}
//                     required
//                     disabled={!startForm.agency_id || vehicles.length === 0}
//                   >
//                     <option value="">Select Vehicle</option>
//                     {vehicles.map(vehicle => (
//                       <option key={vehicle.id} value={vehicle.id}>
//                         {vehicle.vehicle_number}
//                       </option>
//                     ))}
//                   </select>
//                   {startForm.agency_id && vehicles.length === 0 && (
//                     <p className={styles.noData}>No vehicles found for your agency</p>
//                   )}
//                 </div>

//                 {/* 4. Driver Name - User enters */}
//                 <div className={styles.formGroup}>
//                   <label>Driver Name</label>
//                   <input 
//                     type="text"
//                     value={startForm.driver_name}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       // Allow only letters and spaces
//                       if (/^[A-Za-z\s]*$/.test(value)) {
//                         setStartForm(prev => ({...prev, driver_name: value}));
//                       }
//                     }}
//                     placeholder="Enter driver name"
//                     required
//                     pattern="[A-Za-z\s]+"
//                     title="Please enter only letters and spaces"
//                   />
//                   {startForm.driver_name && !/^[A-Za-z\s]+$/.test(startForm.driver_name) && (
//                     <p className={styles.errorText}>Only letters and spaces are allowed</p>
//                   )}
//                 </div>

//                 {/* 5. Contact Number - User enters */}
//                 <div className={styles.formGroup}>
//                   <label>Contact Number</label>
//                   <input 
//                     type="tel"
//                     value={startForm.driver_contact}
//                     onChange={(e) => {
//                       let value = e.target.value;
//                       // Remove any non-digit characters
//                       value = value.replace(/\D/g, '');
//                       // Limit to 10 digits
//                       if (value.length <= 10) {
//                         setStartForm(prev => ({...prev, driver_contact: value}));
//                       }
//                     }}
//                     placeholder="Enter mobile number"
//                     required
//                     maxLength="10"
//                   />
//                 </div>

//                 {/* 6. Get Geo Location Button */}
//                 <div className={styles.formGroup}>
//                   <label>Start Location</label>
//                   <button 
//                     type="button"
//                     className={styles.locationBtn}
//                     onClick={() => getCurrentLocation('start')}
//                     disabled={loading}
//                   >
//                     📍 Get Current Location
//                   </button>
                  
//                   <div className={styles.coordinatesDisplay}>
//                     <div className={styles.coordinateField}>
//                       <span className={styles.coordinateLabel}>Address:</span>
//                       <textarea 
//                         value={startForm.start_address}
//                         readOnly
//                         className={styles.addressInput}
//                         placeholder="Address will appear here after getting location"
//                         rows="3"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Form Actions */}
//                 <div className={styles.formActions}>
//                   <button 
//                     type="submit"
//                     className={styles.submitBtn}
//                     disabled={loading || !startForm.start_lat || !startForm.start_lng || startForm.driver_contact.length !== 10 || !startForm.vehicle_id}
//                   >
//                     {loading ? 'Starting...' : 'Start Trip'}
//                   </button>
//                   <button 
//                     type="button"
//                     className={styles.cancelBtn}
//                     onClick={() => {
//                       setShowStartPopup(false);
//                       setVehicles([]);
//                     }}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {/* End Trip Popup - remains the same */}
//         {showEndPopup && activeTrip && (
//           <div className={styles.popupOverlay}>
//             <div className={styles.popup}>
//               <div className={styles.popupHeader}>
//                 <h3>End Trip</h3>
//                 <button 
//                   className={styles.closeBtn}
//                   onClick={() => setShowEndPopup(false)}
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div className={styles.TripInfo}>
//                 <p><strong>Driver:</strong> {activeTrip.driver_name}</p>
//                 <p><strong>Contact:</strong> {activeTrip.driver_contact}</p>
//                 <p><strong>Vehicle:</strong> {activeTrip.vehicle_number}</p>
//                 <p><strong>Agency:</strong> {agencies.find(a => a.id === activeTrip.agency_id)?.name}</p>
//                 <p><strong>Plant:</strong> {activeTrip.plant}</p>
//                 <p><strong>Start Time:</strong> {new Date(activeTrip.start_time).toLocaleString()}</p>
//               </div>
              
//               <form onSubmit={handleEndTrip} className={styles.form}>
//                 <div className={styles.formGroup}>
//                   <label>End Location</label>
//                   <div className={styles.coordinatesDisplay}>
//                     <div className={styles.coordinateField}>
//                       <span className={styles.coordinateLabel}>Address:</span>
//                       <textarea 
//                         value={endForm.end_address}
//                         readOnly
//                         className={styles.addressInput}
//                         placeholder="Address will appear here after getting location"
//                         rows="3"
//                       />
//                     </div>
//                   </div>
//                   <button 
//                     type="button"
//                     className={styles.locationBtn}
//                     onClick={() => getCurrentLocation('end')}
//                     disabled={loading}
//                   >
//                     📍 Get Current Location
//                   </button>
//                 </div>

//                 <div className={styles.formActions}>
//                   <button 
//                     type="button"
//                     className={styles.cancelBtn}
//                     onClick={() => setShowEndPopup(false)}
//                   >
//                     Cancel
//                   </button>
//                   <button 
//                     type="submit"
//                     className={styles.submitBtn}
//                     disabled={loading || !endForm.end_lat || !endForm.end_lng}
//                   >
//                     {loading ? 'Ending...' : 'End Trip'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DriverPage;