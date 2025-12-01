import { createClient } from "@/utils/supabase/server";
import StoryboardManager from "./StoryboardClient";

export default async function StoryboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch Script
  const { data: scriptRecord } = await supabase.from('scripts').select('*').eq('project_id', id).single();
  
  if (!scriptRecord) return <div>Script not found</div>;

  // Fetch Existing Renders
  const { data: renders } = await supabase.from('scene_renders').select('*').eq('project_id', id);

  return (
    <StoryboardManager 
      projectId={id}
      scenes={scriptRecord.content.scenes}
      renders={renders || []}
    />
  );
}
