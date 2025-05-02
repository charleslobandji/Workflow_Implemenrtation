const express = require('express');
const router = express.Router();
const { startBusinessProcess } = require('./queries');

router.post('/startprocess', async (req, res) => {
  try {
    // Validate request body
    const { process_type_name, creator_id, workflow_name } = req.body;
    
    if (!process_type_name || !creator_id || !workflow_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: process_type_name, creator_id, workflow_name'
      });
    }

    // Validate parameter types
    if (typeof creator_id !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'creator_id must be a numeric value'
      });
    }

    // Start new process
    const instanceId = await startBusinessProcess(
      process_type_name,
      creator_id,
      workflow_name
    );

    res.status(201).json({
      success: true,
      message: 'Process started successfully',
      instance_id: instanceId,
      process_type: process_type_name,
      workflow: workflow_name
    });

  } catch (error) {
    console.error(`[Process Error] ${error.message}`);
    const statusCode = error.message.includes('exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Process initialization failed',
      details: error.message
    });
  }
});

module.exports = router;