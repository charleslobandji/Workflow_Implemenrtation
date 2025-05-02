const express = require('express');
const router = express.Router();
const { convertPRToRFQ } = require('./queries');

/**
 * POST /convert-pr-to-rfq
 * Converts a Purchase Request (PR) to a Request for Quotation (RFQ)
 */
router.post('/', async (req, res) => {
    const { target_pr_id, target_rfq_number, target_supplier_id, target_deadline } = req.body;

    if (!target_pr_id || !target_rfq_number || !target_supplier_id || !target_deadline) {
        return res.status(400).json({ message: 'Invalid request. Ensure proper PR details.' });
    }

    try {
        const result = await convertPRToRFQ(target_pr_id, target_rfq_number, target_supplier_id, target_deadline);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
