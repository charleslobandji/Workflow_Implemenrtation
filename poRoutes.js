const express = require('express');
const router = express.Router();
const { insertPOWithLineItems } = require('./queries');

/**
 * POST /purchase-order
 * Inserts a PO Header along with Line Items
 */
router.post('/', async (req, res) => {
    const { po_number, vendor_id, order_date, items } = req.body;

    if (!po_number || !vendor_id || !order_date || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Invalid request. Ensure proper PO details and items array.' });
    }

    try {
        const result = await insertPOWithLineItems(po_number, vendor_id, order_date, items);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
