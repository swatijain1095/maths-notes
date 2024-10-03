import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper function to convert base64 to the required image part format
function base64ToGenerativePart(base64Image: string, mimeType: string) {
  return {
    inlineData: {
      data: base64Image.split(",")[1],
      mimeType: mimeType,
    },
  };
}

export const callGeminiApi = async (
  base64Image: string,
  dictionaryOfVars: any
) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API key not found!");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Prepare the prompt and image part
  const prompt = `Analyze this image and calculate the mathematical expression. Variables: ${JSON.stringify(
    dictionaryOfVars
  )}.`;
  const imagePart = base64ToGenerativePart(base64Image, "image/png");

  // Call the generateContent API with prompt and image
  const result = await model.generateContent([prompt, imagePart]);

  return result.response.text();
};
