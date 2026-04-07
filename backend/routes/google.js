const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const googleCalendarService = require('../services/googleCalendarService');
const User = require('../models/User');

/**
 * @route GET /api/google/auth
 * @desc  Get the Google Auth URL to initiate OAuth
 * @access Private
 */
router.get('/auth', protect, (req, res) => {
  const url = googleCalendarService.getAuthUrl();
  res.json({ url });
});

/**
 * @route GET /api/google/callback
 * @desc  Google OAuth Callback
 * @access Public (but userId must be passed in state or session)
 */
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // In a real app, 'state' should contain the userId or we use session
  // For this integration, we'll expect the frontend to pass the userId in 'state'
  // or we can use a redirect with a success flag and let the frontend handle it.
  
  try {
    // We'll use a temporary approach: the frontend should have initiated this
    // and passed the userId in the 'state' parameter.
    const userId = state; 
    if (!userId) {
      return res.status(400).send('User ID missing in state');
    }

    await googleCalendarService.handleCallback(code, userId);
    
    // Redirect back to frontend dashboard
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?google=success`);
  } catch (err) {
    console.error('Google Callback Error:', err);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?google=error`);
  }
});

/**
 * @route GET /api/google/events
 * @desc  Fetch upcoming Google Calendar events
 * @access Private
 */
router.get('/events', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+googleCalendar.accessToken +googleCalendar.refreshToken +googleCalendar.expiryDate');
    
    if (!user.googleCalendar || !user.googleCalendar.accessToken) {
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    const events = await googleCalendarService.getCalendarEvents(user);
    res.json({ success: true, events });
  } catch (err) {
    console.error('Fetch Events Error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

/**
 * @route DELETE /api/google/disconnect
 * @desc  Disconnect Google Calendar
 * @access Private
 */
router.delete('/disconnect', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { googleCalendar: 1 }
    });
    res.json({ success: true, message: 'Google Calendar disconnected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

module.exports = router;
