import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const TAU = Math.PI * 2;
const SEGMENTS = 560;
const MAX_LAYERS = 9;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;

const DEFAULT_CONTROLS = Object.freeze({
  intensity: 0.58,
  chaos: 0.52,
  spikes: 0.48,
  speed: 0.7,
  cursorForce: 0.82,
  breath: 0.42,
  lineCount: 7,
  autoEscalate: true,
});

const PRESETS = Object.freeze({
  RUHIG: { intensity: 0.18, chaos: 0.12, spikes: 0.08, speed: 0.22, cursorForce: 0.45, breath: 0.88, lineCount: 3, autoEscalate: false },
  STURM: { intensity: 0.92, chaos: 0.88, spikes: 0.94, speed: 0.85, cursorForce: 0.95, breath: 0.12, lineCount: 9, autoEscalate: true },
  PULS:  { intensity: 0.62, chaos: 0.38, spikes: 0.28, speed: 0.55, cursorForce: 0.72, breath: 0.96, lineCount: 5, autoEscalate: true },
});

const BG_PRESETS = [
  {
    key: "NACHT",
    bg: "#050508",
    bgDeep: "#010104",
    isLight: false,
    radials: "radial-gradient(circle at 50% 48%, rgba(200,164,93,0.18), transparent 26%), radial-gradient(circle at 50% 52%, rgba(143,108,255,0.12), transparent 42%), radial-gradient(circle at 22% 18%, rgba(122,167,255,0.09), transparent 31%)",
    textColor: "#f4efe7",
    textMuted: "rgba(244,239,231,0.66)",
    textFaint: "rgba(244,239,231,0.38)",
    lineColor: "rgba(244,239,231,0.16)",
    lineStrong: "rgba(244,239,231,0.34)",
    surface: "rgba(255,255,255,0.045)",
    surfaceStrong: "rgba(255,255,255,0.075)",
    gold: "#c8a45d",
    amber: "#d68c3c",
    panelBg: "rgba(1,1,4,0.56)",
    chipBg: "rgba(1,1,4,0.48)",
    gridColor: "rgba(244,239,231,0.035)",
    gridColorH: "rgba(244,239,231,0.028)",
    watermark: "rgba(244,239,231,0.045)",
    accentSurface: "rgba(200,164,93,0.12)",
  },
  {
    key: "HELL",
    bg: "#f0ebe2",
    bgDeep: "#e4ddd2",
    isLight: true,
    radials: "radial-gradient(circle at 50% 48%, rgba(120,80,20,0.07), transparent 26%), radial-gradient(circle at 50% 52%, rgba(80,50,140,0.05), transparent 42%), radial-gradient(circle at 22% 18%, rgba(40,80,140,0.04), transparent 31%)",
    textColor: "#111111",
    textMuted: "rgba(20,15,8,0.66)",
    textFaint: "rgba(20,15,8,0.38)",
    lineColor: "rgba(20,15,8,0.16)",
    lineStrong: "rgba(20,15,8,0.34)",
    surface: "rgba(0,0,0,0.04)",
    surfaceStrong: "rgba(0,0,0,0.07)",
    gold: "#7a4500",
    amber: "#8a3c00",
    panelBg: "rgba(230,222,210,0.82)",
    chipBg: "rgba(230,222,210,0.72)",
    gridColor: "rgba(20,15,8,0.04)",
    gridColorH: "rgba(20,15,8,0.03)",
    watermark: "rgba(20,15,8,0.06)",
    accentSurface: "rgba(122,69,0,0.12)",
  },
  {
    key: "OZEAN",
    bg: "#040c18",
    bgDeep: "#020810",
    isLight: false,
    radials: "radial-gradient(circle at 50% 48%, rgba(40,140,200,0.18), transparent 26%), radial-gradient(circle at 50% 52%, rgba(20,80,180,0.12), transparent 42%), radial-gradient(circle at 22% 18%, rgba(80,170,220,0.09), transparent 31%)",
    textColor: "#ddf0ff",
    textMuted: "rgba(200,230,255,0.66)",
    textFaint: "rgba(200,230,255,0.38)",
    lineColor: "rgba(120,180,255,0.16)",
    lineStrong: "rgba(120,180,255,0.34)",
    surface: "rgba(60,120,200,0.06)",
    surfaceStrong: "rgba(60,120,200,0.10)",
    gold: "#5bc0e8",
    amber: "#4aacdc",
    panelBg: "rgba(2,8,20,0.72)",
    chipBg: "rgba(2,8,20,0.60)",
    gridColor: "rgba(120,180,255,0.03)",
    gridColorH: "rgba(120,180,255,0.025)",
    watermark: "rgba(180,220,255,0.045)",
    accentSurface: "rgba(91,192,232,0.12)",
  },
];

