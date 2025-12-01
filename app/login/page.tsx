import { login, signup } from './actions'
import { GlassCard } from '@/components/ui/GlassCard'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const { message, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <GlassCard className="w-full max-w-md p-8 space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-amber-500">Welcome Back</h1>
          <p className="text-neutral-400">Sign in to your creative studio</p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-neutral-900/50 border border-neutral-700 rounded-lg px-4 py-2 focus:ring-amber-500 focus:border-amber-500 text-white"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full bg-neutral-900/50 border border-neutral-700 rounded-lg px-4 py-2 focus:ring-amber-500 focus:border-amber-500 text-white"
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <button formAction={login} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded-lg transition-colors cursor-pointer">
              Log in
            </button>
            <button formAction={signup} className="flex-1 bg-transparent border border-neutral-600 hover:border-amber-500 text-neutral-300 hover:text-amber-500 font-bold py-2 rounded-lg transition-colors cursor-pointer">
              Sign up
            </button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          
          {message && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">
              {message}
            </div>
          )}
        </form>
      </GlassCard>
    </div>
  )
}