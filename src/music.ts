// ─── Audio Engine ──────────────────────────────────────────────────────────────

let _audioCtx: AudioContext | null = null;

export function getAudioCtx(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (_audioCtx.state === "suspended") {
    _audioCtx.resume();
  }
  return _audioCtx;
}

export function playPianoNote(frequency: number): void {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.55, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.28, t + 0.18);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
  env.connect(ctx.destination);

  // Sine harmonics simulate piano timbre
  const partials: [number, number][] = [[1, 0.50], [2, 0.22], [3, 0.10], [4, 0.05], [5, 0.025]];
  for (const [ratio, amp] of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency * ratio;
    g.gain.value = amp;
    osc.connect(g);
    g.connect(env);
    osc.start(t);
    osc.stop(t + 2.2);
  }
}

// ─── Note metadata ─────────────────────────────────────────────────────────────

export const FREQS: Record<string, number> = {
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13,
  E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00,
  Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
};

/** Left-to-right order of the twelve keys on the keyboard. */
export const NOTE_ORDER = [
  "C4", "Cs4", "D4", "Ds4", "E4", "F4", "Fs4", "G4", "Gs4", "A4", "As4", "B4",
] as const;

export interface NoteInfo {
  /** Display name, e.g. "C" or "F♯". */
  name: string;
  /** Computer-keyboard key that plays this note. */
  kbd: string;
  black: boolean;
}

export const NOTE_META: Record<string, NoteInfo> = {
  C4:  { name: "C",  kbd: "Z", black: false },
  Cs4: { name: "C♯", kbd: "S", black: true },
  D4:  { name: "D",  kbd: "X", black: false },
  Ds4: { name: "D♯", kbd: "D", black: true },
  E4:  { name: "E",  kbd: "C", black: false },
  F4:  { name: "F",  kbd: "V", black: false },
  Fs4: { name: "F♯", kbd: "G", black: true },
  G4:  { name: "G",  kbd: "B", black: false },
  Gs4: { name: "G♯", kbd: "H", black: true },
  A4:  { name: "A",  kbd: "N", black: false },
  As4: { name: "A♯", kbd: "J", black: true },
  B4:  { name: "B",  kbd: "M", black: false },
};

// ─── Template songs ────────────────────────────────────────────────────────────
// Every song is arranged to fit the single octave C4–B4. Für Elise is shifted
// down so its opening phrase lands inside the range; the intervals — and so the
// tune — are unchanged. Edit these freely.

export interface Song {
  id: string;
  title: string;
  composer: string;
  hint: string;
  /** Milliseconds between notes when "Watch demo" plays it back. */
  tempo: number;
  notes: string[];
}

export const SONGS: Song[] = [
  {
    id: "ode-to-joy",
    title: "Ode to Joy",
    composer: "Beethoven",
    hint: "Symphony No. 9 — the friendliest place to start.",
    tempo: 430,
    notes: [
      "E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4", "C4", "C4", "D4", "E4", "E4", "D4", "D4",
      "E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4", "C4", "C4", "D4", "E4", "D4", "C4", "C4",
    ],
  },
  {
    id: "fur-elise",
    title: "Für Elise",
    composer: "Beethoven",
    hint: "Bagatelle No. 25 — the famous opening, shifted to fit one octave.",
    tempo: 300,
    notes: [
      "G4", "Fs4", "G4", "Fs4", "G4", "D4", "F4", "Ds4", "C4",
      "Ds4", "G4", "C4", "D4",
      "G4", "Fs4", "G4", "Fs4", "G4", "D4", "F4", "Ds4", "C4",
      "Ds4", "G4", "C4",
    ],
  },
  {
    id: "hes-a-pirate",
    title: "He's a Pirate",
    composer: "Hans Zimmer",
    hint: "Pirates of the Caribbean — the main march theme.",
    tempo: 300,
    notes: [
      "D4", "E4", "F4", "F4", "F4", "G4", "E4", "E4", "E4", "F4", "E4", "D4", "Cs4", "D4",
      "D4", "E4", "F4", "F4", "F4", "G4", "E4", "E4", "E4", "F4", "E4", "D4", "Cs4", "D4",
    ],
  },
];
