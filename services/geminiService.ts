import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptItem } from "../types";

// Helper to safely get API Key
const getApiKey = (): string | undefined => {
  try {
    // We use process.env.API_KEY as strictly required.
    // In some build setups, accessing 'process' directly without a check might throw if not polyfilled.
    return process.env.API_KEY;
  } catch (e) {
    console.error("Failed to access process.env", e);
    return undefined;
  }
};

// Helper to resize and compress image before sending to Gemini
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
        resolve(base64Str); // Fallback
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (err) => reject(err);
  });
};

export const parseReceiptImage = async (base64Image: string): Promise<ReceiptItem[]> => {
  // 1. Initialize Client INSIDE the function to ensure we grab the latest env var
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey.includes('dummy')) {
     console.error("API Key Check Failed. Value found:", apiKey ? "Present (masked)" : "Missing");
     throw new Error("API Key is missing. Please check your Vercel Environment Variables settings.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    // 2. Compress image
    const compressedBase64 = await compressImage(base64Image);
    const cleanBase64 = compressedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    // 3. Call Gemini API
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
    
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
        return [];
    }

    return rawItems.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      description: item.description || "Unknown Item",
      price: Number(item.price) || 0,
    }));

  } catch (error: any) {
    console.error("Error parsing receipt with Gemini:", error);
    
    // Catch auth errors specifically
    if (error.message?.includes('403') || error.toString().includes('API key')) {
        throw new Error("API Key invalid or restricted. Check your Google AI Studio API key permissions.");
    }
    
    throw error;
  }
};