'use client';

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Settings, 
  Sparkles, 
  Check, 
  LayoutGrid, 
  Plus, 
  ArrowLeft,
  LogOut,
  Clapperboard
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StudioNavigation() {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string;
  
  // Detect Mode
  const isWorkspace = !!projectId && pathname.includes(`/project/${projectId}`);

  // Define Menus
  const lobbySteps = [
    { id: 'dashboard', name: 'Projects', href: '/dashboard', icon: LayoutGrid, exact: true },
    { id: 'new', name: 'New Project', href: '/dashboard/new', icon: Plus },
  ];

  const workspaceSteps = [
    { 
      id: 'script', 
      name: 'Script', 
      href: `/dashboard/project/${projectId}/script`, 
      icon: FileText,
      description: 'Review & Edit'
    },
    { 
      id: 'assets', 
      name: 'Assets', 
      href: `/dashboard/project/${projectId}/assets`, 
      icon: ImageIcon, 
      description: 'Characters'
    },
    { 
      id: 'storyboard', 
      name: 'Storyboard', 
      href: `/dashboard/project/${projectId}/storyboard`, 
      icon: Clapperboard, 
      description: 'Keyframes'
    },
    { 
      id: 'studio', 
      name: 'Studio', 
      href: `/dashboard/project/${projectId}/studio`, 
      icon: Film, 
      description: 'Production'
    },
  ];

  const currentSteps = isWorkspace ? workspaceSteps : lobbySteps;
  
  // Calculate active index for progress line (only relevant in workspace mostly, but works for lobby too)
  const activeIndex = currentSteps.findIndex(step => {
    if (step.exact) return pathname === step.href;
    return pathname.includes(step.href);
  });

  return (
    <nav className="fixed left-8 top-0 bottom-0 z-50 flex flex-col justify-center w-16">
      
      {/* Dynamic Header / Back Button */}
      <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-4">
        <AnimatePresence mode="wait">
          {isWorkspace ? (
            <motion.div
              key="back-button"
              initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
            >
              <Link 
                href="/dashboard"
                className="w-12 h-12 rounded-full bg-neutral-900/80 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-amber-500/50 text-neutral-400 hover:text-amber-500 transition-all group"
                title="Back to Lobby"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="brand-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
               <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Sparkles className="w-6 h-6 text-amber-500" />
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Steps Container */}
      <div className="relative flex flex-col gap-6">
        {/* Connecting Lines (Only in Workspace Mode usually implies progression) */}
        {isWorkspace && (
          <>
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-white/5 -z-10 rounded-full" />
            <motion.div 
                className="absolute left-[23px] w-0.5 bg-amber-500/50 -z-10 rounded-full"
                initial={{ height: 0 }}
                animate={{ height: `${activeIndex * 74}px` }} // Distance adjustment
                transition={{ type: "spring", stiffness: 60, damping: 20 }}
                style={{ top: '10px' }}
            />
          </>
        )}

        {currentSteps.map((step, index) => {
          const isActive = step.exact ? pathname === step.href : pathname.includes(step.id);
          const isCompleted = isWorkspace && activeIndex > index;

          return (
            <Link key={step.id} href={step.href} className="group relative flex items-center h-12">
              {/* Sphere/Icon */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)] z-10 shrink-0",
                isActive 
                  ? "bg-amber-500 text-black border-amber-400 scale-110 shadow-[0_0_20px_rgba(245,158,11,0.4)]" 
                  : isCompleted
                    ? "bg-neutral-900 text-amber-500 border-amber-500/30"
                    : "bg-black/40 text-neutral-500 border-white/10 group-hover:border-white/30 group-hover:bg-white/5"
              )}>
                {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>

              {/* Label (Tooltip style) */}
              <div className="absolute left-full ml-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 0, x: -10 }} // Reset state if needed, though CSS handle hover better for simple visibility
                  className={cn(
                    "px-3 py-1.5 rounded-lg border backdrop-blur-md whitespace-nowrap transition-all duration-200",
                    "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0", // CSS Hover Logic
                    isActive 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200" 
                      : "bg-black/60 border-white/10 text-neutral-400"
                  )}
                >
                  <span className="text-sm font-bold block">{step.name}</span>
                  {isActive && step.description && <span className="text-[10px] opacity-70 font-normal">{step.description}</span>}
                </motion.div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer / Settings */}
       <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4">
          <Link href="/login" className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
          </Link>
       </div>
    </nav>
  );
}
