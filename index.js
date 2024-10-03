import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { dbConfig } from './src/dbHandlers/config.js';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();

// Define port
const PORT = process.env.PORT || 3000;
const swaggerDocument = YAML.load('./openapi.yml');

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cors());
app.use(cors({
  origin: '*', // Allow all origins. Adjust as necessary.
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

const pool = mysql.createPool(dbConfig);

// Define route for getting all chain_id
app.get('/chains/:chain', async (req, res) => {
  try {
      const chainName = req.params.chain;
      // Assuming you have a database connection initialized (e.g., using Knex or Sequelize)
      const connection = await pool.getConnection();
      const [chain] = await connection.query('SELECT * FROM Chain WHERE name = ?', [chainName]);
      connection.release();
      res.json(chain);
    } catch (error) {
      console.error('Error fetching chains:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/chains/:chainName/proposals', async (req, res) => {
    try {
        const chainName = req.params.chainName;
        // Fetch proposals for the specified chain from the database using Knex
        const connection = await pool.getConnection();
        const [proposals] = await connection.query('SELECT v.* FROM Proposal v JOIN Chain u ON v.chain_id = u.chain_id WHERE u.name = ?', [chainName]);
        connection.release();
        res.json(proposals);
      } catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
  });

  app.get('/chains/:chainName/proposals/:proposalId', async (req, res) => {
    try {
        const chainName = req.params.chainName;
        const proposalId = req.params.proposalId;
        // Fetch proposals for the specified chain from the database using Knex
        const connection = await pool.getConnection();
        const [proposal] = await connection.query('SELECT v.* FROM Proposal v JOIN Chain u ON v.chain_id = u.chain_id WHERE u.name = ? AND v.proposal_id = ?', [chainName, proposalId]);
        connection.release();
        res.json(proposal);
      } catch (error) {
        console.error(`Error fetching proposal ${proposalId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
  });

app.get('/user/:address', async (req, res) => {
  try {
      const address = req.params.address;
      // Assuming you have a database connection initialized (e.g., using Knex or Sequelize)
      const connection = await pool.getConnection();
      const [user] = await connection.query('SELECT * FROM User WHERE wallet_addr = ?', [address]);
      connection.release();
      res.json(user);
    } catch (error) {
      console.error('Error fetching chains:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/user/:address/userVotes', async (req, res) => {
  try {
      const address = req.params.address;
      // Assuming you have a database connection initialized (e.g., using Knex or Sequelize)
      const connection = await pool.getConnection();
      const [userVotes] = await connection.query('SELECT v.* FROM UserVote v JOIN User u ON v.user_id = u.user_id WHERE u.wallet_addr = ?', [address]);
      connection.release();
      res.json(userVotes);
    } catch (error) {
      console.error('Error fetching UserVotes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/chains/:chainName/validators/:proposalId/', async (req, res) => {
  try {
      const proposalId = req.params.proposalId;
      // Assuming you have a database connection initialized (e.g., using Knex or Sequelize)
      const connection = await pool.getConnection();
      const [validators] = await connection.query(
        'SELECT v.validator_id, v.name, v.info, v.website, v.commission, v.operator_addr, vv.stake, IFNULL(uv.vote_direction, \'Not Voted\') AS vote_direction FROM Validator v JOIN ValidatorVote vv ON v.validator_id = vv.validator_id LEFT JOIN UserVote uv ON vv.proposal_id = uv.proposal_id AND uv.user_id = v.user_id WHERE vv.proposal_id = ?', [proposalId]
      );
      connection.release();
      res.json(validators);
    } catch (error) {
      console.error('Error fetching Validators:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/chains/:chainName/delegations/:proposalId/', async (req, res) => {
  try {
    const proposalId = req.params.proposalId;
    // Assuming you have a database connection initialized (e.g., using Knex or Sequelize)
    const connection = await pool.getConnection();
    const [delegations] = await connection.query(
      'SELECT u.wallet_addr, v.vote_direction, v.weight, d.validator_id, d.delegated_amount FROM UserVote v LEFT JOIN Delegation d ON v.vote_id = d.vote_id LEFT JOIN User u ON v.user_id = u.user_id WHERE v.proposal_id = ?', [proposalId]
    );
    connection.release();

    const result = delegations.map(entry => ({
      user_id: entry.wallet_addr,
      vote_direction: entry.vote_direction,
      weight: entry.weight,
      validator_id: entry.validator_id || null,
      delegated_amount: entry.delegated_amount || null
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching Delegations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


  // Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });