const nodemailer = require('nodemailer');
const Resend = require('resend').Resend;

/**
 * Initialize email service based on configuration
 * Supports both Nodemailer (SMTP) and Resend API
 */

let emailService = null;

/**
 * Initialize mail transporter on startup
 */
function initializeEmailService() {
  const emailProvider = process.env.EMAIL_SERVICE || 'nodemailer';

  if (emailProvider === 'resend') {
    const resend = new Resend(process.env.RESEND_API_KEY);
    emailService = {
      type: 'resend',
      client: resend
    };
    console.log('📧 Email service: Resend API');
  } else {
    // Default to Nodemailer (SMTP)
    // Set secure: false for port 587 (TLS), true for 465 (SSL)
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    emailService = {
      type: 'nodemailer',
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      })
    };
    console.log(`📧 Email service: Nodemailer SMTP (port ${smtpPort}, secure: ${smtpPort === 465})`);
  }

  return emailService;
}

/**
 * Send physician intake receipt email
 * @param {object} intakeData - Patient intake form data
 * @returns {Promise}
 */
async function sendPhysicianEmail(intakeData) {
  if (!emailService) {
    initializeEmailService();
  }

  const physicianEmail = process.env.PHYSICIAN_EMAIL;
  if (!physicianEmail) {
    throw new Error('Physician email not configured');
  }

  const emailContent = generateIntakeEmail(intakeData);

  try {
    if (emailService.type === 'resend') {
      const result = await emailService.client.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@kickoutobesity.com',
        to: physicianEmail,
        subject: `New Patient Intake Request - ${intakeData.fullName}`,
        html: emailContent
      });
      return result;
    } else {
      const result = await emailService.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@kickoutobesity.com',
        to: physicianEmail,
        subject: `New Patient Intake Request - ${intakeData.fullName}`,
        html: emailContent
      });
      return result;
    }
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send patient confirmation email (optional)
 * @param {object} intakeData - Patient intake form data
 * @returns {Promise}
 */
async function sendPatientConfirmationEmail(intakeData) {
  if (!emailService) {
    initializeEmailService();
  }

  const emailContent = generateConfirmationEmail(intakeData);

  try {
    if (emailService.type === 'resend') {
      const result = await emailService.client.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@kickoutobesity.com',
        to: intakeData.email,
        subject: 'Your Consultation Request Has Been Received',
        html: emailContent
      });
      return result;
    } else {
      const result = await emailService.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@kickoutobesity.com',
        to: intakeData.email,
        subject: 'Your Consultation Request Has Been Received',
        html: emailContent
      });
      return result;
    }
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Generate HTML email content for physician
 * @param {object} data - Intake data
 * @returns {string} - HTML email content
 */
function generateIntakeEmail(data) {
  const appointmentInfo = data.callPreference === 'schedule'
    ? `<p><strong>Appointment Date:</strong> ${data.callDate}</p>
       <p><strong>Appointment Time:</strong> ${data.callTime}</p>`
    : '<p><em>Patient requested to wait for physician call.</em></p>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2dd4bf 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #2dd4bf; }
        .label { font-weight: bold; color: #1f2937; }
        hr { border: none; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Patient Intake Request</h1>
          <p>Consultation booking received via KickOutObesity.com</p>
        </div>

        <div class="section">
          <h2>Patient Information</h2>
          <p><span class="label">Name:</span> ${data.fullName}</p>
          <p><span class="label">Email:</span> ${data.email}</p>
          <p><span class="label">Phone:</span> ${data.phone}</p>
          <hr>
          <p><span class="label">Address:</span> ${data.address}</p>
          <p><span class="label">City:</span> ${data.city}</p>
          <p><span class="label">State:</span> ${data.state}</p>
        </div>

        <div class="section">
          <h2>Medication Selection</h2>
          <p><span class="label">Medication:</span> ${data.medication}</p>
          <p><span class="label">Dosage:</span> ${data.dosage}</p>
          <p><span class="label">Price:</span> ${data.price}</p>
        </div>

        <div class="section">
          <h2>Call Preference</h2>
          ${appointmentInfo}
        </div>

        <div class="section" style="background: #f0fdfa; border-left-color: #06b6d4;">
          <p><small><strong>Note:</strong> This is an automated intake receipt. Patient details are ready for physician review and follow-up consultation.</small></p>
        </div>

        <hr>
        <p style="text-align: center; color: #6b7280; font-size: 12px;">
          KickOutObesity.com | Prescription-based weight management consultation platform
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML confirmation email for patient
 * @param {object} data - Intake data
 * @returns {string} - HTML email content
 */
function generateConfirmationEmail(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2dd4bf 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #2dd4bf; }
        .label { font-weight: bold; color: #1f2937; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Consultation Request Received</h1>
          <p>We've received your intake information, ${data.fullName}!</p>
        </div>

        <div class="section">
          <h2>What Happens Next</h2>
          <p>Our physician will review your consultation request and reach out to you shortly using the phone number you provided.</p>
          <p>During your consultation call, the physician will:</p>
          <ul>
            <li>Review your medical history</li>
            <li>Discuss your treatment goals</li>
            <li>Confirm medication selection and dosage</li>
            <li>Complete prescription if appropriate</li>
          </ul>
        </div>

        <div class="section">
          <h2>Your Selected Medication</h2>
          <p><span class="label">Medication:</span> ${data.medication}</p>
          <p><span class="label">Dosage:</span> ${data.dosage}</p>
          <p><span class="label">Price:</span> ${data.price}</p>
        </div>

        <div class="section">
          <h2>Contact Information</h2>
          <p>Please keep ${data.phone} available. We'll call at the time you specified in your request.</p>
        </div>

        <hr>
        <p style="text-align: center; color: #6b7280; font-size: 12px;">
          KickOutObesity.com | Prescription-based weight management consultation platform
        </p>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  initializeEmailService,
  sendPhysicianEmail,
  sendPatientConfirmationEmail
};
