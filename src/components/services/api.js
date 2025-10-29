import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xooblfykojmvtblrwlhh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb2JsZnlrb2ptdnRibHJ3bGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzQ2NTAsImV4cCI6MjA3NTg1MDY1MH0.LTqlR7xEP69k4c2HYUU0K8L1eOPZIDsRMi6iUn7P1LA';

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