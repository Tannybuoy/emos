import { useLocation } from 'wouter';
import { useAppStore } from '@/store/use-app-store';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { capture } from '@/lib/posthog';

export default function LandingPage() {
  const { role, setRole } = useAppStore();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role.trim()) {
      capture('role_entered', { role: role.trim() });
      setLocation('/wheel');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 relative z-10 w-full">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl text-center flex flex-col items-center"
      >
        <div className="inline-block mb-8 px-4 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md shadow-xl">
          <span className="text-sm font-sans font-medium text-white/80 tracking-wide lowercase">welcome to emos</span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-display font-extrabold text-white leading-none tracking-tighter mb-12">
          tune your <br />
          <span className="text-primary italic">work self.</span>
        </h1>
        
        <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto flex flex-col gap-8">
          <div className="relative group w-full">
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="What's your role? (e.g. Engineer)"
              className="w-full bg-transparent border-b border-white/20 focus:border-primary text-lg md:text-4xl text-center text-white placeholder:text-white/20 pb-4 outline-none transition-colors duration-500 font-display"
              autoFocus
            />
          </div>
          <Button 
            type="submit" 
            disabled={!role.trim()}
            className="w-full sm:w-auto self-center group"
          >
            build playlist <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
