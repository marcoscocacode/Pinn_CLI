import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Plus, Video, Calendar, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: projects } = user 
    ? await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-500">My Projects</h1>
        <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <span className="font-bold text-amber-500">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Project Card */}
        <Link href="/dashboard/new" className="group">
          <GlassCard className="h-64 flex flex-col items-center justify-center border-dashed border-neutral-700 group-hover:border-amber-500/50 transition-colors cursor-pointer bg-transparent">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 group-hover:scale-110 transition-all">
              <Plus className="w-8 h-8 text-neutral-400 group-hover:text-amber-500" />
            </div>
            <span className="text-lg font-medium text-neutral-400 group-hover:text-amber-500">Create New Project</span>
          </GlassCard>
        </Link>

        {projects?.map((project) => (
          <Link key={project.id} href={`/dashboard/project/${project.id}/script`}>
            <GlassCard className="h-64 flex flex-col justify-between hover:bg-white/5 cursor-pointer group transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2 py-1 rounded text-xs uppercase tracking-wide font-bold 
                    ${project.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                      project.status === 'production' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-amber-500/10 text-amber-500'}`}>
                    {project.status}
                  </div>
                  <Video className="w-5 h-5 text-neutral-600 group-hover:text-amber-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">{project.title}</h3>
                <p className="text-neutral-500 text-sm mt-2 line-clamp-2">{project.theme}</p>
              </div>
              
              <div className="pt-4 border-t border-white/5 flex items-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(project.created_at).toLocaleDateString()}</span>
                {/* <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 2m ago</span> */}
              </div>
            </GlassCard>
          </Link>
        ))}
        
        {(!projects || projects.length === 0) && (
           <div className="col-span-full text-center py-20 opacity-50 hidden md:block">
             <Video className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
             <p>No projects yet. Start creating!</p>
           </div>
        )}
      </div>
    </div>
  );
}
