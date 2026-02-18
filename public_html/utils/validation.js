const validator = require('validator');

/**
 * Validate intake form data
 * @param {object} data - Form data to validate
 * @returns {object} - { isValid: boolean, errors: array }
 */
function validateIntakeData(data) {
  const errors = [];

  // Full name validation
  if (!data.fullName || typeof data.fullName !== 'string') {
    errors.push('Full name is required');
  } else if (data.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  // Email validation
  if (!data.email || !validator.isEmail(data.email)) {
    errors.push('Valid email is required');
  }

  // Phone validation - accepts formats like: 5551234567, (555)123-4567, 555-123-4567, +1-555-123-4567
  if (!data.phone || typeof data.phone !== 'string') {
    errors.push('Phone number is required');
  } else {
    // Remove common formatting characters and check if we have at least 10 digits
    const digitsOnly = data.phone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      errors.push('Phone number must contain 10-15 digits');
    }
  }

  // Address validation
  if (!data.address || typeof data.address !== 'string') {
    errors.push('Address is required');
  } else if (data.address.trim().length < 5) {
    errors.push('Address must be at least 5 characters');
  }

  // State validation
  if (!data.state || typeof data.state !== 'string') {
    errors.push('State is required');
  } else if (data.state.length !== 2) {
    errors.push('State must be a valid 2-letter code');
  }

  // City validation
  if (!data.city || typeof data.city !== 'string') {
    errors.push('City is required');
  } else if (data.city.trim().length < 2) {
    errors.push('City must be at least 2 characters');
  }

  // Medication validation
  if (!data.medication || typeof data.medication !== 'string') {
    errors.push('Medication selection is required');
  }

  // Dosage validation
  if (!data.dosage || typeof data.dosage !== 'string') {
    errors.push('Dosage selection is required');
  }

  // Price validation
  if (!data.price || typeof data.price !== 'string') {
    errors.push('Price is required');
  }

  // Call preference validation
  if (!data.callPreference || !['wait', 'schedule'].includes(data.callPreference)) {
    errors.push('Call preference must be "wait" or "schedule"');
  }

  // If schedule, validate date and time
  if (data.callPreference === 'schedule') {
    if (!data.callDate) {
      errors.push('Call date is required when scheduling');
    } else if (!validator.isISO8601(data.callDate)) {
      errors.push('Call date must be in ISO 8601 format');
    }

    if (!data.callTime) {
      errors.push('Call time is required when scheduling');
    } else if (!/^\d{2}:\d{2}$/.test(data.callTime)) {
      errors.push('Call time must be in HH:MM format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize form data to prevent XSS
 * @param {object} data - Data to sanitize
 * @returns {object} - Sanitized data
 */
function sanitizeData(data) {
  const sanitized = {};

  for (const key in data) {
    if (typeof data[key] === 'string') {
      sanitized[key] = validator.escape(data[key].trim());
    } else {
      sanitized[key] = data[key];
    }
  }

  return sanitized;
}

module.exports = {
  validateIntakeData,
  sanitizeData
};
