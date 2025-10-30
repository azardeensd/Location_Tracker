import emailjs from '@emailjs/browser';

// Initialize EmailJS (call this once in your app)
export const initEmailJS = () => {
  emailjs.init('5VcmvEA8sd411Zpub'); // Your public key
};

/**
 * Sends a journey completion email with detailed trip information
 */
export const sendTripEmail = async (journeyData) => {
  try {
    // Validate required fields
    if (!journeyData.agencyEmail) {
      throw new Error('Agency email is required');
    }

    if (!journeyData.driverName || !journeyData.agencyName) {
      throw new Error('Driver name and agency name are required');
    }

    console.log('Sending email to:', journeyData.agencyEmail);
    console.log('Email data:', journeyData);

    const templateParams = {
      to_email: journeyData.agencyEmail,
      driver_name: journeyData.driverName,
      agency_name: journeyData.agencyName,
      start_location: formatLocation(journeyData.startLocation),
      end_location: formatLocation(journeyData.endLocation),
      start_time: formatDate(journeyData.startTime),
      end_time: formatDate(journeyData.endTime),
      distance_traveled: `${journeyData.distance} km`,
      journey_duration: journeyData.duration,
      journey_id: journeyData.journeyId || 'N/A',
      vehicle_number: journeyData.vehicleNumber || 'N/A', // Added vehicle number
      plant: journeyData.plant || 'N/A',
      driver_contact: journeyData.driverContact || 'N/A',
      trip_date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      google_maps_start: `https://maps.google.com/?q=${journeyData.startLocation.lat},${journeyData.startLocation.lng}`,
      google_maps_end: `https://maps.google.com/?q=${journeyData.endLocation.lat},${journeyData.endLocation.lng}`,
      subject: `Trip Completion Report - ${journeyData.driverName} - ${journeyData.vehicleNumber} - ${journeyData.agencyName}`
    };

    console.log('Template params:', templateParams);

    const response = await emailjs.send(
      'service_ov3hav9', // Your Service ID
      'template_h5y26ds', // Your Template ID
      templateParams
    );

    console.log('EmailJS Response:', response);
    
    return { 
      success: true, 
      message: 'Trip report sent successfully!',
      status: response.status,
      emailId: response.text 
    };
  } catch (error) {
    console.error('Email sending failed with details:', {
      error: error,
      status: error?.status,
      text: error?.text,
      message: error?.message
    });
    
    let errorMessage = 'Failed to send email';
    if (error?.text) {
      errorMessage = error.text;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      message: errorMessage,
      error: error 
    };
  }
};

/**
 * Format location coordinates into readable address
 */
const formatLocation = (location) => {
  if (!location || !location.lat || !location.lng) {
    return 'Location data not available';
  }
  return `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`;
};

/**
 * Format date for better readability
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

// Test function to verify EmailJS configuration
export const testEmailJS = async () => {
  const testData = {
    agencyEmail: 'test@example.com', // Replace with a real email for testing
    driverName: 'Test Driver',
    agencyName: 'Test Agency',
    vehicleNumber: 'KA01AB1234', // Added vehicle number for testing
    startLocation: { lat: 40.7128, lng: -74.0060 },
    endLocation: { lat: 40.7282, lng: -73.7949 },
    distance: 25.5,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: '2 hours 30 minutes',
    plant: 'Test Plant',
    driverContact: '9876543210'
  };

  return await sendTripEmail(testData);
};
