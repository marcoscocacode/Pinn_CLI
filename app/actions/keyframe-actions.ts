'use server';

import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { revalidatePath } from "next/cache";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateKeyframe(projectId: string, sceneIndex: number, frameType: 'start' | 'end') {
  const supabase = await createClient();

  // 1. Fetch Scene and Assets
  const { data: scriptRecord } = await supabase.from('scripts').select('*').eq('project_id', projectId).single();
  const scene = scriptRecord.content.scenes[sceneIndex];

  // Fetch all generated assets
  const { data: assets } = await supabase.from('assets').select('*').eq('project_id', projectId).not('url', 'is', null);

  // 2. Intelligent Asset Filtering (Keyword Matching)
  // Only include assets if their name appears in the scene visual or audio
  const sceneText = (scene.visual + " " + scene.audio).toLowerCase();
  
  const relevantAssets = assets?.filter(a => {
      const name = a.metadata.name.toLowerCase();
      // Simple check: is the asset name roughly in the text?
      return sceneText.includes(name) || sceneText.includes(name.split(' ')[0]); // Check full name or first name
  }) || [];

  const assetContext = relevantAssets.map(a => 
    `REFERENCE (${a.metadata.type.toUpperCase()}): "${a.metadata.name}" looks like: ${a.prompt}`
  ).join("\n\n");

  // 3. The "Virtual Director" Step (Text Reasoning)
  // Instead of guessing, we ask Gemini Text to describe the visual state difference.
  const directorPrompt = `
    You are a Cinematography Director. 
    Analyze this scene action and break it down into two distinct visual states.
    
    Action: "${scene.visual}"
    Duration: ${scene.duration} seconds.
    
    Task: Describe the VISUAL STATE at the exact Start (0.0s) and the exact End (${scene.duration}.0s).
    Focus on the change in subject pose, camera position, or object location.
    
    If the action is "A man walks into a room":
    - Start: "Wide shot, door closed, man standing outside reaching for handle."
    - End: "Man standing inside the room, door open behind him."
    
    Return ONLY a JSON object:
    {
      "start_visual": "Detailed visual description of the starting frame...",
      "end_visual": "Detailed visual description of the ending frame..."
    }
  `;

  // Helper to generate image from a specific description
  const generateImage = async (visualDescription: string) => {
      const imagePrompt = `
        ROLE: Expert Cinematographer.
        TASK: Generate a single 9:16 Keyframe image.
        
        VISUAL DESCRIPTION:
        "${visualDescription}"
        
        STRICT CONSISTENCY ASSETS (Merge naturally):
        ${assetContext}
        
        STYLE: Photorealistic, 8k, Unreal Engine 5 render style, Volumetric lighting, Cinematic Color Grading.
        ASPECT RATIO: 9:16 (Vertical Full Screen).
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: [{ parts: [{ text: imagePrompt }] }],
        config: {
            // @ts-ignore
            imageConfig: {
                aspectRatio: '9:16', 
                imageSize: '1024x1024'
            }
        }
      });

      // Extract Base64
      // @ts-ignore
      const candidates = response.candidates || (response as any).response?.candidates;
      if (candidates?.[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                  return part.inlineData.data;
              }
          }
      }
      throw new Error("No image generated");
  };

  try {
      // Step A: Get Visual Description from Script (Pre-generated)
      // The script now contains explicit start/end prompts generated during the writing phase.
      // @ts-ignore - Assuming the script content has been updated to include these fields
      const specificPrompt = frameType === 'start' ? scene.start_frame_prompt : scene.end_frame_prompt;
      
      // Fallback if fields are missing (for older scripts)
      const finalPrompt = specificPrompt || scene.visual;

      // Step B: Generate Image
      const base64Image = await generateImage(finalPrompt);

      // Upload to Storage
      const buffer = Buffer.from(base64Image, 'base64');
      const fileName = `${projectId}/scene-${sceneIndex}-${frameType}-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
          .from('project-assets')
          .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

      if (uploadError) throw new Error("Upload failed: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(fileName);

      // Update scene_renders
      const updatePayload = frameType === 'start' ? { start_frame_url: publicUrl } : { end_frame_url: publicUrl };
      
      // Ensure row exists first
      await supabase.from('scene_renders').upsert({
          project_id: projectId,
          scene_index: sceneIndex
      }, { onConflict: 'project_id, scene_index' });

      await supabase
          .from('scene_renders')
          .update(updatePayload)
          .match({ project_id: projectId, scene_index: sceneIndex });

      revalidatePath(`/dashboard/project/${projectId}/storyboard`);

  } catch (error) {
    console.error("Keyframe Gen Failed:", error);
    throw error;
  }
}
