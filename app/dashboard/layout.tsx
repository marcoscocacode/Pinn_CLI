import { createClient } from "@/utils/supabase/server";
import { StudioNavigation } from "@/components/layout/StudioNavigation";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden relative">
      {/* Global Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
         {/* Colorful Abstract Background Image */}
         <Image 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
            alt="Background"
            fill
            className="object-cover opacity-60"
            priority
         />
         
         {/* Overlays for depth and readability */}
         <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
         
         {/* Subtle Grain */}
         <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 mix-blend-overlay" />
      </div>

      {/* Global Navigation Dock */}
      <StudioNavigation />

      {/* Main Content Area */}
      {/* Padding left 32 (8rem) to clear the fixed navigation dock */}
      <main className="flex-1 overflow-auto relative z-10 pl-32"> 
        <div className="min-h-full w-full max-w-[1600px] mx-auto py-8 pr-8">
           {children}
        </div>
      </main>
    </div>
  );
}
