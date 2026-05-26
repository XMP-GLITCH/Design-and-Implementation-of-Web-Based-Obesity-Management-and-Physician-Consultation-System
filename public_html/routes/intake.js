const express = require('express');
const router = express.Router();
const { validateIntakeData, sanitizeData } = require('../utils/validation');
// Email service is disabled. Strictly using WhatsApp.

// === INTAKE FORM BACKEND ROUTE START ===
/**
 * POST /api/intake
 * Receive patient intake form submission
 * Validate, sanitize, and send email to physician
 */
router.post('/', async (req, res) => {
  try {
    // Debug: Log incoming data
    console.log('Received intake POST:', req.body);
    // Step 1: Validate incoming data
    const validation = validateIntakeData(req.body);
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Step 2: Sanitize data to prevent XSS
    const sanitizedData = sanitizeData(req.body);

    // Step 3: Initialize email service (Bypassed - strictly using WhatsApp)

    // Step 4: Build intake record
    const intakeRecord = {
      id: generateIntakeId(),
      timestamp: new Date().toISOString(),
      patientInfo: {
        fullName: sanitizedData.fullName,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        address: sanitizedData.address,
        city: sanitizedData.city,
        state: sanitizedData.state
      },
      medicationSelection: {
        medication: sanitizedData.medication,
        dosage: sanitizedData.dosage,
        price: sanitizedData.price
      },
      callPreference: sanitizedData.callPreference,
      ...(sanitizedData.callPreference === 'schedule' && {
        scheduledCall: {
          date: sanitizedData.callDate,
          time: sanitizedData.callTime
        }
      })
    };

    // Step 5: Store intake submission in MySQL
    const pool = require('../utils/mysql');
    const sql = `INSERT INTO intake_submissions (
      intake_id, full_name, email, phone, address, city, state,
      medication, dosage, price, call_preference, call_date, call_time, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      intakeRecord.id,
      sanitizedData.fullName,
      sanitizedData.email,
      sanitizedData.phone,
      sanitizedData.address,
      sanitizedData.city,
      sanitizedData.state,
      sanitizedData.medication,
      sanitizedData.dosage,
      sanitizedData.price,
      sanitizedData.callPreference,
      sanitizedData.callPreference === 'schedule' ? sanitizedData.callDate : null,
      sanitizedData.callPreference === 'schedule' ? sanitizedData.callTime : null,
      intakeRecord.timestamp
    ];
    try {
      await pool.promise().execute(sql, values);
      console.log(`✅ Intake submission saved to MySQL for intake ${intakeRecord.id}`);
    } catch (dbError) {
      console.error('❌ Failed to save intake submission to MySQL:', dbError);
      if (dbError && dbError.sqlMessage) {
        console.error('MySQL error message:', dbError.sqlMessage);
      }
      if (dbError && dbError.code) {
        console.error('MySQL error code:', dbError.code);
      }
      if (dbError && dbError.errno) {
        console.error('MySQL error number:', dbError.errno);
      }
    }

    // Steps 6 & 7: Email dispatch bypassed (strictly using WhatsApp)

    // Step 8: Return success response
    return res.status(201).json({
      success: true,
      message: 'Intake request received successfully',
      intakeId: intakeRecord.id,
      timestamp: intakeRecord.timestamp,
      nextSteps: 'Please complete your consultation via WhatsApp using the button on screen.'
    });

  } catch (error) {
    console.error('Intake endpoint error:', error);
    
    // Don't expose internal error details to client
    return res.status(500).json({
      success: false,
      message: 'Server error processing intake request',
      errorId: generateIntakeId() // For client to reference in support ticket
    });
  }
});
// === INTAKE FORM BACKEND ROUTE END ===

// === BACKEND ROUTE START ===
/**
 * Health check for intake routes
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Intake routes are operational'
  });
});
// === BACKEND ROUTE END ===

/**
 * Generate unique intake ID
 * Format: INTAKE-TIMESTAMP-RANDOM
 * Example: INTAKE-1699564800000-A7F2
 */
function generateIntakeId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INTAKE-${timestamp}-${random}`;
}

module.exports = router;
