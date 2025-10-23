
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { ENV } from '../../config/env';
import { AnalysisResult } from '../../types';

const ai = new GoogleGenerativeAI(ENV.API_KEY);

export const analyzeSymptoms = async (symptoms: string): Promise<AnalysisResult> => {
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const prompt = `You are an AI medical assistant. Your role is to analyze user-provided symptoms and predict a potential disease. You must provide a brief reasoning for your prediction. Crucially, you must always include a clear disclaimer stating that you are an AI and not a medical professional, and the user should consult a doctor. 

Respond ONLY with a valid JSON object in this exact format:
{
  "predictedDisease": "The most likely disease name",
  "reasoning": "Brief explanation of why this disease is predicted",
  "disclaimer": "This AI analysis is not a substitute for professional medical advice. Please consult a healthcare professional."
}

Analyze the following symptoms and predict a possible disease. Symptoms: "${symptoms}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text().trim();
    const parsedResult = JSON.parse(jsonString);
    return parsedResult as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get analysis from AI: ${error.message}`);
    }
    throw new Error("An unknown error occurred during AI analysis.");
  }
};
