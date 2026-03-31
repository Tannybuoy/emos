import { useAppStore } from '@/store/use-app-store';
import { useLocation } from 'wouter';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { capture } from '@/lib/posthog';

export default function ResultsPage() {
  const { results, role, selectedStates, reset } = useAppStore();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (results?.playlists?.[0]) {
      capture('playlist_received', {
        playlist_id: results.playlists[0].id,
        mood: results.profile?.mood,
        energy: results.profile?.energyLevel,
      });
    }
  }, [results]);

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] text-center relative z-10 p-6">
        <h2 className="text-3xl font-display font-bold text-white mb-6">No sound profile found</h2>
        <button onClick={() => setLocation('/')} className="text-white hover:text-primary transition-colors font-display font-bold">Start Over</button>
      </div>
    );
  }

  const handleStartOver = () => {
    capture('session_restarted');
    reset();
    setLocation('/');
  };

  return (
    <div className="flex flex-col items-center h-[100dvh] md:h-auto md:min-h-screen px-6 pt-8 md:pt-16 pb-14 md:pb-24 relative z-10 w-full overflow-hidden md:overflow-visible">

      {/* Back to wheel */}
      <div className="w-full shrink-0 mb-2">
        <button
          onClick={() => setLocation('/wheel')}
          className="text-white/40 hover:text-white transition-colors flex items-center text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Wheel
        </button>
      </div>

      {/* Title — compact on mobile, elaborate on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center w-full max-w-4xl mx-auto mb-4 md:mb-16 shrink-0"
      >
        <h2 className="font-display font-bold leading-tight text-white">
          <span className="block text-2xl md:text-5xl lg:text-6xl italic font-light">
            <a href="/" className="text-primary hover:underline underline-offset-4">emos</a>
            <span className="text-primary"> tuned for</span>{' '}
            <span className="bg-primary text-black italic font-bold px-2 rounded">
              {role || 'you'}
            </span>
          </span>
          <span className="block text-sm md:text-xl text-white/60 font-normal not-italic mt-1 md:mt-2 tracking-wide lowercase">
            {selectedStates.join(' · ')}
          </span>
        </h2>
      </motion.div>

      {/* Playlist — fills all remaining vertical space */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 min-h-0 md:flex-none md:h-[352px] w-full max-w-2xl mx-auto"
      >
        {results.playlists?.[0] ? (
          <iframe
            src={results.playlists[0].embedUrl}
            width="100%"
            height="100%"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="rounded-2xl border-0 bg-card shadow-2xl shadow-primary/5 block"
          />
        ) : (
          <div className="h-full p-8 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center">
            <p className="text-white/40">No playlist available.</p>
          </div>
        )}
      </motion.div>

      {/* Bottom — fixed height, sits flush below the embed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-5 md:mt-8 flex flex-col items-center w-full shrink-0"
      >
        <button
          onClick={handleStartOver}
          className="flex items-center text-white/60 hover:text-white text-base md:text-lg font-display font-bold transition-colors mb-4 md:mb-6"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Start another session
        </button>

      </motion.div>
    </div>
  );
}