function ringLayerColor(layerIndex, isLight) {
  const isGoldLayer = layerIndex % 3 === 0;
  if (isLight) return isGoldLayer ? 0x6b3d00 : 0x111111;
  return isGoldLayer ? 0xc8a45d : 0xf4efe7;
}

const CSS = `
:root {
  --color-bg: #050508;
  --color-bg-deep: #010104;
  --color-surface: rgba(255,255,255,0.045);
  --color-surface-strong: rgba(255,255,255,0.075);
  --color-text: #f4efe7;
  --color-text-muted: rgba(244,239,231,0.66);
  --color-text-faint: rgba(244,239,231,0.38);
  --color-line: rgba(244,239,231,0.16);
  --color-line-strong: rgba(244,239,231,0.34);
  --color-gold: #c8a45d;
  --color-amber: #d68c3c;
  --color-violet: #8f6cff;
  --color-blue: #7aa7ff;
  --color-danger: #ff6f61;
  --color-grid: rgba(244,239,231,0.035);
  --color-grid-h: rgba(244,239,231,0.028);
  --color-watermark: rgba(244,239,231,0.045);
  --panel-bg: rgba(1,1,4,0.56);
  --chip-bg: rgba(1,1,4,0.48);
  --color-accent-surface: rgba(200,164,93,0.12);
  --font-display: "Inter Tight", "Neue Haas Grotesk Display", "Suisse Intl", "Arial Narrow", sans-serif;
  --font-body: "Inter", "Suisse Intl", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "IBM Plex Mono", "SF Mono", monospace;
}
* { box-sizing: border-box; }
body { margin: 0; }
.chaos-root {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--color-text);
  font-family: var(--font-body);
}
.chaos-root::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.36;
  background-image:
    linear-gradient(var(--color-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-grid-h) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(circle at center, black, transparent 82%);
  transition: opacity 0.5s ease;
}
.chaos-root::after {
  content: "CHAOS RING";
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
  color: var(--color-watermark);
  filter: blur(14px);
  font-family: var(--font-display);
  font-size: clamp(84px, 20vw, 280px);
  font-weight: 900;
  letter-spacing: -0.1em;
  line-height: 0.78;
  text-transform: uppercase;
  white-space: nowrap;
  transition: opacity 0.5s ease;
}
.ring-stage {
  position: fixed;
  inset: 0;
  z-index: 1;
}
.ring-stage canvas {
  cursor: crosshair;
  display: block;
}
.hud-top,
.formula-panel,
.controls-panel {
  transition: opacity 0.5s ease;
}
.focus-mode .hud-top,
.focus-mode .formula-panel,
.focus-mode .controls-panel {
  opacity: 0;
  pointer-events: none !important;
}
.focus-mode::after {
  opacity: 0 !important;
}
.focus-mode::before {
  opacity: 0 !important;
}
.float-controls {
  position: fixed;
  z-index: 10;
  bottom: clamp(18px, 3vw, 42px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  align-items: center;
  pointer-events: auto;
}
.float-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-line-strong);
  background: var(--panel-bg);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  color: var(--color-text-muted);
  padding: 8px 14px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 999px;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  white-space: nowrap;
}
.float-btn:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
}
.float-btn.active {
  border-color: var(--color-gold);
  background: var(--color-accent-surface);
  color: var(--color-gold);
}
.hud-top {
  position: fixed;
  z-index: 3;
  left: clamp(18px, 3vw, 42px);
  top: clamp(18px, 3vw, 42px);
  right: clamp(18px, 3vw, 42px);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  pointer-events: none;
}
.hud-copy {
  max-width: 760px;
  pointer-events: auto;
}
.kicker,
.mono-chip,
.status-line,
.control-row,
.switch-row,
.reset-button,
.metric-label {
  font-family: var(--font-mono);
  text-transform: uppercase;
}
.kicker {
  color: var(--color-gold);
  font-size: 11px;
  letter-spacing: 0.22em;
}
.title {
  margin: 12px 0 0;
  font-family: var(--font-display);
  font-size: clamp(54px, 9vw, 148px);
  font-weight: 900;
  letter-spacing: -0.085em;
  line-height: 0.78;
  text-transform: uppercase;
}
.subclaim {
  max-width: 560px;
  margin: 16px 0 0;
  color: var(--color-text-muted);
  font-size: clamp(14px, 1.2vw, 17px);
  line-height: 1.5;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  align-items: center;
}
.mono-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border: 1px solid var(--color-line);
  background: var(--chip-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: var(--color-text-muted);
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
}
.mono-chip.gold {
  color: var(--color-gold);
  border-color: var(--color-line-strong);
}
.hud-panel,
.controls-panel,
.formula-panel {
  border: 1px solid var(--color-line);
  background: var(--panel-bg);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.hud-panel {
  min-width: 240px;
  padding: 14px;
  pointer-events: auto;
}
.metric-stack {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.metric {
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  padding: 10px;
}
.metric-value {
  font-family: var(--font-mono);
  color: var(--color-text);
  font-size: 18px;
  letter-spacing: -0.03em;
}
.metric-label {
  margin-top: 4px;
  color: var(--color-text-faint);
  font-size: 9px;
  letter-spacing: 0.15em;
}
.output-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.output-card {
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  padding: 10px;
}
.output-value {
  color: var(--color-gold);
  font-family: var(--font-mono);
  font-size: 16px;
}
.output-bar {
  height: 3px;
  margin-top: 8px;
  overflow: hidden;
  background: var(--color-surface-strong);
}
.output-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--color-gold), var(--color-danger));
}
.controls-panel {
  position: fixed;
  z-index: 4;
  right: clamp(18px, 3vw, 42px);
  bottom: clamp(18px, 3vw, 42px);
  width: min(390px, calc(100vw - 36px));
  padding: 16px;
}
.control-row {
  display: grid;
  grid-template-columns: 1fr 62px;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
  color: var(--color-text-muted);
  font-size: 10px;
  letter-spacing: 0.08em;
}
.control-row input[type="range"] {
  grid-column: 1 / -1;
  width: 100%;
  accent-color: var(--color-gold);
}
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  border-top: 1px solid var(--color-line);
  padding-top: 12px;
  color: var(--color-text-muted);
  font-size: 10px;
  letter-spacing: 0.1em;
}
.switch-row input { accent-color: var(--color-gold); }
.control-note {
  margin-top: 12px;
  border-top: 1px solid var(--color-line);
  padding-top: 12px;
  color: var(--color-text-faint);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  line-height: 1.5;
  text-transform: uppercase;
}
.reset-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-line-strong);
  background: var(--color-surface);
  padding: 8px 10px;
  color: var(--color-gold);
  font-size: 10px;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: background 0.2s;
}
.reset-button:hover {
  background: var(--color-surface-strong);
}
.preset-row {
  display: flex;
  gap: 6px;
  margin-top: 14px;
  border-top: 1px solid var(--color-line);
  padding-top: 12px;
}
.preset-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-text-muted);
  padding: 7px 4px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.preset-btn:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
  background: var(--color-surface-strong);
}
.formula-panel {
  position: fixed;
  z-index: 3;
  left: clamp(18px, 3vw, 42px);
  bottom: clamp(18px, 3vw, 42px);
  width: min(560px, calc(100vw - 450px));
  padding: 16px;
}
.formula {
  margin-top: 8px;
  color: var(--color-gold);
  font-family: var(--font-mono);
  font-size: clamp(16px, 2vw, 27px);
  letter-spacing: -0.06em;
}
.status-line {
  margin-top: 8px;
  color: var(--color-text-faint);
  font-size: 10px;
  letter-spacing: 0.12em;
  line-height: 1.5;
}
.mobile-hint {
  display: none;
}
@media (max-width: 980px) {
  .hud-top {
    display: block;
  }
  .hud-panel {
    margin-top: 14px;
    width: 100%;
  }
  .title {
    font-size: clamp(46px, 18vw, 92px);
  }
  .formula-panel {
    display: none;
  }
  .controls-panel {
    left: 18px;
    right: 18px;
    width: auto;
  }
  .mobile-hint {
    display: block;
    margin-top: 10px;
    color: var(--color-text-faint);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .float-controls {
    top: 14px;
    right: 14px;
    bottom: auto;
    left: auto;
    transform: none;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .float-btn {
    padding: 6px 10px;
    font-size: 9px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .chaos-root::after { filter: none; }
}
`;

