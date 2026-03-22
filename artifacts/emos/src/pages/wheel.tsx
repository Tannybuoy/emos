import { useState, useRef } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLocation } from 'wouter';
import { useGenerateMusicProfile } from '@workspace/api-client-react';
import { EmotionWheel } from '@/components/emotion-wheel';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { capture } from '@/lib/posthog';

const RING_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  // Inner — orange
  Focused:      { text: '#FF8C00', border: '#FF8C00', bg: 'rgba(255,140,0,0.1)' },
  Stressed:     { text: '#FF8C00', border: '#FF8C00', bg: 'rgba(255,140,0,0.1)' },
  Tired:        { text: '#FF8C00', border: '#FF8C00', bg: 'rgba(255,140,0,0.1)' },
  Energized:    { text: '#FF8C00', border: '#FF8C00', bg: 'rgba(255,140,0,0.1)' },
  Bored:        { text: '#FF8C00', border: '#FF8C00', bg: 'rgba(255,140,0,0.1)' },
  // Middle — lime
  Calm:         { text: '#CBFF00', border: '#CBFF00', bg: 'rgba(203,255,0,0.1)' },
  Anxious:      { text: '#CBFF00', border: '#CBFF00', bg: 'rgba(203,255,0,0.1)' },
  Distracted:   { text: '#CBFF00', border: '#CBFF00', bg: 'rgba(203,255,0,0.1)' },
  'Locked-in':  { text: '#CBFF00', border: '#CBFF00', bg: 'rgba(203,255,0,0.1)' },
  Overwhelmed:  { text: '#CBFF00', border: '#CBFF00', bg: 'rgba(203,255,0,0.1)' },
  'In Control': { text: '#CBFF00', border: '#CBFF00', bg: 'rgba(203,255,0,0.1)' },
  Curious:      { text: '#CBFF00', border: '#CBFF00', bg: 'rgba(203,255,0,0.1)' },
  Blocked:      { text: '#CBFF00', border: '#CBFF00', bg: 'rgba(203,255,0,0.1)' },
  // Outer — blue
  Start:        { text: '#4DB8FF', border: '#4DB8FF', bg: 'rgba(77,184,255,0.1)' },
  Continue:     { text: '#4DB8FF', border: '#4DB8FF', bg: 'rgba(77,184,255,0.1)' },
  Finish:       { text: '#4DB8FF', border: '#4DB8FF', bg: 'rgba(77,184,255,0.1)' },
  Recover:      { text: '#4DB8FF', border: '#4DB8FF', bg: 'rgba(77,184,255,0.1)' },
};

const RING_NAMES: Record<string, string> = {
  Focused: 'primary', Stressed: 'primary', Tired: 'primary', Energized: 'primary', Bored: 'primary',
  Calm: 'modifier', Anxious: 'modifier', Distracted: 'modifier', 'Locked-in': 'modifier',
  Overwhelmed: 'modifier', 'In Control': 'modifier', Curious: 'modifier', Blocked: 'modifier',
  Start: 'intent', Continue: 'intent', Finish: 'intent', Recover: 'intent',
};

const LANGUAGES = [
  { value: 'any',        label: 'Any language' },
  { value: 'english',   label: 'English' },
  { value: 'spanish',   label: 'Spanish' },
  { value: 'french',    label: 'French' },
  { value: 'japanese',  label: 'Japanese' },
  { value: 'korean',    label: 'Korean' },
  { value: 'portuguese',label: 'Portuguese' },
  { value: 'hindi',     label: 'Hindi' },
  { value: 'arabic',    label: 'Arabic' },
  { value: 'german',    label: 'German' },
];

