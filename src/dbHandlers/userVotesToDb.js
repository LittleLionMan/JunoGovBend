import { dbConfig } from "./config.js";
import mysql from 'mysql2/promise';

export async function userVotesToDb(data, proposal_id) {
    const connection = await mysql.createConnection(dbConfig);

    // Check if user with the same wallet address already exists
    async function getUserId(walletAddr) {
        const [rows, fields] = await connection.execute(
            'SELECT user_id FROM User WHERE wallet_addr = ?',
            [walletAddr]
        );
        if (rows.length > 0) {
            return rows[0].user_id; // Access user_id from the first row
        } else {
            console.log(`No User for ${walletAddr}!`);
            return null; // No user found with the given wallet address
        }
    }
    let counter = 0;
    for (const vote of data.votes) {
        try {
            // Check if user already exists
            const userId = await getUserId(vote.voter);
            if (vote.options.length > 1) {
                console.log(`Found a weighted vote by User ${userId}`)
            }
            let weight = 0;
            for (const option of vote.options) {
                if (Number(option.weight) > 1) {
                    weight = Number(option.weight)/1000000000000000000;
                } else {
                    weight = Number(option.weight)
                }
                // Insert user data into the 'User' table
                await connection.execute(
                    'INSERT INTO UserVote (user_id, proposal_id, vote_direction, weight) VALUES (?, ?, ?, ?)',
                    [
                        userId,
                        proposal_id,
                        option.option,
                        weight
                    ]
                );
                counter += 1;
            } 
        } catch (error) {
            console.error('Error inserting user into the database:', error.message);
        }
        
    }
    console.log(`Added ${counter} Votes` + ' ' + new Date());
    // Close the database connection
    await connection.end();
}
