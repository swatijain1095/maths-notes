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
   You have been given an image with some mathematical expressions, equations, or graphical problems, and you need to solve them. "
    Note: Use the PEMDAS rule for solving mathematical expressions. PEMDAS stands for the Priority Order: Parentheses, Exponents, Multiplication and Division (from left to right), Addition and Subtraction (from left to right). Parentheses have the highest priority, followed by Exponents, then Multiplication and Division, and lastly Addition and Subtraction. "
    YOU CAN HAVE FIVE TYPES OF EQUATIONS/EXPRESSIONS IN THIS IMAGE, AND ONLY ONE CASE SHALL APPLY EVERY TIME: "
    Following are the cases: "
    1. Simple mathematical expressions like 2 + 2, 3 * 4, 5 / 6, 7 - 8, etc.: In this case, solve and return the answer in the format of a LIST OF DICT [{'expr': given expression, 'result': calculated answer}]. "
    2. Set of Equations like x^2 + 2x + 1 = 0, 3y + 4x = 0, 5x^2 + 6y + 7 = 12, etc.: In this case, solve for the given variable, and return the answer in the format of a LIST OF DICTS, with dict 1 as {'expr': 'x', 'result': 2} and dict 2 as {'expr': 'y', 'result': 5}. This example assumes x was calculated as 2, and y as 5. Include as many dicts as there are variables. "
    3. Assigning values to variables like x = 4, y = 5, z = 6, etc. and resolving the expression like x + y + z: In this case, assign values to variables, keeping the variable as 'expr' and the value as 'result' also return the calculated answer for equations. RETURN AS A LIST OF DICTS. [{'expr': 'x', 'result': 4}, {'expr': 'y', 'result': 5}, {'expr': 'z', 'result': 6}, {'expr': 'x + y + z', 'result': 15}] "
    4. Analyzing Graphical Math problems, which are word problems represented in drawing form, such as cars colliding, trigonometric problems, problems on the Pythagorean theorem, adding runs from a cricket wagon wheel, etc. These will have a drawing representing some scenario and accompanying information with the image. You need to return the answer in the format of a LIST OF ONE DICT [{{'expr': given expression, 'result': calculated answer}}]. "
    5. Detecting Abstract Concepts that a drawing might show, such as love, hate, jealousy, patriotism, or a historic reference to war, invention, discovery, quote, etc. USE THE SAME FORMAT AS OTHERS TO RETURN THE ANSWER, where 'expr' will be the explanation of the drawing, and 'result' will be the abstract concept. "
    Analyze the equation or expression in this image and return the answer in proper JSON format according to the given rules`;

  const imagePart = base64ToGenerativePart(base64Image, "image/png");
  const result = await model.generateContent([prompt, imagePart]);
  return result.response.text();
};
