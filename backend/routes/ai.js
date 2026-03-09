const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getCoachInsights } = require('../services/aiService');

router.use(protect);

// GET AI Coach insights
router.get('/coach', async (req, res) => {
    try {
        const insights = await getCoachInsights(req.user._id);
        res.json({
            success: true,
            insights
        });
    } catch (err) {
        console.error('AI Coach error:', err);
        res.status(500).json({ error: 'Error generating AI insights.' });
    }
});

module.exports = router;
