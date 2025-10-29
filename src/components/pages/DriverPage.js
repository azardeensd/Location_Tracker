import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import styles from './DriverPage.module.css';

const DriverPage = () => {
  const [agencies, setAgencies] = useState([]);
  const [filteredAgencies, setFilteredAgencies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [plants, setPlants] = useState([]);
  const [showStartPopup, setShowStartPopup] = useState(false);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [activeJourney, setActiveJourney] = useState(null);
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
    checkActiveJourney();
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

  const checkActiveJourney = async () => {
    try {
      const { data, error } = await api.getActiveJourney();
      if (!error && data) {
        setActiveJourney(data);
      }
    } catch (error) {
      console.error('Error checking active journey:', error);
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

  const handleStartJourney = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const journeyData = {
        ...startForm,
        agency_id: parseInt(startForm.agency_id),
        vehicle_id: parseInt(startForm.vehicle_id),
        plant: startForm.plant, // Store plant name directly
        start_lat: parseFloat(startForm.start_lat),
        start_lng: parseFloat(startForm.start_lng),
        start_time: new Date().toISOString()
      };

      console.log('Starting journey with data:', journeyData);

      const { data, error } = await api.startJourney(journeyData);
      
      if (!error && data) {
        setActiveJourney(data);
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
        alert('Journey started successfully!');
      } else {
        alert('Error starting journey: ' + error?.message);
      }
    } catch (error) {
      alert('Error starting journey: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndJourney = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endTime = new Date().toISOString();
      const distance = calculateDistance(
        activeJourney.start_lat,
        activeJourney.start_lng,
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

      const { data, error } = await api.endJourney(activeJourney.id, endData);
      
      if (!error && data) {
        setActiveJourney(null);
        setShowEndPopup(false);
        setEndForm({ end_lat: '', end_lng: '' });
        
        // Simulate email sending
        const agency = agencies.find(a => a.id === data.agency_id);
        alert(`Journey completed! Distance: ${distance} km\nEmail has been sent to ${agency?.email || 'the head'}`);
      } else {
        alert('Error ending journey: ' + error?.message);
      }
    } catch (error) {
      alert('Error ending journey: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.driverPage}>
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <h2 className={styles.statusTitle}>
            {activeJourney ? 'Journey in Progress' : 'Ready to Start'}
          </h2>
          <p className={styles.statusText}>
            {activeJourney 
              ? `Driver: ${activeJourney.driver_name} - Vehicle: ${activeJourney.vehicle_number} - Plant: ${activeJourney.plant} - Trip Active`
              : 'No active journey. Click Start to begin a new trip.'
            }
          </p>
        </div>

        <div className={styles.controls}>
          {!activeJourney ? (
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
              🏁 End Journey
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
              
              <form onSubmit={handleStartJourney} className={styles.form}>
                {/* Plant Selection - First */}
                <div className={styles.formGroup}>
                  <label>Plant</label>
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

                {/* Agency Selection - Filtered by Plant */}
                <div className={styles.formGroup}>
                  <label>Driving Agency</label>
                  <select 
                    value={startForm.agency_id}
                    onChange={(e) => handleAgencyChange(e.target.value)}
                    required
                    disabled={!startForm.plant || filteredAgencies.length === 0}
                  >
                    <option value="">Select Agency</option>
                    {filteredAgencies.map(agency => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                      </option>
                    ))}
                  </select>
                  {startForm.plant && filteredAgencies.length === 0 && (
                    <p className={styles.noData}>No agencies found for {startForm.plant}</p>
                  )}
                </div>

                {/* Vehicle Selection - Filtered by Agency */}
                <div className={styles.formGroup}>
                  <label>Vehicle Number</label>
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
                    <p className={styles.noData}>No vehicles found for this agency</p>
                  )}
                </div>

                {/* Driver Information */}
                <div className={styles.formGroup}>
                  <label>Driver Name</label>
                  <input 
                    type="text"
                    value={startForm.driver_name}
                    onChange={(e) => setStartForm(prev => ({...prev, driver_name: e.target.value}))}
                    placeholder="Enter driver name"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Driver Contact Number</label>
                    <input 
                      type="tel"
                      value={startForm.driver_contact}
                      onChange={(e) => setStartForm(prev => ({...prev, driver_contact: e.target.value}))}
                      placeholder="Enter contact number"
                      required
                    />
                  </div>
                  
                  <div className={styles.geoButtonContainer}>
                    <button 
                      type="button"
                      className={styles.locationBtn}
                      onClick={() => getCurrentLocation('start')}
                      disabled={loading}
                    >
                      📍 Get Geo Location
                    </button>
                  </div>
                </div>

                {/* Location Coordinates */}
                <div className={styles.formGroup}>
                  <label>Start Location Coordinates</label>
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

                <div className={styles.formActions}>
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
                  <button 
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading || !startForm.start_lat || !startForm.start_lng}
                  >
                    {loading ? 'Starting...' : 'Start Trip'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* End Journey Popup */}
        {showEndPopup && activeJourney && (
          <div className={styles.popupOverlay}>
            <div className={styles.popup}>
              <div className={styles.popupHeader}>
                <h3>End Journey</h3>
                <button 
                  className={styles.closeBtn}
                  onClick={() => setShowEndPopup(false)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.journeyInfo}>
                <p><strong>Driver:</strong> {activeJourney.driver_name}</p>
                <p><strong>Contact:</strong> {activeJourney.driver_contact}</p>
                <p><strong>Vehicle:</strong> {activeJourney.vehicle_number}</p>
                <p><strong>Agency:</strong> {agencies.find(a => a.id === activeJourney.agency_id)?.name}</p>
                <p><strong>Plant:</strong> {activeJourney.plant}</p>
                <p><strong>Start Time:</strong> {new Date(activeJourney.start_time).toLocaleString()}</p>
              </div>
              
              <form onSubmit={handleEndJourney} className={styles.form}>
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
