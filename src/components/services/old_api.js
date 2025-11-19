//old code//

// // services/api.js
// import { createClient } from '@supabase/supabase-js';

// // Singleton pattern to prevent multiple instances
// let supabaseInstance = null;

// const getSupabaseClient = () => {
//   if (!supabaseInstance) {
//     const supabaseUrl = 'https://qhtfjvzwiibedqinsqgl.supabase.co';
//     const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodGZqdnp3aWliZWRxaW5zcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM0NDIsImV4cCI6MjA3NTg1OTQ0Mn0.Gcy5xzqHL_sN_BzRNadaLVU20i2-mhomhdHpZQtp8xw';
//     supabaseInstance = createClient(supabaseUrl, supabaseKey);
//   }
//   return supabaseInstance;
// };

// const supabase = getSupabaseClient();

// const MAPMYINDIA_API_KEY = '8b8a24aa829d919051bce41caee609af';

// // Simple device fingerprinting without restricted globals
// export const generateDeviceId = () => {
//   // Check if we already have a device ID
//   const storedDeviceId = localStorage.getItem('deviceId');
//   if (storedDeviceId) {
//     return storedDeviceId;
//   }

//   // Generate a unique device fingerprint using available browser information
//   // Use window.screen instead of direct screen global
//   const fingerprintComponents = [
//     navigator.userAgent,
//     navigator.language,
//     navigator.hardwareConcurrency || 'unknown',
//     window.screen.width + 'x' + window.screen.height, // Fixed: use window.screen
//     new Date().getTimezoneOffset(),
//     !!navigator.cookieEnabled,
//     !!navigator.javaEnabled && navigator.javaEnabled(),
//   ].join('|');

//   // Create a simple hash
//   let hash = 0;
//   for (let i = 0; i < fingerprintComponents.length; i++) {
//     const char = fingerprintComponents.charCodeAt(i);
//     hash = ((hash << 5) - hash) + char;
//     hash = hash & hash; // Convert to 32-bit integer
//   }

//   const deviceId = 'device_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  
//   // Store in localStorage
//   localStorage.setItem('deviceId', deviceId);
//   console.log('Generated new device ID:', deviceId);
  
//   return deviceId;
// };

// // Get device ID
// export const getDeviceId = () => {
//   return generateDeviceId();
// };

// // Get address from coordinates using MapMyIndia API
// export const getAddressFromCoordinates = async (lat, lng) => {
//   try {
//     console.log('Getting address for coordinates:', lat, lng);
    
//     const response = await fetch(
//       `https://apis.mapmyindia.com/advancedmaps/v1/${MAPMYINDIA_API_KEY}/rev_geocode?lat=${lat}&lng=${lng}`
//     );
    
//     if (response.ok) {
//       const data = await response.json();
//       console.log('MapMyIndia API response:', data);
      
//       if (data && data.results && data.results.length > 0) {
//         return data.results[0].formatted_address;
//       }
//     }
    
//     return await getSimpleLocationDescription(lat, lng);
    
//   } catch (error) {
//     console.error('Error getting address from MapMyIndia API:', error);
//     return await getSimpleLocationDescription(lat, lng);
//   }
// };

// // Simple coordinates-based description as fallback
// const getSimpleLocationDescription = async (lat, lng) => {
//   const cities = [
//     { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
//     { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
//     { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
//     { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
//     { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
//     { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
//   ];
  
//   let nearestCity = 'Unknown Location';
//   let minDistance = Infinity;
  
//   cities.forEach(city => {
//     const distance = Math.sqrt(
//       Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
//     );
//     if (distance < minDistance) {
//       minDistance = distance;
//       nearestCity = city.name;
//     }
//   });
  
//   return `Near ${nearestCity} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
// };

// // API functions with device tracking
// export const api = {
//   // Get all agencies
//   getAgencies: async () => {
//     try {
//       const { data, error } = await supabase
//         .from('agencies')
//         .select('*')
//         .order('name');
      
//       if (error) {
//         console.error('Error fetching agencies:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching agencies:', error);
//       return { data: null, error };
//     }
//   },

//   // Get vehicles by agency
//   getVehiclesByAgency: async (agencyId) => {
//     try {
//       const { data, error } = await supabase
//         .from('vehicles')
//         .select('*')
//         .eq('agency_id', agencyId)
//         .order('vehicle_number');
      
//       if (error) {
//         console.error('Error fetching vehicles:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching vehicles:', error);
//       return { data: null, error };
//     }
//   },

//   // Check if device has active trip
//   checkDeviceActiveTrip: async (deviceId) => {
//     try {
//       const { data, error } = await supabase
//         .from('Trips')
//         .select('*')
//         .eq('device_id', deviceId)
//         .eq('status', 'active')
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .single();
      
//       if (error) {
//         if (error.code === 'PGRST116') {
//           return { data: null, error: null }; // No active trip
//         }
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Error checking device active trip:', error);
//       return { data: null, error };
//     }
//   },

//   // Start trip with device ID
//   startTrip: async (tripData) => {
//     try {
//       const deviceId = getDeviceId();
//       console.log('Starting trip with device ID:', deviceId);
      
//       const { data, error } = await supabase
//         .from('Trips')
//         .insert([{
//           agency_id: tripData.agency_id,
//           vehicle_id: tripData.vehicle_id,
//           vehicle_number: tripData.vehicle_number,
//           plant: tripData.plant,
//           driver_name: tripData.driver_name,
//           driver_contact: tripData.driver_contact,
//           start_lat: tripData.start_lat,
//           start_lng: tripData.start_lng,
//           start_address: tripData.start_address,
//           start_time: tripData.start_time,
//           status: 'active',
//           device_id: deviceId,
//           created_at: new Date().toISOString()
//         }])
//         .select()
//         .single();
      
//       if (error) {
//         console.error('Error starting trip:', error);
//         return { data: null, error };
//       }
      
//       console.log('Start trip response:', { data, error });
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception starting trip:', error);
//       return { data: null, error: { message: error.message } };
//     }
//   },

//   // End trip - verify device ID
//   endTrip: async (tripId, endData) => {
//     try {
//       const deviceId = getDeviceId();
//       console.log('Ending trip with device ID:', deviceId);
      
//       // First verify the trip belongs to this device
//       const { data: trip, error: verifyError } = await supabase
//         .from('Trips')
//         .select('*')
//         .eq('id', tripId)
//         .eq('device_id', deviceId)
//         .single();
      
//       if (verifyError) {
//         return { 
//           data: null, 
//           error: { message: 'Trip not found or you are not authorized to end this trip' } 
//         };
//       }
      
