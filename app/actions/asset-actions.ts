'use server';

import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { revalidatePath } from "next/cache";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AssetEntity {
  name: string;
  type: 'character' | 'item' | 'location';
  description: string;
  visual_prompt: string;
  appearances: number[]; // Scene IDs
}

// ----------------------------------------------------------------------------
// ANALYZE SCRIPT (Gemini 2.5 Flash)
// ----------------------------------------------------------------------------
export async function analyzeScriptForAssets(projectId: string) {
  const supabase = await createClient();

  // 1. Fetch Script
  const { data: scriptRecord } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (!scriptRecord) throw new Error("No script found");

  const script = scriptRecord.content;

  // 2. Analyze with Gemini 2.5 Flash (Efficient Text Analysis)
  const prompt = `
    Analyze this video script and identify all recurring Characters, key Items, and Locations that appear VISUALLY on screen.
    
    Script: ${JSON.stringify(script)}
    
    STRICT EXCLUSION RULES (CRITICAL):
    - DO NOT include "Voiceover", "Narrator", "VO", "Speaker", "Off-screen voice".
    - DO NOT include abstract concepts like "Happiness", "Speed", "Silence".
    - DO NOT include "Camera", "Lens", "Lighting" as assets.
    - ONLY include physical entities that exist in the diegetic world of the video and appear in multiple scenes.
    
    For each entity, create a detailed visual description suitable for an AI Image Generator.
    Identify which scene IDs they appear in.
    
    Return a JSON object with a key "entities" containing an array:
    {
      "entities": [
        {
          "name": "Protagonist (John)",
          "type": "character", // character, item, location
          "description": "Short description of role",
          "visual_prompt": "Detailed visual description, e.g., 'A young man in his 20s, messy brown hair, wearing a red hoodie, cinematic lighting'",
          "appearances": [1, 3, 5]
        }
      ]
    }
  `;

  const result = await client.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
        responseMimeType: "application/json"
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  });

  const text = result.text;
  if (!text) throw new Error("No analysis generated");
  
  const analysis = JSON.parse(text);

  // 3. Save to Assets table
  const entities = analysis.entities as AssetEntity[];
  
  const assetsToInsert = entities.map(entity => ({
    project_id: projectId,
    type: entity.type === 'character' ? 'character_sheet' : 'image', 
    url: '', // Placeholder until generated
    prompt: entity.visual_prompt,
    metadata: {
      name: entity.name,
      description: entity.description,
      appearances: entity.appearances,
      type: entity.type, // Store explicit type in metadata too
      status: 'pending_generation' 
    }
  }));

  const { error } = await supabase
    .from('assets')
    .insert(assetsToInsert);

  if (error) throw new Error("Failed to save assets: " + error.message);

  revalidatePath(`/dashboard/project/${projectId}/assets`);
}


// ----------------------------------------------------------------------------
// GENERATE ASSET IMAGE (Gemini 3 Pro Image)
// ----------------------------------------------------------------------------
export async function generateAssetImage(assetId: string) {
    const supabase = await createClient();
    
    // 1. Get asset details
    const { data: asset } = await supabase.from('assets').select('*').eq('id', assetId).single();
    if (!asset || !asset.prompt) throw new Error("Asset not found");

    const assetType = asset.metadata?.type || 'item';
    const assetName = asset.metadata?.name || 'Asset';

    // 2. Prepare Contextual Prompt for Concept Art / Character Sheet
    const conceptArtStyle = `
      Create a professional ${assetType.toUpperCase()} SHEET / CONCEPT ART.
      Layout: Wide format, neutral grey studio background.
      
      Requirements:
      - Main View: High-fidelity, detailed render of the subject.
      - Detail Views: 2-3 smaller inset sketches showing different angles or close-ups.
      - Annotations: Technical notes about materials, textures, or key features (visual style only, no text legibility required).
      
      Subject: "${assetName}"
      Visual Description: "${asset.prompt}"
      
      Style: Triple-A Game Art / Cinematic Film Pre-production Art. 
      High contrast, clean lines, photorealistic textures.
    `;

    try {
        // 3. Call Gemini 3 Pro Image Preview
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{ parts: [{ text: conceptArtStyle }] }],
            config: {
                // @ts-ignore
                imageConfig: {
                    aspectRatio: '16:9', // Wide for concept sheets
                    imageSize: '1024x1024'
                }
            }
        });

        // 4. Extract Base64
        let base64Image = null;
        // @ts-ignore - navigating deep response structure
        const candidates = response.candidates || (response as any).response?.candidates;
        
        if (candidates?.[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    base64Image = part.inlineData.data;
                    break;
                }
            }
        }

        if (!base64Image) {
            console.error("Gemini Response:", JSON.stringify(response, null, 2));
            throw new Error("No image data found in Gemini response");
        }

        // 5. Upload to Supabase Storage
        const buffer = Buffer.from(base64Image, 'base64');
        const fileName = `${asset.project_id}/${assetId}-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
            .from('project-assets')
            .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) throw new Error("Storage upload failed: " + uploadError.message);

        // 6. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('project-assets')
            .getPublicUrl(fileName);

        // 7. Update Asset Record
        await supabase
            .from('assets')
            .update({ 
                url: publicUrl,
                metadata: { ...asset.metadata, status: 'generated' }
            })
            .eq('id', assetId);

    } catch (error) {
        console.error("Image generation failed:", error);
        throw error; // Let UI handle error state
    }
}
