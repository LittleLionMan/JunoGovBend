
const fetchValidatorsTest = async () => {
      try {
        
          //let atHeight = 116983; //proposal.block_height116983 Replace with the desired height
          //let propNumber = proposal.proposal_id; //proposal.proposal_id 1 Replace with the proposal number
          const response = await fetch('https://lcd-archive.junonetwork.io/cosmos/tx/v1beta1/txs?pagination.offset=0&pagination.limit=100&events=message.action=%27/cosmos.gov.v1beta1.MsgVote%27&events=message.sender=%27juno1t8ehvswxjfn3ejzkjtntcyrqwvmvuknzy3ajxy%27', {
            method: 'GET',
            headers: {
              //'height': atHeight, //x-cosmos-block-height
              'accept': 'application/json',
            },
          });
          const json = await response.json();
          console.log(json.txs.length);
          console.log(json.txs);
          
      } catch (error) {
        console.error('Error:', error);
      }
}

fetchValidatorsTest();