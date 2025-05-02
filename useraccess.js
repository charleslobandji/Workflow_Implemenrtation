const express = require('express');
const router = express.Router();
const { userHasAccess } = require('./queries');

/**
 * GET /users/access/:userId/:operation/:process
 * Checks if the user has permission to perform an operation on a business process.
 */
router.get('/access/:userId/:operation/:process', async (req, res) => {
    const { userId, operation, process } = req.params;

    try {
        const hasAccess = await userHasAccess(userId, operation, process); // test nodemon
        
        res.json({ hasAccess }); //  userId, operation, process,
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
