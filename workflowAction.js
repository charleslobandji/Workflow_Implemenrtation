const express = require('express');
const router = express.Router();
const { handleAction } = require('./queries');

router.post('/execute-workflow-action', async (req, res) => {
  try {
    // Validate request body
    const { instance_id, action_name, user_id, comments } = req.body;
    
    // Required fields check
    if (!instance_id || !action_name || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: instance_id, action_name, user_id'
      });
    }

    // Type validation
    if (typeof instance_id !== 'number' || 
        typeof user_id !== 'number' ||
        typeof action_name !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter types'
      });
    }

    // Process action
    const result = await handleAction(
      instance_id,
      action_name,
      user_id,
      comments
    );

   
    const response = {
        success: true,
        status: result.status || 'unknown',
        message: result.message || 'Aucun message fourni',
        new_status: result.new_status || null
      };

    res.status(201).json(response);
    

  } catch (error) {
    const statusCode = error.message.includes('not allowed') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Action processing failed',
      details: error.message
    });
  }
});

module.exports = router;