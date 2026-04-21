const { google } = require('googleapis');
const User = require('../models/User');

const oauth2Client = 
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback'
      )
    : null;

/**
 * Get the Google Auth URL
 */
const getAuthUrl = () => {
  if (!oauth2Client) {
    throw new Error('Google Calendar is not configured on the server. Missing API keys.');
  }
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes
  });
};

/**
 * Handle the callback and store tokens
 */
const handleCallback = async (code, userId) => {
  if (!oauth2Client) throw new Error('Google Calendar not configured');
  const { tokens } = await oauth2Client.getToken(code);
  
  // Get user info to store the email
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  const updateFields = {
    'googleCalendar.accessToken': tokens.access_token,
    'googleCalendar.expiryDate': tokens.expiry_date,
    'googleCalendar.email': userInfo.data.email
  };

  // Only store refresh token if provided (Google only sends it the first time)
  if (tokens.refresh_token) {
    updateFields['googleCalendar.refreshToken'] = tokens.refresh_token;
  }

  await User.findByIdAndUpdate(userId, { $set: updateFields });
  return tokens;
};

/**
 * Refresh the access token if expired
 */
const refreshAccessToken = async (user) => {
  if (!oauth2Client) throw new Error('Google Calendar not configured');
  if (!user.googleCalendar || !user.googleCalendar.refreshToken) {
    throw new Error('Google Calendar not connected');
  }

  // Use the select('+field') fields since they are excluded by default
  const fullUser = await User.findById(user._id).select('+googleCalendar.refreshToken +googleCalendar.accessToken +googleCalendar.expiryDate');

  oauth2Client.setCredentials({
    access_token: fullUser.googleCalendar.accessToken,
    refresh_token: fullUser.googleCalendar.refreshToken,
    expiry_date: fullUser.googleCalendar.expiryDate
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  
  await User.findByIdAndUpdate(user._id, {
    $set: {
      'googleCalendar.accessToken': credentials.access_token,
      'googleCalendar.expiryDate': credentials.expiry_date
    }
  });

  return credentials.access_token;
};

/**
 * Fetch calendar events
 */
const getCalendarEvents = async (user) => {
  if (!oauth2Client) throw new Error('Google Calendar not configured');
  let accessToken = user.googleCalendar.accessToken;
  
  // Check if token is expired (with 1 min buffer)
  if (Date.now() > (user.googleCalendar.expiryDate - 60000)) {
    accessToken = await refreshAccessToken(user);
  }

  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items;
};

module.exports = {
  getAuthUrl,
  handleCallback,
  getCalendarEvents
};
