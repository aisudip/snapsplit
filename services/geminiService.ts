import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptItem } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

export const parseReceiptImage = async (base64Image: string): Promise<ReceiptItem[]> => {
  // Remove header if present (e.g., "data:image/jpeg;base64,")
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity, usually safe for camera/uploads
              data: cleanBase64,
            },
          },
          {
            text: "Extract all line items from this receipt. Return a JSON array of objects with 'description' and 'price'. Ignore subtotal, tax, and total lines, just get the purchased items. If a price is not clear, estimate or default to 0.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: "The name of the item purchased",
              },
              price: {
                type: Type.NUMBER,
                description: "The price of the item",
              },
            },
            required: ["description", "price"],
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini.");
    }

    const rawItems = JSON.parse(response.text) as { description: string; price: number }[];
    
    // Add unique IDs
    return rawItems.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      description: item.description,
      price: item.price,
    }));

  } catch (error) {
    console.error("Error parsing receipt with Gemini:", error);
    throw error;
  }
};
