import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// STYLES
// ============================================================
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 4px; }

  .ap-root {
    font-family: 'Outfit', sans-serif;
    background: #07070f;
    color: #e8e8f0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ===== HEADER ===== */
  .ap-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: linear-gradient(90deg, #09091a 0%, #0e0e22 100%);
    border-bottom: 1px solid #1a1a32;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }
  .ap-header::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(100,80,255,0.03) 80px, rgba(100,80,255,0.03) 81px);
    pointer-events: none;
  }
  .ap-logo {
    font-family: 'Space Mono', monospace;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    position: relative;
    z-index: 1;
  }
  .ap-logo span { color: #4a4a6a; -webkit-text-fill-color: #4a4a6a; }
  .ap-nav {
    display: flex;
    gap: 4px;
    position: relative;
    z-index: 1;
  }
  .ap-nav-btn {
    border: none;
    cursor: pointer;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 7px 16px;
    border-radius: 6px;
    transition: all 0.18s;
    text-transform: uppercase;
    background: transparent;
    color: #5a5a7a;
    position: relative;
  }
  .ap-nav-btn::after {
    content: '';
    position: absolute;
    bottom: 4px; left: 50%; transform: translateX(-50%);
    width: 0; height: 2px;
    background: linear-gradient(90deg, #a78bfa, #60a5fa);
    transition: width 0.2s;
    border-radius: 2px;
  }
  .ap-nav-btn.active {
    color: #e8e8f0;
    background: rgba(167,139,250,0.1);
  }
  .ap-nav-btn.active::after { width: 70%; }
  .ap-nav-btn:hover:not(.active) { color: #9090b0; background: rgba(255,255,255,0.04); }

  /* ===== CONTROLS BAR ===== */
  .ap-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 24px;
    background: #09091a;
    border-bottom: 1px solid #141428;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .ap-btn {
    border: none;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 7px 14px;
    border-radius: 7px;
    transition: all 0.15s;
    outline: none;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }
  .ap-btn-primary { background: linear-gradient(135deg, #6d4af5, #4a3aff); color: #fff; box-shadow: 0 2px 12px rgba(109,74,245,0.4); }
  .ap-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(109,74,245,0.55); }
  .ap-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
  .ap-btn-green { background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 2px 10px rgba(16,185,129,0.3); }
  .ap-btn-green:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(16,185,129,0.45); }
  .ap-btn-green:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
  .ap-btn-amber { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; box-shadow: 0 2px 10px rgba(245,158,11,0.3); }
  .ap-btn-amber:hover { transform: translateY(-1px); }
  .ap-btn-amber:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .ap-btn-ghost { background: rgba(255,255,255,0.05); color: #8080a0; border: 1px solid rgba(255,255,255,0.08); }
  .ap-btn-ghost:hover { background: rgba(255,255,255,0.09); color: #c0c0e0; }
  .ap-btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }
  .ap-btn-red { background: rgba(239,68,68,0.13); color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
  .ap-btn-red:hover { background: rgba(239,68,68,0.2); }

  .ap-speed-ctrl {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 6px 12px;
    margin-left: auto;
  }
  .ap-speed-label { font-size: 10px; font-weight: 700; color: #5a5a7a; text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap; }
  .ap-speed-val { font-family: 'Space Mono', monospace; font-size: 11px; color: #a78bfa; min-width: 40px; text-align: right; font-weight: 700; }

  input[type=range].ap-slider {
    -webkit-appearance: none; appearance: none;
    height: 4px; background: rgba(255,255,255,0.1);
    border-radius: 4px; outline: none; cursor: pointer; width: 90px;
  }
  input[type=range].ap-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 14px; height: 14px; border-radius: 50%;
    background: #a78bfa; cursor: pointer;
    box-shadow: 0 0 7px rgba(167,139,250,0.6);
    transition: box-shadow 0.15s;
  }
  input[type=range].ap-slider::-webkit-slider-thumb:hover { box-shadow: 0 0 12px rgba(167,139,250,0.9); }

  .ap-size-ctrl {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 6px 12px;
  }

  /* ===== STATUS ===== */
  .ap-status-bar {
    padding: 5px 24px;
    background: #08081a;
    border-bottom: 1px solid #111128;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
    min-height: 32px;
  }
  .ap-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .ap-status-dot.idle { background: #3a3a5a; }
  .ap-status-dot.running { background: #10b981; box-shadow: 0 0 8px #10b981; animation: apPulse 1s infinite; }
  .ap-status-dot.paused { background: #f59e0b; }
  .ap-status-dot.done { background: #a78bfa; }
  .ap-status-msg { font-size: 11px; color: #7070a0; font-family: 'Space Mono', monospace; }
  .ap-status-msg strong { color: #d0d0f0; font-weight: 400; }
  .ap-step-counter { margin-left: auto; font-size: 10px; font-family: 'Space Mono', monospace; color: #4a4a6a; }

  /* ===== MAIN AREA ===== */
  .ap-main {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 260px;
    overflow: hidden;
    height: calc(100vh - 140px);
  }

  /* ===== CANVAS AREA ===== */
  .ap-canvas {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 18px 24px;
    gap: 16px;
    background: #07070f;
    position: relative;
  }
  .ap-canvas::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(109,74,245,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ===== SORT BARS ===== */
  .ap-bars-wrap {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 3px;
    padding: 12px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    min-height: 0;
  }
  .ap-bars-wrap::before {
    content: '';
    position: absolute;
    bottom: 0; left: 12px; right: 12px; height: 1px;
    background: rgba(255,255,255,0.08);
  }
  .ap-bar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    max-width: 40px;
    min-width: 8px;
    height: 100%;
    position: relative;
    transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
  }
  .ap-bar {
    width: 100%;
    border-radius: 4px 4px 0 0;
    transition: height 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.12s;
    position: relative;
  }
  .ap-bar-val {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    color: rgba(255,255,255,0.4);
    margin-bottom: 3px;
    text-align: center;
    line-height: 1;
  }

  /* bar states */
  .ap-bar.default { background: linear-gradient(180deg, #3b3b7a 0%, #252555 100%); }
  .ap-bar.comparing { background: linear-gradient(180deg, #facc15 0%, #d97706 100%); box-shadow: 0 0 12px rgba(250,204,21,0.5); }
  .ap-bar.swapping { background: linear-gradient(180deg, #f87171 0%, #dc2626 100%); box-shadow: 0 0 14px rgba(248,113,113,0.6); }
  .ap-bar.sorted { background: linear-gradient(180deg, #34d399 0%, #059669 100%); box-shadow: 0 0 8px rgba(52,211,153,0.3); }
  .ap-bar.pivot { background: linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%); box-shadow: 0 0 14px rgba(167,139,250,0.6); }
  .ap-bar.found { background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%); box-shadow: 0 0 16px rgba(96,165,250,0.7); }
  .ap-bar.searching { background: linear-gradient(180deg, #fb923c 0%, #ea580c 100%); box-shadow: 0 0 10px rgba(251,146,60,0.5); }
  .ap-bar.left { background: linear-gradient(180deg, #818cf8 0%, #4f46e5 100%); box-shadow: 0 0 10px rgba(129,140,248,0.4); }
  .ap-bar.right { background: linear-gradient(180deg, #f472b6 0%, #db2777 100%); box-shadow: 0 0 10px rgba(244,114,182,0.4); }

  /* ===== BINARY SEARCH ARRAY ===== */
  .ap-bsearch-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 24px;
    padding: 20px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    overflow: hidden;
    min-height: 0;
    position: relative;
  }
  .ap-bs-array {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .ap-bs-cell {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
    position: relative;
    flex-direction: column;
    gap: 2px;
  }
  .ap-bs-cell-idx {
    font-size: 8px;
    font-weight: 400;
    opacity: 0.5;
    position: absolute;
    top: 4px;
  }
  .ap-bs-cell.default { background: rgba(60,60,100,0.5); border: 1px solid rgba(100,100,160,0.3); color: #a0a0c0; }
  .ap-bs-cell.active { background: rgba(167,139,250,0.2); border: 1px solid rgba(167,139,250,0.5); color: #e8e8f0; }
  .ap-bs-cell.left { background: rgba(129,140,248,0.2); border: 1px solid rgba(129,140,248,0.5); color: #c7d2fe; box-shadow: 0 0 10px rgba(129,140,248,0.25); }
  .ap-bs-cell.right { background: rgba(244,114,182,0.2); border: 1px solid rgba(244,114,182,0.5); color: #fbcfe8; box-shadow: 0 0 10px rgba(244,114,182,0.25); }
  .ap-bs-cell.mid { background: rgba(250,204,21,0.2); border: 2px solid rgba(250,204,21,0.6); color: #fef08a; box-shadow: 0 0 14px rgba(250,204,21,0.35); transform: scale(1.08); }
  .ap-bs-cell.found { background: rgba(52,211,153,0.25); border: 2px solid rgba(52,211,153,0.7); color: #6ee7b7; box-shadow: 0 0 18px rgba(52,211,153,0.5); transform: scale(1.15); animation: apFoundPop 0.4s cubic-bezier(0.34,1.56,0.64,1); }
  .ap-bs-cell.eliminated { background: rgba(30,30,50,0.4); border: 1px solid rgba(60,60,90,0.3); color: #3a3a5a; }
  .ap-bs-pointer { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 9px; font-family: 'Space Mono', monospace; }
  .ap-bs-pointer-arrow { font-size: 12px; }
  .ap-bs-pointers-row { display: flex; gap: 4px; }
  .ap-bs-legend { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  .ap-bs-legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #7070a0; }
  .ap-bs-legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
  .ap-bs-target-display {
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: #a78bfa;
    background: rgba(167,139,250,0.1);
    border: 1px solid rgba(167,139,250,0.25);
    border-radius: 8px;
    padding: 8px 18px;
  }

  /* ===== GRAPH (BFS/DFS) ===== */
  .ap-graph-wrap {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    min-height: 0;
  }
  .ap-graph-svg { width: 100%; height: 100%; }
  .ap-graph-edge { stroke: rgba(100,100,160,0.4); stroke-width: 2; transition: stroke 0.25s, stroke-width 0.25s; }
  .ap-graph-edge.traversed { stroke: rgba(167,139,250,0.7); stroke-width: 2.5; }
  .ap-graph-edge.active { stroke: rgba(250,204,21,0.9); stroke-width: 3; filter: drop-shadow(0 0 6px rgba(250,204,21,0.6)); }
  .ap-graph-node { cursor: default; }
  .ap-graph-node circle { transition: fill 0.25s, stroke 0.25s; }
  .ap-graph-node text { font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; fill: #e8e8f0; pointer-events: none; }
  .ap-graph-node.unvisited circle { fill: #1a1a3a; stroke: rgba(100,100,160,0.5); stroke-width: 2; }
  .ap-graph-node.visiting circle { fill: rgba(250,204,21,0.3); stroke: #facc15; stroke-width: 3; filter: drop-shadow(0 0 10px rgba(250,204,21,0.5)); }
  .ap-graph-node.visited circle { fill: rgba(167,139,250,0.25); stroke: #a78bfa; stroke-width: 2.5; }
  .ap-graph-node.start circle { fill: rgba(52,211,153,0.25); stroke: #34d399; stroke-width: 3; }
  .ap-graph-node.current circle { fill: rgba(96,165,250,0.3); stroke: #60a5fa; stroke-width: 3; filter: drop-shadow(0 0 12px rgba(96,165,250,0.6)); animation: apNodePulse 0.8s ease infinite; }

  /* ===== QUEUE / STACK DISPLAY ===== */
  .ap-queue-display {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 10px 14px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    flex-shrink: 0;
    overflow-x: auto;
  }
  .ap-queue-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #5a5a7a; flex-shrink: 0; font-family: 'Space Mono', monospace; }
  .ap-queue-item {
    background: rgba(167,139,250,0.15);
    border: 1px solid rgba(167,139,250,0.3);
    border-radius: 5px;
    padding: 3px 9px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: #c4b5fd;
    animation: apSlideIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
    flex-shrink: 0;
  }
  .ap-queue-item.head { background: rgba(52,211,153,0.2); border-color: rgba(52,211,153,0.4); color: #6ee7b7; }
  .ap-queue-empty { font-size: 10px; color: #3a3a5a; font-style: italic; font-family: 'Space Mono', monospace; }

  /* ===== RIGHT PANEL ===== */
  .ap-panel {
    border-left: 1px solid #141428;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #08081a;
  }
  .ap-panel-section { border-bottom: 1px solid #111128; display: flex; flex-direction: column; overflow: hidden; }
  .ap-panel-section:last-child { flex: 1; border-bottom: none; }
  .ap-panel-header {
    padding: 8px 14px;
    background: #09091a;
    border-bottom: 1px solid #0e0e22;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #4a4a6a;
    flex-shrink: 0;
    font-family: 'Space Mono', monospace;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ap-panel-content { overflow-y: auto; padding: 10px 12px; flex: 1; }

  /* ===== ALGO INFO ===== */
  .ap-algo-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 8px;
  }
  .ap-algo-name { font-size: 13px; font-weight: 700; color: #e8e8f0; margin-bottom: 5px; }
  .ap-algo-stat { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 11px; }
  .ap-algo-stat:last-child { border-bottom: none; }
  .ap-algo-stat-label { color: #5a5a7a; }
  .ap-algo-stat-val { font-family: 'Space Mono', monospace; font-size: 10px; color: #a78bfa; }

  /* ===== PSEUDOCODE ===== */
  .ap-pseudo {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .ap-pseudo-line {
    display: flex;
    align-items: center;
    padding: 3px 10px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: #6060a0;
    transition: all 0.2s;
    line-height: 1.7;
    border-left: 2px solid transparent;
  }
  .ap-pseudo-line.active {
    background: rgba(167,139,250,0.1);
    color: #c4b5fd;
    border-left-color: #a78bfa;
  }
  .ap-pseudo-line-num { color: #3a3a5a; min-width: 22px; flex-shrink: 0; }

  /* ===== STEP LOG ===== */
  .ap-log-item {
    padding: 4px 8px;
    border-radius: 5px;
    font-size: 10px;
    font-family: 'Space Mono', monospace;
    color: #8080b0;
    border-left: 2px solid transparent;
    margin-bottom: 2px;
    animation: apFadeIn 0.25s ease;
    line-height: 1.5;
  }
  .ap-log-item.latest { background: rgba(167,139,250,0.08); border-left-color: #a78bfa; color: #c4b5fd; }
  .ap-log-item.compare { border-left-color: #facc15; }
  .ap-log-item.swap { border-left-color: #f87171; }
  .ap-log-item.sorted { border-left-color: #34d399; }
  .ap-log-item.found { border-left-color: #60a5fa; }

  /* ===== BADGES ===== */
  .ap-badge { display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; font-family: 'Space Mono', monospace; }
  .ap-badge-purple { background: rgba(167,139,250,0.2); color: #a78bfa; }
  .ap-badge-green { background: rgba(52,211,153,0.2); color: #34d399; }
  .ap-badge-blue { background: rgba(96,165,250,0.2); color: #60a5fa; }
  .ap-badge-amber { background: rgba(245,158,11,0.2); color: #fbbf24; }
  .ap-badge-red { background: rgba(248,113,113,0.2); color: #f87171; }

  /* ===== INPUT ROW ===== */
  .ap-input-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .ap-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px;
    padding: 6px 11px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: #e8e8f0;
    outline: none;
    transition: border-color 0.15s;
    width: 110px;
  }
  .ap-input:focus { border-color: rgba(167,139,250,0.5); }
  .ap-input::placeholder { color: #4a4a6a; }
  .ap-input-label { font-size: 10px; color: #5a5a7a; white-space: nowrap; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

  /* ===== EMPTY STATE ===== */
  .ap-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #3a3a5a; gap: 10px; }
  .ap-empty-icon { font-size: 36px; opacity: 0.5; }
  .ap-empty-text { font-size: 12px; font-family: 'Space Mono', monospace; }

  /* ===== MERGE SORT TREE ===== */
  .ap-merge-wrap {
    flex: 1;
    overflow: auto;
    padding: 12px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    min-height: 0;
  }
  .ap-merge-level { display: flex; justify-content: center; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
  .ap-merge-arr {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.25s;
  }
  .ap-merge-arr.active { border-color: rgba(167,139,250,0.5); background: rgba(167,139,250,0.08); }
  .ap-merge-arr.merging { border-color: rgba(52,211,153,0.5); background: rgba(52,211,153,0.06); }
  .ap-merge-cell {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    border-right: 1px solid rgba(255,255,255,0.05);
    transition: all 0.2s;
    color: #8080a0;
  }
  .ap-merge-cell:last-child { border-right: none; }
  .ap-merge-cell.active { background: rgba(167,139,250,0.15); color: #c4b5fd; }
  .ap-merge-cell.sorted { background: rgba(52,211,153,0.15); color: #6ee7b7; }

  /* ===== QUICK SORT ===== */
  .ap-bar.left-region { background: linear-gradient(180deg, #818cf8 0%, #4338ca 100%); }
  .ap-bar.right-region { background: linear-gradient(180deg, #f472b6 0%, #be185d 100%); }

  @keyframes apPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes apNodePulse { 0%,100% { filter: drop-shadow(0 0 8px rgba(96,165,250,0.5)); } 50% { filter: drop-shadow(0 0 18px rgba(96,165,250,0.9)); } }
  @keyframes apFoundPop { 0% { transform: scale(1); } 50% { transform: scale(1.25); } 100% { transform: scale(1.15); } }
  @keyframes apSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes apFadeIn { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
`;

// ============================================================
// ALGORITHM IMPLEMENTATIONS
// ============================================================

// ---- BUBBLE SORT ----
function generateBubbleSortSteps(arr) {
  const a = [...arr];
  const steps = [];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        arr: [...a],
        comparing: [j, j + 1],
        swapping: [],
        sorted: Array.from({ length: i }, (_, k) => n - 1 - k),
        msg: `Comparing a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}`,
        type: "compare",
        pseudoLine: 3,
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({
          arr: [...a],
          comparing: [],
          swapping: [j, j + 1],
          sorted: Array.from({ length: i }, (_, k) => n - 1 - k),
          msg: `Swap! a[${j}] and a[${j + 1}] → [${a[j]}, ${a[j + 1]}]`,
          type: "swap",
          pseudoLine: 4,
        });
      }
    }
    steps.push({
      arr: [...a],
      comparing: [],
      swapping: [],
      sorted: Array.from({ length: i + 1 }, (_, k) => n - 1 - k),
      msg: `Pass ${i + 1} done. a[${n - 1 - i}]=${a[n - 1 - i]} is in place.`,
      type: "sorted",
      pseudoLine: 2,
    });
  }
  steps.push({
    arr: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, k) => k),
    msg: "Array fully sorted! 🎉",
    type: "sorted",
    pseudoLine: -1,
  });
  return steps;
}

// ---- SELECTION SORT ----
function generateSelectionSortSteps(arr) {
  const a = [...arr];
  const steps = [];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      steps.push({
        arr: [...a],
        comparing: [minIdx, j],
        swapping: [],
        sorted: Array.from({ length: i }, (_, k) => k),
        pivot: [minIdx],
        msg: `Comparing: min(a[${minIdx}]=${a[minIdx]}) vs a[${j}]=${a[j]}`,
        type: "compare",
        pseudoLine: 3,
      });
      if (a[j] < a[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      steps.push({
        arr: [...a],
        comparing: [],
        swapping: [i, minIdx],
        sorted: Array.from({ length: i }, (_, k) => k),
        msg: `Placed minimum ${a[i]} at index ${i}`,
        type: "swap",
        pseudoLine: 5,
      });
    }
    steps.push({
      arr: [...a],
      comparing: [],
      swapping: [],
      sorted: Array.from({ length: i + 1 }, (_, k) => k),
      msg: `a[${i}]=${a[i]} is in its final position`,
      type: "sorted",
      pseudoLine: 2,
    });
  }
  steps.push({
    arr: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, k) => k),
    msg: "Array fully sorted! 🎉",
    type: "sorted",
    pseudoLine: -1,
  });
  return steps;
}

// ---- INSERTION SORT ----
function generateInsertionSortSteps(arr) {
  const a = [...arr];
  const steps = [];
  const n = a.length;
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    steps.push({
      arr: [...a],
      comparing: [i],
      swapping: [],
      sorted: [],
      pivot: [i],
      msg: `Key = a[${i}] = ${key}. Inserting into sorted portion.`,
      type: "compare",
      pseudoLine: 2,
    });
    while (j >= 0 && a[j] > key) {
      steps.push({
        arr: [...a],
        comparing: [j, j + 1],
        swapping: [],
        sorted: [],
        msg: `a[${j}]=${a[j]} > ${key}, shifting right`,
        type: "compare",
        pseudoLine: 4,
      });
      a[j + 1] = a[j];
      steps.push({
        arr: [...a],
        comparing: [],
        swapping: [j, j + 1],
        sorted: [],
        msg: `Shifted a[${j}]=${a[j + 1]} → position ${j + 1}`,
        type: "swap",
        pseudoLine: 5,
      });
      j--;
    }
    a[j + 1] = key;
    steps.push({
      arr: [...a],
      comparing: [],
      swapping: [],
      sorted: [],
      msg: `Inserted ${key} at position ${j + 1}`,
      type: "sorted",
      pseudoLine: 6,
    });
  }
  steps.push({
    arr: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, k) => k),
    msg: "Array fully sorted! 🎉",
    type: "sorted",
    pseudoLine: -1,
  });
  return steps;
}

// ---- MERGE SORT ----
function generateMergeSortSteps(arr) {
  const steps = [];
  function merge(a, left, mid, right) {
    const leftArr = a.slice(left, mid + 1);
    const rightArr = a.slice(mid + 1, right + 1);
    let i = 0,
      j = 0,
      k = left;
    while (i < leftArr.length && j < rightArr.length) {
      steps.push({
        arr: [...a],
        comparing: [left + i, mid + 1 + j],
        swapping: [],
        sorted: [],
        msg: `Merging: comparing ${leftArr[i]} and ${rightArr[j]}`,
        type: "compare",
        pseudoLine: 5,
        mergeLeft: left,
        mergeRight: right,
      });
      if (leftArr[i] <= rightArr[j]) {
        a[k++] = leftArr[i++];
      } else {
        a[k++] = rightArr[j++];
      }
      steps.push({
        arr: [...a],
        comparing: [],
        swapping: [k - 1],
        sorted: [],
        msg: `Placed ${a[k - 1]} at position ${k - 1}`,
        type: "swap",
        pseudoLine: 6,
        mergeLeft: left,
        mergeRight: right,
      });
    }
    while (i < leftArr.length) {
      a[k++] = leftArr[i++];
    }
    while (j < rightArr.length) {
      a[k++] = rightArr[j++];
    }
    steps.push({
      arr: [...a],
      comparing: [],
      swapping: [],
      sorted: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
      msg: `Merged subarray [${left}..${right}]`,
      type: "sorted",
      pseudoLine: 7,
      mergeLeft: left,
      mergeRight: right,
    });
  }
  function mergeSort(a, left, right) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    steps.push({
      arr: [...a],
      comparing: [left, right],
      swapping: [],
      sorted: [],
      msg: `Divide [${left}..${right}] at mid=${mid}`,
      type: "compare",
      pseudoLine: 2,
      mergeLeft: left,
      mergeRight: right,
    });
    mergeSort(a, left, mid);
    mergeSort(a, mid + 1, right);
    merge(a, left, mid, right);
  }
  const a = [...arr];
  mergeSort(a, 0, a.length - 1);
  steps.push({
    arr: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: a.length }, (_, k) => k),
    msg: "Array fully sorted! 🎉",
    type: "sorted",
    pseudoLine: -1,
  });
  return steps;
}

// ---- QUICK SORT ----
function generateQuickSortSteps(arr) {
  const steps = [];
  function partition(a, low, high) {
    const pivotVal = a[high];
    steps.push({
      arr: [...a],
      comparing: [],
      swapping: [],
      sorted: [],
      pivot: [high],
      msg: `Pivot = a[${high}] = ${pivotVal}`,
      type: "compare",
      pseudoLine: 2,
    });
    let i = low - 1;
    for (let j = low; j < high; j++) {
      steps.push({
        arr: [...a],
        comparing: [j, high],
        swapping: [],
        sorted: [],
        pivot: [high],
        leftRegion: Array.from({ length: i - low + 1 }, (_, k) => low + k),
        msg: `a[${j}]=${a[j]} vs pivot=${pivotVal}`,
        type: "compare",
        pseudoLine: 4,
      });
      if (a[j] <= pivotVal) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        steps.push({
          arr: [...a],
          comparing: [],
          swapping: [i, j],
          sorted: [],
          pivot: [high],
          msg: `Swap a[${i}]=${a[i]} and a[${j}]=${a[j]}`,
          type: "swap",
          pseudoLine: 5,
        });
      }
    }
    [a[i + 1], a[high]] = [a[high], a[i + 1]];
    steps.push({
      arr: [...a],
      comparing: [],
      swapping: [],
      sorted: [i + 1],
      pivot: [],
      msg: `Pivot ${pivotVal} placed at index ${i + 1}`,
      type: "sorted",
      pseudoLine: 6,
    });
    return i + 1;
  }
  function quickSort(a, low, high) {
    if (low < high) {
      const pi = partition(a, low, high);
      quickSort(a, low, pi - 1);
      quickSort(a, pi + 1, high);
    }
  }
  const a = [...arr];
  quickSort(a, 0, a.length - 1);
  steps.push({
    arr: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: a.length }, (_, k) => k),
    msg: "Array fully sorted! 🎉",
    type: "sorted",
    pseudoLine: -1,
  });
  return steps;
}

// ---- BINARY SEARCH ----
function generateBinarySearchSteps(arr, target) {
  const a = [...arr].sort((x, y) => x - y);
  const steps = [];
  let left = 0,
    right = a.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    steps.push({
      arr: a,
      left,
      right,
      mid,
      target,
      found: false,
      msg: `Check mid=${mid} (val=${a[mid]}). Range [${left}..${right}]`,
      type: "compare",
      pseudoLine: 3,
    });
    if (a[mid] === target) {
      steps.push({
        arr: a,
        left,
        right,
        mid,
        target,
        found: true,
        foundIdx: mid,
        msg: `Found ${target} at index ${mid}! 🎉`,
        type: "found",
        pseudoLine: 4,
      });
      return steps;
    } else if (a[mid] < target) {
      steps.push({
        arr: a,
        left,
        right: right,
        mid,
        target,
        found: false,
        msg: `a[${mid}]=${a[mid]} < ${target} → search RIGHT half`,
        type: "compare",
        pseudoLine: 5,
      });
      left = mid + 1;
    } else {
      steps.push({
        arr: a,
        left,
        right,
        mid,
        target,
        found: false,
        msg: `a[${mid}]=${a[mid]} > ${target} → search LEFT half`,
        type: "compare",
        pseudoLine: 6,
      });
      right = mid - 1;
    }
  }
  steps.push({
    arr: a,
    left,
    right,
    mid: -1,
    target,
    found: false,
    notFound: true,
    msg: `${target} not found in array`,
    type: "notfound",
    pseudoLine: -1,
  });
  return steps;
}

// ---- BFS ----
const GRAPH_NODES = {
  0: { label: "A", x: 0.5, y: 0.12 },
  1: { label: "B", x: 0.25, y: 0.35 },
  2: { label: "C", x: 0.75, y: 0.35 },
  3: { label: "D", x: 0.12, y: 0.62 },
  4: { label: "E", x: 0.38, y: 0.62 },
  5: { label: "F", x: 0.62, y: 0.62 },
  6: { label: "G", x: 0.88, y: 0.62 },
  7: { label: "H", x: 0.25, y: 0.87 },
  8: { label: "I", x: 0.75, y: 0.87 },
};
const GRAPH_EDGES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [2, 6],
  [3, 7],
  [4, 7],
  [5, 8],
  [6, 8],
];

function generateBFSSteps(start = 0) {
  const steps = [];
  const visited = new Set();
  const queue = [start];
  visited.add(start);
  const traversedEdges = new Set();
  while (queue.length > 0) {
    const node = queue.shift();
    steps.push({
      visited: new Set(visited),
      current: node,
      queue: [...queue],
      traversedEdges: new Set(traversedEdges),
      activeEdge: null,
      msg: `Visit node ${GRAPH_NODES[node].label}. Queue: [${queue.map((n) => GRAPH_NODES[n].label).join(", ")}]`,
      type: "visit",
      pseudoLine: 3,
    });
    const neighbors = GRAPH_EDGES.filter(([a, b]) => a === node || b === node)
      .map(([a, b]) => (a === node ? b : a))
      .sort();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const edgeKey = `${Math.min(node, neighbor)}-${Math.max(node, neighbor)}`;
        steps.push({
          visited: new Set(visited),
          current: node,
          queue: [...queue],
          traversedEdges: new Set(traversedEdges),
          activeEdge: edgeKey,
          msg: `Explore edge ${GRAPH_NODES[node].label}→${GRAPH_NODES[neighbor].label}: not visited, adding to queue`,
          type: "explore",
          pseudoLine: 5,
        });
        visited.add(neighbor);
        queue.push(neighbor);
        traversedEdges.add(edgeKey);
      } else {
        steps.push({
          visited: new Set(visited),
          current: node,
          queue: [...queue],
          traversedEdges: new Set(traversedEdges),
          activeEdge: null,
          msg: `Node ${GRAPH_NODES[neighbor].label} already visited, skip`,
          type: "skip",
          pseudoLine: 6,
        });
      }
    }
  }
  steps.push({
    visited: new Set(visited),
    current: -1,
    queue: [],
    traversedEdges: new Set(traversedEdges),
    activeEdge: null,
    msg: "BFS complete! All reachable nodes visited. 🎉",
    type: "done",
    pseudoLine: -1,
  });
  return steps;
}

// ---- DFS ----
function generateDFSSteps(start = 0) {
  const steps = [];
  const visited = new Set();
  const traversedEdges = new Set();
  const stack = [];
  function dfs(node) {
    visited.add(node);
    stack.push(node);
    steps.push({
      visited: new Set(visited),
      current: node,
      stack: [...stack],
      traversedEdges: new Set(traversedEdges),
      activeEdge: null,
      msg: `Visit ${GRAPH_NODES[node].label}. Stack: [${stack.map((n) => GRAPH_NODES[n].label).join("→")}]`,
      type: "visit",
      pseudoLine: 2,
    });
    const neighbors = GRAPH_EDGES.filter(([a, b]) => a === node || b === node)
      .map(([a, b]) => (a === node ? b : a))
      .sort();
    for (const neighbor of neighbors) {
      const edgeKey = `${Math.min(node, neighbor)}-${Math.max(node, neighbor)}`;
      if (!visited.has(neighbor)) {
        traversedEdges.add(edgeKey);
        steps.push({
          visited: new Set(visited),
          current: node,
          stack: [...stack],
          traversedEdges: new Set(traversedEdges),
          activeEdge: edgeKey,
          msg: `Explore edge ${GRAPH_NODES[node].label}→${GRAPH_NODES[neighbor].label}: not visited`,
          type: "explore",
          pseudoLine: 4,
        });
        dfs(neighbor);
      }
    }
    stack.pop();
    steps.push({
      visited: new Set(visited),
      current: node,
      stack: [...stack],
      traversedEdges: new Set(traversedEdges),
      activeEdge: null,
      msg: `Backtrack from ${GRAPH_NODES[node].label}. Stack: [${stack.map((n) => GRAPH_NODES[n].label).join("→")}]`,
      type: "backtrack",
      pseudoLine: 5,
    });
  }
  dfs(start);
  steps.push({
    visited: new Set(visited),
    current: -1,
    stack: [],
    traversedEdges: new Set(traversedEdges),
    activeEdge: null,
    msg: "DFS complete! All reachable nodes visited. 🎉",
    type: "done",
    pseudoLine: -1,
  });
  return steps;
}

// ============================================================
// PSEUDOCODE DEFINITIONS
// ============================================================
const PSEUDOCODE = {
  bubble: [
    "for i = 0 to n-1:",
    "  for j = 0 to n-i-2:",
    "    if arr[j] > arr[j+1]:",
    "      swap(arr[j], arr[j+1])",
  ],
  selection: [
    "for i = 0 to n-1:",
    "  minIdx = i",
    "  for j = i+1 to n:",
    "    if arr[j] < arr[minIdx]: minIdx = j",
    "  swap(arr[i], arr[minIdx])",
  ],
  insertion: [
    "for i = 1 to n:",
    "  key = arr[i]",
    "  j = i - 1",
    "  while j >= 0 and arr[j] > key:",
    "    arr[j+1] = arr[j]",
    "    j -= 1",
    "  arr[j+1] = key",
  ],
  merge: [
    "mergeSort(arr, left, right):",
    "  mid = (left + right) / 2",
    "  mergeSort(arr, left, mid)",
    "  mergeSort(arr, mid+1, right)",
    "  merge(arr, left, mid, right)",
    "    pick smaller element",
    "    place in merged array",
  ],
  quick: [
    "quickSort(arr, low, high):",
    "  pivot = arr[high]",
    "  i = low - 1",
    "  for j = low to high-1:",
    "    if arr[j] <= pivot: swap",
    "  swap(arr[i+1], arr[high])",
  ],
  binary: [
    "binarySearch(arr, target):",
    "  left = 0, right = n-1",
    "  mid = (left + right) / 2",
    "  if arr[mid] == target: return mid",
    "  elif arr[mid] < target: left = mid+1",
    "  else: right = mid-1",
  ],
  bfs: [
    "bfs(start):",
    "  visited = {start}; queue = [start]",
    "  while queue not empty:",
    "    node = queue.dequeue()",
    "    for neighbor in graph[node]:",
    "      if not visited: enqueue",
    "      else: skip",
  ],
  dfs: [
    "dfs(node):",
    "  mark node as visited",
    "  for neighbor in graph[node]:",
    "    if not visited:",
    "      dfs(neighbor)",
    "  backtrack",
  ],
};

const ALGO_INFO = {
  bubble: {
    name: "Bubble Sort",
    time: "O(n²)",
    space: "O(1)",
    best: "O(n)",
    stable: "Yes",
  },
  selection: {
    name: "Selection Sort",
    time: "O(n²)",
    space: "O(1)",
    best: "O(n²)",
    stable: "No",
  },
  insertion: {
    name: "Insertion Sort",
    time: "O(n²)",
    space: "O(1)",
    best: "O(n)",
    stable: "Yes",
  },
  merge: {
    name: "Merge Sort",
    time: "O(n log n)",
    space: "O(n)",
    best: "O(n log n)",
    stable: "Yes",
  },
  quick: {
    name: "Quick Sort",
    time: "O(n log n)",
    space: "O(log n)",
    best: "O(n log n)",
    stable: "No",
  },
  binary: {
    name: "Binary Search",
    time: "O(log n)",
    space: "O(1)",
    best: "O(1)",
    stable: "—",
  },
  bfs: {
    name: "Breadth-First Search",
    time: "O(V+E)",
    space: "O(V)",
    best: "O(1)",
    stable: "—",
  },
  dfs: {
    name: "Depth-First Search",
    time: "O(V+E)",
    space: "O(V)",
    best: "O(1)",
    stable: "—",
  },
};

// ============================================================
// HELPER: Random array
// ============================================================
function randomArray(size = 16, min = 5, max = 95) {
  return Array.from(
    { length: size },
    () => Math.floor(Math.random() * (max - min + 1)) + min,
  );
}

// ============================================================
// SORT VISUALIZER COMPONENT
// ============================================================
function SortVisualizer({ algo }) {
  const [arr, setArr] = useState(() => randomArray(16));
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [size, setSize] = useState(16);
  const [log, setLog] = useState([]);
  const [activePseudo, setActivePseudo] = useState(-1);
  const timerRef = useRef(null);
  const logRef = useRef(null);

  const currentData =
    currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;

  const generateSteps = useCallback(() => {
    const newArr = randomArray(size);
    setArr(newArr);
    let s;
    if (algo === "bubble") s = generateBubbleSortSteps(newArr);
    else if (algo === "selection") s = generateSelectionSortSteps(newArr);
    else if (algo === "insertion") s = generateInsertionSortSteps(newArr);
    else if (algo === "merge") s = generateMergeSortSteps(newArr);
    else if (algo === "quick") s = generateQuickSortSteps(newArr);
    else s = generateBubbleSortSteps(newArr);
    setSteps(s);
    setCurrentStep(-1);
    setLog([]);
    setActivePseudo(-1);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [algo, size]);

  useEffect(() => {
    generateSteps();
  }, [algo, size]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const delay = Math.max(50, 800 / (speed / 100));
    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          setIsPlaying(false);
          clearInterval(timerRef.current);
          return prev;
        }
        const s = steps[next];
        setActivePseudo(s.pseudoLine);
        setLog((l) => [...l.slice(-30), { msg: s.msg, type: s.type }]);
        return next;
      });
    }, delay);
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentStep, steps, speed]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const stepForward = () => {
    if (currentStep >= steps.length - 1) return;
    const next = currentStep + 1;
    const s = steps[next];
    setActivePseudo(s.pseudoLine);
    setLog((l) => [...l.slice(-30), { msg: s.msg, type: s.type }]);
    setCurrentStep(next);
  };

  const stepBack = () => {
    if (currentStep <= 0) {
      setCurrentStep(-1);
      setActivePseudo(-1);
      return;
    }
    setCurrentStep(currentStep - 1);
  };

  const reset = () => {
    setCurrentStep(-1);
    setLog([]);
    setActivePseudo(-1);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const displayArr = currentData ? currentData.arr : arr;
  const maxVal = Math.max(...displayArr);
  const isDone = currentStep >= steps.length - 1 && steps.length > 0;

  const getBarState = (idx) => {
    if (!currentData) return "default";
    if (currentData.sorted?.includes(idx)) return "sorted";
    if (currentData.swapping?.includes(idx)) return "swapping";
    if (currentData.comparing?.includes(idx)) return "comparing";
    if (currentData.pivot?.includes(idx)) return "pivot";
    return "default";
  };

  const info = ALGO_INFO[algo];
  const pseudo = PSEUDOCODE[algo] || [];
  const statusText = isPlaying
    ? "Running"
    : isDone
      ? "Done"
      : currentStep >= 0
        ? "Paused"
        : "Ready";

  return (
    <>
      <div className="ap-controls">
        <button className="ap-btn ap-btn-ghost" onClick={generateSteps}>
          🔀 New Array
        </button>
        {!isPlaying ? (
          <button
            className="ap-btn ap-btn-green"
            onClick={() => setIsPlaying(true)}
            disabled={isDone}
          >
            ▶ Play
          </button>
        ) : (
          <button
            className="ap-btn ap-btn-amber"
            onClick={() => setIsPlaying(false)}
          >
            ⏸ Pause
          </button>
        )}
        <button
          className="ap-btn ap-btn-ghost"
          onClick={stepBack}
          disabled={currentStep < 0}
        >
          ← Back
        </button>
        <button
          className="ap-btn ap-btn-primary"
          onClick={stepForward}
          disabled={isDone || !steps.length}
        >
          Step →
        </button>
        <button className="ap-btn ap-btn-red" onClick={reset}>
          ↺ Reset
        </button>

        <div className="ap-size-ctrl">
          <span className="ap-input-label">Size</span>
          <input
            type="range"
            className="ap-slider"
            min={6}
            max={30}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            style={{ width: 70 }}
          />
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: "#a78bfa",
              minWidth: 20,
            }}
          >
            {size}
          </span>
        </div>

        <div className="ap-speed-ctrl">
          <span className="ap-speed-label">Speed</span>
          <input
            type="range"
            className="ap-slider"
            min={25}
            max={400}
            step={25}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span className="ap-speed-val">{speed}%</span>
        </div>
      </div>

      <div className="ap-status-bar">
        <span
          className={`ap-status-dot ${isPlaying ? "running" : isDone ? "done" : currentStep >= 0 ? "paused" : "idle"}`}
        />
        <span className="ap-status-msg">
          <strong>{statusText}</strong>
          {currentData && ` — ${currentData.msg}`}
        </span>
        {steps.length > 0 && currentStep >= 0 && (
          <span className="ap-step-counter">
            Step {currentStep + 1}/{steps.length}
          </span>
        )}
      </div>

      <div className="ap-main">
        <div className="ap-canvas">
          <div className="ap-bars-wrap">
            {displayArr.map((val, idx) => (
              <div key={idx} className="ap-bar-container">
                {size <= 20 && <div className="ap-bar-val">{val}</div>}
                <div
                  className={`ap-bar ${getBarState(idx)}`}
                  style={{ height: `${(val / maxVal) * 90}%` }}
                />
              </div>
            ))}
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            {[
              ["comparing", "#facc15", "Comparing"],
              ["swapping", "#f87171", "Swapping"],
              ["sorted", "#34d399", "Sorted"],
              ["pivot", "#a78bfa", "Pivot"],
            ].map(([key, color, label]) => (
              <div
                key={key}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: color,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: "#6060a0",
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ap-panel">
          <div className="ap-panel-section" style={{ flexShrink: 0 }}>
            <div className="ap-panel-header">Algorithm Info</div>
            <div className="ap-panel-content" style={{ padding: "10px 12px" }}>
              <div className="ap-algo-card">
                <div className="ap-algo-name">{info.name}</div>
                {[
                  ["Time (avg)", info.time],
                  ["Time (best)", info.best],
                  ["Space", info.space],
                  ["Stable", info.stable],
                ].map(([k, v]) => (
                  <div key={k} className="ap-algo-stat">
                    <span className="ap-algo-stat-label">{k}</span>
                    <span className="ap-algo-stat-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ap-panel-section" style={{ flexShrink: 0 }}>
            <div className="ap-panel-header">Pseudocode</div>
            <div className="ap-panel-content" style={{ padding: "8px 10px" }}>
              <div className="ap-pseudo">
                {pseudo.map((line, i) => (
                  <div
                    key={i}
                    className={`ap-pseudo-line${activePseudo === i ? " active" : ""}`}
                  >
                    <span className="ap-pseudo-line-num">{i + 1}</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ap-panel-section">
            <div className="ap-panel-header">
              Step Log{" "}
              <span className="ap-badge ap-badge-purple">{log.length}</span>
            </div>
            <div className="ap-panel-content" ref={logRef}>
              {log.length === 0 && (
                <div className="ap-empty">
                  <span className="ap-empty-text">Press Play to start</span>
                </div>
              )}
              {log.map((item, i) => (
                <div
                  key={i}
                  className={`ap-log-item ${i === log.length - 1 ? "latest" : ""} ${item.type}`}
                >
                  {item.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// BINARY SEARCH VISUALIZER
// ============================================================
function BinarySearchVisualizer() {
  const [arr] = useState(() =>
    [
      ...new Set(
        Array.from({ length: 15 }, () => Math.floor(Math.random() * 95) + 5),
      ),
    ]
      .sort((a, b) => a - b)
      .slice(0, 14),
  );
  const [target, setTarget] = useState(null);
  const [targetInput, setTargetInput] = useState("");
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [log, setLog] = useState([]);
  const timerRef = useRef(null);

  const currentData =
    currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;
  const isDone = currentStep >= steps.length - 1 && steps.length > 0;

  const handleSearch = () => {
    const t = parseInt(targetInput);
    if (isNaN(t)) return;
    setTarget(t);
    const s = generateBinarySearchSteps(arr, t);
    setSteps(s);
    setCurrentStep(-1);
    setLog([]);
    setIsPlaying(false);
  };

  const handleSearchRandom = () => {
    const t = arr[Math.floor(Math.random() * arr.length)];
    setTarget(t);
    setTargetInput(String(t));
    const s = generateBinarySearchSteps(arr, t);
    setSteps(s);
    setCurrentStep(-1);
    setLog([]);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const delay = Math.max(300, 1200 / (speed / 100));
    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          setIsPlaying(false);
          clearInterval(timerRef.current);
          return prev;
        }
        const s = steps[next];
        setLog((l) => [...l.slice(-20), { msg: s.msg, type: s.type }]);
        return next;
      });
    }, delay);
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentStep, steps, speed]);

  const stepForward = () => {
    if (currentStep >= steps.length - 1) return;
    const next = currentStep + 1;
    setLog((l) => [
      ...l.slice(-20),
      { msg: steps[next].msg, type: steps[next].type },
    ]);
    setCurrentStep(next);
  };

  const getCellState = (idx) => {
    if (!currentData) return "default";
    if (currentData.found && currentData.foundIdx === idx) return "found";
    if (currentData.mid === idx && !currentData.found) return "mid";
    if (idx < currentData.left || idx > currentData.right) return "eliminated";
    if (idx === currentData.left) return "left";
    if (idx === currentData.right) return "right";
    return "active";
  };

  const pseudo = PSEUDOCODE["binary"];

  return (
    <>
      <div className="ap-controls">
        <div className="ap-input-row">
          <span className="ap-input-label">Target</span>
          <input
            className="ap-input"
            placeholder="Enter number…"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="ap-btn ap-btn-primary" onClick={handleSearch}>
            🔍 Search
          </button>
          <button className="ap-btn ap-btn-ghost" onClick={handleSearchRandom}>
            🎲 Random
          </button>
        </div>

        {steps.length > 0 && (
          <>
            {!isPlaying ? (
              <button
                className="ap-btn ap-btn-green"
                onClick={() => setIsPlaying(true)}
                disabled={isDone}
              >
                ▶ Play
              </button>
            ) : (
              <button
                className="ap-btn ap-btn-amber"
                onClick={() => setIsPlaying(false)}
              >
                ⏸ Pause
              </button>
            )}
            <button
              className="ap-btn ap-btn-primary"
              onClick={stepForward}
              disabled={isDone}
            >
              Step →
            </button>
            <button
              className="ap-btn ap-btn-red"
              onClick={() => {
                setCurrentStep(-1);
                setLog([]);
                setIsPlaying(false);
              }}
            >
              ↺ Reset
            </button>
          </>
        )}

        <div className="ap-speed-ctrl" style={{ marginLeft: "auto" }}>
          <span className="ap-speed-label">Speed</span>
          <input
            type="range"
            className="ap-slider"
            min={25}
            max={300}
            step={25}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span className="ap-speed-val">{speed}%</span>
        </div>
      </div>

      <div className="ap-status-bar">
        <span
          className={`ap-status-dot ${isPlaying ? "running" : isDone ? "done" : currentStep >= 0 ? "paused" : "idle"}`}
        />
        <span className="ap-status-msg">
          {currentData ? (
            <>
              <strong>
                {currentData.type === "found"
                  ? "Found!"
                  : currentData.type === "notfound"
                    ? "Not Found"
                    : "Searching"}
              </strong>{" "}
              — {currentData.msg}
            </>
          ) : (
            <strong>Enter a target value and click Search</strong>
          )}
        </span>
        {steps.length > 0 && currentStep >= 0 && (
          <span className="ap-step-counter">
            Step {currentStep + 1}/{steps.length}
          </span>
        )}
      </div>

      <div className="ap-main">
        <div className="ap-canvas">
          <div className="ap-bsearch-wrap">
            {target !== null && (
              <div className="ap-bs-target-display">
                🎯 Target: <strong>{target}</strong>
              </div>
            )}
            <div className="ap-bs-array">
              {arr.map((val, idx) => (
                <div
                  key={idx}
                  className={`ap-bs-cell ${steps.length > 0 ? getCellState(idx) : "default"}`}
                >
                  <span className="ap-bs-cell-idx">[{idx}]</span>
                  {val}
                </div>
              ))}
            </div>

            {currentData && (
              <div className="ap-bs-pointers-row">
                {currentData.left <= currentData.right && (
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                      fontSize: 11,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    <span style={{ color: "#818cf8" }}>
                      L={currentData.left}
                    </span>
                    <span style={{ color: "#5a5a7a" }}>|</span>
                    <span style={{ color: "#facc15" }}>
                      M={currentData.mid}
                    </span>
                    <span style={{ color: "#5a5a7a" }}>|</span>
                    <span style={{ color: "#f472b6" }}>
                      R={currentData.right}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="ap-bs-legend">
              {[
                ["#facc15", "Mid"],
                ["#818cf8", "Left"],
                ["#f472b6", "Right"],
                ["#34d399", "Found"],
                ["#3a3a5a", "Eliminated"],
              ].map(([color, label]) => (
                <div key={label} className="ap-bs-legend-item">
                  <div
                    className="ap-bs-legend-dot"
                    style={{ background: color }}
                  />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ap-panel">
          <div className="ap-panel-section" style={{ flexShrink: 0 }}>
            <div className="ap-panel-header">Algorithm Info</div>
            <div className="ap-panel-content">
              <div className="ap-algo-card">
                <div className="ap-algo-name">Binary Search</div>
                {[
                  ["Time", "O(log n)"],
                  ["Space", "O(1)"],
                  ["Prerequisite", "Sorted array"],
                  ["Best case", "O(1)"],
                ].map(([k, v]) => (
                  <div key={k} className="ap-algo-stat">
                    <span className="ap-algo-stat-label">{k}</span>
                    <span className="ap-algo-stat-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="ap-panel-section" style={{ flexShrink: 0 }}>
            <div className="ap-panel-header">Pseudocode</div>
            <div className="ap-panel-content" style={{ padding: "8px 10px" }}>
              <div className="ap-pseudo">
                {pseudo.map((line, i) => (
                  <div
                    key={i}
                    className={`ap-pseudo-line${currentData?.pseudoLine === i ? " active" : ""}`}
                  >
                    <span className="ap-pseudo-line-num">{i + 1}</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="ap-panel-section">
            <div className="ap-panel-header">Step Log</div>
            <div className="ap-panel-content">
              {log.length === 0 && (
                <div className="ap-empty">
                  <span className="ap-empty-text">Awaiting search…</span>
                </div>
              )}
              {log.map((item, i) => (
                <div
                  key={i}
                  className={`ap-log-item ${i === log.length - 1 ? "latest" : ""} ${item.type}`}
                >
                  {item.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// GRAPH VISUALIZER (BFS / DFS)
// ============================================================
function GraphVisualizer({ algo }) {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [log, setLog] = useState([]);
  const [startNode, setStartNode] = useState(0);
  const svgRef = useRef(null);
  const timerRef = useRef(null);

  const currentData =
    currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;
  const isDone = currentStep >= steps.length - 1 && steps.length > 0;

  const handleStart = useCallback(() => {
    const s =
      algo === "bfs"
        ? generateBFSSteps(startNode)
        : generateDFSSteps(startNode);
    setSteps(s);
    setCurrentStep(-1);
    setLog([]);
    setIsPlaying(false);
  }, [algo, startNode]);

  useEffect(() => {
    handleStart();
  }, [algo]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const delay = Math.max(200, 900 / (speed / 100));
    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          setIsPlaying(false);
          clearInterval(timerRef.current);
          return prev;
        }
        const s = steps[next];
        setLog((l) => [...l.slice(-25), { msg: s.msg, type: s.type }]);
        return next;
      });
    }, delay);
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentStep, steps, speed]);

  const stepForward = () => {
    if (currentStep >= steps.length - 1) return;
    const next = currentStep + 1;
    setLog((l) => [
      ...l.slice(-25),
      { msg: steps[next].msg, type: steps[next].type },
    ]);
    setCurrentStep(next);
  };

  const [svgSize, setSvgSize] = useState({ w: 500, h: 380 });
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const e of entries)
        setSvgSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    if (svgRef.current) obs.observe(svgRef.current);
    return () => obs.disconnect();
  }, []);

  const getNodeState = (id) => {
    if (!currentData) return id === startNode ? "start" : "unvisited";
    if (currentData.current === id) return "current";
    if (currentData.visited?.has(id)) return "visited";
    if (id === startNode) return "start";
    return "unvisited";
  };

  const getEdgeState = (a, b) => {
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (!currentData) return "";
    if (currentData.activeEdge === key) return "active";
    if (currentData.traversedEdges?.has(key)) return "traversed";
    return "";
  };

  const pseudo = PSEUDOCODE[algo];
  const queueOrStack = currentData
    ? algo === "bfs"
      ? currentData.queue
      : currentData.stack
    : [];
  const queueLabel = algo === "bfs" ? "Queue" : "Stack";

  return (
    <>
      <div className="ap-controls">
        <div className="ap-input-row">
          <span className="ap-input-label">Start Node</span>
          <select
            value={startNode}
            onChange={(e) => setStartNode(Number(e.target.value))}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 7,
              padding: "6px 10px",
              color: "#e8e8f0",
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
            }}
          >
            {Object.entries(GRAPH_NODES).map(([id, n]) => (
              <option key={id} value={id} style={{ background: "#09091a" }}>
                {n.label} (node {id})
              </option>
            ))}
          </select>
          <button className="ap-btn ap-btn-primary" onClick={handleStart}>
            ⚡ Start {algo.toUpperCase()}
          </button>
        </div>

        {steps.length > 0 && (
          <>
            {!isPlaying ? (
              <button
                className="ap-btn ap-btn-green"
                onClick={() => setIsPlaying(true)}
                disabled={isDone}
              >
                ▶ Play
              </button>
            ) : (
              <button
                className="ap-btn ap-btn-amber"
                onClick={() => setIsPlaying(false)}
              >
                ⏸ Pause
              </button>
            )}
            <button
              className="ap-btn ap-btn-primary"
              onClick={stepForward}
              disabled={isDone}
            >
              Step →
            </button>
            <button
              className="ap-btn ap-btn-red"
              onClick={() => {
                setCurrentStep(-1);
                setLog([]);
                setIsPlaying(false);
              }}
            >
              ↺ Reset
            </button>
          </>
        )}

        <div className="ap-speed-ctrl" style={{ marginLeft: "auto" }}>
          <span className="ap-speed-label">Speed</span>
          <input
            type="range"
            className="ap-slider"
            min={25}
            max={300}
            step={25}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span className="ap-speed-val">{speed}%</span>
        </div>
      </div>

      <div className="ap-status-bar">
        <span
          className={`ap-status-dot ${isPlaying ? "running" : isDone ? "done" : currentStep >= 0 ? "paused" : "idle"}`}
        />
        <span className="ap-status-msg">
          {currentData ? (
            <>{currentData.msg}</>
          ) : (
            <strong>Click Start to begin {algo.toUpperCase()} traversal</strong>
          )}
        </span>
        {steps.length > 0 && currentStep >= 0 && (
          <span className="ap-step-counter">
            Step {currentStep + 1}/{steps.length}
          </span>
        )}
      </div>

      <div className="ap-main">
        <div className="ap-canvas">
          <div className="ap-graph-wrap" ref={svgRef}>
            <svg
              className="ap-graph-svg"
              viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
            >
              {GRAPH_EDGES.map(([a, b]) => {
                const na = GRAPH_NODES[a],
                  nb = GRAPH_NODES[b];
                const x1 = na.x * svgSize.w,
                  y1 = na.y * svgSize.h;
                const x2 = nb.x * svgSize.w,
                  y2 = nb.y * svgSize.h;
                const state = getEdgeState(a, b);
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className={`ap-graph-edge ${state}`}
                  />
                );
              })}
              {Object.entries(GRAPH_NODES).map(([id, node]) => {
                const x = node.x * svgSize.w,
                  y = node.y * svgSize.h;
                const state = getNodeState(Number(id));
                return (
                  <g
                    key={id}
                    className={`ap-graph-node ${state}`}
                    transform={`translate(${x},${y})`}
                  >
                    <circle r={20} />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Queue/Stack display */}
          <div className="ap-queue-display">
            <span className="ap-queue-label">{queueLabel}:</span>
            {!queueOrStack || queueOrStack.length === 0 ? (
              <span className="ap-queue-empty">empty</span>
            ) : (
              queueOrStack.map((id, i) => (
                <div
                  key={i}
                  className={`ap-queue-item${i === 0 ? " head" : ""}`}
                >
                  {GRAPH_NODES[id]?.label}
                </div>
              ))
            )}
          </div>

          {/* Visited order */}
          {currentData && currentData.visited?.size > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "#5a5a7a",
                  fontFamily: "'Space Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                Visited:
              </span>
              {[...currentData.visited].map((id, i) => (
                <div
                  key={i}
                  className="ap-queue-item"
                  style={{
                    background: "rgba(52,211,153,0.15)",
                    borderColor: "rgba(52,211,153,0.35)",
                    color: "#6ee7b7",
                  }}
                >
                  {GRAPH_NODES[id]?.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ap-panel">
          <div className="ap-panel-section" style={{ flexShrink: 0 }}>
            <div className="ap-panel-header">Algorithm Info</div>
            <div className="ap-panel-content">
              <div className="ap-algo-card">
                <div className="ap-algo-name">{ALGO_INFO[algo].name}</div>
                {[
                  ["Time", ALGO_INFO[algo].time],
                  ["Space", ALGO_INFO[algo].space],
                  [
                    "Data Structure",
                    algo === "bfs" ? "Queue" : "Stack (call stack)",
                  ],
                  [
                    "Use Case",
                    algo === "bfs" ? "Shortest path" : "Cycle detection",
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="ap-algo-stat">
                    <span className="ap-algo-stat-label">{k}</span>
                    <span className="ap-algo-stat-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="ap-panel-section" style={{ flexShrink: 0 }}>
            <div className="ap-panel-header">Pseudocode</div>
            <div className="ap-panel-content" style={{ padding: "8px 10px" }}>
              <div className="ap-pseudo">
                {pseudo.map((line, i) => (
                  <div
                    key={i}
                    className={`ap-pseudo-line${currentData?.pseudoLine === i ? " active" : ""}`}
                  >
                    <span className="ap-pseudo-line-num">{i + 1}</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="ap-panel-section">
            <div className="ap-panel-header">Step Log</div>
            <div className="ap-panel-content">
              {log.length === 0 && (
                <div className="ap-empty">
                  <span className="ap-empty-text">Awaiting traversal…</span>
                </div>
              )}
              {log.map((item, i) => (
                <div
                  key={i}
                  className={`ap-log-item ${i === log.length - 1 ? "latest" : ""} ${item.type}`}
                >
                  {item.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Algorithms() {
  const [category, setCategory] = useState("sorting");
  const [algo, setAlgo] = useState("bubble");

  const styleRef = useRef(false);
  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const el = document.createElement("style");
    el.id = "ap-styles";
    el.textContent = STYLES;
    document.head.appendChild(el);
  }, []);

  const CATEGORIES = [
    { id: "sorting", label: "Sorting" },
    { id: "searching", label: "Searching" },
    { id: "graph", label: "Graph" },
  ];

  const ALGO_TABS = {
    sorting: [
      { id: "bubble", label: "Bubble" },
      { id: "selection", label: "Selection" },
      { id: "insertion", label: "Insertion" },
      { id: "merge", label: "Merge" },
      { id: "quick", label: "Quick" },
    ],
    searching: [{ id: "binary", label: "Binary Search" }],
    graph: [
      { id: "bfs", label: "BFS" },
      { id: "dfs", label: "DFS" },
    ],
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setAlgo(ALGO_TABS[cat][0].id);
  };

  return (
    <div className="ap-root">
      <div className="ap-header">
        <div className="ap-logo">
          ⚡ Algorithm <span>//</span> Playground
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div className="ap-nav">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`ap-nav-btn${category === c.id ? " active" : ""}`}
                onClick={() => handleCategoryChange(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: "#1a1a32" }} />
          <div className="ap-nav">
            {(ALGO_TABS[category] || []).map((a) => (
              <button
                key={a.id}
                className={`ap-nav-btn${algo === a.id ? " active" : ""}`}
                onClick={() => setAlgo(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {category === "sorting" && <SortVisualizer key={algo} algo={algo} />}
      {category === "searching" && algo === "binary" && (
        <BinarySearchVisualizer key="binary" />
      )}
      {category === "graph" && <GraphVisualizer key={algo} algo={algo} />}
    </div>
  );
}
