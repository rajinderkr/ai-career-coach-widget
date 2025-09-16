import { GoogleGenAI } from "@google/genai";

// Netlify serverless function
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server configuration error: API key not found." }),
      };
    }

    const { model, contents, generationConfig } = JSON.parse(event.body);

    if (!model || !contents) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing model or contents in request body." }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const genAIResponse = await ai.models.generateContent({
      model,
      contents,
      config: generationConfig,
    });

    const text = genAIResponse.text;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };
  } catch (error) {
    console.error("Error in Gemini proxy:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An error occurred while processing your request." }),
    };
  }
};
