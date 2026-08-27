import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Piano, { type PianoHandle } from "./Piano";
import { NOTE_META, SONGS, type Song } from "./music";

// Change this to your own site / profile if you like.
const BUILT_BY_URL = "https://github.com/mycodedump";

const PIANO_W = 580;
const PIANO_H = 272;

interface PlayedNote {
  id: string;
  t: number;
}

export default function App() {
  const pianoRef = useRef<PianoHandle>(null);

  // ── Tutorial state ──────────────────────────────────────────────────────────
  const [songId, setSongId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const song = SONGS.find(s => s.id === songId) ?? null;
  const finished = song ? step >= song.notes.length : false;
  const nextNote = song && !finished ? song.notes[step] : null;

  const songIdRef = useRef<string | null>(null);
  useEffect(() => { songIdRef.current = songId; }, [songId]);

  // ── Demo playback ───────────────────────────────────────────────────────────
  const [demoOn, setDemoOn] = useState(false);
  const [demoHi, setDemoHi] = useState<string[]>([]);
  const demoTimer = useRef<number | null>(null);
  const demoActive = useRef(false);

  const stopDemo = useCallback(() => {
    demoActive.current = false;
    if (demoTimer.current) window.clearTimeout(demoTimer.current);
    demoTimer.current = null;
    setDemoOn(false);
    setDemoHi([]);
  }, []);

  const runDemo = useCallback((s: Song) => {
    stopDemo();
    setStep(0);
    setDemoOn(true);
    demoActive.current = true;
    let i = 0;
    const tick = () => {
      if (!demoActive.current) return;
      if (i >= s.notes.length) {
        stopDemo();
        return;
      }
      const n = s.notes[i];
      setDemoHi([n]);
      pianoRef.current?.press(n);
      i += 1;
      demoTimer.current = window.setTimeout(tick, s.tempo);
    };
    tick();
  }, [stopDemo]);

  // ── Composition capture ─────────────────────────────────────────────────────
  const [history, setHistory] = useState<PlayedNote[]>([]);
  const [replaying, setReplaying] = useState(false);
  const replayActive = useRef(false);
  const replayTimers = useRef<number[]>([]);
  const compScrollRef = useRef<HTMLDivElement>(null);

  const clearReplayTimers = () => {
    replayTimers.current.forEach(t => window.clearTimeout(t));
    replayTimers.current = [];
  };

  const replayComposition = useCallback(() => {
    if (replayActive.current || history.length === 0) return;
    stopDemo();
    setReplaying(true);
    replayActive.current = true;
    let acc = 0;
    history.forEach((ev, i) => {
      if (i > 0) acc += Math.min(ev.t - history[i - 1].t, 700);
      const timer = window.setTimeout(() => pianoRef.current?.press(ev.id), acc);
      replayTimers.current.push(timer);
    });
    const end = window.setTimeout(() => {
      replayActive.current = false;
      setReplaying(false);
    }, acc + 400);
    replayTimers.current.push(end);
  }, [history, stopDemo]);

  useEffect(() => {
    // Keep the composition strip scrolled to the newest note.
    const el = compScrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [history]);

  // ── Note handler (pointer / keyboard / press) ───────────────────────────────
  const handleNote = useCallback((id: string) => {
    if (demoActive.current || replayActive.current) return;

    setHistory(h => {
      const next = h.length >= 64 ? h.slice(h.length - 63) : h.slice();
      next.push({ id, t: performance.now() });
      return next;
    });

    const so = SONGS.find(s => s.id === songIdRef.current);
    if (!so) return;
    setStep(s => (id === so.notes[s] ? s + 1 : s));
  }, []);

  // ── Song selection ──────────────────────────────────────────────────────────
  const selectSong = (id: string) => {
    stopDemo();
    setStep(0);
    setSongId(prev => (prev === id ? null : id));
  };

  // ── Responsive scaling — piano fills its slot on any screen ─────────────────
  const slotRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const maxScale = coarse ? 3 : 1.4;
    const fillMode = window.matchMedia(
      "(orientation: landscape) and (max-height: 540px)",
    );
    const measure = () => {
      const w = slot.clientWidth;
      // In mobile-landscape fill mode the slot spans the whole screen and the
      // control bars float on top — keep the keys clear of them.
      const h = slot.clientHeight - (fillMode.matches ? 92 : 0);
      const s = Math.min(w / (PIANO_W + 8), h / (PIANO_H + 12));
      setScale(Math.max(0.33, Math.min(maxScale, s)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(slot);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  // ── Rotate-to-landscape hint (mobile portrait only) ─────────────────────────
  const [showRotate, setShowRotate] = useState(false);
  const [rotateDismissed, setRotateDismissed] = useState(false);
  useEffect(() => {
    const check = () => {
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      const smallCoarse = window.matchMedia(
        "(max-width: 900px) and (pointer: coarse)",
      ).matches;
      setShowRotate(portrait && smallCoarse);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  useEffect(() => () => {
    if (demoTimer.current) window.clearTimeout(demoTimer.current);
    clearReplayTimers();
  }, []);

  const highlightKeys = demoOn ? demoHi : nextNote ? [nextNote] : [];

  return (
    <div className="pn-app">
      {/* ── Song tutorial ────────────────────────────────────────────────── */}
      <div className="pn-panel pn-controls">
        <div className="pn-songs">
          <span className="pn-songs-label">Learn a song</span>
          <div className="pn-pills">
            {SONGS.map(s => (
              <button
                key={s.id}
                className={"pn-pill" + (s.id === songId ? " active" : "")}
                onClick={() => selectSong(s.id)}
              >
                <span>{s.title}</span>
                <small>{s.composer}</small>
              </button>
            ))}
          </div>
        </div>

        {song && (
          <div className="pn-tutor">
            {finished ? (
              <div className="pn-tutor-row">
                <span className="pn-done">🎉 You played {song.title}!</span>
                <button className="pn-btn accent" onClick={() => setStep(0)}>
                  Play again
                </button>
                <button className="pn-btn" onClick={() => runDemo(song)}>
                  ▶ Watch demo
                </button>
              </div>
            ) : (
              <div className="pn-tutor-row">
                {demoOn ? (
                  <span className="pn-demo-label">▶ Playing demo…</span>
                ) : (
                  <>
                    <span className="pn-next-label">Next</span>
                    <kbd className="pn-kbd">{NOTE_META[nextNote!].kbd}</kbd>
                    <span className="pn-arrow">→</span>
                    <span className="pn-next-note">{NOTE_META[nextNote!].name}</span>
                  </>
                )}
                <span className="pn-prog">
                  {step}/{song.notes.length}
                </span>
                <div className="pn-spacer" />
                {demoOn ? (
                  <button className="pn-btn" onClick={stopDemo}>
                    Stop
                  </button>
                ) : (
                  <button className="pn-btn" onClick={() => runDemo(song)}>
                    ▶ Watch demo
                  </button>
                )}
                <button
                  className="pn-btn"
                  onClick={() => {
                    stopDemo();
                    setStep(0);
                  }}
                >
                  Restart
                </button>
              </div>
            )}
            <div className="pn-chips">
              {song.notes.map((_, i) => (
                <i
                  key={i}
                  className={
                    "pn-chip" +
                    (i < step ? " done" : i === step && !finished ? " cur" : "")
                  }
                />
              ))}
            </div>
            <p className="pn-hint">{song.hint}</p>
          </div>
        )}
      </div>

      {/* ── Piano ────────────────────────────────────────────────────────── */}
      <div className="pn-slot" ref={slotRef}>
        <div
          style={{
            width: PIANO_W,
            height: PIANO_H,
            transform: `scale(${scale})`,
            transformOrigin: "center",
            flexShrink: 0,
          }}
        >
          <Piano ref={pianoRef} highlightKeys={highlightKeys} onNote={handleNote} />
        </div>
      </div>

      {/* ── Composition ──────────────────────────────────────────────────── */}
      <div className="pn-panel pn-comp">
        <div className="pn-comp-head">
          <strong>Your composition</strong>
          <span className="pn-muted">
            {history.length ? `last ${history.length} notes` : "nothing yet"}
          </span>
          <div className="pn-spacer" />
          <button
            className="pn-btn"
            disabled={!history.length || replaying || demoOn}
            onClick={replayComposition}
          >
            ▶ Replay
          </button>
          <button
            className="pn-btn"
            disabled={!history.length || replaying}
            onClick={() => setHistory([])}
          >
            Clear
          </button>
        </div>
        <div className="pn-comp-notes" ref={compScrollRef}>
          {history.length === 0 ? (
            <span className="pn-muted">
              Play the keys — your last notes are captured here so you can replay them.
            </span>
          ) : (
            history.map((ev, i) => (
              <span key={i} className="pn-cnote">
                {NOTE_META[ev.id].name}
              </span>
            ))
          )}
        </div>
      </div>

      <footer className="pn-footer">
        <a href={BUILT_BY_URL} target="_blank" rel="noopener noreferrer">
          Built by Laxmi Mahajan
        </a>
        <span className="pn-dot">·</span>
        <span className="pn-muted">Click keys or press Z S X D C · V G B H N J M</span>
      </footer>

      {showRotate && !rotateDismissed && (
        <div className="pn-rotate">
          <div className="pn-rotate-card">
            <div className="pn-rotate-icon">📱 ↻</div>
            <p>Rotate your device to landscape for the full-size keyboard.</p>
            <button className="pn-btn" onClick={() => setRotateDismissed(true)}>
              Continue anyway
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
