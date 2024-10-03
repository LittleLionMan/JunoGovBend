import { dbConfig } from "../dbHandlers/config.js";
import mysql from 'mysql2/promise';
import { validatorToDb } from "../dbHandlers/validatorToDb.js";
import { fetchPool } from "./fetchPool.js";
import { fetchBlock } from "./blockQuery.js";
 
 export const fetchValidators = async ( urlBlocks, startBlock, latestBlock, urlVals, propNumber, atHeight) => {
    const connection = await mysql.createConnection(dbConfig);
      try {
        const [proposals, fields] = await connection.execute(
          'SELECT proposal_id, time, block_height FROM Proposal ORDER BY time'
        );
        const startBlockTime = new Date(await fetchBlock(urlBlocks, startBlock)).toISOString().slice(0, 19).replace('T', ' ');
        // Iterate through each proposal and update the block height if not present
        for (const proposal of proposals) {
          // Skip if block_height is already present for this proposal
          if (new Date (startBlockTime) > proposal.time || Number(proposal.block_height) > latestBlock) {
            console.log(`No data for Proposal ${proposal.proposal_id}.`);
            continue;
          }
          let atHeight = proposal.block_height; //proposal.block_height116983 Replace with the desired height
          let propNumber = proposal.proposal_id; //proposal.proposal_id 1 Replace with the proposal number*/
          const response = await fetch(urlVals + '?pagination.limit=300', {
            method: 'GET',
            headers: {
              'x-cosmos-block-height': atHeight, //x-cosmos-block-height
              'accept': 'application/json',
            },
          });
          const json = await response.json();
          await validatorToDb(json, atHeight, propNumber);
          //await fetchPool(propNumber, atHeight);
      }} catch (error) {
        console.error('Error:', error);
      } finally {
        // Close the database connection
        await connection.end();
      }
    }