function hashNoise(x) {
  const value = Math.sin(x * 127.1) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothNoise(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hashNoise(i), hashNoise(i + 1), u) * 2 - 1;
}

function layeredNoise(x, t) {
  return (
    smoothNoise(x * 1.2 + t * 0.22) * 0.52 +
    smoothNoise(x * 2.8 - t * 0.41) * 0.28 +
    smoothNoise(x * 7.5 + t * 0.73) * 0.15 +
    smoothNoise(x * 17.0 - t * 1.13) * 0.05
  );
}

function runTinySelfTests() {
  if (typeof console === "undefined") return;
  console.assert(clamp(2, 0, 1) === 1, "clamp caps values above max");
  console.assert(clamp(-1, 0, 1) === 0, "clamp caps values below min");
  console.assert(lerp(0, 10, 0.5) === 5, "lerp interpolates linearly");
  const n = smoothNoise(12.34);
  console.assert(Number.isFinite(n) && n >= -1 && n <= 1, "smoothNoise stays in [-1, 1]");
  console.assert(DEFAULT_CONTROLS.lineCount >= 1 && DEFAULT_CONTROLS.lineCount <= MAX_LAYERS, "lineCount default is inside renderer layer range");
  console.assert(DEFAULT_CONTROLS.autoEscalate === true, "object escalates autonomously by default");
  console.assert(SEGMENTS > 64, "renderer has enough contour samples");
  console.assert(MAX_LAYERS >= 6, "renderer has enough visible line layers");
  console.assert(BG_PRESETS.length >= 2, "at least two background themes defined");
  console.assert(Object.keys(PRESETS).length >= 3, "at least three ring presets defined");
}

