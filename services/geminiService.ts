
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const API_KEY = process.env.API_KEY || "";

export const sendMessageToGemini = async (
  history: Message[],
  onChunk: (chunk: string) => void
) => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please ensure it is configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Format history for the API
  const contents = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  try {
    const streamResponse = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: "You are AlphaChat AI, a highly intelligent and helpful assistant. You provide concise, accurate, and professional answers. Use markdown formatting for readability when appropriate (bolding, lists, code blocks). If asked about your origin, you are built by the senior engineering team using Gemini technology.",
        temperature: 0.7,
        topP: 0.9,
      },
    });

    let fullText = "";
    for await (const chunk of streamResponse) {
      const c = chunk as GenerateContentResponse;
      const text = c.text || "";
      fullText += text;
      onChunk(text);
    }
    
    return fullText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
