import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptItem } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

// Helper to resize and compress image before sending to Gemini
// This significantly reduces payload size and prevents network timeouts on mobile
const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str); // Fallback if canvas fails
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      // Return compressed JPEG
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (err) => reject(err);
  });
};

export const parseReceiptImage = async (base64Image: string): Promise<ReceiptItem[]> => {
  try {
    // 1. Compress image (Crucial for mobile performance)
    const compressedBase64 = await compressImage(base64Image);
    const cleanBase64 = compressedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    // 2. Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
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
    
    return rawItems.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      description: item.description,
      price: item.price,
    }));

  } catch (error: any) {
    console.error("Error parsing receipt with Gemini:", error);
    
    // Provide specific error messages for common deployment issues
    if (error.message?.includes('403') || error.message?.includes('API key')) {
        throw new Error("API Key is missing or invalid. Please check your Vercel/Environment settings.");
    }
    
    throw error;
  }
};