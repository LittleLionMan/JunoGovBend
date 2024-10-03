import { nodeDomain } from "../dbHandlers/starter.js";
import { poolToDb } from "../dbHandlers/poolToDb.js";

export const fetchPool = async (propNumber, atHeight) => {
    try {
        const response = await fetch(nodeDomain + '/cosmos/staking/v1beta1/pool', {
          method: 'GET',
          headers: {
            'x-cosmos-block-height': atHeight, //x-cosmos-block-height height
            'accept': 'application/json',
          },
        });

        const data = await response.json();
        await poolToDb(propNumber, data.pool.bonded_tokens, data.pool.not_bonded_tokens)
    } catch (error) {
      console.error('Error:', error);
    }
  }