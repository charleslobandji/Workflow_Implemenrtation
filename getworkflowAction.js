// routes/workflow.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

// Get allowed actions for the current workflow step
router.get('/allowed-actions', async (req, res) => {
  try {
    // Validate required parameters
    const { instance_id, step_id, workflow_id } = req.query;
    
    if (!instance_id || !step_id || !workflow_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: instance_id, step_id, workflow_id'
      });
    }

    
    // Execute PostgreSQL function correspondence
    const result = await db.any(
      `SELECT * FROM get_allowed_actions($1, $2, $3)`,
      [instance_id, step_id, workflow_id]
    );

    // Format response
    const response = {
      success: true,
      message: 'Allowed actions retrieved successfully',
      data: {
        instance_id: parseInt(instance_id),
        step_id: parseInt(step_id),
        workflow_id: parseInt(workflow_id),
        allowed_actions: result.map(row => row.action_name)
      }
    };

    res.json(response);
    
  } catch (error) {
    console.error('[Workflow Error]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve allowed actions',
      details: error.message
    });
  }
});

module.exports = router;