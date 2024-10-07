import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Helper function to convert base64 to the required image part format
function base64ToGenerativePart(base64Image: string, mimeType: string) {
  return {
    inlineData: {
      data: base64Image.split(",")[1],
      mimeType: mimeType,
    },
  };
}

export const callGeminiApi = async (base64Image: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API key not found!");
  }

  // Schema for the expected JSON response
  const schema = {
    description: "Math expression solver and variable assignment handler",
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        expr: {
          type: SchemaType.STRING,
          description: "Mathematical expression or problem statement",
          nullable: false,
        },
        result: {
          type: SchemaType.STRING,
          description: "Result of the solved mathematical expression",
          nullable: false,
        },
      },
      required: ["expr", "result"],
    },
  };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const prompt = `
    You have been given an image with some variable assignments, mathematical expressions, equations, or graphical problems. You need to solve them. Solve them using BODMAS. The following cases apply:
    1. Simple mathematical expressions (like 2 + 2, 3 * 4) - solve and return a single result following the schema like {{'expr': '2 + 2', 'result': '4'}}, and so on.
    2. Set of Equations like 2x + 10y = 5, 5x + 15y = 10, x = , y = etc.: In this case, solve for all the given variable, and the follow schema to give response in LIST OF DICTS,
     with dict 1 as {{'expr': '2x + 10y', 'result': "5"}}, dict 2 as {{'expr': '5x + 15y', 'result': "10"}}, dict 3 as {{'expr': 'x', 'result': '1.25'}} and dict 4 as {{'expr': 'y', 'result': '0.25'}}.
    3. Assigning values to variables like x = 4, y = 5, z = 6, etc.: In this case, assign values to variables and return as dicts, with the variable as 'expr' and the value as 'result'. RETURN AS A LIST OF DICTS.
    4. CONSIDER NEGATIVE AND ZERO VALUES AS WELL IN YOUR EXPRESSION, like for expression 2 - 2, 0 - 3, x = -5, 2 + x. answers should be in LIST OF DICTS like below :
     {{'expr': '2 - 2', 'result': '0'}}, {{'expr': '0 - 3', 'result': '-3'}}, {{'expr': 'x', 'result': '-5'}}, {{'expr': '2 + x', 'result': '-3'}}, etc.
    5. Graphical math problems (car collisions, Pythagorean theorem) - solve and return the result.
    6. Abstract concepts (love, war, etc.) in drawings - interpret and return the concept.
    Solve the expression and return the result in the proper JSON format.`;

  const imagePart = base64ToGenerativePart(base64Image, "image/png");
  const result = await model.generateContent([prompt, imagePart]);
  return result.response.text();
};
