export const fetchVotes = async (urlProbs, propNumber, atHeight) => {
    try {
        const response = await fetch(urlProbs + `/${propNumber}/votes` + '?pagination.limit=1000000', {
          method: 'GET',
          headers: {
            'x-cosmos-block-height': atHeight,
            'accept': 'application/json',
          },
        });

        const data = await response.json();
        //return data;
        await usersToDb(data);
        await userVotesToDb(data, propNumber);
    } catch (error) {
      console.error('Error:', error);
    }
  }