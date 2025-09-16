import { GoogleGenAI } from "@google/genai";

// This is a Netlify Function, which runs in a Node.js environment.
// It acts as a secure proxy to the Google Gemini API.
export const handler = async (event) => {
  // Only allow POST requests for security
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // FIX: Destructure 'generationConfig' from the body instead of 'config'.
    // This makes the data contract between the client and proxy explicit,
    // resolving a subtle bug where the API call was failing.
    const { model, contents, generationConfig } = JSON.parse(event.body);
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error("CRITICAL: API_KEY environment variable not set in Netlify.");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error. Please contact support.' }),
      };
    }

    if (!model || !contents) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing model or contents in request body' }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    // FIX: Use the 'generationConfig' variable as the value for the 'config' property.
    // This correctly passes the configuration to the Gemini SDK.
    const genAIResponse = await ai.models.generateContent({ model, contents, config: generationConfig });
    const text = genAIResponse.text;

    // Netlify Functions expect this specific return format
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      // Return a structured object with the text. This prevents serialization issues with the SDK's response object.
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Error in Netlify function calling Gemini API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while processing your request on the server.' }),
    };
  }
};