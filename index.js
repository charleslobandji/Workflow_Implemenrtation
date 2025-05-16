
const express = require('express')

const bodyParser = require('body-parser')
const app = express()
const dbb = require('./queries')
const usersRoutes = require('./agents')
const usersRoutesHasAccess = require('./useraccess')
const lineItemsRoutes = require('./lineItems'); // Import routes
const poRoutes = require('./poRoutes'); // Import routes
const prRoutes= require('./prRoutes'); 
const poRoutesStandalone= require('./poRoutesStandalone');
const prToRfq = require('./prToRfq');
const processServiceRoute = require('./startProcess');
const getPrRoutes = require('./getPrRoutes');
const postWorkflowAction = require('./workflowAction')

const port = 3000


const Pool = require('pg').Pool

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Elephant-Trade-Workflow-Definition-02',
    password: 'Solutic',
    port: 5432,
})

app.use(express.json()); // Enable JSON parsing
//app.use('/line-items', lineItemsRoutes); // Register line items routes

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({extended: true,}))

// Endpoint to add step allowed action
app.post('/workflow/step-action', async (req, res) => {
    const { step_id, action_id, allowed_roles } = req.body;

    if (!step_id || !action_id || !allowed_roles) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        await pool.query(
            `SELECT add_step_allowed_action($1, $2, $3)`,
            [step_id, action_id, JSON.stringify(allowed_roles)]
        );

        res.status(200).json({ message: 'Step allowed action added successfully' });
    } catch (error) {
        console.error('Error executing function:', error);
        res.status(500).json({ error: error.message });
    }
});


app.delete('/workflow/remove-action', async (req, res) => {
    try {
        const { step_id, action_id } = req.body;

        if (!step_id || !action_id) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        await pool.query('SELECT remove_step_allowed_action($1, $2)', [step_id, action_id]);

        res.json({ message: `Action ${action_id} removed from step ${step_id} successfully.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/workflow/history/:instance_id', async (req, res) => {
    try {
        const { instance_id } = req.params;

        if (!instance_id) {
            return res.status(400).json({ error: 'Instance ID is required' });
        }

        const result = await pool.query('SELECT * FROM get_workflow_history($1)', [instance_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No workflow history found for this instance' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});


// API Endpoint: Get Workflow Structure
app.get('/workflow/:workflow_id', async (req, res) => {
    try {
        const { workflow_id } = req.params;
        const result = await pool.query('SELECT get_workflow_structure($1)', [workflow_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Workflow not found' });
        }

        res.json(result.rows[0].get_workflow_structure);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🚀 Create a Workflow

app.post('/workflow', async (req, res) => {
    const { workflow_name, workflow_description, process_type_id } = req.body;
    try {
      const result = await pool.query('SELECT create_workflow($1, $2, $3)', [workflow_name, workflow_description, process_type_id]);
      res.json({ workflow_id: result.rows[0].create_workflow });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  
  // 🚀 Assign Step to Workflow
  app.post('/workflow/:workflow_id/step', async (req, res) => {
    const { step_name, step_order, required_role_id, is_final_step } = req.body;
    try {
      const result = await pool.query('SELECT assign_workflow_step($1, $2, $3, $4, $5)', [req.params.workflow_id, step_name, step_order, required_role_id, is_final_step]);
      res.json({ step_id: result.rows[0].assign_workflow_step });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// 🚀 Assign Action to Step
app.post('/workflow/step/:step_id/action', async (req, res) => {
    const { action_id } = req.body;
    try {
      await pool.query('SELECT assign_step_action($1, $2)', [req.params.step_id, action_id]);
      res.json({ message: 'Action assigned successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // ** 🚀 Assign Allowed Roles to Action
  app.post('/workflow/step/:step_id/action/:action_id/roles', async (req, res) => {
    const { allowed_roles } = req.body; // Expected as JSON array
    try {
      await pool.query('SELECT assign_allowed_roles($1, $2, $3)', [req.params.step_id, req.params.action_id, JSON.stringify(allowed_roles)]);
      res.json({ message: 'Roles assigned successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
   //🚀 Check If User Can Perform Action
  app.get('/user/:user_id/step/:step_id/action/:action_id', async (req, res) => {
    try {
      const result = await pool.query('SELECT can_user_perform_action($1, $2, $3)', [req.params.user_id, req.params.step_id, req.params.action_id]);
      res.json({ allowed: result.rows[0].can_user_perform_action });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/convert/purchase-orders', async (req, res) => {
    try {
      const {
        quotation_id,
        creator_id,
        process_type_name,
        workflow_name,
        excluded_item_ids = null
      } = req.body;
  
      // Validate required fields
      if (!quotation_id || !creator_id || !process_type_name || !workflow_name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // Call the PostgreSQL function
      const result = await pool.query(
        'SELECT * FROM generate_purchase_order($1, $2, $3, $4, $5::json)',
        [
          quotation_id,
          creator_id,
          process_type_name,
          workflow_name,
          excluded_item_ids ? JSON.stringify(excluded_item_ids) : null
        ]
      );
  
      res.status(201).json({
        success: true,
        po_id: result.rows[0].generate_purchase_order,
        message: 'Purchase order created successfully'
      });
    } catch (error) {
      console.error('Error creating purchase order:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to create purchase order'
      });
    }
  });


// Create Purchase Request API Route
app.post('/purchase-request', async (req, res) => {
    try {
        const { processTypeName, workflowName, requesterId, departmentId, dateNeeded, notes, prItems } = req.body;

        // Validate Required Fields
        if (!processTypeName || !workflowName || !requesterId || !departmentId || !dateNeeded ||!notes || !prItems) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = `
            SELECT public.create_purchase_request_02($1, $2, $3, $4, $5, $6, $7) AS pr_number
        `;
        const values = [processTypeName, workflowName, requesterId, departmentId, dateNeeded, notes, JSON.stringify(prItems)];

        const result = await pool.query(query, values);

        res.status(201).json({ message: 'Purchase request created successfully', pr_number: result.rows[0].pr_number });

    } catch (error) {
        console.error('Error creating purchase request:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

//app.use(express.json());

app.use('/agents', usersRoutes);
//app.use('/agents', usersRoutes);

app.use('/purchase-order', poRoutes); // Register PO route
app.use('/line-items', lineItemsRoutes);
app.use('/useraccess', usersRoutesHasAccess);
app.use('/add-purchase-order', poRoutes)
app.use('/add-purchase-request', prRoutes)
app.use('/convert-pr-to-rfq', prToRfq)
app.use('/getPrRoutes', getPrRoutes)
app.use('/create/create-po', poRoutesStandalone)
app.use('/process-Services', processServiceRoute)
app.use('/workflow-actions', postWorkflowAction )

app.get('/workflows', dbb.getWorkflows);
app.get('/workflows/:id', dbb.getWorkflowById);
app.post('/workflows', dbb.createWorkflow);
app.post('/purchase-orders', dbb.createPurchaseOrder);
app.post('/request-for-quote', dbb.createRFQ);
app.post('/process-workflow', dbb.process_workflow_action);
app.post('/line-items', dbb.insertLineItemsTransactional)


app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})