'use server';

import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GeneratedIdea {
  title: string;
  description: string;
  metrics: {
    estimated_engagement: string;
    production_difficulty: "Low" | "Medium" | "High";
    estimated_duration: string;
  };
  visual_style: string;
}

export async function generateVideoIdeas(topic: string): Promise<GeneratedIdea[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const prompt = `
    You are a creative director for a video production platform called "Pinn".
    The user wants to create a short video (TikTok/Shorts) about the topic: "${topic}".
    
    Generate 3 distinct, creative video concepts based on this topic.
    The concepts should be viral-worthy, engaging, and feasible to produce using AI tools.
    
    Return a JSON array of objects with the following structure:
    [
      {
        "title": "Catchy Title",
        "description": "A brief description of the video concept, plot, and hook.",
        "metrics": {
          "estimated_engagement": "High/Very High",
          "production_difficulty": "Low/Medium/High",
          "estimated_duration": "30s/60s"
        },
        "visual_style": "Description of the visual style (e.g., Cinematic, Cartoon, Minimalist)"
      }
    ]
  `;

  try {
    const result = await client.models.generateContent({
      model: "gemini-3-pro-preview",
      config: {
        responseMimeType: "application/json",
        // @ts-ignore - thinking_level is valid for Gemini 3
        thinkingLevel: "high" 
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = result.text;
    
    if (!text) throw new Error("No text generated");

    return JSON.parse(text) as GeneratedIdea[];
  } catch (error) {
    console.error("Error generating ideas:", error);
    throw new Error("Failed to generate video ideas.");
  }
}