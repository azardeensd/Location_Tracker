import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import styles from './DriverPage.module.css';

const DriverPage = () => {
  const [agencies, setAgencies] = useState([]);
  const [showStartPopup, setShowStartPopup] = useState(false);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [activeJourney, setActiveJourney] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [startForm, setStartForm] = useState({
    agency_id: '',
    driver_name: '',
    start_lat: '',
    start_lng: ''
  });

  const [endForm, setEndForm] = useState({
    end_lat: '',
    end_lng: ''
  });

  useEffect(() => {
    loadAgencies();
    checkActiveJourney();
  }, []);

  const loadAgencies = async () => {
    try {
      const { data, error } = await api.getAgencies();
      if (!error && data) {
        setAgencies(data);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
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

  const handleStartJourney = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const journeyData = {
        ...startForm,
        agency_id: parseInt(startForm.agency_id),
        start_lat: parseFloat(startForm.start_lat),
        start_lng: parseFloat(startForm.start_lng),
        start_time: new Date().toISOString()
      };

      const { data, error } = await api.startJourney(journeyData);
      
      if (!error && data) {
        setActiveJourney(data);
        setShowStartPopup(false);
        setStartForm({ agency_id: '', driver_name: '', start_lat: '', start_lng: '' });
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
              ? `Driver: ${activeJourney.driver_name} - Trip Active`
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
              🚗 Start Journey
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
                <h3>Start New Journey</h3>
                <button 
                  className={styles.closeBtn}
                  onClick={() => setShowStartPopup(false)}
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleStartJourney} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Driving Agency</label>
                  <select 
                    value={startForm.agency_id}
                    onChange={(e) => setStartForm(prev => ({...prev, agency_id: e.target.value}))}
                    required
                  >
                    <option value="">Select Agency</option>
                    {agencies.map(agency => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                      </option>
                    ))}
                  </select>
                </div>

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

                <div className={styles.formGroup}>
                  <label>Start Location</label>
                  <div className={styles.locationInputs}>
                    <input 
                      type="number"
                      step="any"
                      value={startForm.start_lat}
                      onChange={(e) => setStartForm(prev => ({...prev, start_lat: e.target.value}))}
                      placeholder="Latitude"
                      required
                    />
                    <input 
                      type="number"
                      step="any"
                      value={startForm.start_lng}
                      onChange={(e) => setStartForm(prev => ({...prev, start_lng: e.target.value}))}
                      placeholder="Longitude"
                      required
                    />
                  </div>
                  <button 
                    type="button"
                    className={styles.locationBtn}
                    onClick={() => getCurrentLocation('start')}
                    disabled={loading}
                  >
                    📍 Get Current Location
                  </button>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setShowStartPopup(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                  >
                    {loading ? 'Starting...' : 'Start Journey'}
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
                <p><strong>Agency:</strong> {agencies.find(a => a.id === activeJourney.agency_id)?.name}</p>
                <p><strong>Start Time:</strong> {new Date(activeJourney.start_time).toLocaleString()}</p>
              </div>
              
              <form onSubmit={handleEndJourney} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>End Location</label>
                  <div className={styles.locationInputs}>
                    <input 
                      type="number"
                      step="any"
                      value={endForm.end_lat}
                      onChange={(e) => setEndForm(prev => ({...prev, end_lat: e.target.value}))}
                      placeholder="Latitude"
                      required
                    />
                    <input 
                      type="number"
                      step="any"
                      value={endForm.end_lng}
                      onChange={(e) => setEndForm(prev => ({...prev, end_lng: e.target.value}))}
                      placeholder="Longitude"
                      required
                    />
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
                    disabled={loading}
                  >
                    {loading ? 'Ending...' : 'End Journey'}
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