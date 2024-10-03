import { dbConfig } from "./config.js";
import mysql from 'mysql2/promise';
import { fetchVotes } from "../Queries/votesQuery.js";

export async function checkAndProcessVotes() {
    let counter = 0;
    try {
      // Get a connection from the pool
      const connection = await mysql.createConnection(dbConfig);
      try {
        let data = [];
        // Query the UserVote table
        const [userVotes] = await connection.query('SELECT * FROM UserVote');
        let proposalId = 0;
        // Iterate through each entry in the UserVote table
        for (const vote of userVotes) {
          if (vote.weight === 0) {
            // Fetch the block_height and wallet_addr using proposal_id and user_id
            const [[proposal]] = await connection.query('SELECT block_height FROM Proposal WHERE proposal_id = ?', [vote.proposal_id]);
            const [[user]] = await connection.query('SELECT wallet_addr FROM User WHERE user_id = ?', [vote.user_id]);
  
            // Check if the proposal and user exist
            if (proposal && user) {  
              // Call the other function with the required values
              if (proposalId != vote.proposal_id) {
                proposalId = vote.proposal_id;
                data = await fetchVotes("https://lcd-archive.junonetwork.io/cosmos/gov/v1/proposals", vote.proposal_id, proposal.block_height);
              }
              await updateWeight(data, user.wallet_addr, vote.vote_direction, vote.vote_id);
              counter+= 1;
            }
          }
        }
      } finally {
        // Release the connection back to the pool
        connection.end();
        console.log(`${counter} votes have been updated`)
      }
    } catch (err) {
      console.error('Error processing votes:', err);
    }
  }

async function updateWeight(data, address, vote_direction, vote_id) {
    const connection = await mysql.createConnection(dbConfig);
    for (const vote of data.votes) {
        try {
            // Check if user already exists
            if (vote.voter != address) {
                continue;
            } 
            if (vote.options.length > 1) {
                console.log(`Found a weighted vote`)
            }
            let weight = 0;
            for (const option of vote.options) {
                if (option.option != vote_direction) {
                    continue;
                }
                if (Number(option.weight) > 1) {
                    weight = Number(option.weight)/1000000000000000000;
                } else {
                    weight = Number(option.weight)
                }
                // Insert user data into the 'User' table
                await connection.execute(
                    'UPDATE UserVote SET weight = ? WHERE vote_id = ?',
                    [weight, vote_id]
                );
                if (weight != 1) {
                    console.log(`Updated Vote ${vote_id} with a weight of ${weight}`);
                }
            
            } 
        } catch (error) {
            console.error('Error inserting user into the database:', error.message);
        }
    }
    await connection.end();
}
