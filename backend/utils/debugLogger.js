const fs = require('fs');
const path = require('path');

/**
 * Temporary debug logger to capture errors in the environment.
 * Writes to /tmp/habits_error.log
 */
const debugLog = (msg, err) => {
    try {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] ${msg}\n${err?.stack || err}\n\n`;
        fs.appendFileSync(path.join(process.cwd(), 'habits_error.log'), logMsg);
    } catch (e) {
        console.error('Debug logging failed:', e);
    }
};

module.exports = debugLog;
