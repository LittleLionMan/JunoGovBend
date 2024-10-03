import { dbConfig } from "./config.js";
import mysql from 'mysql2/promise';
import { fetchBlock } from "../Queries/blockQuery.js";
import { fetchVotes } from "../Queries/votesQuery.js";
import { fetchPool } from "../Queries/fetchPool.js";
import { fetchValidators } from "../Queries/validatorsQuery.js";

export async function saveProposalsToDatabase(data) {
    const connection = await mysql.createConnection(dbConfig);
    // Loop through the proposals and insert them into the database
    const [proposals, fields] = await connection.execute(
      'SELECT proposal_id FROM Proposal ORDER BY proposal_id'
    );
   
    for (const proposal of data.proposals) {
      
      if (proposal.status == 'PROPOSAL_STATUS_VOTING_PERIOD') {
        console.log(`Proposal ${proposal.id} is still in voting`);
        continue;
      }
      const submitTime = new Date(proposal.voting_end_time).toISOString().slice(0, 19).replace('T', ' ')
      try {
        // Insert proposal data into the 'Proposal' table
        await connection.execute(
          'INSERT INTO Proposal (proposal_id, chain_id, time, status, yes_votes, no_votes, no_with_veto_votes, abstain_votes, info, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            proposal.id, 
            1, 
            submitTime,
            proposal.status,
            proposal.final_tally_result.yes_count,
            proposal.final_tally_result.no_count,
            proposal.final_tally_result.no_with_veto_count,
            proposal.final_tally_result.abstain_count, 
            proposal.summary,
            proposal.title
          ]
        );
        console.log(`Added Data for proposal ${proposal.title}`);
      } catch (error) {
        console.error('Error inserting proposal into the database:', error.message);
      }
    }
  
    // Close the database connection
    await connection.end();
  }

  export async function updateBlockHeights(urlBlocks, startBlock, latestBlock, urlProps, urlVals) {
    const connection = await mysql.createConnection(dbConfig);
    try {
      // Get the proposals sorted by submit time
      const [proposals, fields] = await connection.execute(
        'SELECT proposal_id, time, block_height FROM Proposal ORDER BY time'
      );
      const startBlockTime = new Date(await fetchBlock(urlBlocks, startBlock)).toISOString().slice(0, 19).replace('T', ' ');
      console.log(startBlockTime);
      let blockIndex = startBlock; // Starting index in the blocks array
      // Iterate through each proposal and update the block height if not present
      for (const proposal of proposals) {
        // Skip if block_height is already present for this proposal
        if (new Date (startBlockTime) > proposal.time || Number(proposal.block_height) > latestBlock) {
          console.log(`No data for Proposal ${proposal.proposal_id}.`);
          continue;
        }
        if (proposal.block_height !== null) {
          console.log(`Proposal ${proposal.proposal_id} already has a block_height value. Skipping.`);
          continue;
        }
        // Iterate through all blocks starting from the last block index
        const findProposalInBlocks = async (increment) => {
          for (let i = blockIndex; i <= latestBlock; i += increment) {
            const blockTime = new Date(await fetchBlock(urlBlocks, i)).toISOString().slice(0, 19).replace('T', ' ');
        
            if (new Date(blockTime) >= proposal.time) {
              
              if (increment === 1) {
                await connection.execute(
                  'UPDATE Proposal SET block_height = ? WHERE proposal_id = ?',
                  [i - 1, proposal.proposal_id]
                );
                
                console.log(`Added block_height ${i - 1} to Proposal ${proposal.proposal_id}`);
                await fetchVotes(urlProps, proposal.proposal_id, i - 1)
                await fetchPool(proposal.proposal_id, i - 1);
                await fetchValidators(urlVals, proposal.proposal_id, i - 1)
                break;
              }
              blockIndex = i - increment;
              return;
            }
          }
        };
        
        const increments = [1000000, 100000, 10000, 1000, 100, 10, 1];
        
        for (const increment of increments) {
          await findProposalInBlocks(increment);
        }
      }

      console.log('Block heights updated for all proposals.');
    } catch (error) {
      console.error('Error updating block heights:', error.message);
    } finally {
      // Close the database connection
      await connection.end();
    }
  }