//       const { data, error } = await supabase
//         .from('Trips')
//         .update({
//           end_lat: endData.end_lat,
//           end_lng: endData.end_lng,
//           end_address: endData.end_address,
//           end_time: endData.end_time,
//           distance_km: endData.distance_km,
//           status: 'completed',
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', tripId)
//         .eq('device_id', deviceId)
//         .select()
//         .single();

//       if (error) {
//         console.error('Error ending trip:', error);
//         return { data: null, error };
//       }

//       console.log('End trip response:', { data });
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception ending trip:', error);
//       return { data: null, error: { message: error.message } };
//     }
//   },

//   // Get active trip for current device
//   getActiveTrip: async () => {
//     try {
//       const deviceId = getDeviceId();
      
//       const { data, error } = await supabase
//         .from('Trips')
//         .select('*')
//         .eq('device_id', deviceId)
//         .eq('status', 'active')
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .single();
      
//       if (error) {
//         if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
//           console.log('No active trip found for this device');
//           return { data: null, error: null };
//         }
//         console.error('Error fetching active trip:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching active trip:', error);
//       return { data: null, error };
//     }
//   },

//   // Get all trips for current device
//   getDeviceTrips: async () => {
//     try {
//       const deviceId = getDeviceId();
      
//       const { data, error } = await supabase
//         .from('Trips')
//         .select('*')
//         .eq('device_id', deviceId)
//         .order('created_at', { ascending: false });
      
//       if (error) {
//         console.error('Error fetching device trips:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching device trips:', error);
//       return { data: null, error };
//     }
//   },

//   // Login method
//   login: async (credentials) => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select(`
//           *,
//           agencies (
//             name,
//             plant
//           )
//         `)
//         .eq('username', credentials.username)
//         .eq('password', credentials.password)
//         .eq('is_active', true)
//         .single();

//       if (error) {
//         return { data: null, error };
//       }

//       if (data) {
//         const token = btoa(JSON.stringify({
//           userId: data.id,
//           username: data.username,
//           agency_id: data.agency_id,
//           plant: data.agencies?.plant,
//           transporter_name: data.agencies?.name,
//           role: data.role,
//           timestamp: Date.now()
//         }));

//         return {
//           data: {
//             success: true,
//             token,
//             user: {
//               id: data.id,
//               username: data.username,
//               agency_id: data.agency_id,
//               plant: data.agencies?.plant,
//               transporter_name: data.agencies?.name,
//               role: data.role
//             }
//           },
//           error: null
//         };
//       } else {
//         return {
//           data: null,
//           error: { message: 'Invalid credentials or inactive account' }
//         };
//       }
//     } catch (error) {
//       console.error('Login API error:', error);
//       return { data: null, error };
//     }
//   },

//   // Create user with automatic plant assignment
//   createUser: async (userData) => {
//     try {
//       console.log('Creating user with data:', userData);
      
//       let plant = userData.plant;

//       // If agency_id is provided, fetch the plant
//       if (userData.agency_id && !plant) {
//         console.log('Fetching plant for agency_id:', userData.agency_id);
        
//         const { data: agency, error: agencyError } = await supabase
//           .from('agencies')
//           .select('plant')
//           .eq('id', userData.agency_id)
//           .single();
        
//         if (agencyError) {
//           console.error('Error fetching agency:', agencyError);
//           return { data: null, error: agencyError };
//         }
        
//         if (agency && agency.plant) {
//           plant = agency.plant;
//           console.log('Auto-set plant to:', plant);
//         } else {
//           console.warn('No plant found for agency:', userData.agency_id);
//         }
//       }

//       // Prepare the user data with plant
//       const userWithPlant = {
//         username: userData.username,
//         password: userData.password,
//         agency_id: userData.agency_id,
//         plant: plant,
//         role: userData.role || 'driver',
//         is_active: userData.is_active !== undefined ? userData.is_active : true,
//         created_by: userData.created_by || null
//       };

//       console.log('Final user data to insert:', userWithPlant);

//       // Insert the user
//       const { data, error } = await supabase
//         .from('users')
//         .insert([userWithPlant])
//         .select()
//         .single();
      
//       if (error) {
//         console.error('Error inserting user:', error);
//         return { data: null, error };
//       }

//       console.log('User created successfully:', data);
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception creating user:', error);
//       return { data: null, error };
//     }
//   },

//   // Update user (with automatic plant update if agency changes)
//   updateUser: async (userId, userData) => {
//     try {
//       // If agency_id is being updated, automatically fetch and set the plant
//       if (userData.agency_id) {
//         const { data: agency, error: agencyError } = await supabase
//           .from('agencies')
//           .select('plant')
//           .eq('id', userData.agency_id)
//           .single();
        
//         if (agencyError) {
//           console.error('Error fetching agency:', agencyError);
//           return { data: null, error: agencyError };
//         }
        
//         if (agency) {
//           userData.plant = agency.plant;
//         }
//       }
      
//       const { data, error } = await supabase
//         .from('users')
//         .update(userData)
//         .eq('id', userId)
//         .select()
//         .single();
      
//       if (error) {
//         console.error('Error updating user:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception updating user:', error);
//       return { data: null, error };
//     }
//   },

//   // Verify token method
//   verifyToken: async (token) => {
//     try {
//       const decoded = JSON.parse(atob(token));
//       const currentTime = Date.now();
      
//       // Check if token is expired (24 hours)
//       if (currentTime - decoded.timestamp > 24 * 60 * 60 * 1000) {
//         return { valid: false };
//       }

//       return { valid: true, user: decoded };
//     } catch (error) {
//       console.error('Token verification error:', error);
//       return { valid: false };
//     }
//   },

//   // Get user by ID
//   getUserById: async (userId) => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', userId)
//         .single();

//       if (error) {
//         console.error('Error fetching user:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching user:', error);
//       return { data: null, error };
//     }
//   },

//   // Get all users (for admin purposes)
//   getUsers: async () => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*, agencies(name)')
//         .order('username');

//       if (error) {
//         console.error('Error fetching users:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching users:', error);
//       return { data: null, error };
//     }
//   }
// };

// export default supabase;

// // services/api.js
// import { createClient } from '@supabase/supabase-js';

// // Singleton pattern to prevent multiple instances
// let supabaseInstance = null;

// const getSupabaseClient = () => {
//   if (!supabaseInstance) {
//     const supabaseUrl = 'https://qhtfjvzwiibedqinsqgl.supabase.co';
//     const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodGZqdnp3aWliZWRxaW5zcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM0NDIsImV4cCI6MjA3NTg1OTQ0Mn0.Gcy5xzqHL_sN_BzRNadaLVU20i2-mhomhdHpZQtp8xw';
//     supabaseInstance = createClient(supabaseUrl, supabaseKey);
//   }
//   return supabaseInstance;
// };