runTinySelfTests();

function MiniMetric({ label, value, decimals = 2 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="metric">
      <div className="metric-value">{display.toFixed(decimals)}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

function OutputCard({ label, value }) {
  const safeValue = clamp(value, 0, 1);
  return (
    <div className="output-card">
      <div className="metric-label">{label}</div>
      <div className="output-value">{Math.round(safeValue * 100)}%</div>
      <div className="output-bar" aria-hidden="true"><span style={{ width: `${safeValue * 100}%` }} /></div>
    </div>
  );
}

function ControlRange({ label, value, onChange, min = 0, max = 100, percent = true }) {
  const display = percent ? `${Math.round(value * 100)}%` : String(value);
  const inputValue = percent ? Math.round(value * 100) : value;
  return (
    <label className="control-row">
      <span>{label}</span>
      <span>{display}</span>
      <input type="range" min={min} max={max} value={inputValue} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export default function DynamicChaosCirclePage() {
  const mountRef = useRef(null);
  const frameRef = useRef(0);
  const ripplesRef = useRef([]);
  const pointerRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, inside: false, pressure: 0 });
  const velocityRef = useRef(0);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const linesRef = useRef([]);
  const bgIndexRef = useRef(0);
  const spectrumModeRef = useRef(false);

  const [controls, setControls] = useState({ ...DEFAULT_CONTROLS });
  const controlsRef = useRef(controls);

  const [focusMode, setFocusMode] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [spectrumMode, setSpectrumMode] = useState(false);

  useEffect(() => { controlsRef.current = controls; }, [controls]);
  useEffect(() => { bgIndexRef.current = bgIndex; }, [bgIndex]);
  useEffect(() => { spectrumModeRef.current = spectrumMode; }, [spectrumMode]);

  // Update ring materials when background or spectrum mode changes.
  useEffect(() => {
    const lines = linesRef.current;
    if (lines.length === 0) return;
    const preset = BG_PRESETS[bgIndex];
    const blending = preset.isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    lines.forEach((line, i) => {
      if (!spectrumMode) {
        line.material.color.setHex(ringLayerColor(i, preset.isLight));
      }
      line.material.blending = blending;
      line.material.needsUpdate = true;
    });
  }, [bgIndex, spectrumMode]);

  const labels = useMemo(
    () => [
      ["intensity", "Intensität"],
      ["chaos", "Chaos"],
      ["spikes", "Spitzen"],
      ["speed", "Geschwindigkeit"],
      ["cursorForce", "Cursor-Kraft"],
      ["breath", "Atmung"],
    ],
    []
  );

  const telemetry = useMemo(() => {
    const divergence = clamp(controls.intensity * 0.36 + controls.chaos * 0.31 + controls.spikes * 0.23 + controls.cursorForce * 0.1, 0, 1);
    const coherence = clamp(1 - controls.chaos * 0.48 + controls.breath * 0.18 - controls.spikes * 0.1, 0, 1);
    const energy = clamp(controls.speed * 0.34 + controls.intensity * 0.26 + controls.lineCount / MAX_LAYERS * 0.22 + (controls.autoEscalate ? 0.18 : 0), 0, 1);
    const volatility = clamp(controls.spikes * 0.42 + controls.chaos * 0.38 + controls.speed * 0.2, 0, 1);
    return { divergence, coherence, energy, volatility };
  }, [controls]);

  const resetControls = () => setControls({ ...DEFAULT_CONTROLS });

  const applyPreset = (name) => setControls({ ...DEFAULT_CONTROLS, ...PRESETS[name] });

  // Keyboard shortcut handler (separate from THREE effect for clean closure access).
  useEffect(() => {
    const INTERACTIVE = new Set(["INPUT", "BUTTON", "SELECT", "TEXTAREA"]);
    const onKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (INTERACTIVE.has(event.target.tagName) || event.target.isContentEditable) return;
      const key = event.key.toLowerCase();
      if (key === "r") {
        ripplesRef.current.length = 0;
        setControls({ ...DEFAULT_CONTROLS });
      }
      if (event.key === " ") {
        event.preventDefault();
        const { x, y } = pointerRef.current;
        ripplesRef.current.push({ x, y, born: performance.now() / 1000, force: 1.2 });
        if (ripplesRef.current.length > 12) ripplesRef.current.shift();
      }
      if (key === "f") setFocusMode((m) => !m);
      if (key === "b") setBgIndex((i) => (i + 1) % BG_PRESETS.length);
      if (key === "s") setSpectrumMode((m) => !m);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // THREE.js renderer lifecycle (mounts once, cleans up on unmount).
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.OrthographicCamera(-2, 2, 1.3, -1.3, 0.01, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(Math.max(mount.clientWidth || 1, 1), Math.max(mount.clientHeight || 1, 1));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const baseRadius = 0.86;
    const points = [];
    const lines = [];

    for (let layer = 0; layer < MAX_LAYERS; layer += 1) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array((SEGMENTS + 1) * 3);
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const isGoldLayer = layer % 3 === 0;
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(isGoldLayer ? 0xc8a45d : 0xf4efe7),
        transparent: true,
        opacity: 0.22 + layer * 0.045,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const line = new THREE.Line(geometry, material);
      line.userData = {
        seed: 11.7 + layer * 6.13,
        radiusOffset: (layer - MAX_LAYERS / 2) * 0.004,
        wobblePhase: layer * 0.55,
      };
      group.add(line);
      lines.push(line);
    }

    linesRef.current = lines;

    // Sync initial theme in case bgIndex/spectrumMode changed before mount.
    const initPreset = BG_PRESETS[bgIndexRef.current];
    const initBlending = initPreset.isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    lines.forEach((line, i) => {
      if (!spectrumModeRef.current) {
        line.material.color.setHex(ringLayerColor(i, initPreset.isLight));
      }
      line.material.blending = initBlending;
      line.material.needsUpdate = true;
    });

    for (let i = 0; i <= SEGMENTS; i += 1) {
      const angle = (i / SEGMENTS) * TAU;
      points.push({ angle, ux: Math.cos(angle), uy: Math.sin(angle), baseRadius });
    }

    const updateSize = () => {
      const width = Math.max(mount.clientWidth || 1, 1);
      const height = Math.max(mount.clientHeight || 1, 1);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const viewHeight = 2.45;
      camera.left = (-viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
    };

    const toWorld = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ny = -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      return {
        x: lerp(camera.left, camera.right, (nx + 1) / 2),
        y: lerp(camera.bottom, camera.top, (ny + 1) / 2),
      };
    };

    const addRipple = (x, y, force = 1) => {
      ripplesRef.current.push({ x, y, born: performance.now() / 1000, force });
      if (ripplesRef.current.length > 12) ripplesRef.current.shift();
    };

    const onPointerMove = (event) => {
      const p = toWorld(event);
      const last = lastPointerRef.current;
      const dx = p.x - last.x;
      const dy = p.y - last.y;
      velocityRef.current = lerp(velocityRef.current, Math.sqrt(dx * dx + dy * dy) * 20, 0.24);
      pointerRef.current.targetX = p.x;
      pointerRef.current.targetY = p.y;
      pointerRef.current.inside = true;
      pointerRef.current.pressure = event.buttons ? 1.5 : 1;
      lastPointerRef.current = p;
    };

    const onPointerLeave = () => {
      pointerRef.current.inside = false;
    };

    const onPointerDown = (event) => {
      const p = toWorld(event);
      addRipple(p.x, p.y, 1.55);
      pointerRef.current.pressure = 1.9;
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const animate = () => {
      const now = performance.now() / 1000;
      const c = controlsRef.current;
      const pointer = pointerRef.current;

      pointer.x = lerp(pointer.x, pointer.targetX, 0.12);
      pointer.y = lerp(pointer.y, pointer.targetY, 0.12);
      pointer.pressure = lerp(pointer.pressure, pointer.inside ? 1 : 0, 0.035);
      velocityRef.current *= 0.955;

      const escalation = c.autoEscalate ? clamp((Math.sin(now * 0.19) + 1) * 0.5, 0, 1) : 0.2;
      const intensity = c.intensity + escalation * 0.48;
      const chaos = c.chaos + escalation * 0.55;
      const spikeAmount = c.spikes + escalation * 0.6;
      const time = now * (0.35 + c.speed * 1.95);

      // Expire old ripples once per frame (not per layer – fixes original bug).
      ripplesRef.current = ripplesRef.current.filter((r) => now - r.born < 2.8);

      const isLight = BG_PRESETS[bgIndexRef.current].isLight;
      const useSpectrum = spectrumModeRef.current;

      lines.forEach((line, lineIndex) => {
        line.visible = lineIndex < Math.round(c.lineCount);
        if (!line.visible) return;

        // Spectrum color: each layer cycles through hue with slow rotation.
        if (useSpectrum) {
          const hue = ((lineIndex / MAX_LAYERS) + now * 0.04) % 1;
          const sat = isLight ? 0.88 : 0.82;
          const lit = isLight ? 0.26 : 0.60;
          line.material.color.setHSL(hue, sat, lit);
        }

        const positions = line.geometry.attributes.position.array;
        const { seed, radiusOffset, wobblePhase } = line.userData;
        const layerDrift = lineIndex * 0.007;

        for (let i = 0; i <= SEGMENTS; i += 1) {
          const p = points[i];
          const angle = p.angle;
          const angleNorm = angle / TAU;

          const wave = Math.sin(angle * 3 + time * 1.4 + wobblePhase) * 0.015 * c.breath;
          const rough = layeredNoise(angleNorm * 10 + seed, time) * 0.039 * intensity;
          const micro = Math.sin(angle * (29 + lineIndex * 2) + time * 2.8 + seed) * 0.007 * chaos;

          let spike = 0;
          const spikeBands = 12 + Math.floor(spikeAmount * 26);
          for (let s = 0; s < spikeBands; s += 1) {
            const center = ((s * 0.61803398875 + Math.sin(time * 0.071 + s) * 0.04 + seed * 0.001) % 1) * TAU;
            const angularDistance = Math.atan2(Math.sin(angle - center), Math.cos(angle - center));
            const width = lerp(0.05, 0.011, spikeAmount) * (1 + smoothNoise(s + seed) * 0.22);
            const pulse = Math.pow(Math.max(0, Math.cos((angularDistance / width) * Math.PI * 0.5)), 7);
            const flicker = 0.45 + 0.55 * Math.sin(time * (0.8 + s * 0.035) + s * 9.17);
            spike += pulse * flicker;
          }
          spike *= 0.024 * spikeAmount * (1 + chaos * 3.6);

          const dx = pointer.x - p.ux * p.baseRadius;
          const dy = pointer.y - p.uy * p.baseRadius;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const cursorProximity = pointer.inside ? Math.exp(-dist * 4.6) : 0;
          const cursorAngular = Math.atan2(pointer.y, pointer.x);
          const angularDistanceToCursor = Math.atan2(Math.sin(angle - cursorAngular), Math.cos(angle - cursorAngular));
          const cursorSpike = Math.exp(-(angularDistanceToCursor * angularDistanceToCursor) / 0.075) * c.cursorForce * pointer.pressure;
          const cursorVelocitySpike = velocityRef.current * 0.018 * Math.exp(-(angularDistanceToCursor * angularDistanceToCursor) / 0.04);

          let rippleForce = 0;
          for (const ripple of ripplesRef.current) {
            const age = now - ripple.born;
            const rx = p.ux * p.baseRadius - ripple.x;
            const ry = p.uy * p.baseRadius - ripple.y;
            const rd = Math.sqrt(rx * rx + ry * ry);
            const ring = Math.exp(-Math.pow(rd - age * 0.9, 2) * 42);
            rippleForce += ring * Math.exp(-age * 1.25) * ripple.force * 0.18;
          }

          const radialOffset =
            radiusOffset +
            layerDrift +
            wave +
            rough +
            micro +
            spike +
            cursorProximity * 0.032 * c.cursorForce +
            cursorSpike * 0.16 +
            cursorVelocitySpike +
            rippleForce;

          const tangentNoise = layeredNoise(angleNorm * 7 + seed * 2.1, time + 10) * 0.021 * chaos;
          const finalAngle = angle + tangentNoise + cursorSpike * 0.018;
          const finalRadius = p.baseRadius + radialOffset;

          positions[i * 3] = Math.cos(finalAngle) * finalRadius;
          positions[i * 3 + 1] = Math.sin(finalAngle) * finalRadius;
          positions[i * 3 + 2] = 0;
        }

        line.geometry.attributes.position.needsUpdate = true;
        line.material.opacity = 0.2 + lineIndex * 0.05 + chaos * 0.05;
      });

      group.rotation.z = Math.sin(time * 0.09) * 0.02 + pointer.x * 0.018;
      group.scale.setScalar(1.18 + Math.sin(time * 0.52) * 0.018 * c.breath + velocityRef.current * 0.002);

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", updateSize);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      lines.forEach((line) => {
        line.geometry.dispose();
        line.material.dispose();
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      linesRef.current = [];
    };
  }, []);

  const updateControl = (key, rawValue) => {
    const value = key === "lineCount" ? Number(rawValue) : Number(rawValue) / 100;
    setControls((current) => ({ ...current, [key]: value }));
  };

  const preset = BG_PRESETS[bgIndex];
  const nextBgKey = BG_PRESETS[(bgIndex + 1) % BG_PRESETS.length].key;

  const rootStyle = {
    background: `${preset.radials}, linear-gradient(180deg, ${preset.bg}, ${preset.bgDeep})`,
    "--color-bg": preset.bg,
    "--color-bg-deep": preset.bgDeep,
    "--color-text": preset.textColor,
    "--color-text-muted": preset.textMuted,
    "--color-text-faint": preset.textFaint,
    "--color-line": preset.lineColor,
    "--color-line-strong": preset.lineStrong,
    "--color-surface": preset.surface,
    "--color-surface-strong": preset.surfaceStrong,
    "--color-gold": preset.gold,
    "--color-amber": preset.amber,
    "--panel-bg": preset.panelBg,
    "--chip-bg": preset.chipBg,
    "--color-grid": preset.gridColor,
    "--color-grid-h": preset.gridColorH,
    "--color-watermark": preset.watermark,
    "--color-accent-surface": preset.accentSurface,
  };

  return (
    <div className={`chaos-root${focusMode ? " focus-mode" : ""}`} style={rootStyle}>
      <style>{CSS}</style>

      <div ref={mountRef} className="ring-stage" aria-label="Dynamischer Chaoskreis" />

      <header className="hud-top">
        <div className="hud-copy">
          <div className="chip-row">
            <span className="mono-chip gold">CONFIDENTIAL MOTION OBJECT</span>
            <span className="mono-chip">LIVE / CURSOR FIELD</span>
            <span className="mono-chip">RAILWAY READY</span>
            <span className="mono-chip">D: {telemetry.divergence.toFixed(4)}</span>
          </div>
          <h1 className="title">CHAOS RING</h1>
          <p className="subclaim">
            Ein erster deploybarer Prototyp für den Chaosring: visuelles Kernobjekt, normalisierte Inputs und direkt sichtbare Output-Telemetrie als Grundlage für spätere Datenfeeds, Watch-Komplikationen und Overlays.
          </p>
          <div className="mobile-hint">Cursor bewegen. Klick für Welle. Leertaste für Impuls. R = Reset. F = Fokus. B = Hintergrund. S = Spektrum.</div>
        </div>

        <aside className="hud-panel">
          <div className="kicker">OBJECT TELEMETRY</div>
          <div className="metric-stack">
            <MiniMetric value={telemetry.coherence} label="coherence" decimals={2} />
            <MiniMetric value={SEGMENTS} label="samples" decimals={0} />
            <MiniMetric value={controls.lineCount} label="layers" decimals={0} />
          </div>
          <div className="output-grid">
            <OutputCard label="divergenz" value={telemetry.divergence} />
            <OutputCard label="energie" value={telemetry.energy} />
            <OutputCard label="volatilität" value={telemetry.volatility} />
            <OutputCard label="kohärenz" value={telemetry.coherence} />
          </div>
          <div className="status-line">Input stack: autonomous noise / spike field / pointer proximity / impulse decay.</div>
        </aside>
      </header>

      <aside className="formula-panel">
        <div className="kicker">DETERMINISTIC ENGINE</div>
        <div className="formula">r(θ,t)=R+n(θ,t)+s(θ,t)+c(θ,p)+i(t)</div>
        <div className="status-line">Renderer-Kern: Datenfeeds sollen später nur normalisierte Parameter liefern; der Ring bleibt deterministisch, performant und als Web-/Watch-Objekt wiederverwendbar.</div>
      </aside>

      <aside className="controls-panel">
        <div className="chip-row" style={{ justifyContent: "space-between" }}>
          <span className="mono-chip gold">CONTROL SURFACE</span>
          <button type="button" onClick={resetControls} className="reset-button">RESET</button>
        </div>

        <div className="preset-row">
          {Object.keys(PRESETS).map((name) => (
            <button key={name} type="button" className="preset-btn" onClick={() => applyPreset(name)}>
              {name}
            </button>
          ))}
        </div>

        {labels.map(([key, label]) => (
          <ControlRange key={key} label={label} value={controls[key]} onChange={(next) => updateControl(key, next)} />
        ))}

        <ControlRange label="Linien-Layer" value={controls.lineCount} min={1} max={MAX_LAYERS} percent={false} onChange={(next) => updateControl("lineCount", next)} />

        <label className="switch-row">
          <span>Auto escalation</span>
          <input type="checkbox" checked={controls.autoEscalate} onChange={(event) => setControls((current) => ({ ...current, autoEscalate: event.target.checked }))} />
        </label>

        <div className="control-note">
          Schnellstart: RUHIG / STURM / PULS. Tastatur: F=Fokus, B=Hintergrund, S=Spektrum, R=Reset, Leertaste=Impuls.
        </div>
      </aside>

      {/* Float controls – always visible, survive focus mode */}
      <div className="float-controls" role="toolbar" aria-label="Ansichtssteuerung">
        <button
          type="button"
          className={`float-btn${focusMode ? " active" : ""}`}
          onClick={() => setFocusMode((m) => !m)}
          title="Fokus-Modus ein/aus (F)"
          aria-pressed={focusMode}
        >
          {focusMode ? "UI AN" : "UI AUS"}
        </button>
        <button
          type="button"
          className="float-btn"
          onClick={() => setBgIndex((i) => (i + 1) % BG_PRESETS.length)}
          title={`Hintergrund wechseln zu ${nextBgKey} (B)`}
        >
          BG: {preset.key}
        </button>
        <button
          type="button"
          className={`float-btn${spectrumMode ? " active" : ""}`}
          onClick={() => setSpectrumMode((m) => !m)}
          title="Spektrum-Modus ein/aus (S)"
          aria-pressed={spectrumMode}
        >
          SPEKTRUM
        </button>
      </div>
    </div>
  );
}
