const express = require('express');
const router = express.Router();
const { getPurchaseRequest } = require('./queries');

/**
 * GET /purchase-request/:pr_id
 * Retrieves PR header and line items as JSON
 */
router.get('/purchase-request/:pr_id', async (req, res) => {
    const { pr_id } = req.params;

    if (!pr_id || isNaN(pr_id)) {
        return res.status(400).json({ message: 'Invalid PR ID. It must be a number.' });
    }

    try {
        const result = await getPurchaseRequest(pr_id);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
