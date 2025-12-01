import { createClient } from "@/utils/supabase/server";
import StudioInterface from "./StudioInterface";
import { initializeRenders } from "@/app/actions/video-actions";

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch Script
  const { data: scriptRecord } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', id)
    .single();

  if (!scriptRecord) {
      return <div>No script found. Please generate a script first.</div>;
  }

  const scriptScenes = scriptRecord.content.scenes;

  // Initialize renders if needed (server-side check)
  // Ideally this should happen on entering the page or previous step, but safe to check here
  // Note: we can't await server action inside render easily for initialization side-effect without useEffect or specialized pattern,
  // but we can check if records exist and insert them directly here since we are on server.
  // Actually, let's just fetch existing renders. If empty, the UI will show pending, and the user action triggers the flow.
  // But wait, the video-actions uses "update" assuming row exists. So we DO need to init.
  // I'll call initializeRenders here but catch errors if it's already done (or make it idempotent).
  
  try {
     await initializeRenders(id, scriptScenes.length);
  } catch (e) {
     // Ignore duplicates
  }

  // Fetch Renders
  const { data: renders } = await supabase
    .from('scene_renders')
    .select('*')
    .eq('project_id', id);

  return (
    <StudioInterface 
      projectId={id}
      scriptScenes={scriptScenes}
      renders={renders || []}
    />
  );
}
