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

export const callGeminiApi = async (
  base64Image: string,
  dictionaryOfVars: any
) => {
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
        assign: {
          type: SchemaType.BOOLEAN,
          description: "If the expression involves assignment of variables",
          nullable: true,
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
    You have been given an image with some mathematical expressions, equations, or graphical problems. You need to solve them. Solve them using BODMAS. The following cases apply:
    1. Simple mathematical expressions (like 2 + 2, 3 * 4) - solve and return a single result.
    2. Set of Equations like x^2 + 2x + 1 = 0, 3y + 4x = 0, 5x^2 + 6y + 7 = 12, etc.: In this case, solve for all the given variable, and the format should be a COMMA SEPARATED LIST OF DICTS,
     with dict 1 as {{'expr': 'x', 'result': 2, 'assign': True}} and dict 2 as {{'expr': 'y', 'result': 5, 'assign': True}}. This example assumes x was calculated as 2, 
     and y as 5. Include as many dicts as there are variables. Also consider sign
    3. Assigning values to variables like x = 4, y = 5, z = 6, etc.: In this case, assign values to variables and return another key in the dict called {{'assign': True}},
     keeping the variable as 'expr' and the value as 'result' in the original dictionary. RETURN AS A LIST OF DICTS. Also consider sign.
    4. Graphical math problems (car collisions, Pythagorean theorem) - solve and return the result.
    5. Abstract concepts (love, war, etc.) in drawings - interpret and return the concept.
    Make sure to use the correct variable values from the dictionary if they are provided: ${JSON.stringify(
      dictionaryOfVars
    )}.
    Solve the expression and return the result in the proper JSON format.`;

  const imagePart = base64ToGenerativePart(base64Image, "image/png");
  const result = await model.generateContent([prompt, imagePart]);
  return result.response.text();
};
