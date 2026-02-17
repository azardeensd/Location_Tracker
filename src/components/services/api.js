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
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select(`
          *,
          plants (
            name,
            location,
            code
          )
        `)
        .order('name');
      
      if (error) {
        console.error('Error fetching agencies:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching agencies:', error);
      return { data: null, error };
    }
  },

  // FIXED: Get agencies by plant - PROPER FILTERING
  getAgenciesByPlant: async (plant_id) => {
    try {
      console.log('🔍 Fetching agencies for plant ID:', plant_id);
      
      const { data, error } = await supabase
        .from('agencies')
        .select(`
          *,
          plants (
            name,
            location,
            code
          )
        `)
        .eq('plant_id', plant_id) // This is the key filter
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching plant agencies:', error);
        return { data: null, error };
      }
      
      console.log('✅ Plant agencies fetched:', data?.length || 0);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception fetching plant agencies:', error);
      return { data: null, error };
    }
  },

  // ========== VEHICLE METHODS ==========

  // Get all vehicles
  getVehicles: async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          agencies (
            name,
            plant_id,
            plants (
              name,
              location
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching vehicles:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching vehicles:', error);
      return { data: null, error };
    }
  },

  // NEW: Get vehicles by agency
  getVehiclesByAgency: async (agencyId) => {
    try {
      console.log('🚗 Fetching vehicles for agency ID:', agencyId);
      
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          agencies (
            name,
            plant_id,
            plants (
              name,
              location
            )
          )
        `)
        .eq('agency_id', agencyId)
        .order('vehicle_number');
      
      if (error) {
        console.error('❌ Error fetching agency vehicles:', error);
        return { data: null, error };
      }
      
      console.log('✅ Agency vehicles fetched:', data?.length || 0);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception fetching agency vehicles:', error);
      return { data: null, error };
    }
  },

  updateVehicle: async (vehicleId, vehicleData) => {
    try {
      console.log('🔄 Updating vehicle:', vehicleId, 'with data:', vehicleData);
      
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          agency_id: vehicleData.agency_id,
          vehicle_number: vehicleData.vehicle_number,
          vehicle_type: vehicleData.vehicle_type,
          capacity: vehicleData.capacity,
          status: vehicleData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
        .select(`
          *,
          agencies (
            name,
            plant_id,
            plants (
              name,
              location
            )
          )
      `)
        .single();
      
      if (error) {
        console.error('❌ Error updating vehicle:', error);
        return { data: null, error };
      }
      
      console.log('✅ Vehicle updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Exception updating vehicle:', error);
      return { data: null, error };
    }
  },

  // Delete vehicle
  deleteVehicle: async (vehicleId) => {
    try {
      console.log('🗑️ Deleting vehicle:', vehicleId);
      
      // First check if vehicle has any active trips
      const { data: activeTrips, error: tripsError } = await supabase
        .from('Trips')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .eq('status', 'active')
        .limit(1);
      
      if (tripsError) {
        console.error('Error checking vehicle trips:', tripsError);
        return { data: null, error: tripsError };
      }
      
      if (activeTrips && activeTrips.length > 0) {
        return { 
          data: null, 
          error: { message: 'Cannot delete vehicle. It has active trips.' } 
        };
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);
      
      if (error) {
        console.error('❌ Error deleting vehicle:', error);
        return { data: null, error };
      }
      
      console.log('✅ Vehicle deleted successfully');
      return { data: { success: true }, error: null };
    } catch (error) {
      console.error('💥 Exception deleting vehicle:', error);
      return { data: null, error };
    }
  },

  // NEW: Update vehicle status
  updateVehicleStatus: async (vehicleId, status) => {
    try {
      console.log('🔄 Updating vehicle status:', { vehicleId, status });
      
      const { data, error } = await supabase
        .from('vehicles')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating vehicle status:', error);
        return { data: null, error };
      }
      
      console.log('✅ Vehicle status updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Exception updating vehicle status:', error);
      return { data: null, error };
    }
  },

  // FIXED: Get vehicles by plant - PROPER FILTERING
  getVehiclesByPlantAlternative: async (plantId) => {
    try {
      console.log('🔍 Fetching vehicles for plant ID (alternative):', plantId);
      
      // First get agencies for this plant
      const { data: agencies, error: agenciesError } = await supabase
        .from('agencies')
        .select('id')
        .eq('plant_id', plantId);
      
      if (agenciesError) {
        console.error('Error fetching plant agencies:', agenciesError);
        return { data: null, error: agenciesError };
      }
      
      if (!agencies || agencies.length === 0) {
        console.log('No agencies found for plant, returning empty vehicles');
        return { data: [], error: null };
      }
      
      const agencyIds = agencies.map(agency => agency.id);
      console.log('Agency IDs for plant:', agencyIds);
      
      // Then get vehicles for these agencies
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          *,
          agencies (
            name,
            plant_id,
            plants (
              name,
              location
            )
          )
        `)
        .in('agency_id', agencyIds)
        .order('vehicle_number');
      
      if (vehiclesError) {
        console.error('Error fetching vehicles for agencies:', vehiclesError);
        return { data: null, error: vehiclesError };
      }
      
      console.log('✅ Plant vehicles fetched (alternative):', vehicles?.length || 0);
      return { data: vehicles, error: null };
    } catch (error) {
      console.error('Exception in alternative method:', error);
      return { data: null, error };
    }
  },

  // Create vehicle - UPDATED to NOT include plant_id
  createVehicle: async (vehicleData) => {
    try {
      console.log('🚗 CREATE VEHICLE API - START');
      console.log('Received agency_id:', vehicleData.agency_id, 'Type:', typeof vehicleData.agency_id);

      // First, let's check what agencies exist in the database
      console.log('🔍 Checking all agencies in database...');
      const { data: allAgencies, error: allAgenciesError } = await supabase
        .from('agencies')
        .select('id, name')
        .limit(10);

      if (!allAgenciesError) {
        console.log('📋 First 10 agencies in database:', allAgencies);
      }

      // Now check the specific agency exists
      console.log('🔍 Looking for specific agency:', vehicleData.agency_id);
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .select('id, name, plant_id')
        .eq('id', vehicleData.agency_id)
        .single();

      console.log('🔍 Agency query result:', { agency, agencyError });

      if (agencyError) {
        console.error('❌ Agency not found:', agencyError);
        return { 
          data: null, 
          error: { 
            message: `Agency not found. Available agencies: ${allAgencies?.map(a => `${a.name} (${a.id})`).join(', ')}` 
          } 
        };
      }

      if (!agency) {
        console.error('❌ Agency is null');
        return { 
          data: null, 
          error: { message: 'Selected agency does not exist in database' } 
        };
      }

      console.log('✅ Agency found:', agency);

      // Create vehicle WITHOUT plant_id - vehicles table doesn't need it
      const vehicleInsertData = {
        agency_id: vehicleData.agency_id,
        vehicle_number: vehicleData.vehicle_number,
        vehicle_type: vehicleData.vehicle_type,
        capacity: vehicleData.capacity,
        status: vehicleData.status,
        created_at: new Date().toISOString()
      };

      console.log('📦 Creating vehicle with:', vehicleInsertData);

      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleInsertData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating vehicle:', error);
        return { data: null, error };
      }

      console.log('✅ Vehicle created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Exception creating vehicle:', error);
      return { data: null, error };
    }
  },

  // ========== TRIP MANAGEMENT METHODS ==========

  // Check if device has active trip
   checkDeviceActiveTrip: async (deviceId) => {
    try {
      const { data, error } = await supabase
        .from('Trips')
        .select('*')
        .eq('device_id', deviceId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: null };
        }
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error checking device active trip:', error);
      return { data: null, error };
    }
  },


  // Start trip with device ID
   startTrip: async (tripData) => {
  try {
    const deviceId = generateDeviceId();
    const { data: activeTrip } = await api.checkDeviceActiveTrip(deviceId);
    
    if (activeTrip) return { data: null, error: { message: 'You already have an active trip.' } };

    const requiredFields = ['vehicle_id', 'plant_id', 'start_lat', 'start_lng', 'vendor_code'];
    const missingFields = requiredFields.filter(field => !tripData[field]);
    if (missingFields.length > 0) return { data: null, error: { message: `Missing fields: ${missingFields.join(', ')}` } };

    // Get user data from localStorage
    let agencyId = null;
    let plantId = null;
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const user = userData.user || adminData;
      
      // Check if agency_id is a valid UUID
      if (user?.agency_id && user.agency_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        agencyId = user.agency_id;
      }
      
      // Check if plant_id is a valid UUID
      if (user?.plant_id && user.plant_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        plantId = user.plant_id;
      }
    } catch (e) {
      console.warn('Could not get user data:', e);
    }

    // If we couldn't get UUIDs from user data, we need to fetch them
    if (!plantId && tripData.plant_id) {
      // Fetch the plant UUID using the provided plant_id (which might be a number or code)
      const { data: plant } = await supabase
        .from('plants')
        .select('id')
        .eq('id', tripData.plant_id)
        .maybeSingle();
      
      if (plant) {
        plantId = plant.id;
      } else {
        // Try to find by plant name or code
        const { data: plantByName } = await supabase
          .from('plants')
          .select('id')
          .eq('name', tripData.plant)
          .maybeSingle();
        
        if (plantByName) {
          plantId = plantByName.id;
        }
      }
    }

    if (!agencyId && tripData.agency_id) {
      // Fetch the agency UUID
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('id', tripData.agency_id)
        .maybeSingle();
      
      if (agency) {
        agencyId = agency.id;
      }
    }

    const tripInsertData = {
      agency_id: agencyId, // This will be a proper UUID or null
      vehicle_id: parseInt(tripData.vehicle_id) || null,
      vehicle_number: tripData.vehicle_number || null,
      plant: tripData.plant || null,
      plant_id: plantId, // This will be a proper UUID or null
      driver_name: tripData.driver_name || null,
      driver_contact: tripData.driver_contact || null,
      start_lat: parseFloat(tripData.start_lat) || 0,
      start_lng: parseFloat(tripData.start_lng) || 0,
      start_address: tripData.start_address || null,
      Start_Date: new Date().toISOString().split('T')[0],
      start_time: new Date().toISOString(),
      status: 'active',
      device_id: deviceId,
      vendor_code: tripData.vendor_code?.toString(),
      vendor_name: tripData.vendor_name?.toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📤 Starting trip with data:', JSON.stringify(tripInsertData, null, 2));

    const { data, error } = await supabase.from('Trips').insert([tripInsertData]).select().single();
    
    if (error) {
      console.error('❌ Error starting trip:', error);
      return { data: null, error: { message: error.message } };
    }
    return { data, error: null };
  } catch (error) { 
    console.error('❌ Exception in startTrip:', error);
    return { data: null, error: { message: error.message } }; 
  }
},
  // End trip - verify device ID
  endTrip: async (tripId, endData) => {
    try {
      const deviceId = getDeviceId();
      console.log('Ending trip with device ID:', deviceId);
      
      // First verify the trip belongs to this device
      const { data: trip, error: verifyError } = await supabase
        .from('Trips')
        .select('*')
        .eq('id', tripId)
        .eq('device_id', deviceId)
        .single();
      
      if (verifyError) {
        return { 
          data: null, 
          error: { message: 'Trip not found or you are not authorized to end this trip' } 
        };
      }
      
      // Get current date for end_date
      const currentDate = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('Trips')
        .update({
          end_lat: endData.end_lat,
          end_lng: endData.end_lng,
          end_address: endData.end_address,
          End_Date: currentDate, // ✅ ADDED: end date
          end_time: endData.end_time,
          distance_km: endData.distance_km,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId)
        .eq('device_id', deviceId)
        .select()
        .single();

      if (error) {
        console.error('Error ending trip:', error);
        return { data: null, error };
      }

      console.log('End trip response:', { data });
      return { data, error: null };
    } catch (error) {
      console.error('Exception ending trip:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // Get active trip for current device
   getActiveTrip: async () => {
    try {
      const deviceId = getDeviceId();
      
      const { data, error } = await supabase
        .from('Trips')
        .select('*')
        .eq('device_id', deviceId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
          console.log('No active trip found for this device');
          return { data: null, error: null };
        }
        console.error('Error fetching active trip:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching active trip:', error);
      return { data: null, error };
    }
  },

  // Get all trips for current device
  getDeviceTrips: async () => {
    try {
      const deviceId = getDeviceId();
      
      const { data, error } = await supabase
        .from('Trips')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching device trips:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching device trips:', error);
      return { data: null, error };
    }
  },

  // Get all trips for current device
  getDeviceTrips: async () => {
    try {
      const deviceId = getDeviceId();
      
      const { data, error } = await supabase
        .from('Trips')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching device trips:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching device trips:', error);
      return { data: null, error };
    }
  },

  // ========== AUTHENTICATION METHODS ==========

  // Driver login with CAPTCHA verification
  login: async (credentials) => {
    try {
      console.log('Driver login attempt with credentials:', { 
        username: credentials.username,
        hasCaptcha: !!credentials.captchaToken 
      });

      // Verify CAPTCHA first if token is provided
      if (credentials.captchaToken) {
        console.log('Verifying CAPTCHA...');
        const captchaVerified = await verifyCaptcha(credentials.captchaToken);
        
        if (!captchaVerified) {
          console.log('CAPTCHA verification failed');
          return {
            data: null,
            error: { message: 'CAPTCHA verification failed. Please try again.' }
          };
        }
        console.log('CAPTCHA verification successful');
      } else {
        console.log('No CAPTCHA token provided');
        return {
          data: null,
          error: { message: 'CAPTCHA verification required. Please complete the CAPTCHA.' }
        };
      }

      // Continue with login logic after CAPTCHA verification
      return await commonLogin(credentials);
    } catch (error) {
      console.error('Driver login API error:', error);
      return { data: null, error };
    }
  },

  // Admin login without CAPTCHA verification
  adminLogin: async (credentials) => {
    try {
      console.log('Admin login attempt with credentials:', { 
        username: credentials.username
      });

      console.log('Admin login - CAPTCHA verification bypassed');

      // Use common login logic without CAPTCHA
      return await commonLogin(credentials);
    } catch (error) {
      console.error('Admin login API error:', error);
      return { data: null, error };
    }
  },

  // ========== AGENCY MANAGEMENT METHODS ==========

  createAgency: async (agencyData) => {
    try {
      console.log('🏢 Creating agency:', agencyData);
      
      const { data, error } = await supabase
        .from('agencies')
        .insert([{
          name: agencyData.name,
          code: agencyData.code,
          email: agencyData.email,
          plant_id: agencyData.plant_id
          // Remove created_at if it doesn't exist in your table
        }])
        .select(`
          *,
          plants (
            name,
            location,
            code
          )
        `)
        .single();
      
      if (error) {
        console.error('❌ Error creating agency:', error);
        return { data: null, error };
      }
      
      console.log('✅ Agency created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Exception creating agency:', error);
      return { data: null, error };
    }
  },

  // Update agency - FIXED VERSION (removed updated_at)
  updateAgency: async (agencyId, agencyData) => {
    try {
      console.log('🔄 Updating agency:', agencyId, 'with data:', agencyData);
      
      const { data, error } = await supabase
        .from('agencies')
        .update({
          name: agencyData.name,
          code: agencyData.code,
          email: agencyData.email,
          plant_id: agencyData.plant_id
          // Remove updated_at if it doesn't exist in your table
        })
        .eq('id', agencyId)
        .select(`
          *,
          plants (
            name,
            location,
            code
          )
        `)
        .single();
      
      if (error) {
        console.error('❌ Error updating agency:', error);
        return { data: null, error };
      }
      
      console.log('✅ Agency updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Exception updating agency:', error);
      return { data: null, error };
    }
  },

  // Delete agency - FIXED VERSION
  deleteAgency: async (agencyId) => {
    try {
      console.log('🗑️ Deleting agency:', agencyId);
      
      // First check if agency has any vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('agency_id', agencyId)
        .limit(1);
      
      if (vehiclesError) {
        console.error('Error checking agency vehicles:', vehiclesError);
        return { data: null, error: vehiclesError };
      }
      
      if (vehicles && vehicles.length > 0) {
        return { 
          data: null, 
          error: { message: 'Cannot delete agency. It has vehicles assigned to it.' } 
        };
      }
      
      // Check if agency has any users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('agency_id', agencyId)
        .limit(1);
      
      if (usersError) {
        console.error('Error checking agency users:', usersError);
        return { data: null, error: usersError };
      }
      
      if (users && users.length > 0) {
        return { 
          data: null, 
          error: { message: 'Cannot delete agency. It has users assigned to it.' } 
        };
      }
      
      const { data, error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', agencyId);
      
      if (error) {
        console.error('❌ Error deleting agency:', error);
        return { data: null, error };
      }
      
      console.log('✅ Agency deleted successfully');
      return { data: { success: true }, error: null };
    } catch (error) {
      console.error('💥 Exception deleting agency:', error);
      return { data: null, error };
    }
  },

  // ========== USER MANAGEMENT METHODS ==========

  // Create user with automatic plant assignment
  createUser: async (userData) => {
    try {
      console.log('🔧 CREATE USER API CALL - START');
      console.log('Received user data:', userData);
      
      let plant_id = userData.plant_id || null;

      // For plant_admin role, use the provided plant_id directly
      if (userData.role === 'plant_admin' && userData.plant_id) {
        console.log('👤 Plant Admin user - using provided plant_id:', userData.plant_id);
        plant_id = userData.plant_id;
      }
      // For drivers, get plant_id from agency if not provided
      else if (userData.agency_id && !plant_id) {
        console.log('🚚 Driver user - fetching plant_id for agency:', userData.agency_id);
        
        const { data: agency, error: agencyError } = await supabase
          .from('agencies')
          .select('plant_id')
          .eq('id', userData.agency_id)
          .single();
        
        if (agencyError) {
          console.error('❌ Error fetching agency:', agencyError);
          return { data: null, error: agencyError };
        }
        
        if (agency && agency.plant_id) {
          plant_id = agency.plant_id;
          console.log('✅ Auto-set plant_id from agency:', plant_id);
        } else {
          console.warn('⚠️ No plant_id found for agency:', userData.agency_id);
        }
      }

      // Prepare the user data
      const userWithPlant = {
        username: userData.username,
        password: userData.password,
        agency_id: userData.agency_id || null,
        plant_id: plant_id, // This should be set correctly now
        role: userData.role || 'driver',
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        created_by: userData.created_by || null,
        created_at: new Date().toISOString() // Add created_at
      };

      console.log('📦 Final user data to insert:', userWithPlant);

      // Insert the user
      const { data, error } = await supabase
        .from('users')
        .insert([userWithPlant])
        .select(`
          *,
          agencies (
            name,
            plant_id,
            plants (
              name,
              location
            )
          )
        `)
        .single();
      
      if (error) {
        console.error('❌ Error inserting user:', error);
        return { data: null, error };
      }

      console.log('✅ User created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Exception creating user:', error);
      return { data: null, error };
    }
  },

  // UPDATE USER FUNCTION
  updateUser: async (userId, userData) => {
    try {
      console.log('Updating user:', userId, 'with data:', userData);
      
      let plant_id = userData.plant_id;

      // If agency_id is being updated, automatically fetch and set the plant_id
      if (userData.agency_id && !plant_id) {
        console.log('Fetching plant_id for updated agency:', userData.agency_id);
        
        const { data: agency, error: agencyError } = await supabase
          .from('agencies')
          .select('plant_id')
          .eq('id', userData.agency_id)
          .single();
        
        if (agencyError) {
          console.error('Error fetching agency:', agencyError);
          return { data: null, error: agencyError };
        }
        
        if (agency && agency.plant_id) {
          plant_id = agency.plant_id;
          console.log('Auto-set plant_id to:', plant_id);
        }
      }

      // Prepare update data
      const updateData = { ...userData };
      if (plant_id !== undefined) {
        updateData.plant_id = plant_id;
      }

      console.log('Final update data:', updateData);

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user:', error);
        return { data: null, error };
      }
      
      console.log('User updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Exception updating user:', error);
      return { data: null, error };
    }
  },

  // Verify token method
  verifyToken: async (token) => {
    try {
      const decoded = JSON.parse(atob(token));
      const currentTime = Date.now();
      
      // Check if token is expired (24 hours)
      if (currentTime - decoded.timestamp > 24 * 60 * 60 * 1000) {
        return { valid: false };
      }

      return { valid: true, user: decoded };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false };
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching user:', error);
      return { data: null, error };
    }
  },

  // Get all users (for admin purposes)
  getUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          agencies (
            name,
            plant_id,
            plants (
              name,
              location
            )
          )
        `)
        .order('username');

      if (error) {
        console.error('Error fetching users:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching users:', error);
      return { data: null, error };
    }
  },

  // ========== PLANTS API ENDPOINTS ==========

  // Get all plants
  getPlants: async () => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching plants:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching plants:', error);
      return { data: null, error };
    }
  },

  // Create plant
  createPlant: async (plantData) => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .insert([{
          name: plantData.name,
          location: plantData.location,
          code: plantData.code,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating plant:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception creating plant:', error);
      return { data: null, error };
    }
  },

  // Update plant
  updatePlant: async (plant_id, plantData) => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .update(plantData)
        .eq('id', plant_id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating plant:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception updating plant:', error);
      return { data: null, error };
    }
  },

  // Delete plant
  deletePlant: async (plant_id) => {
    try {
      // First check if any agencies are using this plant
      const { data: agencies, error: agenciesError } = await supabase
        .from('agencies')
        .select('id')
        .eq('plant_id', plant_id)
        .limit(1);
      
      if (agenciesError) {
        console.error('Error checking plant usage:', agenciesError);
        return { data: null, error: agenciesError };
      }
      
      if (agencies && agencies.length > 0) {
        return { 
          data: null, 
          error: { message: 'Cannot delete plant. It is being used by one or more agencies.' } 
        };
      }
      
      const { data, error } = await supabase
        .from('plants')
        .delete()
        .eq('id', plant_id);
      
      if (error) {
        console.error('Error deleting plant:', error);
        return { data: null, error };
      }
      
      return { data: { success: true }, error: null };
    } catch (error) {
      console.error('Exception deleting plant:', error);
      return { data: null, error };
    }
  },

  // Get plant by ID
  getPlantById: async (plant_id) => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('id', plant_id)
        .single();

      if (error) {
        console.error('Error fetching plant:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching plant:', error);
      return { data: null, error };
    }
  }
};

export default api;
