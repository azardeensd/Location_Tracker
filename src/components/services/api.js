import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qhtfjvzwiibedqinsqgl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodGZqdnp3aWliZWRxaW5zcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM0NDIsImV4cCI6MjA3NTg1OTQ0Mn0.Gcy5xzqHL_sN_BzRNadaLVU20i2-mhomhdHpZQtp8xw';
const supabase = createClient(supabaseUrl, supabaseKey);

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