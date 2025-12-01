'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- Helper: Robust Retry Logic (from user example) ---
async function callGeminiWithRetry<T>(
  operation: () => Promise<T>, 
  retries = 3
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      console.warn(`API call failed. Retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callGeminiWithRetry(operation, retries - 1);
    }
    console.error("Critical API Failure:", error);
    throw error;
  }
}

export async function generateSceneVideo(projectId: string, sceneIndex: number) {
  const supabase = await createClient();

  // 1. Fetch prompt/data
  const { data: scriptRecord } = await supabase.from('scripts').select('*').eq('project_id', projectId).single();
  const scene = scriptRecord.content.scenes[sceneIndex];
  
  // 2. Fetch Frames for Consistency (Image-to-Video)
  const { data: render } = await supabase.from('scene_renders')
    .select('start_frame_url, end_frame_url')
    .match({ project_id: projectId, scene_index: sceneIndex })
    .single();

  let inputImage = undefined;
  let lastFrameInput = undefined;

  // Process Start Frame
  if (render?.start_frame_url) {
      try {
          const res = await fetch(render.start_frame_url);
          const buf = await res.arrayBuffer();
          inputImage = {
              imageBytes: Buffer.from(buf).toString('base64'),
              mimeType: "image/png"
          };
      } catch (e) {
          console.warn("Failed to fetch start frame", e);
      }
  }

  // Process End Frame
  if (render?.end_frame_url) {
      try {
          const res = await fetch(render.end_frame_url);
          const buf = await res.arrayBuffer();
          lastFrameInput = {
              imageBytes: Buffer.from(buf).toString('base64'),
              mimeType: "image/png"
          };
      } catch (e) {
          console.warn("Failed to fetch end frame", e);
      }
  }

  // Update status
  await supabase
    .from('scene_renders')
    .update({ status: 'rendering_video' }) 
    .match({ project_id: projectId, scene_index: sceneIndex });

  revalidatePath(`/dashboard/project/${projectId}/studio`);

  try {
      // Call Veo 3.1
      const enhancedPrompt = `${scene.visual}. Vertical Video 9:16. Cinematic lighting, 4k, fluid motion. ${scene.audio}`;
      
      const generationConfig: any = {
          // @ts-ignore
          aspectRatio: '9:16',
      };

      if (lastFrameInput) {
          generationConfig.lastFrame = lastFrameInput;
      }

      // @ts-ignore
      let operation: any = await callGeminiWithRetry(() => 
        client.models.generateVideos({
            model: "veo-3.1-fast-generate-preview",
            prompt: enhancedPrompt,
            image: inputImage,
            config: generationConfig
        })
      );

      console.log("Veo Operation Started:", operation.name);

      // Polling Loop
      while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          // @ts-ignore
          operation = await client.operations.getVideosOperation({ operation });
      }

      if (operation.error) {
          throw new Error(`Veo Generation Failed: ${operation.error.message}`);
      }

      // @ts-ignore
      const vid = operation.response?.generatedVideos?.[0]?.video;
      if (!vid || !vid.uri) {
          throw new Error("No video URI returned.");
      }

      // 3. Download and Upload to Supabase Storage (Persistent)
      // We need to append the key to fetch the raw video
      const videoFetchUrl = `${vid.uri}&key=${process.env.GEMINI_API_KEY}`;
      const videoRes = await fetch(videoFetchUrl);
      
      if (!videoRes.ok) throw new Error("Failed to download generated video from Google");
      
      const videoBuffer = await videoRes.arrayBuffer();
      const fileName = `${projectId}/scene-${sceneIndex}-video-${Date.now()}.mp4`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, videoBuffer, {
            contentType: 'video/mp4',
            upsert: true
        });

      if (uploadError) throw new Error("Storage upload failed: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(fileName);

      await supabase
        .from('scene_renders')
        .update({ 
            status: 'completed',
            video_url: publicUrl
        })
        .match({ project_id: projectId, scene_index: sceneIndex });

  } catch (error: any) {
      console.error("Video Gen Failed:", error);
      await supabase
        .from('scene_renders')
        .update({ status: 'failed' })
        .match({ project_id: projectId, scene_index: sceneIndex });
  }

  revalidatePath(`/dashboard/project/${projectId}/studio`);
}

// Ensure the initializeRenders is exported too (it was in the previous file)
export async function initializeRenders(projectId: string, sceneCount: number) {
    const supabase = await createClient();
    const renders = Array.from({ length: sceneCount }).map((_, i) => ({
      project_id: projectId,
      scene_index: i,
      status: 'pending'
    }));
  
    const { error } = await supabase
      .from('scene_renders')
      .upsert(renders, { onConflict: 'project_id, scene_index', ignoreDuplicates: true });
  
    if (error) throw new Error("Failed to init renders: " + error.message);
  }
