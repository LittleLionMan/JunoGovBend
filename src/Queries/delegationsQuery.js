import { nodeDomain } from "../dbHandlers/starter.js";

export const fetchDelegations = async (operator_addr, atHeight) => {
    try {
        const response = await fetch(nodeDomain + `/cosmos/staking/v1beta1/validators/${operator_addr}/delegations?pagination.limit=100000000`, {
          method: 'GET',
          headers: {
            'x-cosmos-block-height': atHeight, //x-cosmos-block-height height
            'accept': 'application/json',
          },
        });
        const json = await response.json();
        return json;
    } catch (error) {
      console.error('Error:', error);
    }
  }