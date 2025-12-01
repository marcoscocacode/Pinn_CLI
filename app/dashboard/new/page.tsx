'use client';

import { createProject } from '@/app/actions/create-project';
import { useState, useTransition } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { generateVideoIdeas, type GeneratedIdea } from '@/app/actions/generate-ideas';
import { Sparkles, ArrowRight, Loader2, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setIdeas([]);
    setSelectedIdea(null);
    
    try {
      const generatedIdeas = await generateVideoIdeas(topic);
      setIdeas(generatedIdeas);
    } catch (error) {
      console.error(error);
      alert("Failed to generate ideas. Please check your API key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    if (!selectedIdea) return;
    
    startTransition(async () => {
      try {
        const result = await createProject(topic, selectedIdea);
        
        if (!result.success) {
          if (result.error === 'unauthorized') {
            router.push('/login');
            return;
          }
          alert(result.error);
          return;
        }

        router.push(`/dashboard/project/${result.projectId}/script`);
      } catch (error) {
        console.error(error);
        alert("An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-center space-y-12">
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-500 mb-2 drop-shadow-sm">
          New Project
        </h1>
        <p className="text-neutral-400 text-lg">What do you want to create today?</p>
      </header>

      {/* Input Section */}
      <section className="space-y-4 max-w-2xl mx-auto text-center">
        <div className="relative">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The secret history of coffee..."
            className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-6 py-4 text-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-neutral-600"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="absolute right-2 top-2 bottom-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate
          </button>
        </div>
      </section>

      {/* Ideas Grid */}
      <section>
        {isGenerating && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="h-[400px] bg-white/5">
                <div />
              </GlassCard>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatePresence>
            {ideas.map((idea, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedIdea(idea)}
                className="cursor-pointer"
              >
                <GlassCard 
                  className={cn(
                    "h-full flex flex-col transition-all duration-300 relative overflow-hidden",
                    selectedIdea === idea 
                      ? "ring-2 ring-amber-500 bg-amber-500/10 scale-[1.02]" 
                      : "hover:bg-white/5 hover:-translate-y-1"
                  )}
                >
                  <div className="p-4 bg-amber-500/10 -m-6 mb-6 flex items-center gap-3 border-b border-white/5">
                    <Film className="w-5 h-5 text-amber-500" />
                    <span className="font-mono text-xs text-amber-300 uppercase tracking-widest">Concept {index + 1}</span>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-white">{idea.title}</h3>
                  <p className="text-neutral-400 flex-grow mb-6 leading-relaxed">
                    {idea.description}
                  </p>

                  <div className="space-y-3 text-sm border-t border-white/5 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Engagement</span>
                      <span className="text-green-400 font-medium">{idea.metrics.estimated_engagement}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Difficulty</span>
                      <span className={cn(
                        "font-medium",
                        idea.metrics.production_difficulty === 'High' ? 'text-red-400' : 
                        idea.metrics.production_difficulty === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                      )}>
                        {idea.metrics.production_difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Duration</span>
                      <span className="text-neutral-300">{idea.metrics.estimated_duration}</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Action Footer */}
      <AnimatePresence>
        {selectedIdea && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto bg-neutral-900/90 backdrop-blur-xl border border-amber-500/30 rounded-full p-2 pr-8 pl-8 flex items-center gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col">
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Selected Concept</span>
                <span className="font-bold text-amber-400">{selectedIdea.title}</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <button 
                onClick={handleContinue}
                disabled={isPending}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Start Scripting <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
