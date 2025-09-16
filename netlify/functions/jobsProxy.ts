// This is a Netlify Function, which runs in a Node.js environment.
// It acts as a secure proxy to the BrainyScout Jobs API.
export const handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const params = event.queryStringParameters;
    if (!params) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Query parameters are missing.' }),
        };
    }

    const { title, country, fetchLatest, _t } = params;

    if (!title || !country) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing title or country parameters' }),
      };
    }
    
    // Use the fetchLatest flag to determine the age of job postings.
    const maxDaysOld = fetchLatest === 'true' ? 1 : 7;
    const encodedTitle = encodeURIComponent(title);

    // Add cache-busting parameter to the final API call as requested.
    const apiUrl = `https://brainyscout.com/Jobs/FetchAndSaveJobs?title=${encodedTitle}&country=${country}&maxDaysOld=${maxDaysOld}&resultsPerPage=5&_t=${_t || Date.now()}`;

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`BrainyScout API error: ${response.status}`, errorText);
        return {
            statusCode: response.status,
            body: JSON.stringify({ error: `Failed to fetch jobs from BrainyScout API. Status: ${response.status}` })
        };
    }
    
    const jobsData = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobsData),
    };

  } catch (error) {
    console.error('Error in Netlify jobs-proxy function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while processing your request on the server.' }),
    };
  }
};