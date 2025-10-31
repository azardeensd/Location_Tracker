import React, { useState, useEffect } from 'react';
import { api, getAddressFromCoordinates } from '../services/api';
import styles from './DriverPage.module.css';
import { sendTripEmail, initEmailJS } from '../services/email';

const DriverPage = () => {
  const [agencies, setAgencies] = useState([]);
  const [filteredAgencies, setFilteredAgencies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [plants, setPlants] = useState([]);
  const [showStartPopup, setShowStartPopup] = useState(false);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states with address fields
  const [startForm, setStartForm] = useState({
    plant: '',
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
  });

  useEffect(() => {
    loadAgenciesAndPlants();
    checkActiveTrip();
    initEmailJS(); // Initialize EmailJS
  }, []);

  const loadAgenciesAndPlants = async () => {
    try {
      const { data, error } = await api.getAgencies();
      if (!error && data) {
        setAgencies(data);
        
        // Extract unique plant names from agencies data
        const uniquePlants = [...new Set(data.map(agency => agency.plant))]
          .filter(plant => plant && plant.trim() !== '')
          .map((plant, index) => ({ 
            id: index + 1, 
            name: plant 
          }));
        
        setPlants(uniquePlants);
      }
    } catch (error) {
      console.error('Error loading agencies and plants:', error);
    }
  };

  const loadVehicles = async (agencyId) => {
    try {
      if (!agencyId) {
        setVehicles([]);
        return;
      }
      
      const { data, error } = await api.getVehiclesByAgency(agencyId);
      if (!error && data) {
        setVehicles(data);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    }
  };

  const checkActiveTrip = async () => {
    try {
      const { data, error } = await api.getActiveTrip();
      if (!error && data) {
        setActiveTrip(data);
      }
    } catch (error) {
      console.error('Error checking active trip:', error);
    }
  };

  const getCurrentLocation = async (type) => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Get address from coordinates
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
      alert('Error getting location: ' + error.message);
      // Still set coordinates even if address fails
      const { latitude, longitude } = error;
      if (type === 'start') {
        setStartForm(prev => ({
          ...prev,
          start_lat: latitude ? latitude.toFixed(6) : '',
          start_lng: longitude ? longitude.toFixed(6) : '',
          start_address: `Coordinates: ${latitude ? latitude.toFixed(6) : 'N/A'}, ${longitude ? longitude.toFixed(6) : 'N/A'}`
        }));
      } else {
        setEndForm(prev => ({
          ...prev,
          end_lat: latitude ? latitude.toFixed(6) : '',
          end_lng: longitude ? longitude.toFixed(6) : '',
          end_address: `Coordinates: ${latitude ? latitude.toFixed(6) : 'N/A'}, ${longitude ? longitude.toFixed(6) : 'N/A'}`
        }));
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

  const handlePlantChange = (plantName) => {
    setStartForm(prev => ({
      ...prev,
      plant: plantName,
      agency_id: '',
      vehicle_id: ''
    }));
    
    if (plantName) {
      const filtered = agencies.filter(agency => agency.plant === plantName);
      setFilteredAgencies(filtered);
    } else {
      setFilteredAgencies([]);
    }
    setVehicles([]);
  };

  const handleAgencyChange = (agencyId) => {
    setStartForm(prev => ({
      ...prev,
      agency_id: agencyId,
      vehicle_id: ''
    }));
    loadVehicles(agencyId);
  };

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
      const selectedVehicle = vehicles.find(v => v.id === parseInt(startForm.vehicle_id));
      
      const tripData = {
        ...startForm,
        agency_id: parseInt(startForm.agency_id),
        vehicle_id: parseInt(startForm.vehicle_id),
        vehicle_number: selectedVehicle?.vehicle_number,
        plant: startForm.plant,
        start_lat: parseFloat(startForm.start_lat),
        start_lng: parseFloat(startForm.start_lng),
        start_address: startForm.start_address,
        start_time: new Date().toISOString()
      };

      console.log('Starting trip with data:', tripData);

      const { data, error } = await api.startTrip(tripData);
      
      if (!error && data) {
        setActiveTrip(data);
        setShowStartPopup(false);
        setStartForm({ 
          plant: '',
          agency_id: '', 
          vehicle_id: '', 
          driver_name: '', 
          driver_contact: '', 
          start_lat: '', 
          start_lng: '',
          start_address: '' 
        });
        setFilteredAgencies([]);
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
    e.preventDefault();
    setLoading(true);

    try {
      const endTime = new Date().toISOString();
      const distance = calculateDistance(
        activeTrip.start_lat,
        activeTrip.start_lng,
        parseFloat(endForm.end_lat),
        parseFloat(endForm.end_lng)
      );

      const endData = {
        end_lat: parseFloat(endForm.end_lat),
        end_lng: parseFloat(endForm.end_lng),
        end_address: endForm.end_address,
        end_time: endTime,
        distance_km: parseFloat(distance),
        status: 'completed'
      };

      const { data, error } = await api.endTrip(activeTrip.id, endData);
      
      if (!error && data) {
        const emailResult = await sendCompletionEmail(data, distance, endTime);
        
        setActiveTrip(null);
        setShowEndPopup(false);
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

  return (
    <div className={styles.driverPage}>
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <h2 className={styles.statusTitle}>
            {activeTrip ? '🚗 Trip in Progress' : '✅ Ready to Start'}
          </h2>
          
          {activeTrip ? (
            <div className={styles.activeTripDetails}>
              <div className={styles.statusLine}>
                <span className={styles.label}>Driver:</span>
                <span className={styles.value}>{activeTrip.driver_name}</span>
              </div>
              <div className={styles.statusLine}>
                <span className={styles.label}>Vehicle:</span>
                <span className={styles.value}>{activeTrip.vehicle_number}</span>
              </div>
              <div className={styles.statusLine}>
                <span className={styles.label}>Plant:</span>
                <span className={styles.value}>{activeTrip.plant}</span>
              </div>
              <div className={styles.statusLine}>
                <span className={styles.label}>Start Time:</span>
                <span className={styles.value}>
                  {new Date(activeTrip.start_time).toLocaleString()}
                </span>
              </div>
              <div className={styles.statusLine}>
                <span className={styles.label}>Status:</span>
                <span className={`${styles.value} ${styles.activeStatus}`}>
                  ● Active
                </span>
              </div>
            </div>
          ) : (
            <p className={styles.statusText}>
              
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
                    setFilteredAgencies([]);
                    setVehicles([]);
                  }}
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleStartTrip} className={styles.form}>
                {/* 1. Plant Selection - First */}
                <div className={styles.formGroup}>
                  <select 
                    value={startForm.plant}
                    onChange={(e) => handlePlantChange(e.target.value)}
                    required
                  >
                    <option value="">Select Plant</option>
                    {plants.length > 0 ? (
                      plants.map(plant => (
                        <option key={plant.id} value={plant.name}>
                          {plant.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading plants...</option>
                    )}
                  </select>
                  {plants.length === 0 && (
                    <p className={styles.noData}>No plants found. Please check your database.</p>
                  )}
                </div>

                {/* 2. Transporter (Agency) - Second */}
                <div className={styles.formGroup}>
                  <select 
                    value={startForm.agency_id}
                    onChange={(e) => handleAgencyChange(e.target.value)}
                    required
                    disabled={!startForm.plant || filteredAgencies.length === 0}
                  >
                    <option value="">Select Transporter</option>
                    {filteredAgencies.map(agency => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                      </option>
                    ))}
                  </select>
                  {startForm.plant && filteredAgencies.length === 0 && (
                    <p className={styles.noData}>No transporters found for {startForm.plant}</p>
                  )}
                </div>

                {/* 3. Vehicle Number - Third */}
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
                        {vehicle.vehicle_number}
                      </option>
                    ))}
                  </select>
                  {startForm.agency_id && vehicles.length === 0 && (
                    <p className={styles.noData}>No vehicles found for this transporter</p>
                  )}
                </div>

                {/* 4. Driver Name - Fourth */}
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

                {/* 5. Contact Number - Fifth */}
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

                {/* 6. Get Geo Location Button - Sixth */}
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
                      {/* <span className={styles.coordinateLabel}>Address:</span> */}
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
                    disabled={loading || !startForm.start_lat || !startForm.start_lng || startForm.driver_contact.length !== 10}
                  >
                    {loading ? 'Starting...' : 'Start Trip'}
                  </button>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowStartPopup(false);
                      setFilteredAgencies([]);
                      setVehicles([]);
                    }}
                  >
                    Cancel
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
                    {/* Latitude and Longitude fields removed from End Trip popup */}
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
    </div>
  );
};

export default DriverPage;
