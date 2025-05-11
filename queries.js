const Pool = require('pg').Pool

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Elephant-Trade-Workflow-Definition',
    password: 'Solutic',
    port: 5432,
})

const pool2 = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Elephant-Trade-Workflow-Definition-02',
  password: 'Solutic',
  port: 5432,
})

const getWorkflows = (request, response) => {
    pool.query('SELECT * FROM workflow ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}



const getWorkflowById = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM workflow WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}


const getUsersWithAccess = async (operation, process) => {
    try {
        const result = await pool.query(
            'SELECT get_users_with_access($1, $2)',
            [operation, process]
        );
        return { success: true, data: result.rows };
        
    } catch (error) {
        return { success: false, message: 'Database query failed', error: error.message };
    }
};

const userHasAccess = async (userId, operation, process) => {
  try {
      const result = await pool.query(
          'SELECT user_has_access($1, $2, $3) AS access',
          [userId, operation, process]
      );
      return result.rows[0].access; // Returns true or false
  } catch (error) {
      // console.error('Error checking user access:', error);
      throw error;
  }
};




const createWorkflow = (request, response) => {
    try {
    const { name, description, bip_id } = request.body
    pool.query('INSERT INTO workflow (name, description, bip_id) VALUES ($1, $2, $3)', [name, description, bip_id], (error, results) => {
    response.status(201).send('Un nouveau workflow a été créé avec succès')
    })
    } catch (err) {
        response.status(500).json({error: err.message})
    }
}


const process_workflow_action = async (request, response) => {
    try{
        const {process_id, action_name, actor_id, comments} = request.body
        const result = await pool.query(`SELECT process_workflow_action(
          $1::INT, $2::VARCHAR, $3::INT, $4::TEXT
        ) `,
        [
          process_id,
          action_name,
          actor_id,
          comments
        ])

        response.json({
            success: true,
            message: "Etape d'approbation réussie"
        })
    } catch (error) {
        console.error("Erreur dans le processus d'approbation: ", error);
        response.status(500).json({ 
          success: false, 
          error: error.message 
        });
    }
    
};




const createRFQ = async (request, response) => {
    try {
    const { 
        supplier_id,
        requester_id,
        issue_date,
        bid_deadline,
        total_estimated_amount,
        status,
        project_id,
        gl_account_id,
        cost_center_id,
        created_at,
        updated_at,
        p_workflow_name
    } = request.body;
      const result = await pool.query(
        `SELECT create_rfq_04($1::integer, $2::integer, $3::DATE, $4::date, $5::numeric, $6::VARCHAR,$7::INT, $8::INT,$9::INT, $10::DATE,$11::DATE, $12::VARCHAR
        
      ) AS rfq_number `,

      [ supplier_id,
        requester_id,
        issue_date,
        bid_deadline,
        total_estimated_amount,
        status,
        project_id,
        gl_account_id,
        cost_center_id,
        created_at,
        updated_at,
        p_workflow_name]

      
      );
      if (!result.rows[0]?.rfq_number) { // Added null check
        return response.status(500).json({ error: "Erreur lors de la génération du RFQ" });
      }

      response.status(201).json({
        success: true,
        rfq_number: result.rows[0].rfq_number
      });

    } catch (error) {
      console.error('Erreur lors de la création du RFQ: ', error);
      
      // Handle specific PostgreSQL errors
      if (error.code === '23505') { // Unique violation
        return response.status(409).json({ error: "Numéro RFQ existant" }); // Fixed response
      }
      if (error.code === '23503') { // Foreign key violation
        return response.status(400).json({ error: "Clé de référence invalide" }); // Fixed response
      }

      response.status(500).json({ error: "Erreur du Serveur des données" }); // Fixed response
    }


};

  


const createPurchaseOrder = async (request, response) => { // Added async
    try {
      const {
        supplier_id,
        requester_id,
        issue_date = new Date().toISOString(), // Better date formatting
        delivery_date,
        total_amount = 0.00,
        tax_amount = 0.00,
        status = 'draft',
        payment_terms,
        gl_account_id,
        project_id,
        cost_center_id,
        p_workflow_name
      } = request.body;

      // Required field validation
      if (!supplier_id || !requester_id) {
        return response.status(400).json({ error: "Supplier ID and Requester ID are required" }); // Fixed response
      }

      // Call PostgreSQL function with await
      const result = await pool.query( // Added await
        `SELECT create_purchase_order_04(
          $1::INT, $2::INT, $3::DATE, $4::DATE, $5::NUMERIC, $6::NUMERIC, $7::VARCHAR, $8::VARCHAR, $9::INT, $10::INT, $11::INT, $12::VARCHAR
        ) AS po_number`,
        [
          supplier_id,
          requester_id,
          issue_date,
          delivery_date,
          total_amount,
          tax_amount,
          status,
          payment_terms,
          gl_account_id,
          project_id,
          cost_center_id,
          p_workflow_name
        ]
      );

      if (!result.rows[0]?.po_number) { // Added null check
        return response.status(500).json({ error: "Echec de génération du numéro du PO" });
      }

      response.status(201).json({
        success: true,
        po_number: result.rows[0].po_number
      });

    } catch (error) {
      console.error('Erreur lors de la création du PO: ', error);
      
      // Handle specific PostgreSQL errors
      if (error.code === '23505') { // Unique violation
        return response.status(409).json({ error: "Numéro PO existant" }); // Fixed response
      }
      if (error.code === '23503') { // Foreign key violation
        return response.status(400).json({ error: "Clé de référence invalide" }); // Fixed response
      }

      response.status(500).json({ error: "Erreur du Serveur des données" }); // Fixed response
    }
};  



/**
 * Insert multiple line items into the database using PostgreSQL function
 */


/**
 * Insert multiple line items with transaction handling
 */
const insertLineItemsTransactional = async (items) => {
    try {
        const result = await pool.query(
            'SELECT * FROM insert_line_items_transactional($1)',
            [items]
            //[JSON.stringify(items)]
        );

        const failedItems = result.rows;

        if (failedItems.length > 0) {
            return { success: false, message: 'Partial insert failure', failedItems };
        }

        return { success: true, message: 'All line items inserted successfully' };
    } catch (error) {
        return { success: false, message: 'Database transaction failed', error: error.message };
    }
};




/**
 * Insert PO Header & Line Items with Transactions
 */
const insertPOWithLineItems = async (po_number, vendor_id, order_date, items) => {
    try {
        const result = await pool.query(
            'SELECT * FROM insert_po_with_line_items($1, $2, $3, $4)',
            [po_number, vendor_id, order_date, items]
        );

        const failedItems = result.rows;

        if (failedItems.length > 0) {
            return { success: false, message: 'Partial insert failure', failedItems };
        }

        return { success: true, message: 'PO and line items inserted successfully' };
    } catch (error) {
        return { success: false, message: 'Database transaction failed', error: error.message };
    }
};


/**
 * Insert Purchase Request with Line Items
 */
const insertPurchaseRequest = async (pr_number, requester_id, status, items) => {
  try {
      const result = await pool.query(
          'SELECT * FROM insert_purchase_request($1, $2, $3, $4)',
          [pr_number, requester_id, status, items]
      );

      const failedItems = result.rows;

      if (failedItems.length > 0) {
          return { success: false, message: 'Partial insert failure', failedItems };
      }

      return { success: true, message: 'PR and line items inserted successfully' };
  } catch (error) {
      return { success: false, message: 'Database transaction failed', error: error.message };
  }
};


/**
 * Convert PR to RFQ
 */
const convertPRToRFQ = async (target_pr_id, target_rfq_number, target_supplier_id, target_deadline) => {
    try {
        const result = await pool.query(
            'SELECT convert_pr_to_rfq($1, $2, $3, $4)',
            [target_pr_id, target_rfq_number, target_supplier_id, target_deadline]
        );

        const newRfqId = result.rows[0].convert_pr_to_rfq;

        return { success: true, message: 'PR converted to RFQ successfully', rfq_id: newRfqId };
    } catch (error) {
        return { success: false, message: 'Database transaction failed', error: error.message };
    }
};


/**
 * Retrieve Purchase Request with Line Items
 */
const getPurchaseRequest = async (pr_id) => {
  try {
    const result = await pool.query('SELECT get_purchase_request($1) AS pr_data', [pr_id]);
    
    // Debug: Log the raw result and its type
    

    // Directly use the parsed object
    const prData = result.rows[0].pr_data;

    return { success: true, pr: prData };
  } catch (error) {
    return { success: false, message: 'Database query failed', error: error.message };
  }
};



const startBusinessProcess = async (processTypeName, creatorId, workflowName) => {
  try {
    const result = await pool2.query(
      `SELECT start_process($1, $2, $3) AS instance_id`,
      [processTypeName, creatorId, workflowName]
    );
    return result.instance_id;
  } catch (error) {
    throw new Error(`Failed to start process: ${error.message}`);
  }
};


const handleAction = async (instanceId, actionName, userId, comments = null) => {
  try {
    const result = await pool2.query(
      `SELECT handle_action($1, $2, $3, $4) AS result`,
      [instanceId, actionName, userId, comments]
    );
    
    if (!result?.rows?.[0]?.result) {
      throw new Error('Réponse invalide de la base de données');
    }
    
    let parsed;
    try {
      parsed = result.rows[0].result //JSON.parse(result.rows[0].result);
    } catch (e) {
      throw new Error('Réponse JSON invalide: ' + result.rows[0].result);
    }

    // Validation de la structure
    if (!parsed.status || !parsed.message) {
      throw new Error('Structure de réponse incorrecte');
    }

    return {
      status: parsed.status || 'unknown',
      message: parsed.message || 'Pas de message',
      new_status: parsed.new_status || null
    };

  } catch (error) {
    console.error('Action failed:', error.message);
    throw new Error(`Action processing error: ${error.message}`);
  }
};


/**
 * Create Standalone Purchase Order
 */
const createStandalonePO = async (process_type_name, actor_id, workflow_name, supplier_id, po_number, order_date, delivery_date, currency, terms, assigned_to, po_items) => {
    try {
        const result = await pool2.query(
            'SELECT create_standalone_po($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [process_type_name, actor_id, workflow_name, supplier_id, po_number, order_date, delivery_date, currency, terms, assigned_to, JSON.stringify(po_items)]
        );

        const newPoId = result.rows[0].create_standalone_po;

        return { success: true, message: 'Purchase Order created successfully', po_id: newPoId };
    } catch (error) {
        return { success: false, message: 'Database transaction failed', error: error.message };
    }
};





module.exports = { 
  createStandalonePO,
  handleAction,
  startBusinessProcess,
  getPurchaseRequest,
  convertPRToRFQ,
  insertPurchaseRequest,
  insertPOWithLineItems,
  insertLineItemsTransactional,
    getUsersWithAccess,
    userHasAccess,
    createPurchaseOrder,
    createRFQ,
    createWorkflow,
    getWorkflows,
    getWorkflowById,
    process_workflow_action    
}