// const supabase = getSupabaseClient();

// const MAPMYINDIA_API_KEY = '8b8a24aa829d919051bce41caee609af';

// // Get address from coordinates using MapMyIndia API with CORS workaround
// export const getAddressFromCoordinates = async (lat, lng) => {
//   try {
//     // Method 1: Try the official MapMyIndia reverse geocode endpoint
//     const response = await fetch(
//       `https://apis.mapmyindia.com/advancedmaps/v1/${MAPMYINDIA_API_KEY}/rev_geocode?lat=${lat}&lng=${lng}`
//     );
    
//     if (response.ok) {
//       const data = await response.json();
      
//       if (data && data.results && data.results.length > 0) {
//         return data.results[0].formatted_address;
//       }
//     }
    
//     // Method 2: If first method fails, try a different endpoint
//     const fallbackResponse = await fetch(
//       `https://atlas.mapmyindia.com/api/places/reverse_geocode?lat=${lat}&lng=${lng}&region=IND`,
//       {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${MAPMYINDIA_API_KEY}`
//         }
//       }
//     );
    
//     if (fallbackResponse.ok) {
//       const data = await fallbackResponse.json();
      
//       if (data.copResults && data.copResults.address) {
//         const address = data.copResults.address;
//         return formatMapMyIndiaAddress(address);
//       }
//     }
    
//     // Method 3: Final fallback - use a CORS proxy
//     const proxyResponse = await fetch(
//       `https://corsproxy.io/?${encodeURIComponent(`https://atlas.mapmyindia.com/api/places/reverse_geocode?lat=${lat}&lng=${lng}&region=IND&pod=city`)}`,
//       {
//         headers: {
//           'Authorization': `Bearer ${MAPMYINDIA_API_KEY}`
//         }
//       }
//     );
    
//     if (proxyResponse.ok) {
//       const data = await proxyResponse.json();
      
//       if (data.copResults && data.copResults.address) {
//         const address = data.copResults.address;
//         return formatMapMyIndiaAddress(address);
//       }
//     }
    
//     // If all methods fail, return coordinates
//     return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
//   } catch (error) {
//     console.error('Error getting address from MapMyIndia API:', error);
    
//     // Ultimate fallback - return coordinates
//     return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//   }
// };

// // Helper function to format MapMyIndia address
// const formatMapMyIndiaAddress = (address) => {
//   let formattedAddress = '';
  
//   if (address.houseNumber) formattedAddress += `${address.houseNumber}, `;
//   if (address.houseName) formattedAddress += `${address.houseName}, `;
//   if (address.street) formattedAddress += `${address.street}, `;
//   if (address.subSubLocality) formattedAddress += `${address.subSubLocality}, `;
//   if (address.subLocality) formattedAddress += `${address.subLocality}, `;
//   if (address.locality) formattedAddress += `${address.locality}, `;
//   if (address.city) formattedAddress += `${address.city}, `;
//   if (address.state) formattedAddress += `${address.state}, `;
//   if (address.pincode) formattedAddress += `${address.pincode}`;
  
//   formattedAddress = formattedAddress.replace(/, $/, '');
//   return formattedAddress || 'Address not available';
// };

// // Alternative: Simple coordinates-based description (as fallback)
// export const getSimpleLocationDescription = async (lat, lng) => {
//   try {
//     // Try to get address first
//     const address = await getAddressFromCoordinates(lat, lng);
    
//     // If we got a proper address (not just coordinates), return it
//     if (address && !address.startsWith('Coordinates:')) {
//       return address;
//     }
    
//     // Otherwise create a simple description based on coordinates
//     // This is useful when APIs are blocked
//     const locations = [
//       { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
//       { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
//       { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
//       { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
//       { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },
//       { lat: 22.5726, lng: 88.3639, name: 'Kolkata' }
//     ];
    
//     // Find the nearest major city
//     let nearestCity = 'Unknown Location';
//     let minDistance = Infinity;
    
//     locations.forEach(location => {
//       const distance = Math.sqrt(
//         Math.pow(lat - location.lat, 2) + Math.pow(lng - location.lng, 2)
//       );
//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestCity = location.name;
//       }
//     });
    
//     return `Near ${nearestCity} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    
//   } catch (error) {
//     console.error('Error getting location description:', error);
//     return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//   }
// };

// // API functions (all your existing functions remain the same)
// export const api = {
//   // Get all agencies
//   getAgencies: async () => {
//     try {
//       const { data, error } = await supabase
//         .from('agencies')
//         .select('*')
//         .order('name');
      
//       if (error) {
//         console.error('Error fetching agencies:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching agencies:', error);
//       return { data: null, error };
//     }
//   },

//   // Get vehicles by agency
//   getVehiclesByAgency: async (agencyId) => {
//     try {
//       const { data, error } = await supabase
//         .from('vehicles')
//         .select('*')
//         .eq('agency_id', agencyId)
//         .order('vehicle_number');
      
//       if (error) {
//         console.error('Error fetching vehicles:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching vehicles:', error);
//       return { data: null, error };
//     }
//   },

//   // Start trip with address
//   startTrip: async (tripData) => {
//     try {
//       console.log('Starting trip with data:', tripData);
      
//       const { data, error } = await supabase
//         .from('Trips')
//         .insert([{
//           agency_id: tripData.agency_id,
//           vehicle_id: tripData.vehicle_id,
//           vehicle_number: tripData.vehicle_number,
//           plant: tripData.plant,
//           driver_name: tripData.driver_name,
//           driver_contact: tripData.driver_contact,
//           start_lat: tripData.start_lat,
//           start_lng: tripData.start_lng,
//           start_address: tripData.start_address,
//           start_time: tripData.start_time,
//           status: 'active',
//           created_at: new Date().toISOString()
//         }])
//         .select()
//         .single();
      
//       if (error) {
//         console.error('Error starting trip:', error);
//         return { data: null, error };
//       }
      
//       console.log('Start trip response:', { data, error });
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception starting trip:', error);
//       return { data: null, error: { message: error.message } };
//     }
//   },

//   // End trip with address
//   endTrip: async (tripId, endData) => {
//     try {
//       console.log('Ending trip:', tripId, endData);
      
//       const { data, error } = await supabase
//         .from('Trips')
//         .update({
//           end_lat: endData.end_lat,
//           end_lng: endData.end_lng,
//           end_address: endData.end_address,
//           end_time: endData.end_time,
//           distance_km: endData.distance_km,
//           status: 'completed',
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', tripId)
//         .select()
//         .single();

//       if (error) {
//         console.error('Error ending trip:', error);
//         return { data: null, error };
//       }

