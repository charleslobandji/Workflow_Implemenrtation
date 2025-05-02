const express = require('express');
const router = express.Router();
const { getUsersWithAccess } = require('./queries');


router.get('/access/:operation/:process', async (req, res) => {
    const { operation, process } = req.params;
try {
    const users = await getUsersWithAccess(operation, process);
    res.json(users);
    
} catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
}
    
});




module.exports = router;
