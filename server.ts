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

// --- Helper for distance calculation (Haversine Formula) ---
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Function Declarations for Issue Routing Agent
const checkForDuplicatesDeclaration = {
  name: "check_for_duplicates",
  description: "Checks if there is an existing issue within 200m radius of the given coordinate with a similar category, which indicates a duplicate report.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      lat: { type: Type.NUMBER, description: "Latitude of the reported issue" },
      lng: { type: Type.NUMBER, description: "Longitude of the reported issue" },
      category: { type: Type.STRING, description: "Category of the issue" }
    },
    required: ["lat", "lng", "category"]
  }
};

const routeAndPredictDeclaration = {
  name: "route_and_predict",
  description: "Routes a unique civic issue to the correct department, generates a tracking ID, and predicts the estimated resolution time.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, description: "Category of the issue" },
      severity: { type: Type.STRING, description: "Severity of the issue (Low, Medium, High, Critical)" },
      title: { type: Type.STRING, description: "Title of the issue" },
      description: { type: Type.STRING, description: "Description of the issue" }
    },
    required: ["category", "severity", "title", "description"]
  }
};

// API Endpoint for Agent 1 - Autonomous Issue Router Agent
app.post("/api/gemini/route-issue", async (req, res) => {
  try {
    const { issue, existingIssues } = req.body;

    if (!issue) {
      return res.status(400).json({ error: "Missing issue data" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured. Please add it to your Settings > Secrets." 
      });
    }

    const prompt = `You are the CivicAI Autonomous Issue Router Agent.
A citizen has reported a new civic issue:
Title: "${issue.title || ''}"
Description: "${issue.description || ''}"
Category: "${issue.category || ''}"
Severity: "${issue.severity || ''}"
Location: "${issue.location || ''}"
GPS: ${JSON.stringify(issue.gps || { lat: 20.2961, lng: 85.8245 })}

Your primary directives:
1. Always call 'check_for_duplicates' FIRST using the latitude and longitude of the reported issue.
2. If the check returns that a duplicate exists, stop immediately.
3. If no duplicate exists, call 'route_and_predict' to route the issue, generate a tracking ID (CIVIC-2025-XXXX) and predict estimated resolution time.`;

    // Step 1: Initial call to Gemini with tools
    let currentResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [checkForDuplicatesDeclaration, routeAndPredictDeclaration] }]
      }
    });

    let contentsHistory: any[] = [
      { role: 'user', parts: [{ text: prompt }] }
    ];

    let finalStatus: any = {};

    // Run a tool loop up to 3 turns
    for (let i = 0; i < 3; i++) {
      const functionCalls = currentResponse.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        break;
      }

      // Add the model's call to history
      contentsHistory.push(currentResponse.candidates?.[0]?.content);

      const call = functionCalls[0];
      let toolResult: any = {};

      if (call.name === "check_for_duplicates") {
        const { lat, lng, category } = call.args as any;
        let duplicateIssue: any = null;

        if (lat && lng && Array.isArray(existingIssues)) {
          for (const existing of existingIssues) {
            if (!existing.gps) continue;
            const distance = getDistance(lat, lng, existing.gps.lat, existing.gps.lng);
            // Check within 200 meters and not already resolved
            if (distance <= 200 && existing.status !== 'Resolved' && existing.category === category) {
              duplicateIssue = existing;
              break;
            }
          }
        }

        if (duplicateIssue) {
          toolResult = {
            duplicateFound: true,
            duplicateIssueId: duplicateIssue.id,
            message: `This issue was already reported — your upvote has been added. Already tracked under tracking code: ${duplicateIssue.id}`
          };
          finalStatus = {
            status: "duplicate",
            duplicateIssueId: duplicateIssue.id,
            message: `This issue was already reported — your upvote has been added.`
          };
        } else {
          toolResult = {
            duplicateFound: false,
            message: "No duplicate issues found within 200m."
          };
        }
      } else if (call.name === "route_and_predict") {
        const { category: finalCategory, severity, title, description } = call.args as any;
        
        let department = "Municipal Corporation";
        let baseDays = 5;

        // Base resolution time logic
        if (finalCategory === 'Pothole') {
          department = "PWD";
          baseDays = 7;
        } else if (finalCategory === 'Water Leakage') {
          department = "Water Board";
          baseDays = 3;
        } else if (finalCategory === 'Damaged Streetlight') {
          department = "Electricity Board";
          baseDays = 4;
        } else if (finalCategory === 'Waste Dumping') {
          department = "Municipal Corporation";
          baseDays = 2;
        } else if (finalCategory === 'Broken Footpath') {
          department = "PWD";
          baseDays = 10;
        } else if (finalCategory === 'Flooding') {
          department = "Municipal Corporation";
          baseDays = 5;
        }

        // Severity modifier
        let multiplier = 1.0;
        if (severity === 'Critical') multiplier = 0.5;
        else if (severity === 'High') multiplier = 0.8;
        else if (severity === 'Low') multiplier = 1.2;

        // Current department workload (mock workload factor)
        const currentWorkloadFactor = Math.random() > 0.5 ? 2 : 0; 
        const predictedDays = Math.max(1, Math.round(baseDays * multiplier + currentWorkloadFactor));

        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const trackingId = `CIVIC-2025-${randomDigits}`;

        toolResult = {
          trackingId,
          department,
          estimatedResolutionDays: predictedDays,
          notificationMessage: `Your issue #${trackingId} has been assigned to ${department}. Estimated resolution: ${predictedDays} days.`
        };

        finalStatus = {
          status: "routed",
          trackingId,
          department,
          estimatedResolutionDays: predictedDays,
          notificationMessage: `Your issue #${trackingId} has been assigned to ${department}. Estimated resolution: ${predictedDays} days.`
        };
      }

      // Append tool response to history
      contentsHistory.push({
        role: 'tool',
        parts: [{
          functionResponse: {
            name: call.name,
            response: toolResult
          }
        }]
      });

      // Break loop if duplicate found, no need to query route_and_predict
      if (call.name === "check_for_duplicates" && toolResult.duplicateFound) {
        break;
      }

      // Query Gemini again
      currentResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsHistory,
        config: {
          tools: [{ functionDeclarations: [checkForDuplicatesDeclaration, routeAndPredictDeclaration] }]
        }
      });
    }

    // Default fallback if finalStatus wasn't set (should not happen)
    if (!finalStatus.status) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const trackingId = `CIVIC-2025-${randomDigits}`;
      finalStatus = {
        status: "routed",
        trackingId,
        department: "Municipal Corporation",
        estimatedResolutionDays: 5,
        notificationMessage: `Your issue #${trackingId} has been assigned to Municipal Corporation. Estimated resolution: 5 days.`
      };
    }

    return res.json(finalStatus);

  } catch (error: any) {
    console.error("Issue Routing Agent error:", error);
    return res.status(500).json({ error: error.message || "Failed to process issue routing." });
  }
});

