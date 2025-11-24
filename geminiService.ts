import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBio = async (name: string, jobTitle: string, company: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Write a short, professional, and engaging LinkedIn-style bio (max 200 characters) for a vCard.
    Name: ${name}
    Job Title: ${jobTitle}
    Company: ${company}
    
    Return ONLY the bio text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating bio:", error);
    throw error;
  }
};

export const generateEmailBody = async (topic: string, recipient: string): Promise<string> => {
    try {
      const ai = getClient();
      const prompt = `Write a professional email body based on this topic: "${topic}". 
      Recipient Name (if known, otherwise generic): ${recipient}
      Keep it concise (under 100 words). Return ONLY the body text.`;
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
  
      return response.text?.trim() || "";
    } catch (error) {
      console.error("Error generating email:", error);
      throw error;
    }
  };
  
  export const generateWifiSignText = async (ssid: string): Promise<string> => {
      try {
        const ai = getClient();
        const prompt = `Write a funny or welcoming 1-sentence slogan for a WiFi sign. The network name is "${ssid}". Return ONLY the sentence.`;
    
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
    
        return response.text?.trim() || "";
      } catch (error) {
        console.error("Error generating slogan:", error);
        throw error;
      }
    };
