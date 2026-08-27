import { useState, useEffect, useRef, useCallback } from "react";
import svgPaths from "../imports/svg-yoltbw2dg9";

// ─── Audio Engine ──────────────────────────────────────────────────────────────

let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (_audioCtx.state === "suspended") {
    _audioCtx.resume();
  }
  return _audioCtx;
}

function playPianoNote(frequency: number): void {
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

// ─── Key Data ──────────────────────────────────────────────────────────────────

const FREQS: Record<string, number> = {
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13,
  E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00,
  Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
};

interface WhiteKeyDef {
  id: string; label: string;
  left: number; w: number; svgW: number;
  insetR: string; insetL: string;
  path: string; flip: boolean;
}

const WHITE_KEYS: WhiteKeyDef[] = [
  { id: "C4", label: "C", left: 14,  w: 67, svgW: 79, insetR: "-11.94%", insetL: "-5.97%", path: svgPaths.p1b1e1000, flip: false },
  { id: "D4", label: "D", left: 95,  w: 65, svgW: 77, insetR: "-12.31%", insetL: "-6.15%", path: svgPaths.p112b5f00, flip: false },
  { id: "E4", label: "E", left: 174, w: 67, svgW: 79, insetR: "-11.94%", insetL: "-5.97%", path: svgPaths.p1e3d4e00, flip: true  },
  { id: "F4", label: "F", left: 255, w: 67, svgW: 79, insetR: "-11.94%", insetL: "-5.97%", path: svgPaths.p1e3d4e00, flip: false },
  { id: "G4", label: "G", left: 336, w: 65, svgW: 77, insetR: "-12.31%", insetL: "-6.15%", path: svgPaths.p112b5f00, flip: false },
  { id: "A4", label: "A", left: 415, w: 65, svgW: 77, insetR: "-12.31%", insetL: "-6.15%", path: svgPaths.p112b5f00, flip: false },
  { id: "B4", label: "B", left: 494, w: 67, svgW: 79, insetR: "-11.94%", insetL: "-5.97%", path: svgPaths.p3b786a00, flip: true  },
];

interface BlackKeyDef { id: string; label: string; left: number }

const BLACK_KEYS: BlackKeyDef[] = [
  { id: "Cs4", label: "C♯", left: 68  },
  { id: "Ds4", label: "D♯", left: 147 },
  { id: "Fs4", label: "F♯", left: 309 },
  { id: "Gs4", label: "G♯", left: 388 },
  { id: "As4", label: "A♯", left: 467 },
];

// Standard QWERTY piano mapping (bottom two rows)
const KB_MAP: Record<string, string> = {
  z: "C4", s: "Cs4", x: "D4", d: "Ds4", c: "E4",
  v: "F4", g: "Fs4", b: "G4", h: "Gs4", n: "A4", j: "As4", m: "B4",
};

// ─── SVG Filter for White Keys ─────────────────────────────────────────────────

function WKFilter({ id, width }: { id: string; width: number }) {
  return (
    <filter
      colorInterpolationFilters="sRGB"
      filterUnits="userSpaceOnUse"
      height="203"
      id={id}
      width={width}
      x="0"
      y="-1"
    >
      <feFlood floodOpacity="0" result="BackgroundImageFix" />
      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dx="3" dy="3" />
      <feGaussianBlur stdDeviation="2.5" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0" />
      <feBlend in2="BackgroundImageFix" mode="normal" result="ds1" />
      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dy="2" />
      <feGaussianBlur stdDeviation="2" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0" />
      <feBlend in2="ds1" mode="normal" result="ds2" />
      <feBlend in="SourceGraphic" in2="ds2" mode="normal" result="shape" />
      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dx="3" />
      <feGaussianBlur stdDeviation="1" />
      <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.8 0" />
      <feBlend in2="shape" mode="normal" result="is1" />
      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dy="-3" />
      <feGaussianBlur stdDeviation="2.5" />
      <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0" />
      <feBlend in2="is1" mode="normal" result="is2" />
      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dx="-3" />
      <feGaussianBlur stdDeviation="2" />
      <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.17 0" />
      <feBlend in2="is2" mode="normal" result="is3" />
    </filter>
  );
}

// ─── Header Button Filter ──────────────────────────────────────────────────────

function HdrBtnFilter({ id, innerDx }: { id: string; innerDx: number }) {
  return (
    <filter
      colorInterpolationFilters="sRGB"
      filterUnits="userSpaceOnUse"
      height="38"
      id={id}
      width={innerDx < 0 ? "39" : "38"}
      x={innerDx < 0 ? "-1" : "0"}
      y="0"
    >
      <feFlood floodOpacity="0" result="BackgroundImageFix" />
      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dx="2" dy="2" />
      <feGaussianBlur stdDeviation="1" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0" />
      <feBlend in2="BackgroundImageFix" mode="normal" result="ds" />
      <feBlend in="SourceGraphic" in2="ds" mode="normal" result="shape" />
      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dx={innerDx} dy="2" />
      <feGaussianBlur stdDeviation="0.5" />
      <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0" />
      <feBlend in2="shape" mode="normal" result="is" />
    </filter>
  );
}

// ─── Piano ─────────────────────────────────────────────────────────────────────

interface FloatingNote { id: number; left: number }

export default function Piano() {
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [floats, setFloats] = useState<FloatingNote[]>([]);
  const nextId = useRef(0);

  const triggerNote = useCallback((keyId: string) => {
    const freq = FREQS[keyId];
    if (!freq) return;
    playPianoNote(freq);
    setPressed(prev => new Set([...prev, keyId]));

    const wk = WHITE_KEYS.find(k => k.id === keyId);
    const bk = BLACK_KEYS.find(k => k.id === keyId);
    const left = wk ? wk.left + wk.w / 2 - 8 : bk ? bk.left + 12 : 280;

    const id = ++nextId.current;
    setFloats(prev => [...prev, { id, left }]);
    setTimeout(() => setFloats(prev => prev.filter(n => n.id !== id)), 1200);
  }, []);

  const releaseNote = useCallback((keyId: string) => {
    setPressed(prev => {
      const next = new Set(prev);
      next.delete(keyId);
      return next;
    });
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const id = KB_MAP[e.key.toLowerCase()];
      if (id) triggerNote(id);
    };
    const up = (e: KeyboardEvent) => {
      const id = KB_MAP[e.key.toLowerCase()];
      if (id) releaseNote(id);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [triggerNote, releaseNote]);

  function wkProps(id: string) {
    return {
      onMouseDown: () => triggerNote(id),
      onMouseUp: () => releaseNote(id),
      onMouseLeave: () => releaseNote(id),
      onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); triggerNote(id); },
      onTouchEnd: () => releaseNote(id),
    };
  }

  function bkProps(id: string) {
    return {
      onMouseDown: (e: React.MouseEvent) => { e.stopPropagation(); triggerNote(id); },
      onMouseUp: () => releaseNote(id),
      onMouseLeave: () => releaseNote(id),
      onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); e.stopPropagation(); triggerNote(id); },
      onTouchEnd: () => releaseNote(id),
    };
  }

  return (
    <div
      className="relative rounded-[36px] size-full select-none"
      style={{ cursor: "default" }}
    >
      {/* Frame fill */}
      <div aria-hidden className="absolute bg-[#dedde2] inset-0 pointer-events-none rounded-[36px]" />
      <div aria-hidden className="absolute border-2 border-[#e3e2e5] border-solid inset-0 pointer-events-none rounded-[36px]" />

      {/* Indicator circle */}
      <div
        className="absolute left-[26px] rounded-[16px] size-[34px] top-[15px]"
        style={{ pointerEvents: "none" }}
      >
        <div aria-hidden className="absolute bg-[#e6e5ea] inset-0 pointer-events-none rounded-[16px]" />
        <div className="overflow-clip relative rounded-[inherit] size-full">
          <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-white left-1/2 rounded-[24px] size-[12px] top-1/2" />
        </div>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_1px_2px_1px_0px_rgba(255,255,255,0.5)]" />
        <div aria-hidden className="absolute border border-[#e5e4e9] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[2px_2px_2px_0px_rgba(0,0,0,0.07)]" />
      </div>

      {/* M-01 label */}
      <p
        className="[word-break:break-word] absolute font-['Inter',sans-serif] font-normal leading-[normal] left-[76px] not-italic text-[#8d8c92] text-[22px] top-[19px] whitespace-nowrap"
        style={{ pointerEvents: "none" }}
      >
        M-01
      </p>

      {/* Decorative line */}
      <div
        className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#e5e4e9] border border-[#e5e4e9] border-solid h-[4px] left-[calc(50%+11px)] rounded-[16px] shadow-[2px_2px_2px_0px_rgba(0,0,0,0.07)] top-[calc(50%-101px)] w-[300px]"
        style={{ pointerEvents: "none" }}
      />

      {/* Left arrow */}
      <div
        className="absolute left-[472px] size-[34px] top-[15px]"
        style={{ pointerEvents: "none" }}
      >
        <div className="absolute inset-[0_-11.76%_-11.76%_0]">
          <svg className="block size-full" fill="none" height="38" preserveAspectRatio="none" viewBox="0 0 38 38" width="38">
            <g filter="url(#hdr-left-f)">
              <rect fill="#E6E5EA" height="34" rx="16" width="34" />
              <rect height="33" rx="15.5" stroke="#E5E4E9" width="33" x="0.5" y="0.5" />
              <path d={svgPaths.pa85bb00} fill="#8C8B91" />
            </g>
            <defs>
              <HdrBtnFilter id="hdr-left-f" innerDx={1} />
            </defs>
          </svg>
        </div>
      </div>

      {/* Right arrow */}
      <div
        className="absolute left-[514px] size-[34px] top-[15px]"
        style={{ pointerEvents: "none" }}
      >
        <div className="absolute inset-[0_-11.76%_-11.76%_0]">
          <svg className="block size-full" fill="none" height="38" preserveAspectRatio="none" viewBox="0 0 38 38" width="38">
            <g filter="url(#hdr-right-f)">
              <rect fill="#E6E5EA" height="34" rx="16" width="34" />
              <rect height="33" rx="15.5" stroke="#E5E4E9" width="33" x="0.5" y="0.5" />
              <path d={svgPaths.pa38df0} fill="#8C8B91" />
            </g>
            <defs>
              <HdrBtnFilter id="hdr-right-f" innerDx={-1} />
            </defs>
          </svg>
        </div>
      </div>

      {/* White Keys */}
      {WHITE_KEYS.map(k => {
        const isPressed = pressed.has(k.id);
        const fill = isPressed ? "#b8ccf2" : "#EEEEF0";
        const filterId = `wkf-${k.id}`;

        const svgEl = (
          <div
            style={{
              position: "absolute",
              top: "-1.04%",
              right: k.insetR,
              bottom: "-4.17%",
              left: k.insetL,
            }}
          >
            <svg
              className="block size-full"
              fill="none"
              height="202"
              preserveAspectRatio="none"
              viewBox={`0 0 ${k.svgW} 202`}
              width={k.svgW}
            >
              <g filter={`url(#${filterId})`}>
                <path d={k.path} fill={fill} />
              </g>
              <defs>
                <WKFilter id={filterId} width={k.svgW} />
              </defs>
            </svg>
          </div>
        );

        const noteLabel = (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 0,
              right: 0,
              textAlign: "center",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                color: isPressed ? "#4870c8" : "#b0b0ba",
                letterSpacing: "0.04em",
                transition: "color 0.06s",
              }}
            >
              {k.label}
            </span>
          </div>
        );

        if (k.flip) {
          return (
            <div
              key={k.id}
              style={{
                position: "absolute",
                left: k.left,
                top: 60,
                width: k.w,
                height: 192,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              {...wkProps(k.id)}
            >
              <div
                style={{
                  transform: "rotate(180deg) scaleY(-1)",
                  width: k.w,
                  height: 192,
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                {svgEl}
              </div>
              {noteLabel}
            </div>
          );
        }

        return (
          <div
            key={k.id}
            style={{
              position: "absolute",
              left: k.left,
              top: 60,
              width: k.w,
              height: 192,
              cursor: "pointer",
            }}
            {...wkProps(k.id)}
          >
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              {svgEl}
            </div>
            {noteLabel}
          </div>
        );
      })}

      {/* Black Keys — rendered after white keys so they appear on top */}
      {BLACK_KEYS.map(k => {
        const isPressed = pressed.has(k.id);
        return (
          <div
            key={k.id}
            style={{
              position: "absolute",
              left: k.left,
              top: 60,
              width: 40,
              height: 119,
              cursor: "pointer",
              zIndex: 20,
              borderRadius: "2px 2px 8px 8px",
              boxShadow:
                "0px 2px 4px 0px rgba(0,0,0,0.12), 3px 3px 5px 0px rgba(0,0,0,0.07)",
            }}
            {...bkProps(k.id)}
          >
            {/* Fill */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: isPressed ? "#b8ccf2" : "#eeeef0",
                transition: "background 0.05s",
              }}
            />
            {/* Inner shadow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                boxShadow:
                  "inset -3px 0px 4px 0px rgba(255,255,255,0.17), inset 0px -3px 5px 0px rgba(255,255,255,0.3), inset 3px 0px 2px 0px rgba(255,255,255,0.8)",
                pointerEvents: "none",
              }}
            />
            {/* Note label */}
            <div
              style={{
                position: "absolute",
                bottom: 7,
                left: 0,
                right: 0,
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontSize: 7,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  color: isPressed ? "#4870c8" : "#9898a8",
                  transition: "color 0.06s",
                }}
              >
                {k.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Floating music notes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "visible",
          zIndex: 100,
        }}
      >
        {floats.map(n => (
          <div
            key={n.id}
            className="piano-float-note"
            style={{
              position: "absolute",
              left: n.left,
              top: 30,
              fontSize: 22,
              color: "#7092e0",
              userSelect: "none",
              lineHeight: 1,
            }}
          >
            ♪
          </div>
        ))}
      </div>

      {/* Frame inner highlight */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          boxShadow:
            "inset 2px 2px 0px 0px rgba(255,255,255,0.7), inset -2px -2px 0px 0px rgba(255,255,255,0.7)",
        }}
      />
    </div>
  );
}