//       console.log('End trip response:', { data });
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception ending trip:', error);
//       return { data: null, error: { message: error.message } };
//     }
//   },

//   // Get active trip
//   getActiveTrip: async () => {
//     try {
//       const { data, error } = await supabase
//         .from('Trips')
//         .select('*')
//         .eq('status', 'active')
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .single();
      
//       if (error) {
//         if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
//           console.log('No active trip found - this is normal');
//           return { data: null, error: null };
//         }
//         console.error('Error fetching active trip:', error);
        
//         if (error.code === '42501' || error.message?.includes('permission')) {
//           console.error('Permission denied - check RLS policies');
//           return { data: null, error: { message: 'Permission denied. Check table permissions.' } };
//         }
        
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching active trip:', error);
//       return { data: null, error };
//     }
//   },

//   // Login method
//   login: async (credentials) => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select(`
//           *,
//           agencies (
//             name,
//             plant
//           )
//         `)
//         .eq('username', credentials.username)
//         .eq('password', credentials.password)
//         .eq('is_active', true)
//         .single();

//       if (error) {
//         return { data: null, error };
//       }

//       if (data) {
//         const token = btoa(JSON.stringify({
//           userId: data.id,
//           username: data.username,
//           agency_id: data.agency_id,
//           plant: data.agencies?.plant,
//           transporter_name: data.agencies?.name,
//           role: data.role,
//           timestamp: Date.now()
//         }));

//         return {
//           data: {
//             success: true,
//             token,
//             user: {
//               id: data.id,
//               username: data.username,
//               agency_id: data.agency_id,
//               plant: data.agencies?.plant,
//               transporter_name: data.agencies?.name,
//               role: data.role
//             }
//           },
//           error: null
//         };
//       } else {
//         return {
//           data: null,
//           error: { message: 'Invalid credentials or inactive account' }
//         };
//       }
//     } catch (error) {
//       console.error('Login API error:', error);
//       return { data: null, error };
//     }
//   },

//   // ... include all your other existing API functions
//   createUser: async (userData) => {
//     // ... your existing createUser implementation
//   },

//   updateUser: async (userId, userData) => {
//     // ... your existing updateUser implementation
//   },

//   verifyToken: async (token) => {
//     // ... your existing verifyToken implementation
//   },

//   getUserById: async (userId) => {
//     // ... your existing getUserById implementation
//   },

//   getUsers: async () => {
//     // ... your existing getUsers implementation
//   }
// };

// export default supabase;


// // services/api.js
// import { createClient } from '@supabase/supabase-js';

// // Singleton pattern to prevent multiple instances
// let supabaseInstance = null;

// const getSupabaseClient = () => {
//   if (!supabaseInstance) {
//     const supabaseUrl = 'https://qhtfjvzwiibedqinsqgl.supabase.co';
//     const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodGZqdnp3aWliZWRxaW5zcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM0NDIsImV4cCI6MjA3NTg1OTQ0Mn0.Gcy5xzqHL_sN_BzRNadaLVU20i2-mhomhdHpZQtp8xw';
//     supabaseInstance = createClient(supabaseUrl, supabaseKey);
//   }
//   return supabaseInstance;
// };

// const supabase = getSupabaseClient();

// // Get address from coordinates using Google Geocoding API
// export const getAddressFromCoordinates = async (lat, lng) => {
//   try {
//     const apiKey = 'AIzaSyAkfePn1hexpsaQFrs8Y4bJy2Ado_JluYI';
//     const response = await fetch(
//       `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
//     );
    
//     if (!response.ok) {
//       throw new Error('Failed to fetch address from Google API');
//     }
    
//     const data = await response.json();
    
//     if (data.status === 'OK' && data.results && data.results.length > 0) {
//       return data.results[0].formatted_address;
//     } else if (data.status === 'ZERO_RESULTS') {
//       return `Location near coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//     } else {
//       throw new Error(`Google API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
//     }
    
//   } catch (error) {
//     console.error('Error getting address from Google API:', error);
//     return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//   }
// };

// // API functions
// export const api = {
//   // Get all agencies
//   getAgencies: async () => {
//     try {
//       const { data, error } = await supabase
//         .from('agencies')
//         .select('*')
//         .order('name');
      
//       if (error) {
//         console.error('Error fetching agencies:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching agencies:', error);
//       return { data: null, error };
//     }
//   },

//   // Get vehicles by agency
//   getVehiclesByAgency: async (agencyId) => {
//     try {
//       const { data, error } = await supabase
//         .from('vehicles')
//         .select('*')
//         .eq('agency_id', agencyId)
//         .order('vehicle_number');
      
//       if (error) {
//         console.error('Error fetching vehicles:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching vehicles:', error);
//       return { data: null, error };
//     }
//   },

//   // Start trip with address - FIXED TABLE NAME
//   startTrip: async (tripData) => {
//     try {
//       console.log('Starting trip with data:', tripData);
      
//       const { data, error } = await supabase
//         .from('Trips') // Changed to lowercase
//         .insert([{
//           agency_id: tripData.agency_id,
//           vehicle_id: tripData.vehicle_id,
//           vehicle_number: tripData.vehicle_number,
//           plant: tripData.plant,
//           driver_name: tripData.driver_name,
//           driver_contact: tripData.driver_contact,
//           start_lat: tripData.start_lat,
//           start_lng: tripData.start_lng,
//           start_address: tripData.start_address,
//           start_time: tripData.start_time,
//           status: 'active',
//           created_at: new Date().toISOString()
//         }])
//         .select()
//         .single();
      
//       if (error) {
//         console.error('Error starting trip:', error);
//         return { data: null, error };
//       }
      
//       console.log('Start trip response:', { data, error });
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception starting trip:', error);
//       return { data: null, error: { message: error.message } };
//     }
//   },

//   // End trip with address - FIXED TABLE NAME
//   endTrip: async (tripId, endData) => {
//     try {
//       console.log('Ending trip:', tripId, endData);
      
//       const { data, error } = await supabase
//         .from('Trips') // Changed to lowercase
//         .update({
//           end_lat: endData.end_lat,
//           end_lng: endData.end_lng,
//           end_address: endData.end_address,
//           end_time: endData.end_time,
//           distance_km: endData.distance_km,
//           status: 'completed',
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', tripId)
//         .select()
//         .single();

//       if (error) {
//         console.error('Error ending trip:', error);
//         return { data: null, error };
//       }

//       console.log('End trip response:', { data });
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception ending trip:', error);
//       return { data: null, error: { message: error.message } };
//     }
//   },

