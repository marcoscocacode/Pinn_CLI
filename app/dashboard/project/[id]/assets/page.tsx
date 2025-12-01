import { createClient } from "@/utils/supabase/server";
import AssetManager from "./ScriptAssets";

export default async function AssetsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch Assets
  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', id);

  return (
    <AssetManager 
      projectId={id}
      assets={assets || []}
    />
  );
}
