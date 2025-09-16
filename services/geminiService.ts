import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from '../constants';
// FIX: Added LinkedInTipsData to imports to support getLinkedInTips function.
import { UserProfile, SalaryInsightsData, ResumeScoreData, Job, Skill, BrainyScoutJob, PlacementPlanData, ProcessedResume, InterviewQuestionWithAnswer, ActionItem, LinkedInHeadlineData, LinkedInTipsData } from '../types';
import { extractTextFromResume } from './resumeService';

// This function acts as the single point of contact for all Gemini API calls,
// routing them through our secure Netlify proxy function. This prevents exposing
// the API key on the client-side.
const callGeminiProxy = async (payload: { model: string; contents: any; config?: any; }): Promise<{ text: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25-second timeout

    // Standardize the 'contents' payload to match the format that is confirmed to work.
    // The user's manual test proved that the proxy works when 'contents' is a structured array.
    // This ensures all calls from the app now use this correct, robust format.
    const structuredContents = typeof payload.contents === 'string'
        ? [{ role: 'user', parts: [{ text: payload.contents }] }]
        : payload.contents;

    try {
        // Use the direct function URL that was proven to work, bypassing the unreliable redirect.
        const response = await fetch('/.netlify/functions/gemini-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: payload.model,
                contents: structuredContents,
                // Use a different key to avoid conflicts on the server.
                generationConfig: payload.config || {} 
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'The AI service is currently unavailable.' }));
            throw new Error(errorData.error || `AI service returned an error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('The request to the AI service timed out. Please try again.');
        }
        throw error;
    }
};

const handleGeminiError = (error: unknown, context: string): Error => {
    console.error(`Error during ${context}:`, error);
    if (error instanceof Error) {
        return new Error(`An error occurred during ${context}: ${error.message}`);
    }
    return new Error(`An unexpected error occurred during ${context}.`);
};

const cleanAndParseJson = <T>(rawText: string): T => {
    if (!rawText || typeof rawText !== 'string') {
        throw new Error("Invalid input from AI: Expected a non-empty string.");
    }
    const jsonStart = rawText.indexOf('{');
    const arrayStart = rawText.indexOf('[');
    let start = -1;
    if (jsonStart === -1) start = arrayStart;
    else if (arrayStart === -1) start = jsonStart;
    else start = Math.min(jsonStart, arrayStart);
    if (start === -1) throw new Error("No JSON object or array found in the AI's response.");
    const jsonEnd = rawText.lastIndexOf('}');
    const arrayEnd = rawText.lastIndexOf(']');
    const end = Math.max(jsonEnd, arrayEnd);
    if (end === -1) throw new Error("AI's JSON response is not properly terminated.");
    const jsonString = rawText.substring(start, end + 1);
    try {
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.error("Failed to parse cleaned JSON from AI:", jsonString);
        if (e instanceof Error) throw new Error(`Error parsing AI's JSON response: ${e.message}`);
        throw new Error("An unknown JSON parsing error occurred from the AI's response.");
    }
};

