# KickOutObesity Backend API

Node.js/Express backend server for patient consultation booking platform.

## Project Structure

```
backend/
├── server.js                  # Express server entry point
├── package.json               # Node.js dependencies
├── .env                       # Configuration (use .env template)
├── .gitignore                 # Git ignore rules
├── routes/
│   └── intake.js             # POST /api/intake endpoint for form submissions
├── utils/
│   ├── validation.js         # Form data validation & sanitization
│   └── emailService.js       # Email sending (SMTP & Resend support)
└── data/
    └── medications.json      # Product catalog with pricing
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Environment variable management
- **validator** - Data validation & sanitization
- **nodemailer** - SMTP email sending
- **resend** - Resend.com email API

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
# Copy the .env template
cp .env.example .env
```

Edit `.env` with your actual values:

```
PORT=3000
NODE_ENV=development

# Choose one email service:
EMAIL_SERVICE=nodemailer

# For Nodemailer (SMTP via Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your_email@yourdomain.com
SMTP_PASSWORD=your_app_password

# OR for Resend API
RESEND_API_KEY=re_xxxxx...

# Email settings
FROM_EMAIL=noreply@kickoutobesity.com
PHYSICIAN_EMAIL=doctor@yourmedicalclinic.com
```

### 3. Get Email Credentials

#### Option A: Hostinger SMTP
1. Log in to Hostinger Control Panel
2. Go to Email → Accounts
3. Create an email account (or use existing)
4. Get SMTP credentials from account settings
5. Use these in `.env` with `EMAIL_SERVICE=nodemailer`

#### Option B: Resend API (Recommended)
1. Sign up at https://resend.com
2. Get API key from dashboard
3. Add to `.env`: `RESEND_API_KEY=re_xxxxx...`
4. Set `EMAIL_SERVICE=resend`

### 4. Update Physician Email

In `.env`, set the physician email address where intake notifications should be sent:
```
PHYSICIAN_EMAIL=doctor_name@medicalpractice.com
```

## Running the Server

### Development (with auto-reload)

```bash
npm run dev
```

Requires `nodemon` installed globally or as dev dependency.

### Production

```bash
npm start
```

Server runs on `http://localhost:3000` (or PORT from .env)

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

## API Endpoints

### POST /api/intake

Submit patient consultation request.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-123-4567",
  "address": "123 Main St",
  "city": "Los Angeles",
  "state": "CA",
  "medication": "Semaglutide",
  "dosage": "1 mL vial",
  "price": "$175",
  "callPreference": "schedule",
  "callDate": "2024-01-15",
  "callTime": "14:30"
}
```

**Responses:**

✅ Success (201 Created):
```json
{
  "success": true,
  "message": "Intake request received successfully",
  "intakeId": "INTAKE-1699564800000-A7F2",
  "timestamp": "2024-01-10T14:30:00.000Z",
  "nextSteps": "A physician will contact you to confirm your consultation..."
}
```

❌ Validation Error (400 Bad Request):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Full name is required",
    "Valid email is required"
  ]
}
```

❌ Server Error (500 Internal Server Error):
```json
{
  "success": false,
  "message": "Server error processing intake request",
  "errorId": "INTAKE-1699564800000-A7F2"
}
```

### GET /api/intake/health

Health check for intake routes.

**Response:**
```json
{
  "success": true,
  "message": "Intake routes are operational"
}
```

## Data Validation

The `/api/intake` endpoint validates:

| Field | Rules |
|-------|-------|
| `fullName` | Required, min 2 chars |
| `email` | Required, valid email format |
| `phone` | Required, valid US phone number |
| `address` | Required, min 5 chars |
| `state` | Required, 2-letter state code |
| `city` | Required, min 2 chars |
| `medication` | Required (Semaglutide or Tirzepatide) |
| `dosage` | Required |
| `price` | Required |
| `callPreference` | Required ('wait' or 'schedule') |
| `callDate` | Required if schedule, ISO8601 format |
| `callTime` | Required if schedule, HH:MM format |

All string inputs are sanitized to prevent XSS attacks.

## Email Templates

### Physician Email
Confirms new patient intake with full details:
- Patient contact information
- Selected medication & dosage  
- Requested call preference & appointment time
- Professional HTML formatting

### Patient Confirmation Email
Acknowledges receipt and sets expectations:
- Confirmation of selected medication
- Timeline expectations
- Link to contact support

Both emails automatically send to respective recipients on successful form submission.

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3000 | Server port |
| NODE_ENV | No | development | Environment (development/production) |
| EMAIL_SERVICE | No | nodemailer | Email service ('nodemailer' or 'resend') |
| SMTP_HOST | Yes* | - | SMTP server hostname (*if using nodemailer) |
| SMTP_PORT | Yes* | 465 | SMTP server port (*if using nodemailer) |
| SMTP_USER | Yes* | - | SMTP authentication username (*if using nodemailer) |
| SMTP_PASSWORD | Yes* | - | SMTP authentication password (*if using nodemailer) |
| RESEND_API_KEY | Yes** | - | Resend API key (**if using resend) |
| FROM_EMAIL | Yes | - | Sender email address |
| PHYSICIAN_EMAIL | Yes | - | Physician recipient email |

## Troubleshooting

### "Validation failed" errors
Check that all required fields are being sent from frontend with correct format.

### "Failed to send email"
1. Verify `.env` configuration is correct
2. Check SMTP credentials or Resend API key
3. Ensure FROM_EMAIL is a valid sending address
4. Check firewall/network allows SMTP port (465)

### "Cannot find module" errors
Run `npm install` to ensure all dependencies are installed.

### Server won't start
- Check PORT is not already in use: `lsof -i :3000` (Mac/Linux)
- Check NODE_ENV and other config in `.env`
- Verify `.env` file exists in backend directory

## Frontend Integration

The frontend form (in `script.js`) should POST to this endpoint:

```javascript
const formData = {
  fullName, email, phone, address, state, city,
  medication, dosage, price,
  callPreference, callDate, callTime
};

const response = await fetch('/api/intake', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

const result = await response.json();
if (result.success) {
  // Show success message
  console.log('Intake ID:', result.intakeId);
} else {
  // Show error messages
  console.error('Errors:', result.errors);
}
```

## Security Notes

- All string inputs are sanitized with `validator.escape()` to prevent XSS
- Phone numbers validated against US format standards
- Email addresses validated with standard patterns
- Sensitive config (credentials) stored in `.env` (not committed to git)
- CORS enabled by default - restrict in production if needed
- Request body size limited to 10kb

## Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "validator": "^13.11.0",
  "nodemailer": "^6.9.6",
  "resend": "^1.0.0"
}
```

For dev: `nodemon` recommended for auto-reload during development.

## Future Enhancements

- [ ] Database integration (MySQL/SQLite/MongoDB)
- [ ] Persistent intake record storage
- [ ] Calendar/scheduling system integration
- [ ] Admin dashboard for reviewing intakes
- [ ] SMS notifications to patient
- [ ] Prescription generation workflow
- [ ] Payment processing integration
- [ ] Analytics & reporting

## Support

For issues or questions, contact the development team.
