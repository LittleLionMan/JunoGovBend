import fetch from 'node-fetch'
import { saveProposalsToDatabase } from '../dbHandlers/proposalsToDb.js';

// Function to make the HTTP request and log the result


    export async function fetchProposals(url) {
        try {
        // Make the HTTP GET request using fetch
        const response = await fetch(url + '?pagination.limit=10000');

        // Check if the request was successful (status code 200)
        if (response.ok) {
            // Parse the JSON response
            const data = await response.json();
            saveProposalsToDatabase(data);

            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }


// Check if there is exactly one command-line argument
if (process.argv.length > 4) {
    console.error('Please do not provide more than two arguments.');
    process.exit(1); // Exit with an error code
  }
 
if (process.argv.length == 3) {
    const id = process.argv[2]
    async function fetchProposal() {
        try {
        // Make the HTTP GET request using fetch
        const response = await fetch(url + id);

        // Check if the request was successful (status code 200)
        if (response.ok) {
            // Parse the JSON response
            const data = await response.json();

            // Log the result to the console
            console.log('Response:', data);
            } else {
            console.error('Error:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    fetchProposal();
    //fetchVotes(url, id);
}