// Use the secure proxy for JSON content generation
const generateJsonContent = async <T>(prompt: string, context: string): Promise<T> => {
    try {
        const response = await callGeminiProxy({
            model: GEMINI_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const content = response.text;
        return cleanAndParseJson<T>(content);
    } catch (error) {
        throw handleGeminiError(error, context);
    }
};

// Use the secure proxy for text content generation
const generateTextContent = async (prompt: string, context: string): Promise<string> => {
    try {
        const response = await callGeminiProxy({
            model: GEMINI_MODEL,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        throw handleGeminiError(error, context);
    }
};


export const processResumeFile = async (file: File, onProgress?: (step: number) => void): Promise<ProcessedResume> => {
    try {
        onProgress?.(0); // Step 0: Reading your resume file...
        const resumeText = await extractTextFromResume(file);
        if (!resumeText.trim()) {
            throw new Error("Could not extract any text from the resume.");
        }

        onProgress?.(1); // Step 1: Analyzing skills and experience...
        const prompt = `Analyze the following resume text and perform two tasks:
      1. Identify the user's most recent location (e.g., 'San Francisco, USA'). If no location is found, return the exact string "NOT_FOUND".
      2. Calculate the total years of professional work experience. If it cannot be determined, default to 3.
      
      Return a single JSON object with the keys: "location", and "yearsOfExperience".
      
      --- RESUME TEXT ---
      ${resumeText.substring(0, 8000)}
      --- END RESUME TEXT ---`;
      
      const structuredData = await generateJsonContent<{ location: string; yearsOfExperience: number; }>(prompt, "resume analysis");

      return {
          resumeText: resumeText,
          location: structuredData.location,
          yearsOfExperience: structuredData.yearsOfExperience,
      };
    } catch (e) {
        throw handleGeminiError(e, "resume processing");
    }
};

const getCountryCodeFromLocation = (location: string): string => {
    if (!location || location.toLowerCase().includes('a major city')) return 'us';
    const parts = location.split(',');
    const countryPart = parts[parts.length - 1].trim().toLowerCase();
    const canadianProvinces = ['on', 'qc', 'bc', 'ab', 'mb', 'sk', 'ns', 'nb', 'nl', 'pe', 'nt', 'nu', 'yt'];
    if (canadianProvinces.includes(countryPart)) return 'ca';
    const usStates = ['al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy'];
    if (usStates.includes(countryPart)) return 'us';
    switch (countryPart) {
        case 'usa': case 'united states': return 'us';
        case 'canada': return 'ca';
        case 'india': return 'in';
        case 'united kingdom': case 'uk': return 'gb';
        default: return countryPart.length === 2 ? countryPart : 'us';
    }
};

const getCurrencyAndCountryInfo = (location: string) => {
    const lowerLocation = location.toLowerCase();
    if (lowerLocation.includes('india') || lowerLocation.endsWith(' in')) return { currency: 'INR', term: 'annual CTC' };
    if (lowerLocation.includes('canada') || lowerLocation.endsWith(' ca')) return { currency: 'CAD', term: 'annual salary' };
    if (lowerLocation.includes('united kingdom') || lowerLocation.includes(' uk') || lowerLocation.endsWith(' gb')) return { currency: 'GBP', term: 'annual salary' };
    return { currency: 'USD', term: 'annual salary' };
};

export const getSalaryInsights = async (jobTitle: string, location: string, yearsOfExperience: number): Promise<SalaryInsightsData> => {
    const { currency, term } = getCurrencyAndCountryInfo(location);
    const prompt = `Provide a detailed salary band for a ${jobTitle} in ${location} with exactly ${yearsOfExperience} years of experience. The response must be a single JSON object. The salary figures should be NUMBERS ONLY, representing the typical ${term} in ${currency}. Do not include currency symbols or commas in the numbers. The JSON object should have the following keys: "lowerRange" (string), "average" (string), "upperRange" (string), "keySkills" (array of 5-7 strings), "industries" (array of 3-5 strings).`;
    return generateJsonContent<SalaryInsightsData>(prompt, "salary insights fetching");
};

export const getRelevantSkills = async (jobTitle: string): Promise<string[]> => {
    const prompt = `List 12 to 15 of the most important technical and soft skills for a ${jobTitle}. Return a JSON array of strings.`;
    return generateJsonContent<string[]>(prompt, "fetching relevant skills");
};

export const rewriteResumeSummary = async (currentSummary: string, jobTitle: string): Promise<string> => {
    const prompt = `Rewrite this resume summary to be more impactful for a ${jobTitle} role. Focus on quantifiable achievements and action verbs. Keep it to 2-3 sentences. Current summary: "${currentSummary}"`;
    return generateTextContent(prompt, "rewriting resume summary");
};

export const getLinkedInHeadline = async (jobTitle: string, resumeText: string): Promise<LinkedInHeadlineData> => {
    const prompt = `Generate an optimized LinkedIn headline for a professional with the title "${jobTitle}". Use the provided resume text to extract a real, quantifiable achievement.

  **Instructions:**
  1.  **Headline:** Create a headline that follows the format: [Role] | [Key Skill 1], [Skill 2] | [Industry] | [Key Achievement].
  2.  **Headline Score:** Provide a score for the generated headline from 0 to 100, and a concise, one-sentence explanation for why the score is high.
  
  **Output Format:**
  You MUST return a single, valid JSON object with exactly three keys: "headline" (string), "score" (number), and "scoreExplanation" (string). Do not include any text outside the JSON object.
  
  --- RESUME FOR CONTEXT ---
  ${resumeText.substring(0, 4000)}
  --- END RESUME ---`;
    return generateJsonContent<LinkedInHeadlineData>(prompt, "generating LinkedIn headline");
};

export const getLinkedInAbout = async (jobTitle: string, resumeText: string): Promise<string> => {
    const prompt = `Generate an optimized LinkedIn "About" section for a professional with the title "${jobTitle}". Use the provided resume text for context on achievements and skills.

  **Instructions:**
  1. Create a three-paragraph summary.
  2. Start with a compelling hook.
  3. The second paragraph should tell a brief story with 2-3 achievements from the resume.
  4. The final paragraph should be a call to action with contact info.
  5. The output must be a single string, with paragraphs separated by '\\n\\n'. Do not return JSON or markdown.
  
  --- RESUME FOR CONTEXT ---
  ${resumeText.substring(0, 4000)}
  --- END RESUME ---`;
    return generateTextContent(prompt, "generating LinkedIn about section");
};

export const optimizeBulletPoint = async (bulletPoint: string, jobDescription: string): Promise<string[]> => {
    const prompt = `As an expert resume writer, rewrite the following bullet point to be more impactful for a job description. Focus on using the STAR method (Situation, Task, Action, Result) and incorporating quantifiable achievements. Align the language with the provided job description. Return 2-3 distinct suggestions in a JSON array of strings. Original Bullet Point: "${bulletPoint}" Relevant Job Description context: "${jobDescription.substring(0, 1000)}"`;
    return generateJsonContent<string[]>(prompt, "optimizing bullet point");
};

export const generateCoverLetter = async (resumeText: string, jobDescription: string): Promise<string> => {
    const prompt = `As an expert career coach, write a professional and compelling cover letter. Use the provided resume to highlight the candidate's relevant skills and experience. Tailor the tone and content specifically for the target job description. The cover letter should be concise, about 3-4 paragraphs long, and ready to be sent. Do not use markdown. --- RESUME --- ${resumeText.substring(0, 4000)} --- JOB DESCRIPTION --- ${jobDescription.substring(0, 4000)}`;
    return generateTextContent(prompt, "generating cover letter");
};

export const generatePlacementPlan = async (resumeText: string | null, jobTitle: string, yearsOfExperience: number, skills: Skill[]): Promise<PlacementPlanData> => {
    const ratedSkills = skills.map(s => `${s.name} (self-rated ${s.rating}/10)`).join(', ');
    const prompt = `As an expert career coach, create a personalized Placement Plan for a user with ${yearsOfExperience} years of experience applying for a "${jobTitle}" role. Analyze their self-assessed skill ratings. ${resumeText ? "Also analyze their provided resume to identify strengths and weaknesses." : "Since no resume was provided, base the plan primarily on their self-assessed skills for the target role."} The user's self-assessed skills are: ${ratedSkills}. Based on all this information, generate two components: 1. A SWOT Analysis: Identify their Strengths, Weaknesses, Opportunities, and Threats in the context of their job search. Provide 3-4 bullet points for each category. 2. An Action Plan: Create a list of 5-7 actionable steps. The list must be prioritized based on what is most critical for a "${jobTitle}" role. For skills with similar importance, prioritize the one with the lower self-rated score. Each action item must have: 'priority': ('High', 'Medium', or 'Low'), 'action': A concise description of the task, 'timeline': A realistic completion timeline (e.g., "Next 2 weeks"). Base this on the user's skill rating; a lower rating for a skill should have a more intensive or longer timeline, 'skillRating' (optional): The original self-rated skill score (e.g., 3) if the action is tied to improving a specific skill, 'courseName' (optional): If the action involves upskilling, suggest a relevant online course (e.g., "Advanced SAP FICO Certification"). For actions related to resume building or interview practice, the 'courseName' should be 'Resume & Interview Practice Tool'. 'courseUrl' (optional): For general upskilling courses, use the URL 'https://brainyscout.com/our-courses'. For resume and interview practice actions, the URL MUST be 'https://resumegen.io/'. Return a single JSON object with the keys "swot" and "actionPlan". ${resumeText ? `--- USER RESUME ---\n${resumeText.substring(0, 5000)}` : ''}`;
    return generateJsonContent<PlacementPlanData>(prompt, "generating placement plan");
};

export const getInterviewQuestionsWithAnswers = async (resumeText: string, jobDescription: string): Promise<InterviewQuestionWithAnswer[]> => {
    const prompt = `As an expert career coach and hiring manager, generate 5 interview questions based on the provided resume and target job description. For each question, craft a concise and powerful sample answer from the candidate's perspective. Guidelines for the answers: 1. Use the STAR method (Situation, Task, Action, Result) where applicable, especially for behavioral questions. 2. IMPORTANT FORMATTING: When using the STAR method, start each component on a new line for clarity. For example: S: [The situation] T: [The task] A: [The action] R: [The result]. 3. Incorporate specific skills, experiences, and achievements mentioned in the resume. 4. Tailor the answer to align with the requirements and keywords in the job description. 5. Keep each answer under 250 words. 6. The tone should be professional, confident, and authentic. Return a valid JSON array of 5 objects, where each object has two keys: "question" (string) and "suggestedAnswer" (string). --- RESUME TEXT --- ${resumeText.substring(0, 4000)} --- JOB DESCRIPTION --- ${jobDescription.substring(0, 4000)}`;
    return generateJsonContent<InterviewQuestionWithAnswer[]>(prompt, "generating interview questions");
};

export const scoreResumeWithAI = async (resumeText: string, jobDescription: string): Promise<ResumeScoreData> => {
    const prompt = `Act as an expert Applicant Tracking System (ATS) and a senior hiring manager. Analyze the following resume against the provided job description and return a detailed score breakdown. The analysis must include: 1. An "overallScore" from 0 to 100. 2. A "breakdown" array of objects, each with: "metric": The name of the scoring category (e.g., "Keyword Alignment", "Skill & Experience Relevance", "Impact & Achievements", "ATS Compatibility"), "score": A score from 0 to 100 for that metric, "explanation": A concise, one-sentence explanation of the score, providing one actionable tip for improvement if the score is below 85. 3. For the "Keyword Alignment" metric ONLY, also provide two arrays: "matchedKeywords": An array of 5-10 important keywords from the job description that were found in the resume, "missingKeywords": An array of 5-10 of the most critical keywords from the job description that were NOT found in the resume. Return a single, valid JSON object with the keys "overallScore" and "breakdown". --- RESUME TEXT --- ${resumeText.substring(0, 4000)} --- JOB DESCRIPTION --- ${jobDescription.substring(0, 4000)}`;
    return generateJsonContent<ResumeScoreData>(prompt, "scoring resume");
};

export const findJobs = async (jobTitle: string, location: string, fetchLatest: boolean = false): Promise<Job[]> => {
    const countryCode = getCountryCodeFromLocation(location);
    const encodedTitle = encodeURIComponent(jobTitle);
    const maxDaysOld = fetchLatest ? 1 : 7;
    
    // Per user request, this calls the BrainyScout API directly from the browser.
    // Note: This may be blocked by the browser's CORS policy if the API is not configured for public access.
    const apiUrl = `https://brainyscout.com/Jobs/FetchAndSaveJobs?title=${encodedTitle}&country=${countryCode}&maxDaysOld=${maxDaysOld}&resultsPerPage=5&_t=${Date.now()}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'The job search service is temporarily unavailable.');
            console.error("Direct API error:", errorText);
            // Provide a more specific error for potential CORS issues.
            throw new Error(`The job search service is temporarily unavailable (status: ${response.status}). This may be due to a network or CORS issue.`);
        }
        
        const apiJobs: BrainyScoutJob[] = await response.json();
        
        if (!Array.isArray(apiJobs)) {
            console.error("API Error: Expected an array of jobs, but received:", apiJobs);
            return [];
        }

        return apiJobs.map(apiJob => {
            const descriptionParts = apiJob.ShortDescription.split('|');
            const company = descriptionParts.length > 1 ? descriptionParts[1].trim() : 'Company Unknown';
            const jobLocation = descriptionParts.length > 0 ? descriptionParts[0].trim() : location;
            return { title: apiJob.Title, company: company, location: jobLocation, uri: apiJob.SourceURL };
        });
    } catch (error) {
        console.error("Error fetching jobs directly:", error);
        // Add a more helpful message to the user, hinting at CORS.
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             throw new Error(`We're having trouble fetching job listings. This might be a network issue or a browser security policy (CORS) preventing the connection. Please check your network and try again.`);
        }
        throw new Error(`We're having trouble fetching job listings right now. This could be a temporary issue with our job provider. Please try again in a few moments.`);
    }
};

export async function getChatResponse(
    message: string, 
    profile: UserProfile
): Promise<{ text: string; videoUrl?: string; }> {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("networking") || lowerMessage.includes("referral")) {
         return { 
            text: "Here is a quick tip from Rajinder on networking:", 
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" 
         };
    }
    
    const response = await fetch('/career_data.md');
    const careerData = await response.text();
    const systemPrompt = `You are a friendly and professional AI Career Coach, operating under the guidance of career expert Rajinder Kumar. Your primary knowledge base is the content from his webinar script provided below. When a user asks a question, you must first synthesize an answer based on the principles and strategies outlined in this script. Read the user's question, analyze the provided text, and formulate a helpful, personalized response that reflects Rajinder's coaching style. 
    
    IMPORTANT: Keep your responses short, interactive, and to the point, as if you are sending a message in a a chat. Avoid long paragraphs. Do not use markdown formatting like '**' or '*'.
    
    If the answer cannot be found in the provided text, state that the information is not covered in Rajinder's material, and then provide a general, helpful answer.
    
    Here is some context about the user you are helping:
    - Target Job Title: ${profile.jobTitle || 'Not provided'}
    - Years of Experience: ${profile.yearsOfExperience ?? 'Not provided'}
    - Resume Summary: ${profile.resumeText ? profile.resumeText.substring(0, 500) + '...' : 'Not provided'}

    --- WEBINAR SCRIPT KNOWLEDGE BASE --- 
    ${careerData} 
    --- END OF KNOWLEDGE BASE ---`;

    const config = {
        systemInstruction: systemPrompt,
    };

    try {
        // Use the secure proxy for chat responses
        const result = await callGeminiProxy({
            model: GEMINI_MODEL,
            contents: message,
            config,
        });
        return { text: result.text };
    } catch(error) {
        throw handleGeminiError(error, "chat response");
    }
};

// FIX: Added missing getLinkedInTips function to support the LinkedInTips component.
export const getLinkedInTips = async (jobTitle: string, resumeText: string): Promise<LinkedInTipsData> => {
    const [headlineData, aboutSection] = await Promise.all([
        getLinkedInHeadline(jobTitle, resumeText),
        getLinkedInAbout(jobTitle, resumeText)
    ]);

    return {
        ...headlineData,
        about: aboutSection
    };
};