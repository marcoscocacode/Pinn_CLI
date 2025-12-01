'use server';

import { createClient } from "@/utils/supabase/server";
import { GeneratedIdea } from "./generate-ideas";

export async function createProject(topic: string, idea: GeneratedIdea) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "unauthorized" };
  }

  // 1. Create Project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title: idea.title, // Use idea title as project title initially
      theme: topic,
      status: 'scripting'
    })
    .select()
    .single();

  if (projectError) {
    console.error("Error creating project:", projectError);
    return { success: false, error: "Failed to create project" };
  }

  // 2. Save Selected Idea
  const { error: ideaError } = await supabase
    .from('ideas')
    .insert({
      project_id: project.id,
      title: idea.title,
      description: idea.description,
      metrics: idea.metrics,
      selected: true
    });

  if (ideaError) {
    console.error("Error saving idea:", ideaError);
    // Continue anyway as project is created
  }

  return { success: true, projectId: project.id };
}
