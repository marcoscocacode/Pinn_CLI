'use server';

import { createClient } from "@/utils/supabase/server";
import { GeneratedScript } from "./generate-script";
import { revalidatePath } from "next/cache";

export async function saveScript(projectId: string, scriptContent: GeneratedScript) {
  const supabase = await createClient();
  
  // Upsert script
  const { error } = await supabase
    .from('scripts')
    .upsert({
      project_id: projectId,
      content: scriptContent,
      version: 1 // TODO: Handle versioning
    }, { onConflict: 'project_id' });

  if (error) {
    throw new Error("Failed to save script: " + error.message);
  }

  // Update project status
  await supabase
    .from('projects')
    .update({ status: 'assets' })
    .eq('id', projectId);

  revalidatePath(`/dashboard/project/${projectId}/script`);
}

export async function getScript(projectId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('scripts')
        .select('*')
        .eq('project_id', projectId)
        .single();
    
    return data;
}
