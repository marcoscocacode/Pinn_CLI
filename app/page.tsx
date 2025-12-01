import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-2xl">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 text-glow">
            Pinn
          </h1>
          <p className="text-xl text-neutral-400">
            Your AI-Powered One-Man Studio
          </p>
        </div>

        <GlassCard className="p-8 max-w-md w-full backdrop-blur-xl">
          <p className="text-neutral-300 mb-6">
            Transform ideas into viral videos with a complete AI pipeline. 
            From script to screen, orchestrated by Gemini.
          </p>
          
          <Link 
            href="/dashboard"
            className="block w-full py-3 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] text-center"
          >
            Enter Studio
          </Link>
        </GlassCard>
      </div>
    </main>
  );
}