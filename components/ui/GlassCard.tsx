import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "panel" | "glow";
}

export function GlassCard({ children, className, variant = "default", ...props }: GlassCardProps) {
  const variants = {
    default: "glass-card",
    panel: "glass-panel",
    glow: "glass border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]",
  };

  return (
    <div 
      className={cn("rounded-xl p-6", variants[variant], className)} 
      {...props}
    >
      {children}
    </div>
  );
}
