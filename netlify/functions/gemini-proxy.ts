import { GoogleGenAI } from "@google/genai";

// Common headers for all responses to handle CORS.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allows any domain to access the API.
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Specify allowed methods.
};

// This is a Netlify Function, which runs in a Node.js environment.
// It acts as a secure proxy to the Google Gemini API.
export const handler = async (event) => {
  // Handle the browser's preflight OPTIONS request required for CORS.
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No Content
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow POST requests for the actual API call.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders, // Include CORS headers in error responses.
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const apiKey = process.env.API_KEY;

    // --- Enhanced Logging ---
    if (apiKey && apiKey.length > 10) {
      console.log('Gemini Proxy Log: API_KEY environment variable loaded successfully. Length:', apiKey.length);
    } else {
      console.error('Gemini Proxy Log: CRITICAL - API_KEY environment variable not found or is too short in the server environment.');
    }
    // --- End Enhanced Logging ---
    
    const { model, contents, generationConfig } = JSON.parse(event.body);

    // --- START: API Key Diagnostic Check ---
    if (contents === 'ping_api_key_status') {
      let statusMessage = '';
      if (apiKey && apiKey.length > 10) {
        statusMessage = `Success: API key is configured on the server. Key length: ${apiKey.length}.`;
      } else if (apiKey) {
        statusMessage = 'Error: API key found, but it appears to be too short or invalid.';
      } else {
        statusMessage = 'Error: API_KEY environment variable was not found on the server.';
      }
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: statusMessage }),
      };
    }
    // --- END: API Key Diagnostic Check ---


    if (!apiKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Server configuration error. API key not found.' }),
      };
    }

    if (!model || !contents) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing model or contents in request body' }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const genAIResponse = await ai.models.generateContent({ model, contents, config: generationConfig });
    const text = genAIResponse.text;

    // Netlify Functions expect this specific return format
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Error in Netlify function calling Gemini API:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'An error occurred while processing your request on the server.' }),
    };
  }
};