//   // Get active trip - FIXED TABLE NAME
//   // In api.js - UPDATE getActiveTrip method
// getActiveTrip: async () => {
//   try {
//     const { data, error } = await supabase
//       .from('Trips') // Make sure this matches your exact table name
//       .select('*')
//       .eq('status', 'active')
//       .order('created_at', { ascending: false })
//       .limit(1)
//       .single();
    
//     // If no active trip found, it's not an error
//     if (error) {
//       if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
//         console.log('No active trip found - this is normal');
//         return { data: null, error: null };
//       }
//       console.error('Error fetching active trip:', error);
      
//       // Check if it's a permission error
//       if (error.code === '42501' || error.message?.includes('permission')) {
//         console.error('Permission denied - check RLS policies');
//         return { data: null, error: { message: 'Permission denied. Check table permissions.' } };
//       }
      
//       return { data: null, error };
//     }
    
//     return { data, error: null };
//   } catch (error) {
//     console.error('Exception fetching active trip:', error);
//     return { data: null, error };
//   }
// },

//   // Login method
//   // In your api.js login method
// // In your api.js login method - UPDATE THIS
// login: async (credentials) => {
//   try {
//     const { data, error } = await supabase
//       .from('users')
//       .select(`
//         *,
//         agencies (
//           name,
//           plant
//         )
//       `)
//       .eq('username', credentials.username)
//       .eq('password', credentials.password)
//       .eq('is_active', true)
//       .single();

//     if (error) {
//       return { data: null, error };
//     }

//     if (data) {
//       const token = btoa(JSON.stringify({
//         userId: data.id,
//         username: data.username,
//         agency_id: data.agency_id,
//         plant: data.agencies?.plant,
//         transporter_name: data.agencies?.name,
//         role: data.role,
//         timestamp: Date.now()
//       }));

//       return {
//         data: {
//           success: true,
//           token,
//           user: {
//             id: data.id,
//             username: data.username,
//             agency_id: data.agency_id,
//             plant: data.agencies?.plant, // Include plant name
//             transporter_name: data.agencies?.name, // Include transporter name
//             role: data.role
//           }
//         },
//         error: null
//       };
//     } else {
//       return {
//         data: null,
//         error: { message: 'Invalid credentials or inactive account' }
//       };
//     }
//   } catch (error) {
//     console.error('Login API error:', error);
//     return { data: null, error };
//   }
// },

//   // Create user with automatic plant assignment
//   createUser: async (userData) => {
//   try {
//     console.log('Creating user with data:', userData);
    
//     let plant = userData.plant;

//     // If agency_id is provided, fetch the plant
//     if (userData.agency_id && !plant) {
//       console.log('Fetching plant for agency_id:', userData.agency_id);
      
//       const { data: agency, error: agencyError } = await supabase
//         .from('agencies')
//         .select('plant')
//         .eq('id', userData.agency_id)
//         .single();
      
//       if (agencyError) {
//         console.error('Error fetching agency:', agencyError);
//         return { data: null, error: agencyError };
//       }
      
//       if (agency && agency.plant) {
//         plant = agency.plant;
//         console.log('Auto-set plant to:', plant);
//       } else {
//         console.warn('No plant found for agency:', userData.agency_id);
//       }
//     }

//     // Prepare the user data with plant
//     const userWithPlant = {
//       username: userData.username,
//       password: userData.password,
//       agency_id: userData.agency_id,
//       plant: plant, // This will be set now
//       role: userData.role || 'driver',
//       is_active: userData.is_active !== undefined ? userData.is_active : true,
//       created_by: userData.created_by || null
//     };

//     console.log('Final user data to insert:', userWithPlant);

//     // Insert the user
//     const { data, error } = await supabase
//       .from('users')
//       .insert([userWithPlant])
//       .select()
//       .single();
    
//     if (error) {
//       console.error('Error inserting user:', error);
//       return { data: null, error };
//     }

//     console.log('User created successfully:', data);
//     return { data, error: null };
//   } catch (error) {
//     console.error('Exception creating user:', error);
//     return { data: null, error };
//   }
// },

//   // Update user (with automatic plant update if agency changes)
//   updateUser: async (userId, userData) => {
//     try {
//       // If agency_id is being updated, automatically fetch and set the plant
//       if (userData.agency_id) {
//         const { data: agency, error: agencyError } = await supabase
//           .from('agencies')
//           .select('plant')
//           .eq('id', userData.agency_id)
//           .single();
        
//         if (agencyError) {
//           console.error('Error fetching agency:', agencyError);
//           return { data: null, error: agencyError };
//         }
        
//         if (agency) {
//           userData.plant = agency.plant;
//         }
//       }
      
//       const { data, error } = await supabase
//         .from('users')
//         .update(userData)
//         .eq('id', userId)
//         .select()
//         .single();
      
//       if (error) {
//         console.error('Error updating user:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception updating user:', error);
//       return { data: null, error };
//     }
//   },

//   // Verify token method
//   verifyToken: async (token) => {
//     try {
//       const decoded = JSON.parse(atob(token));
//       const currentTime = Date.now();
      
//       // Check if token is expired (24 hours)
//       if (currentTime - decoded.timestamp > 24 * 60 * 60 * 1000) {
//         return { valid: false };
//       }

//       return { valid: true, user: decoded };
//     } catch (error) {
//       console.error('Token verification error:', error);
//       return { valid: false };
//     }
//   },

//   // Get user by ID
//   getUserById: async (userId) => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', userId)
//         .single();

//       if (error) {
//         console.error('Error fetching user:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching user:', error);
//       return { data: null, error };
//     }
//   },

//   // Get all users (for admin purposes)
//   getUsers: async () => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*, agencies(name)')
//         .order('username');

//       if (error) {
//         console.error('Error fetching users:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching users:', error);
//       return { data: null, error };
//     }
//   }
// };

// export default supabase;

//google map api//

// // services/api.js
// import { createClient } from '@supabase/supabase-js';

// // Singleton pattern to prevent multiple instances
// let supabaseInstance = null;

// const getSupabaseClient = () => {
//   if (!supabaseInstance) {
//     const supabaseUrl = 'https://qhtfjvzwiibedqinsqgl.supabase.co';
//     const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodGZqdnp3aWliZWRxaW5zcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM0NDIsImV4cCI6MjA3NTg1OTQ0Mn0.Gcy5xzqHL_sN_BzRNadaLVU20i2-mhomhdHpZQtp8xw';
//     supabaseInstance = createClient(supabaseUrl, supabaseKey);
//   }
//   return supabaseInstance;
// };

// const supabase = getSupabaseClient();

// // Get address from coordinates using Google Geocoding API
// export const getAddressFromCoordinates = async (lat, lng) => {
//   try {
//     const apiKey = 'AIzaSyAkfePn1hexpsaQFrs8Y4bJy2Ado_JluYI';
//     const response = await fetch(
//       `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
//     );
    
