'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { generateSceneVideo } from '@/app/actions/video-actions';
import { Loader2, Play, CheckCircle, Film, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScriptScene } from '@/app/actions/generate-script';

interface SceneRender {
  scene_index: number;
  status: 'pending' | 'generating_keyframes' | 'rendering_video' | 'completed' | 'failed';
  video_url?: string;
}

interface StudioInterfaceProps {
  projectId: string;
  scriptScenes: ScriptScene[];
  renders: SceneRender[];
}

export default function StudioInterface({ projectId, scriptScenes, renders }: StudioInterfaceProps) {
  const [processingScenes, setProcessingScenes] = useState<Set<number>>(new Set());

  const getRenderStatus = (index: number) => {
    return renders.find(r => r.scene_index === index)?.status || 'pending';
  };

  const getVideoUrl = (index: number) => {
    return renders.find(r => r.scene_index === index)?.video_url;
  };

  const handleRenderScene = async (index: number) => {
    setProcessingScenes(prev => new Set(prev).add(index));
    try {
        await generateSceneVideo(projectId, index);
    } catch (error) {
        console.error(error);
        alert("Failed to start render");
    } finally {
        setProcessingScenes(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-white mb-1">Production Studio</h2>
            <p className="text-neutral-400 text-sm">Render scenes and assemble your final cut.</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Film className="w-4 h-4" /> Export Full Video
        </button>
      </header>

      <div className="space-y-4">
        {scriptScenes.map((scene, index) => {
            const status = getRenderStatus(index);
            const isProcessing = processingScenes.has(index) || status === 'generating_keyframes' || status === 'rendering_video';
            const videoUrl = getVideoUrl(index);

            return (
                <GlassCard key={index} className="flex gap-6 items-center p-4 hover:border-amber-500/30 transition-colors">
                    <div className="w-12 h-12 bg-neutral-900 rounded-lg flex items-center justify-center font-bold text-neutral-500 border border-neutral-800">
                        {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-300 line-clamp-1 mb-1 font-medium">{scene.visual}</p>
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                             <span className="flex items-center gap-1"><Film className="w-3 h-3" /> {scene.duration}s</span>
                             <span className={cn("flex items-center gap-1 capitalize", 
                                status === 'completed' ? "text-green-500" : 
                                status === 'failed' ? "text-red-500" : 
                                isProcessing ? "text-amber-500" : "text-neutral-500"
                             )}>
                                {status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                {status === 'failed' && <AlertCircle className="w-3 h-3" />}
                                {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
                                {status.replace('_', ' ')}
                             </span>
                        </div>
                    </div>

                    <div className="w-64 h-36 bg-black/50 rounded-lg overflow-hidden border border-white/10 relative group">
                        {status === 'completed' && videoUrl ? (
                            <video src={videoUrl} className="w-full h-full object-cover" controls />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600 gap-2">
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                        <span className="text-xs text-amber-500 animate-pulse">
                                            {status === 'generating_keyframes' ? 'Creating Frames...' : 'Rendering Video...'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-8 h-8 opacity-50" />
                                        <span className="text-xs">Ready to Render</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => handleRenderScene(index)}
                        disabled={isProcessing || status === 'completed'}
                        className={cn(
                            "px-4 py-2 rounded-lg font-bold text-sm transition-all min-w-[100px]",
                            status === 'completed' 
                                ? "bg-green-500/10 text-green-500 cursor-default" 
                                : "bg-white/5 hover:bg-white/10 text-white hover:text-amber-500 border border-white/10"
                        )}
                    >
                        {status === 'completed' ? 'Done' : isProcessing ? 'Rendering' : 'Render'}
                    </button>
                </GlassCard>
            );
        })}
      </div>
    </div>
  );
}
