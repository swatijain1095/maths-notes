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
    1. Simple mathematical expressions like 2 + 2, 3 * 4, 5 / 6, 7 - 8, etc.: Solve and return the answer in the format of a LIST OF DICT [{'expr': given expression, 'result': calculated answer}]. "
    2. Set of Equations like x^2 + 2x + 1 = 0, 3y + 4x = 0, 5x^2 + 6y + 7 = 12, etc.: Solve for the given variables, and return the answer as a LIST OF DICTS with one dict for each variable.  For example: [{"expr": "x", "result": 2}, {"expr": "y", "result": 5}]. This example assumes x was calculated as 2, and y as 5. "
    3. Assigning values to variables like x = 4, y = 5, z = 6, etc.: Assign values to variables and return as a LIST OF DICTS. For example: [{"expr": "x", "result": 4}, {"expr": "y", "result": 5}, {"expr": "z", "result": 6}]
    4. Analyzing Graphical Math problems, which are word problems represented in drawing form, such as cars colliding, trigonometric problems, problems on the Pythagorean theorem, adding runs from a cricket wagon wheel, etc.: These will have a drawing representing some scenario and accompanying information with the image. Return the answer in the format of a LIST OF ONE DICT [{"expr": given expression, "result": calculated answer}].
    5. Detecting Abstract Concepts that a drawing might show, such as love, hate, jealousy, patriotism, or a historic reference to war, invention, discovery, quote, etc.: Use the same format as others to return the answer, where 'expr' will be the explanation of the drawing, and 'result' will be the abstract concept.
    Analyze the equation or expression in this image and return the answer in proper JSON format according to the given rules. Make sure to use extra backslashes for escape characters like \f -> \f, \n -> \n, etc. DO NOT USE BACKTICKS OR MARKDOWN FORMATTING `;

  const imagePart = base64ToGenerativePart(base64Image, "image/png");
  const result = await model.generateContent([prompt, imagePart]);
  return result.response.text();
};
