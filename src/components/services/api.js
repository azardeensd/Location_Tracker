import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qhtfjvzwiibedqinsqgl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodGZqdnp3aWliZWRxaW5zcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM0NDIsImV4cCI6MjA3NTg1OTQ0Mn0.Gcy5xzqHL_sN_BzRNadaLVU20i2-mhomhdHpZQtp8xw';
const MAPMYINDIA_API_KEY = '8b8a24aa829d919051bce41caee609af';

// Initialize Supabase Client (Singleton)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// CAPTCHA verification
const verifyCaptcha = async (token) => {
  try {
    if (process.env.NODE_ENV === 'development') return true;

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

// Common Login Logic
const commonLogin = async (credentials) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', credentials.username)
      .eq('password', credentials.password)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      return { data: null, error: { message: 'Invalid credentials or inactive account' } };
    }

    let plantName = 'N/A';
    let plantLocation = 'N/A';
    let plantId = userData.plant_id;
    let transporterName = null;

    // Fetch context based on role
    if (userData.role === 'plant_admin' && userData.plant_id) {
      const { data: plantData } = await supabase
        .from('plants')
        .select('name, location')
        .eq('id', userData.plant_id)
        .single();
      
      if (plantData) {
        plantName = plantData.name;
        plantLocation = plantData.location;
      }
    } else if (userData.role === 'driver' && userData.agency_id) {
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('name, plant_id, plants(name, location)')
        .eq('id', userData.agency_id)
        .single();

      if (agencyData) {
        transporterName = agencyData.name;
        plantId = agencyData.plant_id;
        if (agencyData.plants) {
          plantName = agencyData.plants.name;
          plantLocation = agencyData.plants.location;
        }
      }
    }

    // Handle custom roles
    let effectiveRole = userData.role;
    let baseRole = null;
    let isCustomRole = false;

    if (userData.role && userData.role.startsWith('custom_')) {
      isCustomRole = true;
      const { data: roleData } = await supabase
        .from('roles')
        .select('base_role')
        .eq('code', userData.role)
        .single();
      
      if (roleData) {
        baseRole = roleData.base_role;
        effectiveRole = baseRole || userData.role;
      }
    }

    const token = btoa(JSON.stringify({
      userId: userData.id,
      username: userData.username,
      agency_id: userData.agency_id,
      plant: plantName,
      plant_location: plantLocation,
      plant_id: plantId,
      transporter_name: transporterName,
      role: userData.role,
      timestamp: Date.now()
    }));

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
          plant_id: plantId,
          transporter_name: transporterName,
          role: effectiveRole,
          original_role: userData.role,
          is_custom_role: isCustomRole,
          base_role: baseRole,
          db_original_role: userData.original_role || null,
          email: userData.email || null,
          department_id: userData.department_id || null
        }
      },
      error: null
    };
  } catch (error) {
    console.error('Exception in commonLogin:', error);
    return { data: null, error };
  }
};

// Device Fingerprinting
export const generateDeviceId = () => {
  const storedDeviceId = localStorage.getItem('deviceId');
  if (storedDeviceId) return storedDeviceId;

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
    hash = ((hash << 5) - hash) + fingerprintComponents.charCodeAt(i);
    hash = hash & hash;
  }

  const deviceId = 'device_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  localStorage.setItem('deviceId', deviceId);
  return deviceId;
};

