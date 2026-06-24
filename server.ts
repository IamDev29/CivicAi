import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable large payloads for image base64 uploads
app.use(express.json({ limit: "10mb" }));

// Initialize GoogleGenAI securely on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API endpoint to analyze the civic issue image
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "Missing image data or mimeType" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set in environment.");
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured. Please add it to your Settings > Secrets." 
      });
    }

    let base64Data = image;
    let resolvedMimeType = mimeType;

    // If the image is a URL, fetch it and convert to base64
    if (image.startsWith("http")) {
      try {
        const fetchRes = await fetch(image);
        if (!fetchRes.ok) {
          throw new Error(`Failed to fetch remote image: ${fetchRes.statusText}`);
        }
        const arrayBuffer = await fetchRes.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString("base64");
        resolvedMimeType = fetchRes.headers.get("content-type") || mimeType;
      } catch (err: any) {
        console.error("Error downloading external image:", err);
        return res.status(500).json({ error: `Could not retrieve external sample photo: ${err.message}` });
      }
    }

    const imagePart = {
      inlineData: {
        mimeType: resolvedMimeType,
        data: base64Data,
      },
    };

    const promptText = `Analyze this image and identify:
(1) Issue category: one of [Pothole, Water Leakage, Damaged Streetlight, Waste Dumping, Broken Footpath, Flooding, Other]
(2) Severity: [Low, Medium, High, Critical] based on safety risk
(3) Brief description in 1 sentence
(4) Suggested government department to notify: [PWD, Municipal Corporation, Water Board, Electricity Board]

Provide a raw confidence score between 0.0 and 100.0 based on the visual clarity and accuracy of the identification. Return the response as a JSON object adhering strictly to the schema.`;

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "The identified category. Must be one of: Pothole, Water Leakage, Damaged Streetlight, Waste Dumping, Broken Footpath, Flooding, Other",
            },
            severity: {
              type: Type.STRING,
              description: "The safety severity level. Must be one of: Low, Medium, High, Critical",
            },
            description: {
              type: Type.STRING,
              description: "A concise, single-sentence human-friendly description of the civic problem pictured.",
            },
            department: {
              type: Type.STRING,
              description: "The recommended local municipal agency. Must be one of: PWD, Municipal Corporation, Water Board, Electricity Board",
            },
            confidence: {
              type: Type.NUMBER,
              description: "A confidence percentage between 0 and 100 for this analysis, based on clarity.",
            },
          },
          required: ["category", "severity", "description", "department", "confidence"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      return res.status(500).json({ error: "No response from Gemini" });
    }

    const parsedResult = JSON.parse(resultText);
    return res.json(parsedResult);

  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to analyze image using Gemini AI." 
    });
  }
});

// Configure Vite or Static Serve
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