// API Endpoint for Agent 2 - Predictive Insights Agent
app.post("/api/gemini/insights", async (req, res) => {
  try {
    const { issues } = req.body;

    if (!Array.isArray(issues)) {
      return res.status(400).json({ error: "Issues list must be provided as an array" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured. Please add it to your Settings > Secrets." 
      });
    }

    const serializedIssues = issues.map(i => ({
      id: i.id,
      title: i.title,
      category: i.category,
      severity: i.severity,
      location: i.location,
      status: i.status,
      date: i.date,
      upvotes: i.upvotes
    }));

    const promptText = `Analyze the following dataset of reported civic issues and generate a comprehensive prediction and insights analysis.

Dataset:
${JSON.stringify(serializedIssues, null, 2)}

Identify:
1. Top 3 problem categories or areas based on counts and severity.
2. Which specific ward/locality/neighborhood has the highest concentration or density of issues.
3. Prediction of expected issue counts or challenges for next month.
4. Provide categoryStats (array of { category, count }) summarizing the actual counts.
5. Provide weeklyTrend (array of { week, count }) for reported issues across weeks present in the data (group them logically into Week 1, Week 2, Week 3, etc.).
6. Generate a highly polished, analytical natural language summary (strictly start with "This week, [locality] had the highest issue density...").

Return the result STRICTLY as a JSON object adhering to the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            top3Categories: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Top 3 civic categories currently requiring urgent intervention"
            },
            topLocality: {
              type: Type.STRING,
              description: "The ward or locality with the highest concentration of issues"
            },
            predictedNextMonth: {
              type: Type.STRING,
              description: "Predictive foresight of which issue category will spike next month and why"
            },
            naturalLanguageSummary: {
              type: Type.STRING,
              description: "Natural language analysis summarizing findings. Must start with: This week, [locality] had the highest issue density..."
            },
            categoryStats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  count: { type: Type.NUMBER }
                },
                required: ["category", "count"]
              }
            },
            weeklyTrend: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.STRING },
                  count: { type: Type.NUMBER }
                },
                required: ["week", "count"]
              }
            }
          },
          required: ["top3Categories", "topLocality", "predictedNextMonth", "naturalLanguageSummary", "categoryStats", "weeklyTrend"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      return res.status(500).json({ error: "No insights response from Gemini" });
    }

    const parsedResult = JSON.parse(resultText);
    return res.json(parsedResult);

  } catch (error: any) {
    console.error("Predictive Insights Agent error:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze predictive insights." });
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
