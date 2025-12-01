'use server';

import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ScriptScene {
  id: number;
  visual: string;
  audio: string; // Voice over or dialogue
  duration: number; // 4, 6, or 8
  characters: string[]; // List of characters in scene
  start_frame_prompt: string; // Detailed visual description for frame 0
  end_frame_prompt: string; // Detailed visual description for frame N
}

export interface GeneratedScript {
  title: string;
  scenes: ScriptScene[];
}

export async function generateScript(topic: string, ideaDescription: string): Promise<GeneratedScript> {
  
  const prompt = `
    You are a professional screenwriter and cinematographer for viral short videos.
    
    Topic: "${topic}"
    Concept: "${ideaDescription}"
    
    Create a complete script for this video.
    
    CRITICAL: For each scene, you must also act as a Director and describe the Start (0s) and End (Ns) frames visually.
    The Start and End frames MUST show the progression of the action described.
    Example:
    - Action: "Man walks into room."
    - Start Frame: "Wide shot, man outside closed door, hand reaching for handle."
    - End Frame: "Man standing inside room, door open behind him."
    
    Constraints:
    - Total duration should be between 30-60 seconds.
    - Each scene duration MUST be exactly 4, 6, or 8 seconds.
    
    Return a JSON object:
    {
      "title": "Video Title",
      "scenes": [
        {
          "id": 1,
          "visual": "General action description...",
          "audio": "Voiceover text...",
          "duration": 4,
          "characters": ["Name"],
          "start_frame_prompt": "Detailed description of the very first frame...",
          "end_frame_prompt": "Detailed description of the very last frame..."
        }
      ]
    }
  `;

  try {
    const result = await client.models.generateContent({
        model: "gemini-3-pro-preview",
        config: {
            responseMimeType: "application/json",
            // @ts-ignore
            thinkingLevel: "high"
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = result.text;
    if (!text) throw new Error("No script generated");

    return JSON.parse(text) as GeneratedScript;
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("Failed to generate script.");
  }
}