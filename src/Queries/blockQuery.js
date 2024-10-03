import fetch from 'node-fetch'

export async function fetchBlock(url, height) {
    try {
    // Make the HTTP GET request using fetch
    const response = await fetch(`${url}/${height}`);

    // Check if the request was successful (status code 200)
    if (response.ok) {
        // Parse the JSON response
        const data = await response.json();
        return data.block.header.time;

        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

export async function fetchLatestBlock(url) {
    try {

    // Make the HTTP GET request using fetch
    const response = await fetch(url + '/latest');
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

    if (response.ok) {
        // Parse the JSON response
        const data = await response.json();
        
        return data.block.header.height;
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}
