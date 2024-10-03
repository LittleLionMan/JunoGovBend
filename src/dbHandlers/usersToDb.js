import { dbConfig } from "./config.js";
import mysql from 'mysql2/promise';

export async function usersToDb(data) {
    const connection = await mysql.createConnection(dbConfig);

    // Check if user with the same wallet address already exists
    async function userExists(walletAddr) {
        const [rows, fields] = await connection.execute(
            'SELECT user_id FROM User WHERE wallet_addr = ?',
            [walletAddr]
        );
        return rows.length > 0;
    }
    let counter = 0;
    for (const vote of data.votes) {
        try {
            // Check if user already exists
            const exists = await userExists(vote.voter);
            if (!exists) {
                // Insert user data into the 'User' table
                await connection.execute(
                    'INSERT INTO User (wallet_addr) VALUES (?)',
                    [vote.voter]
                );
                //console.log(`Added ${counter} User ${vote.voter}`);
                counter += 1;
            } else {
                //console.log(`User ${vote.voter} already exists`);
            }
        } catch (error) {
            console.error('Error inserting user into the database:', error.message);
        }
    }
    console.log(`Added ${counter} Users` + ' ' + new Date());
    // Close the database connection
    await connection.end();
}
