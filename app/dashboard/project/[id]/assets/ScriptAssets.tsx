'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { analyzeScriptForAssets, generateAssetImage } from '@/app/actions/asset-actions';
import { Loader2, Box, User, MapPin, Wand2, CheckCircle, Image as ImageIcon, Sparkles, Film, ArrowRight, Clapperboard } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Asset {
  id: string;
  type: string;
  url: string;
  prompt: string;
  metadata: any;
}

export default function AssetManager({ projectId, assets }: { projectId: string; assets: Asset[] }) {
  const router = useRouter();
  const [isAnalyzing, startAnalysis] = useTransition();
  const [generatingAssets, setGeneratingAssets] = useState<Set<string>>(new Set());
  const hasAutoStarted = useRef(false);

  const handleAnalyze = () => {
    startAnalysis(async () => {
      try {
        await analyzeScriptForAssets(projectId);
      } catch (error) {
        console.error(error);
        alert("Failed to analyze script");
      }
    });
  };

  // Auto-start analysis if no assets exist
  useEffect(() => {
    if (assets.length === 0 && !hasAutoStarted.current) {
        hasAutoStarted.current = true;
        handleAnalyze();
    }
  }, [assets.length]);

  const handleGenerateImage = async (assetId: string) => {
    setGeneratingAssets(prev => new Set(prev).add(assetId));
    try {
        await generateAssetImage(assetId);
        router.refresh(); // Soft refresh to show new image
    } catch (error) {
        console.error(error);
        alert("Failed to generate image");
    } finally {
        setGeneratingAssets(prev => {
            const newSet = new Set(prev);
            newSet.delete(assetId);
            return newSet;
        });
    }
  };

  const handleContinue = () => {
    router.push(`/dashboard/project/${projectId}/storyboard`);
  };

  // Loading / Empty State (Auto-Analyzing)
  if (assets.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="relative">
             <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center relative z-10 border border-amber-500/20 backdrop-blur-md">
                {isAnalyzing ? (
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                ) : (
                    <Wand2 className="w-10 h-10 text-amber-500" />
                )}
            </div>
            {isAnalyzing && (
                <>
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping opacity-50" />
                    <div className="absolute inset-[-20px] bg-amber-500/5 rounded-full blur-xl" />
                </>
            )}
        </div>

        <div className="max-w-md space-y-3">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-400">
                {isAnalyzing ? "Analyzing Script Entities..." : "No Assets Found"}
            </h2>
            <p className="text-neutral-400 text-lg leading-relaxed">
                {isAnalyzing 
                    ? "Gemini is reading your script to identify characters, locations, and key items for consistency."
                    : "We couldn't find any assets. You can try analyzing again."
                }
            </p>
        </div>
        
        {!isAnalyzing && (
            <button
              onClick={handleAnalyze}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              Analyze Script Again
            </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex items-center gap-4 mb-8">
        <div className="bg-amber-500/10 p-3 rounded-full border border-amber-500/20">
            <Box className="w-6 h-6 text-amber-500" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-white mb-1">Project Assets</h2>
            <p className="text-neutral-400 text-sm">{assets.length} items identified from script</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {assets.map((asset) => {
            const isGenerated = !!asset.url;
            const isGenerating = generatingAssets.has(asset.id);
            
            // Determine Type (Check both metadata and root property if available)
            // The DB schema has a 'type' column, and we also store it in metadata.
            const rawType = asset.metadata?.type || asset.type || 'item'; 
            const type = rawType.toLowerCase();

            const Icon = type.includes('character') ? User : type.includes('location') ? MapPin : Box;
            
            // Determine Badge Color
            const badgeColor = type.includes('character') ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                               type.includes('location') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 
                               'bg-amber-500/20 text-amber-300 border-amber-500/30';

            return (
                <GlassCard key={asset.id} className="group relative overflow-hidden flex flex-col p-0 border border-white/5 hover:border-amber-500/30 transition-colors">
                    {/* Image Area - 9:16 Aspect Ratio */}
                    <div className="aspect-[9/16] bg-black/40 relative overflow-hidden border-b border-white/5">
                        {isGenerated ? (
                            <Image 
                                src={asset.url} 
                                alt={asset.metadata.name} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-105" 
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-700 gap-3">
                                <ImageIcon className="w-12 h-12 opacity-50" />
                                <span className="text-xs font-mono uppercase tracking-widest opacity-50">Pending Generation</span>
                            </div>
                        )}
                        
                        {/* Type Badge (Overlay) */}
                        <div className="absolute top-3 left-3 z-10">
                            <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 uppercase tracking-wide", badgeColor)}>
                                <Icon className="w-3 h-3" />
                                {type}
                            </span>
                        </div>

                        {/* Generate Overlay */}
                        {!isGenerated && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <button
                                    onClick={() => handleGenerateImage(asset.id)}
                                    disabled={isGenerating}
                                    className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                                    Generate 9:16
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-white">{asset.metadata.name}</h3>
                            {isGenerated && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-4">{asset.prompt}</p>
                        
                        <div className="text-[10px] text-neutral-600 font-mono uppercase tracking-wider">
                            Scenes: {asset.metadata.appearances?.join(', ')}
                        </div>
                    </div>
                </GlassCard>
            );
        })}
      </div>

      {/* Floating Action Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none pl-32"
      >
        <div className="pointer-events-auto bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 pr-2 flex items-center gap-4 shadow-2xl shadow-black/50">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Next Step</span>
                <span className="text-sm font-bold text-white">Storyboard & Keyframes</span>
            </div>
            <button 
                onClick={handleContinue}
                className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105"
            >
                Go to Storyboard <Clapperboard className="w-4 h-4" />
            </button>
        </div>
      </motion.div>
    </div>
  );
}