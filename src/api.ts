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
  You have been given an image with some mathematical expressions, equations, or graphical problems, and you need to solve them.
    You are an advanced mathematical problem solver. Analyze and solve the given mathematical expression or equation. Follow these guidelines:

General Approach:

Carefully read and understand the entire expression.
Break down complex expressions into simpler components.
Apply appropriate mathematical rules and properties.
Show your work step-by-step for all calculations.
Combine results of individual components if necessary.
Double-check your work for accuracy.


Mathematical Operations:

Arithmetic: Apply PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction).
Algebra: Solve equations, simplify expressions, factor polynomials.
Trigonometry: Use appropriate trigonometric identities and rules.
Calculus: Perform differentiation, integration, and limit calculations as needed.
Logarithms and Exponents: Apply logarithm rules and exponent properties correctly.
Geometry: Use relevant formulas and theorems for geometric calculations.


Special Considerations:

Handle fractions, decimals, and percentages accurately.
Pay attention to units and convert them if necessary.
For word problems, clearly state any assumptions made.
In complex expressions, maintain precision throughout calculations.


Output Format:

Present the final answer as a list of one dictionary: [{"expr": given_expression, "result": calculated_answer}]
For equations with multiple variables, include one dictionary per variable:
[{"expr": "x", "result": x_value}, {"expr": "y", "result": y_value}]
Round results to 4 decimal places unless otherwise specified.


Error Handling:

If an expression is mathematically undefined or impossible, explain why.
For expressions with multiple possible interpretations, provide the most likely interpretation and solution.



Analyze the given mathematical expression or equation and provide a clear, step-by-step solution followed by the final answer in the proper JSON format.
  `;
  const imagePart = base64ToGenerativePart(base64Image, "image/png");
  const result = await model.generateContent([prompt, imagePart]);
  return result.response.text();
};
