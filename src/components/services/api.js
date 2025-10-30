// services/api.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qhtfjvzwiibedqinsqgl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodGZqdnp3aWliZWRxaW5zcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM0NDIsImV4cCI6MjA3NTg1OTQ0Mn0.Gcy5xzqHL_sN_BzRNadaLVU20i2-mhomhdHpZQtp8xw';
const supabase = createClient(supabaseUrl, supabaseKey);

// API functions
export const api = {
  // Get all agencies
  getAgencies: async () => {
    try {
      console.log('Fetching agencies from Supabase...');
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('name');

      console.log('Supabase agencies response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getAgencies:', error);
      return { data: null, error };
    }
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

  // In your api.js
startTrip: async (TripData) => {
  try {
    console.log('Starting Trip with data:', TripData);
    const { data, error } = await supabase
      .from('Trips')
      .insert([{
        agency_id: TripData.agency_id,
        vehicle_id: TripData.vehicle_id,
        vehicle_number: TripData.vehicle_number, // Make sure this is included
        plant: TripData.plant,
        driver_name: TripData.driver_name,
        driver_contact: TripData.driver_contact,
        start_lat: TripData.start_lat,
        start_lng: TripData.start_lng,
        start_time: TripData.start_time,
        status: 'active',
        created_at: new Date().toISOString()
      }])
      .select('*') // Select all columns including vehicle_number
      .single();
    
    console.log('Start Trip response:', { data, error });
    return { data, error };
  } catch (error) {
    console.error('Error starting Trip:', error);
    return { data: null, error };
  }
},
  // End Trip
  endTrip: async (TripId, endData) => {
    try {
      const { data: TripData, error } = await supabase
        .from('Trips')
        .update({
          ...endData,
          updated_at: new Date().toISOString()
        })
        .eq('id', TripId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data: TripData, error: null };
    } catch (error) {
      console.error('Error ending Trip:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // Get active Trip
  getActiveTrip: async () => {
    try {
      const { data, error } = await supabase
        .from('Trips')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching active Trip:', error);
      return { data: null, error };
    }
  }
};

export default supabase;
