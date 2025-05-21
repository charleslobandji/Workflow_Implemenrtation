const express = require('express');
const { getProcessSummary } = require('../queries'); // Import queries
const router = express.Router();

// API to fetch process summary using exported query function
router.get('/summary', async (req, res) => {
    try {
        const { month } = req.query; // Get month filter from request
        const data = await getProcessSummary(month);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching process summary:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;