// services/email.js
import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_ov3hav9',
  TEMPLATE_ID: 'template_h5y26ds', 
  PUBLIC_KEY: '5VcmvEA8sd411Zpub'
};

// Initialize EmailJS
export const initEmailJS = () => {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
};

export const sendTripEmail = async (emailData) => {
  try {
    if (!emailData.agency_email) {
      throw new Error('Agency email is required');
    }

    console.log('Sending email to:', emailData.agency_email);

    const templateParams = {
      agency_email: emailData.agency_email,
      subject: emailData.subject,
      agency_name: emailData.agency_name,
      plant: emailData.plant,
      vehicle_number: emailData.vehicle_number,
      driver_name: emailData.driver_name,
      driver_contact: emailData.driver_contact,
      start_time: emailData.start_time,
      end_time: emailData.end_time,
      start_lat: emailData.start_lat,
      start_lng: emailData.start_lng,
      end_lat: emailData.end_lat,
      end_lng: emailData.end_lng,
      start_address: emailData.start_address || `Coordinates: ${emailData.start_lat}, ${emailData.start_lng}`, // Include address
      end_address: emailData.end_address || `Coordinates: ${emailData.end_lat}, ${emailData.end_lng}`, // Include address
      distance: emailData.distance,
      duration: emailData.duration,
      trip_id: emailData.trip_id,
      current_date: emailData.current_date,
      // Legacy parameters
      to_email: emailData.agency_email,
      start_location: emailData.start_address || `Lat: ${emailData.start_lat}, Lng: ${emailData.start_lng}`,
      end_location: emailData.end_address || `Lat: ${emailData.end_lat}, Lng: ${emailData.end_lng}`
    };

    console.log('Template params:', templateParams);

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    console.log('Email sent successfully:', response);
    return { 
      success: true, 
      message: 'Trip report sent successfully!',
      emailId: response.text 
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      message: `Failed to send email: ${error.text || error.message}` 
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

// Test function to verify EmailJS configuration with new structure
export const testEmailJS = async () => {
  const testData = {
    agency_email: 'test@example.com', // Replace with a real email for testing
    subject: 'MANUAL TRIP-MARKET VEHICLE-TEST123',
    agency_name: 'Test Agency',
    plant: 'Test Plant',
    vehicle_number: 'KA01AB1234',
    driver_name: 'Test Driver',
    driver_contact: '9876543210',
    start_time: '29/10/2024 14:30',
    end_time: '29/10/2024 16:45',
    start_lat: '12.971598',
    start_lng: '77.594566',
    end_lat: '13.082680',
    end_lng: '80.270718',
    distance: '25.5',
    duration: '2h 15m',
    trip_id: '12345',
    current_date: new Date().toLocaleDateString('en-GB')
  };

  return await sendTripEmail(testData);
};

export default { initEmailJS, sendTripEmail, testEmailJS };