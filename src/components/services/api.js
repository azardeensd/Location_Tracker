// services/api.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qhtfjvzwiibedqinsqgl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodGZqdnp3aWliZWRxaW5zcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM0NDIsImV4cCI6MjA3NTg1OTQ0Mn0.Gcy5xzqHL_sN_BzRNadaLVU20i2-mhomhdHpZQtp8xw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Add this function to get address from coordinates
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Format the address
    const address = data.display_name || `${data.address?.road || ''}, ${data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''}`.trim();
    
    return address;
  } catch (error) {
    console.error('Error getting address:', error);
    return `Coordinates: ${lat}, ${lng}`; // Fallback to coordinates
  }
};

// API functions
export const api = {
  // Get all agencies
  getAgencies: async () => {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('name');
    return { data, error };
  },

  // Get vehicles by agency
  getVehiclesByAgency: async (agencyId) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('agency_id', agencyId)
        .order('vehicle_number');
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return { data: null, error };
    }
  },

  // Start trip with address
  startTrip: async (tripData) => {
    try {
      console.log('Starting trip with data:', tripData);
      const { data, error } = await supabase
        .from('Trips')
        .insert([{
          agency_id: tripData.agency_id,
          vehicle_id: tripData.vehicle_id,
          vehicle_number: tripData.vehicle_number,
          plant: tripData.plant,
          driver_name: tripData.driver_name,
          driver_contact: tripData.driver_contact,
          start_lat: tripData.start_lat,
          start_lng: tripData.start_lng,
          start_address: tripData.start_address, // Add address field
          start_time: tripData.start_time,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select('*')
        .single();
      
      console.log('Start trip response:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('Error starting trip:', error);
      return { data: null, error };
    }
  },

  // End trip with address
  endTrip: async (tripId, endData) => {
    try {
      console.log('Ending trip:', tripId, endData);
      const { data: tripData, error } = await supabase
        .from('Trips')
        .update({
          end_lat: endData.end_lat,
          end_lng: endData.end_lng,
          end_address: endData.end_address, // Add address field
          end_time: endData.end_time,
          distance_km: endData.distance_km,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId)
        .select('*')
        .single();

      console.log('End trip response:', { tripData, error });

      if (error) {
        throw new Error(error.message);
      }

      return { data: tripData, error: null };
    } catch (error) {
      console.error('Error ending trip:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // Get active trip
  getActiveTrip: async () => {
    try {
      const { data, error } = await supabase
        .from('Trips')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      // If no active trip found, it's not an error
      if (error && error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching active trip:', error);
      return { data: null, error };
    }
  }
};

export default supabase;
