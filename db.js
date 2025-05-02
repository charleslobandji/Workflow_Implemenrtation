const Pool = require('pg').Pool

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Elephant-Trade-Workflow-Definition-02',
    password: 'Solutic',
    port: 5432,
})