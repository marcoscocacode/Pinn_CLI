'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GeneratedScript, generateScript } from '@/app/actions/generate-script';
import { saveScript } from '@/app/actions/script-actions';
import { Loader2, Wand2, Sparkles, Clock, Mic, Image as ImageIcon, CheckCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ScriptEditorProps {
  projectId: string;
  initialScript: GeneratedScript | null;
  ideaDescription: string;
  topic: string;
}

export default function ScriptEditor({ projectId, initialScript, ideaDescription, topic }: ScriptEditorProps) {
  const router = useRouter();
  const [script, setScript] = useState<GeneratedScript | null>(initialScript);
  const [isGenerating, startTransition] = useTransition();
  const hasAutoStarted = useRef(false);
  
  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debouncedSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Generate Script Function
  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      try {
        const generated = await generateScript(topic, ideaDescription);
        setScript(generated);
        await saveScript(projectId, generated);
        setLastSaved(new Date());
      } catch (error) {
        console.error(error);
        alert("Failed to generate script");
      }
    });
  }, [topic, ideaDescription, projectId]);

  // Auto-start generation
  useEffect(() => {
    if (!initialScript && !hasAutoStarted.current) {
        hasAutoStarted.current = true;
        handleGenerate();
    }
  }, [initialScript, handleGenerate]);

  // Handle Edit & Auto-Save
  const handleSceneChange = (sceneId: number, field: 'visual' | 'audio', value: string) => {
    if (!script) return;

    // Optimistic Update
    const updatedScenes = script.scenes.map(scene => 
        scene.id === sceneId ? { ...scene, [field]: value } : scene
    );
    
    const updatedScript = { ...script, scenes: updatedScenes };
    setScript(updatedScript);
    setIsSaving(true);

    // Debounce Save
    if (debouncedSaveTimeout.current) {
        clearTimeout(debouncedSaveTimeout.current);
    }

    debouncedSaveTimeout.current = setTimeout(async () => {
        try {
            await saveScript(projectId, updatedScript);
            setLastSaved(new Date());
        } catch (err) {
            console.error("Auto-save failed", err);
        } finally {
            setIsSaving(false);
        }
    }, 1500); // Save after 1.5s of inactivity
  };

  const handleApprove = () => {
    if (isSaving) {
        // Force immediate save if pending? 
        // For now, simple router push assuming debounce catches up or previous save worked.
        // Ideally we wait, but 1.5s is short.
    }
    router.push(`/dashboard/project/${projectId}/assets`);
  };

  // Loading State (Centered)
  if (!script) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="relative">
            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse-slow relative z-10 border border-amber-500/20 backdrop-blur-md">
                <Wand2 className="w-10 h-10 text-amber-500" />
            </div>
            <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping opacity-50" />
            <div className="absolute inset-[-20px] bg-amber-500/5 rounded-full blur-xl" />
        </div>
        
        <div className="max-w-md space-y-3">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-400">
                {isGenerating ? "Crafting Your Story..." : "Let's Write the Script"}
            </h2>
            <p className="text-neutral-400 text-lg leading-relaxed">
                {isGenerating 
                    ? "Gemini is analyzing your concept and structuring scenes for maximum engagement."
                    : `Gemini will generate a scene-by-scene script based on your concept.`
                }
            </p>
        </div>
        
        {!isGenerating && (
            <button
            onClick={handleGenerate}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
            <Sparkles className="w-5 h-5" />
            Generate Script
            </button>
        )}
      </div>
    );
  }

  // Editor State
  return (
    <div className="max-w-5xl mx-auto pb-32 relative">
      {/* Floating Pill Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-6 z-40 flex justify-center mb-8 pointer-events-none"
      >
        <div className="pointer-events-auto bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-full px-6 py-2.5 flex items-center gap-5 shadow-2xl ring-1 ring-white/5">
            <h2 className="font-bold text-white text-sm max-w-[200px] truncate">{script.title}</h2>
            
            <div className="w-px h-4 bg-white/10" />
            
            <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                <span>{script.scenes.length} Scenes</span>
                <span className="w-1 h-1 rounded-full bg-neutral-600" />
                <span>{script.scenes.reduce((acc, s) => acc + s.duration, 0)}s</span>
            </div>

            <div className="w-px h-4 bg-white/10" />

            <div className="text-xs font-mono w-[70px] flex justify-end">
                {isSaving ? (
                    <span className="flex items-center gap-1.5 text-amber-500"><Loader2 className="w-3 h-3 animate-spin" /> Saving</span>
                ) : lastSaved ? (
                    <span className="flex items-center gap-1.5 text-neutral-500"><CheckCircle className="w-3 h-3" /> Saved</span>
                ) : (
                    <span className="text-neutral-600">Draft</span>
                )}
            </div>
        </div>
      </motion.header>

      <div className="space-y-6">
        {script.scenes.map((scene, index) => (
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
              <GlassCard className="group hover:border-amber-500/30 transition-colors p-0 overflow-hidden">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Scene Meta */}
                    <div className="bg-white/5 border-b md:border-b-0 md:border-r border-white/5 p-4 flex md:flex-col items-center justify-between md:justify-center gap-2 min-w-[80px]">
                        <span className="text-2xl font-bold text-amber-500/50 group-hover:text-amber-500 transition-colors">#{index + 1}</span>
                        <div className="flex items-center gap-1 text-xs font-mono bg-black/40 px-2 py-1 rounded border border-white/5 text-neutral-400">
                            <Clock className="w-3 h-3" /> {scene.duration}s
                        </div>
                    </div>

                    {/* Content Editors */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                        {/* Visual Editor */}
                        <div className="p-6 border-b md:border-b-0 md:border-r border-white/5 space-y-3">
                            <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Visual Description
                            </label>
                            <textarea 
                                className="w-full bg-transparent text-neutral-200 leading-relaxed resize-none focus:outline-none focus:ring-0 min-h-[100px] placeholder:text-neutral-700"
                                value={scene.visual}
                                onChange={(e) => handleSceneChange(scene.id, 'visual', e.target.value)}
                                placeholder="Describe the scene visuals..."
                            />
                        </div>

                        {/* Audio Editor */}
                        <div className="p-6 space-y-3 bg-amber-500/[0.02]">
                            <label className="text-xs font-bold text-amber-500/50 uppercase flex items-center gap-2">
                                <Mic className="w-3 h-3" /> Audio / Voiceover
                            </label>
                            <textarea 
                                className="w-full bg-transparent text-amber-100/90 leading-relaxed italic resize-none focus:outline-none focus:ring-0 min-h-[100px] placeholder:text-amber-900/30"
                                value={scene.audio}
                                onChange={(e) => handleSceneChange(scene.id, 'audio', e.target.value)}
                                placeholder="Write the voiceover or dialogue..."
                            />
                        </div>
                    </div>
                </div>
              </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Floating Action Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none pl-32" // pl-32 to offset menu
      >
        <div className="pointer-events-auto bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 pr-2 flex items-center gap-4 shadow-2xl shadow-black/50">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Next Step</span>
                <span className="text-sm font-bold text-white">Character & Asset Analysis</span>
            </div>
            <button 
                onClick={handleApprove}
                className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105"
            >
                Approve & Analyze <CheckCircle className="w-4 h-4" />
            </button>
        </div>
      </motion.div>
    </div>
  );
}