import { dbConfig } from "./config.js";
import mysql from 'mysql2/promise';
import { toBech32, fromBech32 } from '@cosmjs/encoding';
import { fetchDelegations } from "../Queries/delegationsQuery.js";
import { fetchUnbondings } from "../Queries/unbondingsQuery.js";

export async function validatorToDb(json, atHeight, propNumber) {
    const connection = await mysql.createConnection(dbConfig);

    const sumBalances = (data) => {
        return data.reduce((sum, entry) => {
          return sum + parseFloat(entry.balance);
        }, 0);
    };
    
    async function valCheck(operator_Add) {
        const [vals, fields] = await connection.execute(
            'SELECT validator_id FROM Validator WHERE operator_addr = ?',
            [operator_Add]
        );
        if (vals.length > 0) {
            return vals[0].validator_id; // Return the validator_id from the first row if it exists
        } else {
            return null; // Return null if no matching validator is found
        }
    }

    async function stakeExists(validatorId, propNumber) {
        const [rows, fields] = await connection.execute(
            'SELECT vote_id FROM ValidatorVote WHERE validator_id = ? AND proposal_id = ?',
            [validatorId, propNumber]
        );
        return rows.length > 0;
    }

    async function delegationExists(vote_id, validator_id, bonded) {
        const [rows, fields] = await connection.execute(
            'SELECT delegation_id FROM Delegation WHERE vote_id = ? AND validator_id = ? AND bonded = ?',
            [vote_id, validator_id, bonded]
        );
        return rows.length > 0;
    }

    async function insertValidator(validator) {
        // Extract necessary information from the validator object
        const { prefix, data } = fromBech32(validator.operator_address);
        const address = toBech32(prefix.split('valoper')[0], data);
        const user_id = await getUserId(address);

        // Insert the validator into the database
        await connection.execute(
            'INSERT INTO Validator (name, info, website, commission, operator_addr, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [validator.description.moniker, validator.description.details, validator.description.website, validator.commission.commission_rates.rate * 100, validator.operator_address, user_id]
        );
    }

    async function updateValidator(validator) {
        // Update the validator in the database
        await connection.execute(
            'UPDATE Validator SET name = ?, info = ?, website = ?, commission = ? WHERE operator_addr = ?',
            [validator.description.moniker, validator.description.details, validator.description.website, validator.commission.commission_rates.rate * 100, validator.operator_address]
        );
    }

    async function getUserId(address) {
        const [users, fields] = await connection.execute(
            'SELECT user_id FROM User WHERE wallet_addr = ?',
            [address]
        );
        if (users.length > 0) {
            return users[0].user_id;
        } else {
            return null; // Or handle this case according to your application's logic
        }
    }

    async function getValId(address) {
        const [vals, fields] = await connection.execute(
            'SELECT validator_id FROM Validator WHERE operator_addr = ?',
            [address]
        );
        if (vals.length > 0) {
            return vals[0].validator_id;
        } else {
            console.log(`No user found with wallet address ${address}`);
            return null; // Or handle this case according to your application's logic
        }
    }

    async function insertStake(validator) {
        // Insert the validator into the database
        const validatorId = await valCheck(validator.operator_address);
        const exists = await stakeExists(validatorId, propNumber);
            if (!exists) {
                await connection.execute(
                    'INSERT INTO ValidatorVote (validator_id, proposal_id, stake) VALUES (?, ?, ?)',
                    [validatorId, propNumber, validator.tokens]
                );
                console.log(`Added Stake for ${validatorId} on prop ${propNumber}`)
            } else {
                //console.log('Stake was already saved')
            };
    }

    async function insertDelegation(vote_id, validator_id, stake, bonded) {
        // Insert the validator into the database
                await connection.execute(
                    'INSERT INTO Delegation (vote_id, validator_id, delegated_amount, bonded) VALUES (?, ?, ?, ?)',
                    [vote_id, validator_id, stake, bonded]
                );
    }
    
    async function prepareDelegations(validator, propNumber, atHeight) {
        const response = await fetchDelegations(validator.operator_address, atHeight);
        let counter1 = 0;
        let counter2 = 0;
        const validator_id = await getValId(validator.operator_address);
        for (const delegation of response.delegation_responses) {
            try {
                    const user_id = await getUserId(delegation.delegation.delegator_address);
                    if (user_id === null) {
                        continue;
                    }
                    const vote_id = await getVoteId(propNumber, user_id);
                    if (vote_id === null) {
                        continue;
                    }
                    
                        const exists = await delegationExists(vote_id, validator_id, 1);
                        if (exists) {
                            console.log(`Delegation already added for ${validator.description.moniker}`);
                            break;
                            counter2++
                        } else {
                            await insertDelegation(vote_id, validator_id, delegation.balance.amount, 1);
                            counter1++
                        }
                    
                
            } catch (error) {
                console.error('Error processing Delegations:', error.message);
            }
        }
        if (counter2 > 0) {
            console.log(`${counter2} delegations already existed for ${validator.description.moniker}`)
        }
        if (counter1 > 0) {
            console.log(`Saved ${counter1} delegations to ${validator.description.moniker}`); 
        }  
    }

    async function prepareUnbondings(validator, propNumber, atHeight) {
        const response = await fetchUnbondings(validator.operator_address, atHeight);
        let counter1 = 0;
        let counter2 = 0;
        const validator_id = await getValId(validator.operator_address);
        for (const unbonding of response.unbonding_responses) {
            try {
                    const user_id = await getUserId(unbonding.delegator_address);
                    if (user_id === null) {
                        continue;
                    }
                    const vote_id = await getVoteId(propNumber, user_id);
                    if (vote_id === null) {
                        continue;
                    }
                    
                        const exists = await delegationExists(vote_id, validator_id, 0);
                        if (exists) {
                            console.log(`Unbondings already added for ${validator.description.moniker}`);
                            break;
                            counter2++
                        } else {
                            const totalUnbonding = sumBalances(unbonding.entries);
                            await insertDelegation(vote_id, validator_id, totalUnbonding, 0);
                            counter1++
                        }
                    
                
            } catch (error) {
                console.error('Error processing Unbondings:', error.message);
            }
        }
        if (counter2 > 0) {
            console.log(`${counter2} unbondings already existed for ${validator.description.moniker}`)
        }
        if (counter1 > 0) {
            console.log(`Saved ${counter1} unbondings from ${validator.description.moniker}`); 
        }  
    }

    async function getVoteId(propNumber, address) {
        const [votes, fields] = await connection.execute(
            'SELECT vote_id FROM UserVote WHERE proposal_id = ? AND user_id = ? ',
            [propNumber, address]
        );
        if (votes.length > 0) {
            return votes[0].vote_id;
        } else {
            return null; // Or handle this case according to your application's logic
        }
    }

    let counterI = 0; 
    let counterU = 0;
    for (const validator of json.validators) {
        try {
            if (validator.status === "BOND_STATUS_BONDED") {
                const validatorId = await valCheck(validator.operator_address);
                if (validatorId === null) {
                    await insertValidator(validator);
                    counterI++
                } else {
                    await updateValidator(validator);
                    counterU++
                }
                await insertStake(validator, propNumber);
                await prepareDelegations(validator, propNumber, atHeight);  
                await prepareUnbondings(validator, propNumber, atHeight); 
            }
        } catch (error) {
            console.error('Error processing validator:', error.message);
        }
    }
    
    console.log(`Added ${counterI} and updated ${counterU} Validators` + ' ' + new Date());
    
    await connection.end();
}
