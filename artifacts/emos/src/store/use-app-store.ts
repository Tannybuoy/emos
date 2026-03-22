import { create } from 'zustand';
import type { GenerateMusicProfileResponse } from '@workspace/api-client-react';

interface AppStore {
  role: string;
  setRole: (role: string) => void;
  selectedStates: string[];
  toggleState: (state: string) => void;
  instrumental: boolean;
  setInstrumental: (v: boolean) => void;
  language: string;
  setLanguage: (v: string) => void;
  results: GenerateMusicProfileResponse | null;
  setResults: (results: GenerateMusicProfileResponse | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  role: '',
  setRole: (role) => set({ role }),
  selectedStates: [],
  toggleState: (state) => set((prev) => {
    const isSelected = prev.selectedStates.includes(state);
    if (isSelected) {
      return { selectedStates: prev.selectedStates.filter(s => s !== state) };
    }
    if (prev.selectedStates.length >= 5) return prev;
    return { selectedStates: [...prev.selectedStates, state] };
  }),
  instrumental: false,
  setInstrumental: (v) => set({ instrumental: v }),
  language: 'any',
  setLanguage: (v) => set({ language: v }),
  results: null,
  setResults: (results) => set({ results }),
  reset: () => set({ role: '', selectedStates: [], results: null, instrumental: false, language: 'any' }),
}));
