import { createClient } from "@/utils/supabase/server";
import ScriptEditor from "./ScriptEditor";
import { notFound } from "next/navigation";

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch Project and Idea
  const { data: project } = await supabase
    .from('projects')
    .select('*, ideas(*)') // Join ideas
    .eq('id', id)
    .single();

  if (!project) notFound();

  // Find the selected idea
  // Note: Types from Supabase might be 'any' without generating types, casting for now
  const selectedIdea = Array.isArray(project.ideas) 
    ? project.ideas.find((i: any) => i.selected) 
    : null;

  if (!selectedIdea) {
     // Fallback if no idea is marked selected (shouldn't happen in normal flow)
     return <div>Error: No idea selected for this project.</div>
  }

  // Fetch Script
  const { data: scriptRecord } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', id)
    .single();

  const scriptContent = scriptRecord ? scriptRecord.content : null;

  return (
    <ScriptEditor 
      projectId={id}
      topic={project.theme}
      ideaDescription={selectedIdea.description}
      initialScript={scriptContent}
    />
  );
}
