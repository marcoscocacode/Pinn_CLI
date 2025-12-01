'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, Film, Settings, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectNavigationProps {
  projectId: string;
}

export function ProjectNavigation({ projectId }: ProjectNavigationProps) {
  const pathname = usePathname();

  const steps = [
    { 
      id: 'script', 
      name: 'Script', 
      href: `/dashboard/project/${projectId}/script`, 
      icon: FileText,
      description: 'Review & Edit Scenes'
    },
    { 
      id: 'assets', 
      name: 'Assets', 
      href: `/dashboard/project/${projectId}/assets`, 
      icon: ImageIcon, 
      description: 'Characters & Consistency'
    },
    { 
      id: 'studio', 
      name: 'Studio', 
      href: `/dashboard/project/${projectId}/studio`, 
      icon: Film, 
      description: 'Render & Export'
    },
    // Settings is usually not a step in the linear process, but valid navigation
    // { id: 'settings', name: 'Settings', href: `/dashboard/project/${projectId}/settings`, icon: Settings } 
  ];

  // Determine active step index for progress line
  const activeIndex = steps.findIndex(step => pathname.includes(step.id));

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-8">
      {/* Brand / Home Link */}
      <Link href="/dashboard" className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:border-amber-500/50 transition-colors group mb-4 shadow-lg">
         <Sparkles className="w-5 h-5 text-amber-500 group-hover:rotate-12 transition-transform" />
      </Link>

      {/* Steps Container */}
      <div className="relative flex flex-col gap-6">
        {/* Connecting Line */}
        <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-white/5 -z-10 rounded-full" />
        <motion.div 
            className="absolute left-[23px] w-0.5 bg-amber-500/50 -z-10 rounded-full"
            initial={{ height: 0 }}
            animate={{ height: `${activeIndex * 80}px` }} // Approx distance between items
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
            style={{ top: '16px' }}
        />

        {steps.map((step, index) => {
          const isActive = pathname.includes(step.id);
          const isCompleted = activeIndex > index;

          return (
            <Link key={step.id} href={step.href} className="group relative flex items-center">
              {/* Sphere/Icon */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)] z-10",
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
                  animate={{ 
                    opacity: isActive || isCompleted ? 1 : 0, 
                    x: isActive || isCompleted ? 0 : -10 
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border backdrop-blur-md whitespace-nowrap",
                    isActive 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200" 
                      : "bg-black/60 border-white/10 text-neutral-400"
                  )}
                >
                  <span className="text-sm font-bold block">{step.name}</span>
                  {isActive && <span className="text-[10px] opacity-70 font-normal">{step.description}</span>}
                </motion.div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
