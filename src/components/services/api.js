// services/api.js
import { createClient } from '@supabase/supabase-js';

// Singleton pattern to prevent multiple instances
let supabaseInstance = null;

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = 'https://qhtfjvzwiibedqinsqgl.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodGZqdnp3aWliZWRxaW5zcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM0NDIsImV4cCI6MjA3NTg1OTQ0Mn0.Gcy5xzqHL_sN_BzRNadaLVU20i2-mhomhdHpZQtp8xw';
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
};

const supabase = getSupabaseClient();

const MAPMYINDIA_API_KEY = '8b8a24aa829d919051bce41caee609af';

// CAPTCHA verification function
const verifyCaptcha = async (token) => {
  try {
    console.log('CAPTCHA token received:', token);
    
    // For development only - always return true
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: CAPTCHA verification bypassed');
      return true;
    }

    const response = await fetch('/api/verify-captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const data = await response.json();
    return data.success === true;
    
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return false;
  }
};

// Common login logic (without CAPTCHA) - UPDATED FOR NEW STRUCTURE
// In your api.js - update the commonLogin function
// FIXED commonLogin function in api.js
const commonLogin = async (credentials) => {
  try {
    console.log('🔐 Login attempt for:', credentials.username);

    // First, get the basic user data without complex joins
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', credentials.username)
      .eq('password', credentials.password)
      .eq('is_active', true)
      .single();

    if (userError) {
      console.log('❌ Database query error:', userError);
      return { data: null, error: userError };
    }

    if (!userData) {
      console.log('❌ No user found with provided credentials');
      return {
        data: null,
        error: { message: 'Invalid credentials or inactive account' }
      };
    }

    console.log('✅ User found:', userData);

    let plantName = 'N/A';
    let plantLocation = 'N/A';
    let plantId = userData.plant_id;
    let transporterName = null;

    // For plant_admin users - get plant details
    if (userData.role === 'plant_admin' && userData.plant_id) {
      console.log('🏭 Fetching plant details for plant admin');
      const { data: plantData, error: plantError } = await supabase
        .from('plants')
        .select('name, location')
        .eq('id', userData.plant_id)
        .single();

      if (!plantError && plantData) {
        plantName = plantData.name;
        plantLocation = plantData.location;
        console.log('✅ Plant details found:', plantData);
      } else {
        console.log('⚠️ No plant details found for plant admin');
      }
    }
    // For driver users - get agency and plant details
    else if (userData.role === 'driver' && userData.agency_id) {
      console.log('🚚 Fetching agency details for driver');
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('name, plant_id, plants(name, location)')
        .eq('id', userData.agency_id)
        .single();

      if (!agencyError && agencyData) {
        transporterName = agencyData.name;
        plantId = agencyData.plant_id;
        
        if (agencyData.plants) {
          plantName = agencyData.plants.name;
          plantLocation = agencyData.plants.location;
        }
        console.log('✅ Agency details found:', agencyData);
      }
    }

    // For plant_admin without plant_id, try to get it from user data
    if (userData.role === 'plant_admin' && !plantId) {
      plantId = userData.plant_id;
      console.log('⚠️ Plant admin has no plant_id in database');
    }

    console.log('🎯 Final user info:', {
      username: userData.username,
      role: userData.role,
      plantId,
      plantName,
      plantLocation
    });

    const token = btoa(JSON.stringify({
      userId: userData.id,
      username: userData.username,
      agency_id: userData.agency_id,
      plant: plantName,
      plant_location: plantLocation,
      plant_id: plantId, // This is crucial for plant admin
      transporter_name: transporterName,
      role: userData.role,
      timestamp: Date.now()
    }));

    console.log('✅ Login successful for user:', userData.username);
    
    return {
      data: {
        success: true,
        token,
        user: {
          id: userData.id,
          username: userData.username,
          agency_id: userData.agency_id,
          plant: plantName,
          plant_location: plantLocation,
          plant_id: plantId, // This must be set for plant admin
          transporter_name: transporterName,
          role: userData.role
        }
      },
      error: null
    };
  } catch (error) {
    console.error('💥 Exception in commonLogin:', error);
    return { data: null, error };
  }
};

// Simple device fingerprinting without restricted globals
export const generateDeviceId = () => {
  const storedDeviceId = localStorage.getItem('deviceId');
  if (storedDeviceId) {
    return storedDeviceId;
  }

  const fingerprintComponents = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency || 'unknown',
    window.screen.width + 'x' + window.screen.height,
    new Date().getTimezoneOffset(),
    !!navigator.cookieEnabled,
    !!navigator.javaEnabled && navigator.javaEnabled(),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprintComponents.length; i++) {
    const char = fingerprintComponents.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const deviceId = 'device_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  
  localStorage.setItem('deviceId', deviceId);
  console.log('Generated new device ID:', deviceId);
  
  return deviceId;
};

// Get device ID
export const getDeviceId = () => {
  return generateDeviceId();
};

