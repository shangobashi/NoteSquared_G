import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { LessonAIOutputs } from "../types";

// Schema definition for Gemini
const lessonResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    student_recap: {
      type: Type.STRING,
      description: "Encouraging but specific recap for the student. Max 100 words.",
    },
    practice_plan: {
      type: Type.STRING,
      description: "Markdown bullet points practice plan.",
    },
    parent_email: {
      type: Type.STRING,
      description: "Professional summary for the parent. Max 150 words.",
    },
  },
  required: ["student_recap", "practice_plan", "parent_email"],
};

export const processLessonAudio = async (
  base64Audio: string,
  mimeType: string,
  studentName: string,
  instrument: string
): Promise<LessonAIOutputs> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Contextualize the prompt with student details
  const contextualizedPrompt = `
    ${SYSTEM_PROMPT}
    
    Context Variables:
    Student Name: ${studentName}
    Instrument: ${instrument}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: contextualizedPrompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonResponseSchema,
        systemInstruction: "You are a helpful AI assistant for music teachers.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    const data = JSON.parse(text) as LessonAIOutputs;
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};