export default function WheelPage() {
  const { role, selectedStates, toggleState, setResults, instrumental, setInstrumental, language, setLanguage } = useAppStore();
  const [, setLocation] = useLocation();
  const [showLimit, setShowLimit] = useState(false);
  const limitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerLimit = () => {
    if (limitTimer.current) clearTimeout(limitTimer.current);
    setShowLimit(true);
    limitTimer.current = setTimeout(() => setShowLimit(false), 2000);
  };

  const hasPrimary  = selectedStates.some(s => RING_NAMES[s] === 'primary');
  const hasModifier = selectedStates.some(s => RING_NAMES[s] === 'modifier');
  const hasIntent   = selectedStates.some(s => RING_NAMES[s] === 'intent');
  const activeRing: 'primary' | 'modifier' | 'intent' | 'done' =
    !hasPrimary  ? 'primary'  :
    !hasModifier ? 'modifier' :
    !hasIntent   ? 'intent'   : 'done';

  const mutation = useGenerateMusicProfile();

  const handleToggleState = (state: string) => {
    const isSelected = selectedStates.includes(state);
    if (isSelected) {
      capture('state_deselected', { state, ring: RING_NAMES[state] ?? 'unknown' });
      toggleState(state);
    } else if (selectedStates.length >= 5) {
      triggerLimit();
    } else {
      capture('state_selected', { state, ring: RING_NAMES[state] ?? 'unknown' });
      toggleState(state);
    }
  };

  const handleSetInstrumental = (v: boolean) => {
    capture('instrumental_toggled', { enabled: v });
    setInstrumental(v);
  };

  const handleSetLanguage = (v: string) => {
    capture('language_changed', { language: v });
    setLanguage(v);
  };

  const handleGenerate = () => {
    if (selectedStates.length < 3) {
      toast.error('Select at least 3 states to build your profile');
      return;
    }
    capture('playlist_requested', { role: role || 'Knowledge Worker', states: selectedStates, instrumental, language });
    mutation.mutate(
      { data: { role: role || 'Knowledge Worker', states: selectedStates, instrumental, language } },
      {
        onSuccess: (data) => {
          setResults(data);
          setLocation('/results');
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to generate profile');
        }
      }
    );
  };

  return (
    <div className="flex flex-col items-center h-[100dvh] px-4 pt-3 pb-14 relative z-10 w-full overflow-hidden">

      {/* Top bar — back button left, controls right, in normal flow so no overlap */}
      <div className="flex items-center justify-between w-full shrink-0 mb-2">
        <button
          onClick={() => setLocation('/')}
          className="text-white/40 hover:text-white transition-colors flex items-center text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Role
        </button>

        <div className="flex items-center gap-3">
          {/* Instrumental toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className={`text-xs font-medium transition-colors ${instrumental ? 'text-primary' : 'text-white/40'}`}>
              Instrumental
            </span>
            <Switch
              checked={instrumental}
              onCheckedChange={handleSetInstrumental}
              className="data-[state=checked]:bg-primary"
            />
          </label>

          {/* Language selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleSetLanguage(e.target.value)}
              className="appearance-none bg-transparent border border-white/20 hover:border-primary/60 text-white/60 hover:text-white text-xs font-medium rounded-md px-3 py-1.5 pr-7 cursor-pointer transition-colors focus:outline-none focus:border-primary focus:text-white"
              style={{ backgroundImage: 'none' }}
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value} className="bg-black text-white">
                  {l.label}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 justify-center max-w-2xl w-full shrink-0 min-h-[32px] mb-1">
        <AnimatePresence>
          {selectedStates.map(state => {
            const color = RING_COLORS[state] ?? { text: '#CBFF00', border: '#CBFF00', bg: 'rgba(203,255,0,0.1)' };
            return (
              <motion.div
                key={state}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-3 py-1 rounded-full text-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                style={{
                  color: color.text,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: color.border,
                  backgroundColor: color.bg,
                }}
                onClick={() => handleToggleState(state)}
              >
                {state}
                <X className="w-3.5 h-3.5 opacity-70" style={{ color: color.text }} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Wheel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex-1 min-h-0 w-full flex justify-center"
      >
        <EmotionWheel
          selectedStates={selectedStates}
          toggleState={handleToggleState}
          onAtLimit={triggerLimit}
          activeRing={activeRing}
        />
      </motion.div>

      {/* Bottom action */}
      <div className="h-14 w-full flex justify-center items-center shrink-0">
        <AnimatePresence mode="wait">
          {showLimit ? (
            <motion.p
              key="limit"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-destructive text-lg font-medium"
            >
              cannot select more than 5
            </motion.p>
          ) : selectedStates.length >= 3 ? (
            <motion.div
              key="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Button onClick={handleGenerate} disabled={mutation.isPending} className="w-64 h-12 text-xl group">
                {mutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>my emos playlist <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </motion.div>
          ) : (() => {
            const hints = !hasPrimary
              ? { key: 'hint-primary',  text: 'select your physical state', color: '#FF8C00' }
              : !hasModifier
              ? { key: 'hint-modifier', text: 'select your mental state',   color: '#CBFF00' }
              : { key: 'hint-intent',   text: 'select your intent',         color: '#4DB8FF' };
            return (
              <motion.p
                key={hints.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-lg font-medium"
                style={{ color: hints.color }}
              >
                {hints.text}
              </motion.p>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
