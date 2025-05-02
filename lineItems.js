const express = require('express');
const router = express.Router();
const { insertLineItemsTransactional } = require('./queries');

/**
 * POST /line-items
 * Inserts multiple line items using PostgreSQL stored procedure
 */
router.post('/', async (req, res) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Invalid request, items must be an array' });
    }

    try {
        const result = await insertLineItemsTransactional(items);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