// Helper for location description (Fallback)
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
    const distance = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2));
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city.name;
    }
  });

  return `Near ${nearestCity} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
};

export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://apis.mapmyindia.com/advancedmaps/v1/${MAPMYINDIA_API_KEY}/rev_geocode?lat=${lat}&lng=${lng}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data?.results?.length > 0) {
        return data.results[0].formatted_address;
      }
    }
    return await getSimpleLocationDescription(lat, lng);
  } catch (error) {
    return await getSimpleLocationDescription(lat, lng);
  }
};

// ========== API EXPORTS ==========
export const api = {
  supabase,

  // --- SUPPLIER METHODS ---
  getSuppliers: async () => {
    try {
      const { data, error } = await supabase.from('vendor').select('*').order('created_at', { ascending: false });
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  createSupplier: async (supplierData) => {
    try {
      const { data, error } = await supabase.from('vendor').insert([supplierData]).select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  updateSupplier: async (supplierId, supplierData) => {
    try {
      const { data, error } = await supabase.from('vendor').update(supplierData).eq('id', supplierId).select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  deleteSupplier: async (supplierId) => {
    try {
      const { error } = await supabase.from('vendor').delete().eq('id', supplierId);
      return { data: { success: !error }, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  // --- DEPARTMENT METHODS ---
  getDepartments: async () => {
    try {
      const { data, error } = await supabase.from('department').select('*').order('name');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getDepartmentById: async (departmentId) => {
    try {
      const { data, error } = await supabase.from('department').select('*').eq('id', departmentId).single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  // --- USER METHODS ---
  getUserById: async (userId) => {
    try {
      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();
      if (userError) return { data: null, error: userError };

      let departmentData = null;
      if (userData.department_id) {
        const { data } = await supabase.from('department').select('*').eq('id', userData.department_id).single();
        departmentData = data;
      }

      return {
        data: { ...userData, department: departmentData, department_name: departmentData?.name || null },
        error: null
      };
    } catch (error) { return { data: null, error }; }
  },

  getUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`*, department:department_id(id, name, code, description), agencies(name, plant_id, plants(name, location))`)
        .order('username');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  createUser: async (userData) => {
    try {
      let plant_id = userData.plant_id || null;

      // Auto-resolve plant_id based on role logic
      if (userData.role === 'plant_admin' && userData.plant_id) {
        plant_id = userData.plant_id;
      } else if (userData.agency_id && !plant_id) {
        const { data: agency } = await supabase.from('agencies').select('plant_id').eq('id', userData.agency_id).single();
        if (agency?.plant_id) plant_id = agency.plant_id;
      }

      const userToInsert = {
        username: userData.username,
        password: userData.password,
        agency_id: userData.agency_id || null,
        plant_id: plant_id,
        role: userData.role || 'driver',
        department_id: userData.department_id || null,
        email: userData.email || null,
        custom_role_id: userData.custom_role_id || null,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        created_at: new Date().toISOString()
      };

      // Clean undefined fields
      Object.keys(userToInsert).forEach(key => userToInsert[key] === undefined && delete userToInsert[key]);

      const { data, error } = await supabase
        .from('users')
        .insert([userToInsert])
        .select(`*, department:department_id(id, name, code), agencies(name, plant_id, plants(name, location))`)
        .single();

      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  updateUser: async (userId, userData) => {
    try {
      let plant_id = userData.plant_id;

      if (userData.agency_id && !plant_id) {
        const { data: agency } = await supabase.from('agencies').select('plant_id').eq('id', userData.agency_id).single();
        if (agency?.plant_id) plant_id = agency.plant_id;
      }

      const updateData = { ...userData };
      if (plant_id !== undefined) updateData.plant_id = plant_id;

      const { data, error } = await supabase.from('users').update(updateData).eq('id', userId).select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  // --- MODULE & PERMISSION METHODS ---
  getModules: async () => {
    try {
      const { data, error } = await supabase.from('modules').select('*').order('sort_order');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getPermissions: async () => {
    try {
      const { data, error } = await supabase.from('permissions').select('*').order('name');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getRolePermissions: async (roleId) => {
    try {
      const { data, error } = await supabase.from('role_permissions').select('*, modules(*), permissions(*)').eq('role_id', roleId);
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  updateRolePermissions: async (roleId, permissions) => {
    try {
      await supabase.from('role_permissions').delete().eq('role_id', roleId);

      const permissionsToInsert = [];
      Object.keys(permissions).forEach(moduleCode => {
        const modulePermissions = permissions[moduleCode];
        if (modulePermissions?.length) {
          modulePermissions.forEach(permissionCode => {
            permissionsToInsert.push({ role_id: roleId, module_code: moduleCode, permission_code: permissionCode });
          });
        }
      });

      if (permissionsToInsert.length === 0) return { data: { success: true }, error: null };

      const { error } = await supabase.from('role_permissions').insert(permissionsToInsert);
      return { data: { success: !error }, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  createUserWithPermissions: async (userData, permissions, createdByUsername = 'system') => {
    try {
      // 1. Create Custom Role
      const targetUsername = (userData.username || '').substring(0, 100).trim();
      const randomStr = Math.random().toString(36).substring(2, 6);
      const safeRoleCode = `custom_${targetUsername.toLowerCase().substring(0, 20)}_${Date.now()}_${randomStr}`.substring(0, 50);

      const { data: customRole, error: roleCreateError } = await supabase.from('roles').insert([{
        name: `Custom: ${targetUsername.substring(0, 30)}`,
        code: safeRoleCode,
        description: `Custom role for ${targetUsername}`,
        is_custom: true,
        base_role: userData.role,
        created_for_user: targetUsername,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]).select().single();

      if (roleCreateError) return { data: null, error: roleCreateError };

      // 2. Fetch IDs
      const [{ data: allModules }, { data: allPermissions }] = await Promise.all([
        supabase.from('modules').select('id, code'),
        supabase.from('permissions').select('id, code')
      ]);

      // 3. Map Permissions
      const permissionsToInsert = [];
      Object.entries(permissions).forEach(([moduleCode, modulePermissions]) => {
        const module = allModules.find(m => m.code === moduleCode);
        if (module && modulePermissions?.length) {
          modulePermissions.forEach(permissionCode => {
            const permission = allPermissions.find(p => p.code === permissionCode);
            if (permission) {
              permissionsToInsert.push({
                role_id: customRole.id,
                module_id: module.id,
                permission_id: permission.id,
                module_code: module.code,
                permission_code: permission.code,
                created_at: new Date().toISOString()
              });
            }
          });
        }
      });

      // 4. Insert Permissions
      if (permissionsToInsert.length > 0) {
        const { error: rolePermsError } = await supabase.from('role_permissions').insert(permissionsToInsert);
        if (rolePermsError) {
          await supabase.from('roles').delete().eq('id', customRole.id); // Cleanup
          return { data: null, error: rolePermsError };
        }
      }

      // 5. Create User
      const userResponse = await api.createUser({
        ...userData,
        role: safeRoleCode,
        custom_role_id: customRole.id,
        created_at: new Date().toISOString()
      });

      if (userResponse.error) {
        // Cleanup on failure
        await supabase.from('role_permissions').delete().eq('role_id', customRole.id);
        await supabase.from('roles').delete().eq('id', customRole.id);
        return userResponse;
      }

      return { ...userResponse, customRoleInfo: customRole };
    } catch (error) { return { data: null, error }; }
  },

  getDefaultRolePermissions: async (roleCode) => {
    try {
      const { data: role } = await supabase.from('roles').select('id').eq('code', roleCode).single();
      if (!role) return { data: {}, error: null };

      const { data: rolePermissions } = await supabase.from('role_permissions')
        .select(`modules(code), permissions(code)`).eq('role_id', role.id);

      const formattedPermissions = {};
      rolePermissions?.forEach(rp => {
        if (rp.modules && rp.permissions) {
          const mCode = rp.modules.code;
          if (!formattedPermissions[mCode]) formattedPermissions[mCode] = [];
          if (!formattedPermissions[mCode].includes(rp.permissions.code)) {
            formattedPermissions[mCode].push(rp.permissions.code);
          }
        }
      });
      return { data: formattedPermissions, error: null };
    } catch (error) { return { data: {}, error: null }; }
  },

  // --- ROLE MANAGEMENT ---
  getRoles: async () => {
    try {
      const { data, error } = await supabase.from('roles').select('*').order('name');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getRoleById: async (roleId) => {
    try {
      const { data, error } = await supabase.from('roles').select('*').eq('id', roleId).single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getRoleByCode: async (roleCode) => {
    try {
      const { data, error } = await supabase.from('roles').select('*').eq('code', roleCode).single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  createRole: async (roleData) => {
    try {
      const { data, error } = await supabase.from('roles').insert([{ ...roleData, created_at: new Date().toISOString() }]).select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  updateRole: async (roleId, roleData) => {
    try {
      const { data, error } = await supabase.from('roles').update({ ...roleData, updated_at: new Date().toISOString() }).eq('id', roleId).select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  deleteRole: async (roleId) => {
    try {
      const { data: users } = await supabase.from('users').select('id').eq('role', roleId).limit(1);
      if (users?.length > 0) return { data: null, error: { message: 'Cannot delete role. It has users assigned.' } };

      const { error } = await supabase.from('roles').delete().eq('id', roleId);
      return { data: { success: !error }, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  cleanupCustomRoles: async () => {
    try {
      const { data: customRoles } = await supabase.from('roles').select('id, code').eq('is_custom', true);
      let cleanedCount = 0;

      for (const role of (customRoles || [])) {
        const { data: users } = await supabase.from('users').select('id').eq('role', role.code).limit(1);
        if (!users || users.length === 0) {
          await supabase.from('role_permissions').delete().eq('role_id', role.id);
          await supabase.from('roles').delete().eq('id', role.id);
          cleanedCount++;
        }
      }
      return { data: { cleaned: cleanedCount }, error: null };
    } catch (error) { return { data: null, error }; }
  },

  // --- AUTHENTICATION ---
  login: async (credentials) => {
    try {
      if (credentials.captchaToken) {
        if (!(await verifyCaptcha(credentials.captchaToken))) {
          return { data: null, error: { message: 'CAPTCHA verification failed.' } };
        }
      } else {
        return { data: null, error: { message: 'CAPTCHA required.' } };
      }
      return await commonLogin(credentials);
    } catch (error) { return { data: null, error }; }
  },

  adminLogin: async (credentials) => {
    return await commonLogin(credentials);
  },

  verifyToken: async (token) => {
    try {
      const decoded = JSON.parse(atob(token));
      if (Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000) return { valid: false };
      return { valid: true, user: decoded };
    } catch (error) { return { valid: false }; }
  },

  // --- RATE MASTER ---
  getRates: async () => {
    try {
      const { data, error } = await supabase.from('rate_master')
        .select(`*, agencies(name, code, plant_id, plants(name, location))`).order('created_at', { ascending: false });
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  // Create rate
  createRate: async (rateData) => {
    try {
      // CRITICAL FIX: Ensure min_km and max_km are null for Kilometer basis
      const sanitizedData = {
        plant_id: rateData.plant_id,
        agency_id: rateData.agency_id,
        tone: parseFloat(rateData.tone) || 0,
        type: rateData.type,
        rate: parseFloat(rateData.rate) || 0,
        // This is the key fix - set to null for Kilometer, number for Trip
        min_km: rateData.type === 'Trip' ? (parseFloat(rateData.min_km) || 0) : null,
        max_km: rateData.type === 'Trip' ? (parseFloat(rateData.max_km) || 0) : null,
        created_at: new Date().toISOString()
      };

      console.log('📤 API createRate - sanitized data:', sanitizedData);

      const { data, error } = await supabase
        .from('rate_master')
        .insert([sanitizedData])
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      console.error('❌ Error creating rate:', error);
      return { data: null, error };
    }
  },

  // Update rate
  updateRate: async (id, rateData) => {
    try {
      // CRITICAL FIX: Ensure min_km and max_km are null for Kilometer basis
      const sanitizedData = {
        plant_id: rateData.plant_id,
        agency_id: rateData.agency_id,
        tone: parseFloat(rateData.tone) || 0,
        type: rateData.type,
        rate: parseFloat(rateData.rate) || 0,
        // This is the key fix - set to null for Kilometer, number for Trip
        min_km: rateData.type === 'Trip' ? (parseFloat(rateData.min_km) || 0) : null,
        max_km: rateData.type === 'Trip' ? (parseFloat(rateData.max_km) || 0) : null,
        updated_at: new Date().toISOString()
      };

      console.log('📤 API updateRate - sanitized data:', sanitizedData);

      const { data, error } = await supabase
        .from('rate_master')
        .update(sanitizedData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      console.error('❌ Error updating rate:', error);
      return { data: null, error };
    }
  },

  deleteRate: async (rateId) => {
    try {
      const { error } = await supabase.from('rate_master').delete().eq('id', rateId);
      return { data: { success: !error }, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  // --- DASHBOARD TRIPS ---
  getAllTrips: async () => {
    try {
      const { data, error } = await supabase.from('Trips')
        .select(`*, plant:plants(name, location), vehicle:vehicles(vehicle_number, vehicle_type, capacity), agency:agencies(name, code)`)
        .order('created_at', { ascending: false });
      return { data: data || [], error: error || null };
    } catch (error) { return { data: [], error }; }
  },

  getTripsByPlant: async (plantId) => {
    try {
      // 1. Fetch Trips
      const { data: trips, error } = await supabase.from('Trips').select('*').eq('plant_id', plantId).order('created_at', { ascending: false });
      if (error || !trips?.length) return { data: [], error: error || null };

      // 2. Fetch Context Data
      const { data: plant } = await supabase.from('plants').select('id, name, location, code').eq('id', plantId).single();
      
      const vehicleIds = [...new Set(trips.map(t => t.vehicle_id).filter(Boolean))];
      const agencyIds = [...new Set(trips.map(t => t.agency_id).filter(Boolean))];

      const [{ data: vehicles }, { data: agencies }] = await Promise.all([
        vehicleIds.length ? supabase.from('vehicles').select('*').in('id', vehicleIds) : { data: [] },
        agencyIds.length ? supabase.from('agencies').select('*').in('id', agencyIds) : { data: [] }
      ]);

      // 3. Enrich Data (Manual Join Preservation)
      const enrichedTrips = trips.map(trip => ({
        ...trip,
        plants: plant || null,
        plant: plant?.name || null,
        plant_name: plant?.name || null,
        plant_location: plant?.location || null,
        plant_data: plant,
        vehicle: vehicles?.find(v => v.id === trip.vehicle_id) || null,
        vehicles: vehicles?.find(v => v.id === trip.vehicle_id) || null,
        agency: agencies?.find(a => a.id === trip.agency_id) || null,
        agencies: agencies?.find(a => a.id === trip.agency_id) || null
      }));

      return { data: enrichedTrips, error: null };
    } catch (error) { return { data: [], error }; }
  },

  // Get trips by agency (for transporter users)
  getTripsByAgency: async (agencyId) => {
    try {
      const { data, error } = await supabase.from('Trips')
        .select(`*, plant:plants(name, location), vehicle:vehicles(vehicle_number, vehicle_type, capacity), agency:agencies(name, code)`)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
      
      return { data: data || [], error: error || null };
    } catch (error) { 
      console.error('Error fetching trips by agency:', error);
      return { data: [], error }; 
    }
  },

  // Update trip status (for admin cancellation)
  updateTripStatus: async (tripId, statusData) => {
    try {
      console.log('🔄 Updating trip status:', tripId, statusData);

      // Get current user info for audit
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      
      const updatePayload = {
        status: statusData.status,
        updated_at: new Date().toISOString()
      };

      // Add cancellation-specific fields if status is cancelled
      if (statusData.status === 'cancelled') {
        updatePayload.cancellation_reason = statusData.cancellation_reason;
        updatePayload.cancelled_by = statusData.cancelled_by || adminData.userId || adminData.id || null;
        updatePayload.cancelled_at = statusData.cancelled_at || new Date().toISOString();
      }

      console.log('📤 Update payload:', updatePayload);

      const { data, error } = await supabase
        .from('Trips')
        .update(updatePayload)
        .eq('id', tripId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error updating trip status:', error);
        return { error: { message: error.message } };
      }

      console.log('✅ Trip status updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception in updateTripStatus:', error);
      return { error: { message: error.message } };
    }
  },

  // --- AGENCY METHODS ---
  getAgencies: async () => {
    try {
      const { data, error } = await supabase.from('agencies').select(`*, plants(name, location, code)`).order('name');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getAgenciesByPlant: async (plant_id) => {
    try {
      const { data, error } = await supabase.from('agencies').select(`*, plants(name, location, code)`).eq('plant_id', plant_id).order('name');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  createAgency: async (agencyData) => {
    try {
      const { data, error } = await supabase.from('agencies').insert([agencyData]).select(`*, plants(name, location, code)`).single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  updateAgency: async (agencyId, agencyData) => {
    try {
      const { data, error } = await supabase.from('agencies').update(agencyData).eq('id', agencyId).select(`*, plants(name, location, code)`).single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  deleteAgency: async (agencyId) => {
    try {
      const [{ data: v }, { data: u }] = await Promise.all([
        supabase.from('vehicles').select('id').eq('agency_id', agencyId).limit(1),
        supabase.from('users').select('id').eq('agency_id', agencyId).limit(1)
      ]);

      if (v?.length > 0 || u?.length > 0) return { data: null, error: { message: 'Cannot delete agency. It has vehicles or users.' } };

      const { error } = await supabase.from('agencies').delete().eq('id', agencyId);
      return { data: { success: !error }, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  // --- VEHICLE METHODS ---
  getVehicles: async () => {
    try {
      const { data, error } = await supabase.from('vehicles')
        .select(`*, agencies(name, plant_id, plants(name, location))`).order('created_at', { ascending: false });
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getVehiclesByAgency: async (agencyId) => {
    try {
      const { data, error } = await supabase.from('vehicles')
        .select(`*, agencies(name, plant_id, plants(name, location))`).eq('agency_id', agencyId).order('vehicle_number');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  createVehicle: async (vehicleData) => {
    try {
      const { data: agency } = await supabase.from('agencies').select('id').eq('id', vehicleData.agency_id).single();
      if (!agency) return { data: null, error: { message: 'Agency not found.' } };

      const { data, error } = await supabase.from('vehicles').insert([{ ...vehicleData, created_at: new Date().toISOString() }]).select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  updateVehicle: async (vehicleId, vehicleData) => {
    try {
      const { data, error } = await supabase.from('vehicles')
        .update({ ...vehicleData, updated_at: new Date().toISOString() })
        .eq('id', vehicleId)
        .select(`*, agencies(name, plant_id, plants(name, location))`).single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  deleteVehicle: async (vehicleId) => {
    try {
      const { data: trips } = await supabase.from('Trips').select('id').eq('vehicle_id', vehicleId).eq('status', 'active').limit(1);
      if (trips?.length > 0) return { data: null, error: { message: 'Cannot delete vehicle. It has active trips.' } };

      const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
      return { data: { success: !error }, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  updateVehicleStatus: async (vehicleId, status) => {
    try {
      const { data, error } = await supabase.from('vehicles').update({ status, updated_at: new Date().toISOString() }).eq('id', vehicleId).select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getVehiclesByPlantAlternative: async (plantId) => {
    try {
      const { data: agencies } = await supabase.from('agencies').select('id').eq('plant_id', plantId);
      if (!agencies?.length) return { data: [], error: null };

      const { data: vehicles, error } = await supabase.from('vehicles')
        .select(`*, agencies(name, plant_id, plants(name, location))`)
        .in('agency_id', agencies.map(a => a.id)).order('vehicle_number');
      return { data: vehicles, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  // --- TRIP MANAGEMENT (DRIVER) ---
  checkDeviceActiveTrip: async (deviceId) => {
    try {
      const { data, error } = await supabase.from('Trips').select('*')
        .eq('device_id', deviceId).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return { data, error: error?.code === 'PGRST116' ? null : error };
    } catch (error) { return { data: null, error }; }
  },

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

  endTrip: async (tripId, endData) => {
    try {
      const deviceId = generateDeviceId();
      const { data: trip } = await supabase.from('Trips').select('*').eq('id', tripId).eq('device_id', deviceId).single();
      
      if (!trip) return { data: null, error: { message: 'Trip not found or unauthorized.' } };

      const updateData = {
        end_lat: parseFloat(endData.end_lat) || 0,
        end_lng: parseFloat(endData.end_lng) || 0,
        end_address: endData.end_address || null,
        End_Date: new Date().toISOString().split('T')[0],
        end_time: endData.end_time || new Date().toISOString(),
        distance_km: parseFloat(endData.distance_km) || 0,
        status: 'completed',
        updated_at: new Date().toISOString(),
        end_vendor_code: endData.end_vendor_code?.toString(),
        end_vendor_name: endData.end_vendor_name?.toString()
      };

      const { data, error } = await supabase.from('Trips').update(updateData).eq('id', tripId).eq('device_id', deviceId).select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error: { message: error.message } }; }
  },

  getActiveTrip: async () => {
    try {
      const deviceId = generateDeviceId();
      const { data, error } = await supabase.from('Trips').select('*')
        .eq('device_id', deviceId).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return { data, error: error?.code === 'PGRST116' ? null : error };
    } catch (error) { return { data: null, error }; }
  },

  getDeviceTrips: async () => {
    try {
      const deviceId = generateDeviceId();
      const { data, error } = await supabase.from('Trips').select('*').eq('device_id', deviceId).order('created_at', { ascending: false });
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  // --- PLANTS API ---
  getPlants: async () => {
    try {
      const { data, error } = await supabase.from('plants').select('*').order('name');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  createPlant: async (plantData) => {
    try {
      const { data, error } = await supabase.from('plants').insert([{ ...plantData, created_at: new Date().toISOString() }]).select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  updatePlant: async (plant_id, plantData) => {
    try {
      const { data, error } = await supabase.from('plants').update(plantData).eq('id', plant_id).select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  deletePlant: async (plant_id) => {
    try {
      const { data: agencies } = await supabase.from('agencies').select('id').eq('plant_id', plant_id).limit(1);
      if (agencies?.length > 0) return { data: null, error: { message: 'Cannot delete plant. Used by agencies.' } };

      const { error } = await supabase.from('plants').delete().eq('id', plant_id);
      return { data: { success: !error }, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getPlantById: async (plant_id) => {
    try {
      const { data, error } = await supabase.from('plants').select('*').eq('id', plant_id).single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getUsersByPlant: async (plantId) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('plant_id', plantId).order('username');
      if (error) throw error;

      const { data: roles } = await supabase.from('roles').select('*');
      const rolesMap = {};
      roles?.forEach(r => rolesMap[r.code] = r.name);

      return { data: data.map(u => ({ ...u, role_name: rolesMap[u.role] || u.role })), error: null };
    } catch (error) { return { data: null, error }; }
  },

  // --- VENDORS ---
  getVendors: async () => {
    try {
      const { data, error } = await supabase.from('vendor').select('*').order('vendor_name');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getVendorsByPlant: async (plantName) => {
    try {
      const { data, error } = await supabase.from('vendor').select('*').eq('plant', plantName).order('vendor_name');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getVendorsByPlantId: async (plantId) => {
    try {
      const { data: plant } = await supabase.from('plants').select('name').eq('id', plantId).single();
      if (!plant) return { data: null, error: { message: 'Plant not found' } };

      const { data, error } = await supabase.from('vendor').select('*').eq('plant', plant.name).order('vendor_name');
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  // --- BILLING ---
  getBillings: async () => {
    try {
      const { data, error } = await supabase.from('trip_billings').select('*');
      return { data: data || [], error: error || null };
    } catch (error) { return { data: [], error }; }
  },

  saveBilling: async (billingData) => {
    try {
      const { data, error } = await supabase.from('trip_billings')
        .upsert({ ...billingData, updated_at: new Date().toISOString() }, { onConflict: 'trip_id' })
        .select().single();
      return { data, error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  // --- SYSTEM CHECKS ---
  testConnection: async () => {
    try {
      const { error } = await supabase.from('Trips').select('count').limit(1);
      return { success: !error, message: error ? error.message : 'Connection successful' };
    } catch (error) { return { success: false, error: error.message }; }
  },

  // --- EMAILS ---
  getPlantAdminEmails: async (plantId) => {
    try {
      const { data, error } = await supabase.from('users').select('email')
        .eq('plant_id', plantId).eq('role', 'plant_admin').eq('is_active', true);
      return { data: data?.map(u => u.email).filter(Boolean) || [], error: error || null };
    } catch (error) { return { data: null, error }; }
  },

  getPlantUserEmails: async (plantId) => {
    try {
      const { data, error } = await supabase.from('users').select('email')
        .eq('plant_id', plantId).eq('is_active', true).neq('role', 'plant_admin');
      return { data: data?.map(u => u.email).filter(Boolean) || [], error: error || null };
    } catch (error) { return { data: null, error }; }
  }
};

export default api;
