const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { BADGE_DEFS, awardBadges } = require('../services/badgeService');

// ── GET /api/badges ──────────────────────────────────────────────────────────
// Returns the full badge catalogue with earned status for the current user.
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('badges');
        const earnedMap = new Map((user.badges || []).map(b => [b.id, b]));

        const catalogue = BADGE_DEFS.map(def => ({
            id: def.id,
            name: def.name,
            description: def.description,
            icon: def.icon,
            tier: def.tier,
            earned: earnedMap.has(def.id),
            earnedAt: earnedMap.get(def.id)?.earnedAt || null
        }));

        res.json({
            catalogue,
            earned: user.badges || [],
            total: BADGE_DEFS.length,
            count: (user.badges || []).length
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
});

// ── POST /api/badges/check ───────────────────────────────────────────────────
// Manually triggers a badge check — e.g. called from frontend after login.
router.post('/check', protect, async (req, res) => {
    try {
        const newBadges = await awardBadges(req.user.id);
        res.json({ newBadges });
    } catch (err) {
        res.status(500).json({ error: 'Badge check failed' });
    }
});

module.exports = router;