//     if (!response.ok) {
//       throw new Error('Failed to fetch address from Google API');
//     }
    
//     const data = await response.json();
    
//     if (data.status === 'OK' && data.results && data.results.length > 0) {
//       // Return the formatted address from Google
//       return data.results[0].formatted_address;
//     } else if (data.status === 'ZERO_RESULTS') {
//       return `Location near coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//     } else {
//       throw new Error(`Google API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
//     }
    
//   } catch (error) {
//     console.error('Error getting address from Google API:', error);
    
//     // Fallback: Return coordinates in a readable format
//     return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//   }
// };

// // API functions
// export const api = {
//   // Get all agencies
//   getAgencies: async () => {
//     const { data, error } = await supabase
//       .from('agencies')
//       .select('*')
//       .order('name');
//     return { data, error };
//   },

//   // Get vehicles by agency
//   getVehiclesByAgency: async (agencyId) => {
//     try {
//       const { data, error } = await supabase
//         .from('vehicles')
//         .select('*')
//         .eq('agency_id', agencyId)
//         .order('vehicle_number');
      
//       return { data, error };
//     } catch (error) {
//       console.error('Error fetching vehicles:', error);
//       return { data: null, error };
//     }
//   },

//   // Start trip with address
//   startTrip: async (tripData) => {
//     try {
//       console.log('Starting trip with data:', tripData);
//       const { data, error } = await supabase
//         .from('Trips')
//         .insert([{
//           agency_id: tripData.agency_id,
//           vehicle_id: tripData.vehicle_id,
//           vehicle_number: tripData.vehicle_number,
//           plant: tripData.plant,
//           driver_name: tripData.driver_name,
//           driver_contact: tripData.driver_contact,
//           start_lat: tripData.start_lat,
//           start_lng: tripData.start_lng,
//           start_address: tripData.start_address,
//           start_time: tripData.start_time,
//           status: 'active',
//           created_at: new Date().toISOString()
//         }])
//         .select('*')
//         .single();
      
//       console.log('Start trip response:', { data, error });
//       return { data, error };
//     } catch (error) {
//       console.error('Error starting trip:', error);
//       return { data: null, error };
//     }
//   },

//   // End trip with address
//   endTrip: async (tripId, endData) => {
//     try {
//       console.log('Ending trip:', tripId, endData);
//       const { data: tripData, error } = await supabase
//         .from('Trips')
//         .update({
//           end_lat: endData.end_lat,
//           end_lng: endData.end_lng,
//           end_address: endData.end_address,
//           end_time: endData.end_time,
//           distance_km: endData.distance_km,
//           status: 'completed',
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', tripId)
//         .select('*')
//         .single();

//       console.log('End trip response:', { tripData, error });

//       if (error) {
//         throw new Error(error.message);
//       }

//       return { data: tripData, error: null };
//     } catch (error) {
//       console.error('Error ending trip:', error);
//       return { data: null, error: { message: error.message } };
//     }
//   },

//   // Get active trip
//   getActiveTrip: async () => {
//     try {
//       const { data, error } = await supabase
//         .from('Trips')
//         .select('*')
//         .eq('status', 'active')
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .single();
      
//       if (error && error.code === 'PGRST116') {
//         return { data: null, error: null };
//       }
      
//       return { data, error };
//     } catch (error) {
//       console.error('Error fetching active trip:', error);
//       return { data: null, error };
//     }
//   },

//   // Login method
//   login: async (credentials) => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*')
//         .eq('username', credentials.username)
//         .eq('password', credentials.password)
//         .eq('role', 'driver')
//         .eq('is_active', true)
//         .single();

//       if (error) {
//         return { data: null, error };
//       }

//       if (data) {
//         const token = btoa(JSON.stringify({
//           userId: data.id,
//           username: data.username,
//           agency_id: data.agency_id,
//           timestamp: Date.now()
//         }));

//         return {
//           data: {
//             success: true,
//             token,
//             user: {
//               id: data.id,
//               username: data.username,
//               agency_id: data.agency_id
//             }
//           },
//           error: null
//         };
//       } else {
//         return {
//           data: null,
//           error: { message: 'Invalid credentials or inactive account' }
//         };
//       }
//     } catch (error) {
//       console.error('Login API error:', error);
//       return { data: null, error };
//     }
//   },

//   // Verify token method
//   verifyToken: async (token) => {
//     try {
//       const decoded = JSON.parse(atob(token));
//       const currentTime = Date.now();
      
//       if (currentTime - decoded.timestamp > 24 * 60 * 60 * 1000) {
//         return { valid: false };
//       }

//       return { valid: true, user: decoded };
//     } catch (error) {
//       return { valid: false };
//     }
//   },

//   // Get user by ID
//   getUserById: async (userId) => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', userId)
//         .single();

//       return { data, error };
//     } catch (error) {
//       console.error('Error fetching user:', error);
//       return { data: null, error };
//     }
//   }
// };

// export default supabase;
// // services/api.js
// import { createClient } from '@supabase/supabase-js';

// // Singleton pattern to prevent multiple instances
// let supabaseInstance = null;

// const getSupabaseClient = () => {
//   if (!supabaseInstance) {
//     const supabaseUrl = 'https://qhtfjvzwiibedqinsqgl.supabase.co';
//     const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodGZqdnp3aWliZWRxaW5zcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM0NDIsImV4cCI6MjA3NTg1OTQ0Mn0.Gcy5xzqHL_sN_BzRNadaLVU20i2-mhomhdHpZQtp8xw';
//     supabaseInstance = createClient(supabaseUrl, supabaseKey);
//   }
//   return supabaseInstance;
// };

// const supabase = getSupabaseClient();

// const MAPMYINDIA_API_KEY = '8b8a24aa829d919051bce41caee609af';

// // CAPTCHA verification function
// const verifyCaptcha = async (token) => {
//   try {
//     console.log('CAPTCHA token received:', token);
    
//     // For development only - always return true
//     if (process.env.NODE_ENV === 'development') {
//       console.log('Development mode: CAPTCHA verification bypassed');
//       return true;
//     }
    
//     // Production: Call your backend API
//     const response = await fetch('/api/verify-captcha', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ token })
//     });

//     const data = await response.json();
//     return data.success === true;
    
//   } catch (error) {
//     console.error('CAPTCHA verification error:', error);
//     return false;
//   }
// };

// // Common login logic (without CAPTCHA)
// const commonLogin = async (credentials) => {
//   const { data, error } = await supabase
//     .from('users')
//     .select(`
//       *,
//       agencies (
//         name,
//         plant
//       )
//     `)
//     .eq('username', credentials.username)
//     .eq('password', credentials.password)
//     .eq('is_active', true)
//     .single();

