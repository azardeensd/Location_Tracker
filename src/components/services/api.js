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

  // Start journey
  startJourney: async (journeyData) => {
    try {
      const { data, error } = await supabase
        .from('journeys')
        .insert([{
          ...journeyData,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error starting journey:', error);
      return { data: null, error };
    }
  },

  // End journey
  endJourney: async (journeyId, endData) => {
    try {
      const { data: journeyData, error } = await supabase
        .from('journeys')
        .update({
          ...endData,
          updated_at: new Date().toISOString()
        })
        .eq('id', journeyId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data: journeyData, error: null };
    } catch (error) {
      console.error('Error ending journey:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // Get active journey
  getActiveJourney: async () => {
    try {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching active journey:', error);
      return { data: null, error };
    }
  }
};

export default supabase;