// Get address from coordinates using MapMyIndia API
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    console.log('Getting address for coordinates:', lat, lng);
    
    const response = await fetch(
      `https://apis.mapmyindia.com/advancedmaps/v1/${MAPMYINDIA_API_KEY}/rev_geocode?lat=${lat}&lng=${lng}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('MapMyIndia API response:', data);
      
      if (data && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
    }
    
    return await getSimpleLocationDescription(lat, lng);
    
  } catch (error) {
    console.error('Error getting address from MapMyIndia API:', error);
    return await getSimpleLocationDescription(lat, lng);
  }
};

// Simple coordinates-based description as fallback
const getSimpleLocationDescription = async (lat, lng) => {
  const cities = [
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  ];
  
  let nearestCity = 'Unknown Location';
  let minDistance = Infinity;
  
  cities.forEach(city => {
    const distance = Math.sqrt(
      Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city.name;
    }
  });
  
  return `Near ${nearestCity} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
};

// API functions with device tracking
// FIXED API functions with proper plant filtering
export const api = {
  // ========== DASHBOARD TRIPS METHODS ==========
  
  // Get all trips (for admin) - FIXED with agencies
  getAllTrips: async () => {
    try {
      console.log('🔍 Fetching all trips for admin...');
      
      const { data, error } = await supabase
        .from('Trips')
        .select(`
          *,
          plant:plants(name, location),
          vehicle:vehicles(vehicle_number, vehicle_type),
          agency:agencies(name, code)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all trips:', error);
        return { data: [], error };
      }

      console.log('✅ All trips fetched successfully:', data?.length || 0);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Exception in getAllTrips:', error);
      return { data: [], error };
    }
  },
  // Get all trips (for Plant Admin) - FIXED with agencies
getTripsByPlant: async (plantId) => {
    try {
      console.log('🔍 Fetching trips for plant ID:', plantId);
      
      const { data: trips, error: tripsError } = await supabase
        .from('Trips')
        .select('*')
        .eq('plant_id', plantId)
        .order('created_at', { ascending: false });

      if (tripsError) {
        console.error('❌ Error fetching trips:', tripsError);
        return { data: [], error: tripsError };
      }

      if (!trips || trips.length === 0) {
        return { data: [], error: null };
      }

    // Get plant details separately
    const { data: plant, error: plantError } = await supabase
      .from('plants')
      .select('id, name, location, code')
      .eq('id', plantId)
      .single();

    console.log('🏭 Plant details:', plant);

    // Get vehicle details for all trips
    const vehicleIds = trips.map(trip => trip.vehicle_id).filter(Boolean);
    let vehicles = [];
    
    if (vehicleIds.length > 0) {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, vehicle_number, vehicle_type')
        .in('id', vehicleIds);
      
      if (!vehiclesError) {
        vehicles = vehiclesData || [];
      }
    }

    // Get agency details for all trips
    const agencyIds = trips.map(trip => trip.agency_id).filter(Boolean);
    let agencies = [];
    
    if (agencyIds.length > 0) {
      const { data: agenciesData, error: agenciesError } = await supabase
        .from('agencies')
        .select('id, name, code')
        .in('id', agencyIds);
      
      if (!agenciesError) {
        agencies = agenciesData || [];
      }
    }

    // Enrich trips data manually with plant information
    const enrichedTrips = trips.map(trip => ({
      ...trip,
      // Plant data in multiple formats
      plants: plant ? { 
        id: plant.id,
        name: plant.name, 
        location: plant.location,
        code: plant.code
      } : null,
      plant: plant ? plant.name : null, // Direct plant name
      plant_name: plant ? plant.name : null, // Alternative property
      plant_location: plant ? plant.location : null,
      plant_data: plant, // Complete plant object
      
      // Vehicle data
      vehicle: vehicles.find(v => v.id === trip.vehicle_id) || null,
      vehicles: vehicles.find(v => v.id === trip.vehicle_id) || null,
      
      // Agency data
      agency: agencies.find(a => a.id === trip.agency_id) || null,
      agencies: agencies.find(a => a.id === trip.agency_id) || null
    }));

    console.log('✅ Plant trips fetched and enriched:', enrichedTrips.length);
    console.log('📊 Sample enriched trip:', enrichedTrips[0]);
    return { data: enrichedTrips, error: null };

  } catch (error) {
    console.error('💥 Exception in getTripsByPlant:', error);
    return { data: [], error };
  }
},

  // ========== EXISTING AGENCY METHODS ==========
  
  // Get all agencies
  getAgencies: async () => {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('name');
    return { data, error };
  },

  startJourney: async (journeyData) => {
    const { data, error } = await supabase
      .from('journeys')
      .insert([journeyData])
      .select()
      .single();
    return { data, error };
  },

  endJourney: async (journeyId, endData) => {
    const { data, error } = await supabase
      .from('journeys')
      .update(endData)
      .eq('id', journeyId)
      .select()
      .single();
    return { data, error };
  },

  // Get active journey
  getActiveJourney: async () => {
    const { data, error } = await supabase
      .from('journeys')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return { data, error };
  }
};

export default supabase;