//   if (error) {
//     console.log('Database query error:', error);
//     return { data: null, error };
//   }

//   if (data) {
//     const token = btoa(JSON.stringify({
//       userId: data.id,
//       username: data.username,
//       agency_id: data.agency_id,
//       plant: data.agencies?.plant,
//       transporter_name: data.agencies?.name,
//       role: data.role,
//       timestamp: Date.now()
//     }));

//     console.log('Login successful for user:', data.username);
    
//     return {
//       data: {
//         success: true,
//         token,
//         user: {
//           id: data.id,
//           username: data.username,
//           agency_id: data.agency_id,
//           plant: data.agencies?.plant,
//           transporter_name: data.agencies?.name,
//           role: data.role
//         }
//       },
//       error: null
//     };
//   } else {
//     console.log('No user found with provided credentials');
//     return {
//       data: null,
//       error: { message: 'Invalid credentials or inactive account' }
//     };
//   }
// };

// // Simple device fingerprinting without restricted globals
// export const generateDeviceId = () => {
//   // Check if we already have a device ID
//   const storedDeviceId = localStorage.getItem('deviceId');
//   if (storedDeviceId) {
//     return storedDeviceId;
//   }

//   // Generate a unique device fingerprint using available browser information
//   // Use window.screen instead of direct screen global
//   const fingerprintComponents = [
//     navigator.userAgent,
//     navigator.language,
//     navigator.hardwareConcurrency || 'unknown',
//     window.screen.width + 'x' + window.screen.height, // Fixed: use window.screen
//     new Date().getTimezoneOffset(),
//     !!navigator.cookieEnabled,
//     !!navigator.javaEnabled && navigator.javaEnabled(),
//   ].join('|');

//   // Create a simple hash
//   let hash = 0;
//   for (let i = 0; i < fingerprintComponents.length; i++) {
//     const char = fingerprintComponents.charCodeAt(i);
//     hash = ((hash << 5) - hash) + char;
//     hash = hash & hash; // Convert to 32-bit integer
//   }

//   const deviceId = 'device_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  
//   // Store in localStorage
//   localStorage.setItem('deviceId', deviceId);
//   console.log('Generated new device ID:', deviceId);
  
//   return deviceId;
// };

// // Get device ID
// export const getDeviceId = () => {
//   return generateDeviceId();
// };

// // Get address from coordinates using MapMyIndia API
// export const getAddressFromCoordinates = async (lat, lng) => {
//   try {
//     console.log('Getting address for coordinates:', lat, lng);
    
//     const response = await fetch(
//       `https://apis.mapmyindia.com/advancedmaps/v1/${MAPMYINDIA_API_KEY}/rev_geocode?lat=${lat}&lng=${lng}`
//     );
    
//     if (response.ok) {
//       const data = await response.json();
//       console.log('MapMyIndia API response:', data);
      
//       if (data && data.results && data.results.length > 0) {
//         return data.results[0].formatted_address;
//       }
//     }
    
//     return await getSimpleLocationDescription(lat, lng);
    
//   } catch (error) {
//     console.error('Error getting address from MapMyIndia API:', error);
//     return await getSimpleLocationDescription(lat, lng);
//   }
// };

// // Simple coordinates-based description as fallback
// const getSimpleLocationDescription = async (lat, lng) => {
//   const cities = [
//     { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
//     { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
//     { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
//     { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
//     { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
//     { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
//   ];
  
//   let nearestCity = 'Unknown Location';
//   let minDistance = Infinity;
  
//   cities.forEach(city => {
//     const distance = Math.sqrt(
//       Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
//     );
//     if (distance < minDistance) {
//       minDistance = distance;
//       nearestCity = city.name;
//     }
//   });
  
//   return `Near ${nearestCity} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
// };

// // API functions with device tracking
// export const api = {
//   // Get all agencies
//   getAgencies: async () => {
//     try {
//       const { data, error } = await supabase
//         .from('agencies')
//         .select('*')
//         .order('name');
      
//       if (error) {
//         console.error('Error fetching agencies:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching agencies:', error);
//       return { data: null, error };
//     }
//   },

//   // Get vehicles by agency
//   getVehiclesByAgency: async (agencyId) => {
//     try {
//       const { data, error } = await supabase
//         .from('vehicles')
//         .select('*')
//         .eq('agency_id', agencyId)
//         .order('vehicle_number');
      
//       if (error) {
//         console.error('Error fetching vehicles:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching vehicles:', error);
//       return { data: null, error };
//     }
//   },

//   // Check if device has active trip
//   checkDeviceActiveTrip: async (deviceId) => {
//     try {
//       const { data, error } = await supabase
//         .from('Trips')
//         .select('*')
//         .eq('device_id', deviceId)
//         .eq('status', 'active')
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .single();
      
//       if (error) {
//         if (error.code === 'PGRST116') {
//           return { data: null, error: null }; // No active trip
//         }
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Error checking device active trip:', error);
//       return { data: null, error };
//     }
//   },

//   // Start trip with device ID
//   startTrip: async (tripData) => {
//     try {
//       const deviceId = getDeviceId();
//       console.log('Starting trip with device ID:', deviceId);
      
//       const { data, error } = await supabase
//         .from('Trips')
//         .insert([{
//           agency_id: tripData.agency_id,
//           vehicle_id: tripData.vehicle_id,
//           vehicle_number: tripData.vehicle_number,
//           plant: tripData.plant,
//           driver_name: tripData.driver_name,
//           driver_contact: tripData.driver_contact,
//           start_lat: tripData.start_lat,
//           start_lng: tripData.start_lng,
//           start_address: tripData.start_address,
//           start_time: tripData.start_time,
//           status: 'active',
//           device_id: deviceId,
//           created_at: new Date().toISOString()
//         }])
//         .select()
//         .single();
      
//       if (error) {
//         console.error('Error starting trip:', error);
//         return { data: null, error };
//       }
      
//       console.log('Start trip response:', { data, error });
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception starting trip:', error);
//       return { data: null, error: { message: error.message } };
//     }
//   },

//   // End trip - verify device ID
//   endTrip: async (tripId, endData) => {
//     try {
//       const deviceId = getDeviceId();
//       console.log('Ending trip with device ID:', deviceId);
      
//       // First verify the trip belongs to this device
//       const { data: trip, error: verifyError } = await supabase
//         .from('Trips')
//         .select('*')
//         .eq('id', tripId)
//         .eq('device_id', deviceId)
//         .single();
      
//       if (verifyError) {
//         return { 
//           data: null, 
//           error: { message: 'Trip not found or you are not authorized to end this trip' } 
//         };
//       }
      
