const express = require('express');
const router = express.Router();

/**
 * GET /api/config
 * Expose public configurations (like WhatsApp number)
 */
router.get('/', (req, res) => {
  res.json({
    whatsappNumber: process.env.PHYSICIAN_WHATSAPP || '237677123456'
  });
});

module.exports = router;
