import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
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

  // Form states
  const [startForm, setStartForm] = useState({
    plant: '',
    agency_id: '',
    vehicle_id: '',
    driver_name: '',
    driver_contact: '',
    start_lat: '',
    start_lng: ''
  });

  const [endForm, setEndForm] = useState({
    end_lat: '',
    end_lng: ''
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
          .filter(plant => plant && plant.trim() !== '') // Remove null/empty values
          .map((plant, index) => ({ 
            id: index + 1, 
            name: plant 
          }));
        
        console.log('Extracted plants:', uniquePlants);
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
      console.error('Error checking active Trip:', error);
    }
  };

  const getCurrentLocation = (type) => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (type === 'start') {
          setStartForm(prev => ({
            ...prev,
            start_lat: latitude.toFixed(6),
            start_lng: longitude.toFixed(6)
          }));
        } else {
          setEndForm(prev => ({
            ...prev,
            end_lat: latitude.toFixed(6),
            end_lng: longitude.toFixed(6)
          }));
        }
        setLoading(false);
      },
      (error) => {
        alert('Error getting location: ' + error.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const calculateDistance = (startLat, startLng, endLat, endLng) => {
    // Haversine formula to calculate distance between two coordinates
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
    console.log('Plant selected:', plantName);
    setStartForm(prev => ({
      ...prev,
      plant: plantName,
      agency_id: '', // Reset agency when plant changes
      vehicle_id: '' // Reset vehicle when plant changes
    }));
    
    // Filter agencies based on selected plant name
    if (plantName) {
      const filtered = agencies.filter(agency => agency.plant === plantName);
      console.log('Filtered agencies for plant', plantName, ':', filtered);
      setFilteredAgencies(filtered);
    } else {
      setFilteredAgencies([]);
    }
    setVehicles([]);
  };

  const handleAgencyChange = (agencyId) => {
    console.log('Agency selected:', agencyId);
    setStartForm(prev => ({
      ...prev,
      agency_id: agencyId,
      vehicle_id: '' // Reset vehicle when agency changes
    }));
    loadVehicles(agencyId);
  };

  const handleStartTrip = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Find the selected vehicle to get its number
    const selectedVehicle = vehicles.find(v => v.id === parseInt(startForm.vehicle_id));
    
    const TripData = {
      ...startForm,
      agency_id: parseInt(startForm.agency_id),
      vehicle_id: parseInt(startForm.vehicle_id),
      vehicle_number: selectedVehicle?.vehicle_number, // Add vehicle number here
      plant: startForm.plant,
      start_lat: parseFloat(startForm.start_lat),
      start_lng: parseFloat(startForm.start_lng),
      start_time: new Date().toISOString()
    };

    console.log('Starting Trip with data:', TripData);

    const { data, error } = await api.startTrip(TripData);
    
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
        start_lng: '' 
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
        end_time: endTime,
        distance_km: parseFloat(distance),
        status: 'completed'
      };

      const { data, error } = await api.endTrip(activeTrip.id, endData);
      
      if (!error && data) {
        // Send email notification with proper data formatting
        const emailResult = await sendCompletionEmail(data, distance, endTime);
        
        setActiveTrip(null);
        setShowEndPopup(false);
        setEndForm({ end_lat: '', end_lng: '' });
        
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

  // Email sending function
  const sendCompletionEmail = async (TripData, distance, endTime) => {
    try {
      const agency = agencies.find(a => a.id === TripData.agency_id);
      
      if (!agency) {
        return { success: false, message: 'Agency not found' };
      }

      // Make sure agency has an email
      if (!agency.email) {
        return { success: false, message: 'Agency email not available' };
      }

      // Calculate duration
      const startTime = new Date(TripData.start_time);
      const endTimeDate = new Date(endTime);
      const durationMs = endTimeDate - startTime;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const duration = `${hours}h ${minutes}m`;

      // Get vehicle number - use the vehicle number from TripData or find from vehicles list
      const vehicleNumber = TripData.vehicle_number || 
                           (vehicles.find(v => v.id === TripData.vehicle_id)?.vehicle_number) || 
                           'N/A';

      const emailData = {
        agencyEmail: agency.email,
        driverName: TripData.driver_name,
        agencyName: agency.name,
        startLocation: {
          lat: TripData.start_lat,
          lng: TripData.start_lng
        },
        endLocation: {
          lat: TripData.end_lat,
          lng: TripData.end_lng
        },
        distance: parseFloat(distance),
        startTime: TripData.start_time,
        endTime: endTime,
        duration: duration,
        TripId: TripData.id.toString(),
        plant: TripData.plant,
        vehicleNumber: vehicleNumber, // Added vehicle number
        driverContact: TripData.driver_contact
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
            <span className={styles.value}>{activeTrip.vehicle_number || 'N/A'}</span>
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
          Click Start to begin a new trip.
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

        {/* Start Journey Popup */}
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
          {/* <label>Plant</label> */}
          <select 
            value={startForm.plant}
            onChange={(e) => handlePlantChange(e.target.value)}
            required
          >
            { <option value="">Select Plant</option> }
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
          {/* <label>Transporter</label> */}
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
          {/* <label>Vehicle Number</label> */}
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
          {/* <label>Driver Name</label> */}
          <input 
            type="text"
            value={startForm.driver_name}
            onChange={(e) => setStartForm(prev => ({...prev, driver_name: e.target.value}))}
            placeholder="Enter driver name"
            required
          />
        </div>

        {/* 5. Contact Number - Fifth */}
        <div className={styles.formGroup}>
          {/* <label>Driver Contact Number</label> */}
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
            pattern="[0-9]{10}"
            title="Please enter exactly 10 digits"
            maxLength="10"
            inputMode="numeric"
          />
          <div className={styles.validationInfo}>
            <span className={
              startForm.driver_contact.length === 10 
                ? styles.validCount 
                : styles.digitCount
            }>
              {/* {startForm.driver_contact.length}/10 digits */}
            </span>
            {startForm.driver_contact && startForm.driver_contact.length !== 10 && (
              <span className={styles.errorText}>❌ Must be exactly 10 digits</span>
            )}
            {startForm.driver_contact.length === 10 && (
              <span className={styles.successText}>✅ Valid number</span>
            )}
          </div>
        </div>

        {/* 6. Get Geo Location Button - Sixth */}
        <div className={styles.formGroup}>
          <label>Location Coordinates</label>
          <button 
            type="button"
            className={styles.locationBtn}
            onClick={() => getCurrentLocation('start')}
            disabled={loading}
          >
            📍 Get Geo Location
          </button>
          
          {/* Location Coordinates Display */}
          <div className={styles.coordinatesDisplay}>
            <div className={styles.coordinateField}>
              <span className={styles.coordinateLabel}>Latitude:</span>
              <input 
                type="text"
                value={startForm.start_lat}
                readOnly
                className={styles.readonlyInput}
                placeholder="Click Get Geo Location"
              />
            </div>
            <div className={styles.coordinateField}>
              <span className={styles.coordinateLabel}>Longitude:</span>
              <input 
                type="text"
                value={startForm.start_lng}
                readOnly
                className={styles.readonlyInput}
                placeholder="Click Get Geo Location"
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
                  {/* <button 
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading || !startForm.start_lat || !startForm.start_lng}
                  >
                    {loading ? 'Starting...' : 'Start Trip'}
                  </button> */}
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
                  <label>End Location Coordinates</label>
                  <div className={styles.coordinatesDisplay}>
                    <div className={styles.coordinateField}>
                      <span className={styles.coordinateLabel}>Latitude:</span>
                      <input 
                        type="text"
                        value={endForm.end_lat}
                        readOnly
                        className={styles.readonlyInput}
                        placeholder="Click Get Geo Location"
                      />
                    </div>
                    <div className={styles.coordinateField}>
                      <span className={styles.coordinateLabel}>Longitude:</span>
                      <input 
                        type="text"
                        value={endForm.end_lng}
                        readOnly
                        className={styles.readonlyInput}
                        placeholder="Click Get Geo Location"
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
    </div>
  );
};

export default DriverPage;
