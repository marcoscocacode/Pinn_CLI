'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { generateKeyframe } from '@/app/actions/keyframe-actions';
import { Loader2, Image as ImageIcon, Film, RefreshCw, Wand2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Scene {
    visual: string;
    duration: number;
}

interface SceneRender {
    scene_index: number;
    start_frame_url?: string;
    end_frame_url?: string;
}

export default function StoryboardManager({ projectId, scenes, renders }: { projectId: string; scenes: Scene[]; renders: SceneRender[] }) {
  const router = useRouter();
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [generating, setGenerating] = useState<Set<string>>(new Set());

  const handleGenerate = async (sceneIndex: number, type: 'start' | 'end') => {
    const key = `${sceneIndex}-${type}`;
    setGenerating(prev => new Set(prev).add(key));
    
    try {
        await generateKeyframe(projectId, sceneIndex, type);
        router.refresh();
    } catch (error) {
        console.error(error);
        alert("Failed to generate keyframe");
    } finally {
        setGenerating(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
        });
    }
  };

  const handleContinue = () => {
    router.push(`/dashboard/project/${projectId}/studio`);
  };

  const selectedScene = scenes[selectedSceneIndex];
  const selectedRender = renders.find(r => r.scene_index === selectedSceneIndex);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden gap-6 pb-6">
      
      {/* LEFT: Scene Selector (Scrollable) */}
      <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <header className="mb-2">
            <h2 className="text-xl font-bold text-white">Storyboard</h2>
            <p className="text-neutral-400 text-xs">Select a scene to generate frames.</p>
        </header>

        {scenes.map((scene, index) => {
            const isSelected = index === selectedSceneIndex;
            const render = renders.find(r => r.scene_index === index);
            const hasStart = !!render?.start_frame_url;
            const hasEnd = !!render?.end_frame_url;
            const isComplete = hasStart && hasEnd;

            return (
                <div 
                    key={index} 
                    onClick={() => setSelectedSceneIndex(index)}
                    className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all duration-200 group relative overflow-hidden",
                        isSelected 
                            ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
                            : "bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/10"
                    )}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={cn("font-bold text-sm", isSelected ? "text-amber-400" : "text-neutral-400")}>
                            Scene {index + 1}
                        </span>
                        <div className="flex gap-1">
                            <StatusDot active={hasStart} />
                            <StatusDot active={hasEnd} />
                        </div>
                    </div>
                    <p className={cn("text-xs line-clamp-2", isSelected ? "text-neutral-200" : "text-neutral-500")}>
                        {scene.visual}
                    </p>
                    
                    {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                    )}
                </div>
            );
        })}
      </div>

      {/* RIGHT: Main Stage (Fixed) */}
      <div className="flex-1 flex flex-col min-w-0">
        <GlassCard className="flex-1 flex flex-col relative overflow-hidden border-white/10 bg-black/40">
            {/* Scene Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-black/20">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold text-white">Scene {selectedSceneIndex + 1}</h3>
                        <span className="bg-white/5 px-2 py-0.5 rounded text-xs font-mono text-neutral-400 border border-white/5">
                            {selectedScene.duration}s
                        </span>
                    </div>
                    <p className="text-neutral-300 text-sm max-w-2xl italic leading-relaxed">
                        "{selectedScene.visual}"
                    </p>
                </div>
            </div>

            {/* Frames Canvas */}
            <div className="flex-1 p-8 flex items-center justify-center gap-8 bg-[url('/grid.svg')] bg-center opacity-100">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={selectedSceneIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-8 w-full justify-center h-full max-h-[600px]"
                    >
                        <FrameEditor 
                            type="start"
                            url={selectedRender?.start_frame_url}
                            loading={generating.has(`${selectedSceneIndex}-start`)}
                            onGenerate={() => handleGenerate(selectedSceneIndex, 'start')}
                        />
                        
                        <div className="self-center">
                            <ArrowRight className="w-6 h-6 text-neutral-600" />
                        </div>

                        <FrameEditor 
                            type="end"
                            url={selectedRender?.end_frame_url}
                            loading={generating.has(`${selectedSceneIndex}-end`)}
                            onGenerate={() => handleGenerate(selectedSceneIndex, 'end')}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        </GlassCard>

        {/* Action Footer */}
        <div className="mt-4 flex justify-end">
             <button 
                onClick={handleContinue}
                className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
            >
                Continue to Studio <Film className="w-4 h-4" />
            </button>
        </div>
      </div>

    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
    return (
        <div className={cn("w-2 h-2 rounded-full", active ? "bg-green-500" : "bg-neutral-800")} />
    )
}

function FrameEditor({ type, url, loading, onGenerate }: { type: 'start' | 'end', url?: string, loading: boolean, onGenerate: () => void }) {
    return (
        <div className="h-full aspect-[9/16] bg-black/60 rounded-xl border border-white/10 flex flex-col relative group overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start">
                <span className="text-xs font-bold text-white uppercase tracking-widest bg-black/50 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                    {type} Frame
                </span>
                {url && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                        className="p-2 rounded-full bg-black/50 text-neutral-400 hover:text-white hover:bg-black/80 transition-colors backdrop-blur-md"
                        title="Regenerate"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                )}
            </div>

            {/* Image Area */}
            <div className="flex-1 relative w-full h-full">
                {url ? (
                    <Image src={url} alt={`${type} frame`} fill className="object-cover" />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-700 gap-4 p-4 text-center">
                        <ImageIcon className="w-12 h-12 opacity-20" />
                        <p className="text-xs font-mono opacity-40 uppercase">
                            {type === 'start' ? 'Initial State' : 'Final State'}
                        </p>
                    </div>
                )}

                {/* Generate Button (Center Overlay) */}
                {(!url || loading) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                         <button 
                            onClick={onGenerate}
                            disabled={loading}
                            className={cn(
                                "px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-xl hover:scale-105",
                                loading ? "bg-neutral-800 text-neutral-400 cursor-not-allowed" : "bg-amber-500 text-black hover:bg-amber-400"
                            )}
                        >
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                            {loading ? 'Generating...' : 'Generate Frame'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}