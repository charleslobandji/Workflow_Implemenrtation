const express = require('express');
const router = express.Router();

const { importProducts } = require('../queries');

// Import CSV into PostgreSQL
router.post('/import', async (req, res) => {
    try {
        const { filePath } = req.body;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }

        const result = await importProducts(filePath);

        res.json({ message: 'Data import successful' });

    } catch (error) {
        console.error('Import failed:', error);
        res.status(500).json({ error: 'Data import failed', details: error.message });
    }
});
module.exports = router;