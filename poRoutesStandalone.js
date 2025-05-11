const express = require('express');
const router = express.Router();
const { createStandalonePO } = require('./queries');

/**
 * POST /create-po
 * Creates a Standalone Purchase Order (PO)
 */
router.post('/', async (req, res) => {
    const {process_type_name, actor_id, workflow_name,  supplier_id, po_number, order_date, delivery_date, currency, terms, assigned_to, po_items } = req.body;

    if (!process_type_name || !actor_id || !workflow_name || !supplier_id || !po_number || !order_date || !delivery_date || !currency || !terms || !assigned_to || !po_items) {
        return res.status(400).json({ message: 'Invalid request. Ensure all fields are provided.' });
    }

    try {
        const result = await createStandalonePO(process_type_name, actor_id, workflow_name, supplier_id, po_number, order_date, delivery_date, currency, terms, assigned_to, po_items);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
