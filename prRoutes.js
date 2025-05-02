const express = require('express');
const router = express.Router();
const { insertPurchaseRequest } = require('./queries');

/**
 * POST /purchase-request
 * Inserts a Purchase Request (PR) with line items
 */
router.post('/', async (req, res) => {
    const { pr_number, requester_id, status, items } = req.body;

    if (!pr_number || !requester_id || !status || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Invalid request. Ensure proper PR details and items array.' });
    }

    try {
        const result = await insertPurchaseRequest(pr_number, requester_id, status, items);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