//       const { data, error } = await supabase
//         .from('Trips')
//         .update({
//           end_lat: endData.end_lat,
//           end_lng: endData.end_lng,
//           end_address: endData.end_address,
//           end_time: endData.end_time,
//           distance_km: endData.distance_km,
//           status: 'completed',
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', tripId)
//         .eq('device_id', deviceId)
//         .select()
//         .single();

//       if (error) {
//         console.error('Error ending trip:', error);
//         return { data: null, error };
//       }

//       console.log('End trip response:', { data });
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception ending trip:', error);
//       return { data: null, error: { message: error.message } };
//     }
//   },

//   // Get active trip for current device
//   getActiveTrip: async () => {
//     try {
//       const deviceId = getDeviceId();
      
//       const { data, error } = await supabase
//         .from('Trips')
//         .select('*')
//         .eq('device_id', deviceId)
//         .eq('status', 'active')
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .single();
      
//       if (error) {
//         if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
//           console.log('No active trip found for this device');
//           return { data: null, error: null };
//         }
//         console.error('Error fetching active trip:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching active trip:', error);
//       return { data: null, error };
//     }
//   },

//   // Get all trips for current device
//   getDeviceTrips: async () => {
//     try {
//       const deviceId = getDeviceId();
      
//       const { data, error } = await supabase
//         .from('Trips')
//         .select('*')
//         .eq('device_id', deviceId)
//         .order('created_at', { ascending: false });
      
//       if (error) {
//         console.error('Error fetching device trips:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching device trips:', error);
//       return { data: null, error };
//     }
//   },

//   // Driver login with CAPTCHA verification
//   login: async (credentials) => {
//     try {
//       console.log('Driver login attempt with credentials:', { 
//         username: credentials.username,
//         hasCaptcha: !!credentials.captchaToken 
//       });

//       // Verify CAPTCHA first if token is provided
//       if (credentials.captchaToken) {
//         console.log('Verifying CAPTCHA...');
//         const captchaVerified = await verifyCaptcha(credentials.captchaToken);
        
//         if (!captchaVerified) {
//           console.log('CAPTCHA verification failed');
//           return {
//             data: null,
//             error: { message: 'CAPTCHA verification failed. Please try again.' }
//           };
//         }
//         console.log('CAPTCHA verification successful');
//       } else {
//         console.log('No CAPTCHA token provided');
//         return {
//           data: null,
//           error: { message: 'CAPTCHA verification required. Please complete the CAPTCHA.' }
//         };
//       }

//       // Continue with login logic after CAPTCHA verification
//       return await commonLogin(credentials);
//     } catch (error) {
//       console.error('Driver login API error:', error);
//       return { data: null, error };
//     }
//   },

//   // Admin login without CAPTCHA verification
//   adminLogin: async (credentials) => {
//     try {
//       console.log('Admin login attempt with credentials:', { 
//         username: credentials.username
//       });

//       console.log('Admin login - CAPTCHA verification bypassed');

//       // Use common login logic without CAPTCHA
//       return await commonLogin(credentials);
//     } catch (error) {
//       console.error('Admin login API error:', error);
//       return { data: null, error };
//     }
//   },

//   // Create user with automatic plant assignment
//   createUser: async (userData) => {
//     try {
//       console.log('Creating user with data:', userData);
      
//       let plant = userData.plant;

//       // If agency_id is provided, fetch the plant
//       if (userData.agency_id && !plant) {
//         console.log('Fetching plant for agency_id:', userData.agency_id);
        
//         const { data: agency, error: agencyError } = await supabase
//           .from('agencies')
//           .select('plant')
//           .eq('id', userData.agency_id)
//           .single();
        
//         if (agencyError) {
//           console.error('Error fetching agency:', agencyError);
//           return { data: null, error: agencyError };
//         }
        
//         if (agency && agency.plant) {
//           plant = agency.plant;
//           console.log('Auto-set plant to:', plant);
//         } else {
//           console.warn('No plant found for agency:', userData.agency_id);
//         }
//       }

//       // Prepare the user data with plant
//       const userWithPlant = {
//         username: userData.username,
//         password: userData.password,
//         agency_id: userData.agency_id,
//         plant: plant,
//         role: userData.role || 'driver',
//         is_active: userData.is_active !== undefined ? userData.is_active : true,
//         created_by: userData.created_by || null
//       };

//       console.log('Final user data to insert:', userWithPlant);

//       // Insert the user
//       const { data, error } = await supabase
//         .from('users')
//         .insert([userWithPlant])
//         .select()
//         .single();
      
//       if (error) {
//         console.error('Error inserting user:', error);
//         return { data: null, error };
//       }

//       console.log('User created successfully:', data);
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception creating user:', error);
//       return { data: null, error };
//     }
//   },

//   // Update user (with automatic plant update if agency changes)
//   updateUser: async (userId, userData) => {
//     try {
//       // If agency_id is being updated, automatically fetch and set the plant
//       if (userData.agency_id) {
//         const { data: agency, error: agencyError } = await supabase
//           .from('agencies')
//           .select('plant')
//           .eq('id', userData.agency_id)
//           .single();
        
//         if (agencyError) {
//           console.error('Error fetching agency:', agencyError);
//           return { data: null, error: agencyError };
//         }
        
//         if (agency) {
//           userData.plant = agency.plant;
//         }
//       }
      
//       const { data, error } = await supabase
//         .from('users')
//         .update(userData)
//         .eq('id', userId)
//         .select()
//         .single();
      
//       if (error) {
//         console.error('Error updating user:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception updating user:', error);
//       return { data: null, error };
//     }
//   },

//   // Verify token method
//   verifyToken: async (token) => {
//     try {
//       const decoded = JSON.parse(atob(token));
//       const currentTime = Date.now();
      
//       // Check if token is expired (24 hours)
//       if (currentTime - decoded.timestamp > 24 * 60 * 60 * 1000) {
//         return { valid: false };
//       }

//       return { valid: true, user: decoded };
//     } catch (error) {
//       console.error('Token verification error:', error);
//       return { valid: false };
//     }
//   },

//   // Get user by ID
//   getUserById: async (userId) => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', userId)
//         .single();

//       if (error) {
//         console.error('Error fetching user:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching user:', error);
//       return { data: null, error };
//     }
//   },

//   // Get all users (for admin purposes)
//   getUsers: async () => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*, agencies(name)')
//         .order('username');

//       if (error) {
//         console.error('Error fetching users:', error);
//         return { data: null, error };
//       }
      
//       return { data, error: null };
//     } catch (error) {
//       console.error('Exception fetching users:', error);
//       return { data: null, error };
//     }
//   }
// };

// export default supabase;