import { dbConfig } from "./config.js";
import mysql from 'mysql2/promise';

export async function poolToDb(proposalId, bondedTokens, unbondedTokens) {
    const connection = await mysql.createConnection(dbConfig);

    try {
        // Update the specific row in the Proposals table with the provided tokens
        await connection.execute(`
            UPDATE Proposal
            SET bonded_tokens = ?, unbonded_tokens = ?
            WHERE proposal_id = ?
        `, [bondedTokens, unbondedTokens, proposalId]);

        console.log(`Tokens added to proposal ${proposalId}`);
    } catch (error) {
        console.error('Error adding tokens to proposal:', error.message);
    } finally {
        // Close the database connection
        await connection.end();
    }
}
