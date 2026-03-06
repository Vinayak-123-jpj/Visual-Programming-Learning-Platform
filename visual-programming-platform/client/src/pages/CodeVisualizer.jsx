import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// STYLES
// ============================================================
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 4px; }

  .cv-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #080d14;
    color: #dce8f0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* HEADER */
  .cv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 20px;
    background: #090f18;
    border-bottom: 1px solid #112030;
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 8px;
    position: relative;
  }
  .cv-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(56,189,248,0.2), transparent);
  }
  .cv-logo {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cv-logo-icon {
    width: 26px; height: 26px;
    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
  }
  .cv-logo-text {
    background: linear-gradient(90deg, #38bdf8, #818cf8, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .cv-logo-sub { color: #2a4560; -webkit-text-fill-color: #2a4560; font-size: 12px; margin-left: 2px; }
  .cv-header-tabs {
    display: flex;
    gap: 3px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 3px;
  }
  .cv-header-tab {
    border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 11px; font-weight: 600;
    padding: 5px 14px; border-radius: 6px;
    transition: all 0.15s;
    background: transparent; color: #4a6080;
  }
  .cv-header-tab.active {
    background: #0f1e30;
    color: #38bdf8;
    box-shadow: 0 1px 8px rgba(56,189,248,0.15);
  }
  .cv-header-tab:hover:not(.active) { color: #8090b0; background: rgba(255,255,255,0.03); }

  /* BEGINNER CALLOUT */
  .cv-beginner-bar {
    background: linear-gradient(90deg, rgba(56,189,248,0.06), rgba(129,140,248,0.06));
    border-bottom: 1px solid rgba(56,189,248,0.1);
    padding: 7px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .cv-beginner-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 8px #38bdf8;
    flex-shrink: 0;
  }
  .cv-beginner-text { font-size: 11px; color: #6090b0; line-height: 1.5; flex: 1; }
  .cv-beginner-text strong { color: #38bdf8; }

  /* CONCEPT MODAL */
  .cv-concept-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.88);
    backdrop-filter: blur(10px);
    z-index: 200;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: cvFadeIn 0.2s ease;
  }
  .cv-concept-card {
    background: #0a1322;
    border: 1px solid rgba(56,189,248,0.25);
    border-radius: 16px;
    padding: 26px 30px;
    max-width: 560px; width: 100%;
    max-height: 88vh; overflow-y: auto;
    box-shadow: 0 20px 80px rgba(0,0,0,0.9), 0 0 40px rgba(14,165,233,0.1);
    animation: cvSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .cv-concept-emoji { font-size: 40px; text-align: center; margin-bottom: 8px; }
  .cv-concept-title { font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 4px; }
  .cv-concept-sub { text-align: center; font-size: 12px; color: #38bdf8; font-family: 'JetBrains Mono', monospace; margin-bottom: 18px; }
  .cv-concept-section { margin-bottom: 16px; }
  .cv-concept-section-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;
    color: #2a4560; margin-bottom: 7px; font-family: 'JetBrains Mono', monospace;
  }
  .cv-concept-body { font-size: 13px; line-height: 1.75; color: #8aaccc; }
  .cv-concept-box {
    background: rgba(56,189,248,0.05);
    border: 1px solid rgba(56,189,248,0.15);
    border-left: 3px solid #38bdf8;
    border-radius: 8px;
    padding: 11px 14px;
    font-size: 12px; line-height: 1.65; color: #90b8d8;
  }
  .cv-concept-example {
    background: #060d18;
    border: 1px solid #112030;
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; line-height: 1.8;
    color: #5a8aaa;
    overflow-x: auto;
  }
  .cv-concept-example .kw { color: #818cf8; }
  .cv-concept-example .str { color: #34d399; }
  .cv-concept-example .num { color: #fb923c; }
  .cv-concept-example .cmt { color: #2a5070; }
  .cv-concept-example .fn { color: #38bdf8; }
  .cv-concept-steps { display: flex; flex-direction: column; gap: 6px; }
  .cv-concept-step {
    display: flex; gap: 10px; align-items: flex-start;
    font-size: 12px; color: #7090b0; line-height: 1.55;
  }
  .cv-concept-step-n {
    background: rgba(56,189,248,0.15);
    color: #38bdf8;
    border-radius: 50%; width: 20px; height: 20px;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
    font-family: 'JetBrains Mono', monospace;
  }
  .cv-concept-actions { display: flex; gap: 8px; margin-top: 20px; }
  .cv-concept-btn-start {
    flex: 1; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 700;
    padding: 11px 18px; border-radius: 9px;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: #fff; box-shadow: 0 4px 20px rgba(14,165,233,0.4);
    transition: all 0.15s;
  }
  .cv-concept-btn-start:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(14,165,233,0.55); }
  .cv-concept-btn-skip {
    border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px; font-weight: 600;
    padding: 11px 16px; border-radius: 9px;
    background: transparent; color: #4a6080; transition: all 0.15s;
  }
  .cv-concept-btn-skip:hover { background: rgba(255,255,255,0.04); color: #7090a0; }

  /* MAIN LAYOUT */
  .cv-body {
    flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;
  }
  .cv-workspace {
    flex: 1; display: grid;
    grid-template-columns: 1fr 300px;
    overflow: hidden; min-height: 0;
  }

  /* EDITOR PANE */
  .cv-editor-pane {
    display: flex; flex-direction: column;
    overflow: hidden; min-height: 0;
    border-right: 1px solid #0f1e30;
  }
  .cv-editor-header {
    padding: 7px 14px;
    background: #090f18;
    border-bottom: 1px solid #0f1e30;
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
    flex-wrap: wrap; gap: 6px;
  }
  .cv-editor-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1.2px; color: #2a4560;
    font-family: 'JetBrains Mono', monospace;
    display: flex; align-items: center; gap: 7px;
  }
  .cv-editor-dot { width: 8px; height: 8px; border-radius: 50%; }
  .cv-editor-dot.red { background: #f87171; }
  .cv-editor-dot.yellow { background: #fbbf24; }
  .cv-editor-dot.green { background: #34d399; }
  .cv-btn {
    border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 11px; font-weight: 700;
    padding: 6px 13px; border-radius: 7px;
    transition: all 0.14s; outline: none;
    display: flex; align-items: center; gap: 5px; white-space: nowrap;
  }
  .cv-btn-blue { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #fff; box-shadow: 0 2px 12px rgba(14,165,233,0.35); }
  .cv-btn-blue:hover { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(14,165,233,0.5); }
  .cv-btn-blue:disabled { opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none; }
  .cv-btn-green { background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 2px 10px rgba(16,185,129,0.3); }
  .cv-btn-green:hover { transform: translateY(-1px); }
  .cv-btn-green:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
  .cv-btn-amber { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
  .cv-btn-amber:hover { transform: translateY(-1px); }
  .cv-btn-ghost { background: rgba(255,255,255,0.04); color: #5a7090; border: 1px solid rgba(255,255,255,0.07); }
  .cv-btn-ghost:hover { background: rgba(255,255,255,0.07); color: #90aac0; }
  .cv-btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }
  .cv-btn-red { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.22); }
  .cv-btn-red:hover { background: rgba(239,68,68,0.2); }
  .cv-btn-outline-blue { background: rgba(56,189,248,0.08); color: #38bdf8; border: 1px solid rgba(56,189,248,0.25); }
  .cv-btn-outline-blue:hover { background: rgba(56,189,248,0.15); }

  /* CODE EDITOR */
  .cv-code-area {
    flex: 1; display: flex; overflow: hidden; min-height: 0;
    position: relative;
    background: #060d18;
  }
  .cv-line-numbers {
    padding: 14px 0;
    background: #070e1a;
    border-right: 1px solid #0f1e30;
    min-width: 44px;
    text-align: right;
    flex-shrink: 0;
    overflow: hidden;
    user-select: none;
  }
  .cv-line-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #1a3048;
    padding: 0 10px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    transition: color 0.15s;
  }
  .cv-line-num.active { color: #38bdf8; }
  .cv-line-num.executed { color: #2a5070; }
  .cv-code-editor-wrap {
    flex: 1;
    overflow: auto;
    position: relative;
  }
  .cv-code-highlight {
    position: absolute;
    inset: 0;
    pointer-events: none;
    padding: 14px 0;
    overflow: hidden;
  }
  .cv-code-line-bg {
    height: 22px;
    transition: background 0.18s;
  }
  .cv-code-line-bg.active {
    background: rgba(56,189,248,0.1);
    box-shadow: inset 2px 0 0 #38bdf8;
  }
  .cv-code-line-bg.executed {
    background: rgba(52,211,153,0.04);
  }
  .cv-code-line-bg.error {
    background: rgba(239,68,68,0.1);
    box-shadow: inset 2px 0 0 #f87171;
  }
  textarea.cv-textarea {
    position: relative;
    width: 100%;
    min-height: 100%;
    background: transparent;
    border: none; outline: none;
    padding: 14px 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12.5px;
    line-height: 22px;
    color: #7aaac8;
    resize: none;
    caret-color: #38bdf8;
    white-space: pre;
    overflow-wrap: normal;
    tab-size: 4;
    z-index: 1;
  }
  textarea.cv-textarea::selection { background: rgba(56,189,248,0.15); }

  /* CONTROLS */
  .cv-controls {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px;
    background: #090f18;
    border-top: 1px solid #0f1e30;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .cv-speed-wrap {
    margin-left: auto;
    display: flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 7px;
    padding: 5px 10px;
  }
  .cv-speed-label { font-size: 9px; font-weight: 700; color: #2a4560; text-transform: uppercase; letter-spacing: 0.8px; }
  input[type=range].cv-slider {
    -webkit-appearance: none; appearance: none;
    height: 3px; background: rgba(255,255,255,0.08);
    border-radius: 4px; outline: none; cursor: pointer; width: 80px;
  }
  input[type=range].cv-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 13px; height: 13px; border-radius: 50%;
    background: #38bdf8; cursor: pointer;
    box-shadow: 0 0 7px rgba(56,189,248,0.6);
  }
  .cv-speed-val { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #38bdf8; min-width: 30px; font-weight: 700; }

  /* STATUS BAR */
  .cv-status {
    display: flex; align-items: center; gap: 10px;
    padding: 5px 16px;
    background: #070d18;
    border-top: 1px solid #0c1828;
    flex-shrink: 0; min-height: 30px;
  }
  .cv-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .cv-status-dot.idle { background: #1e3a50; }
  .cv-status-dot.running { background: #10b981; box-shadow: 0 0 8px #10b981; animation: cvPulse 1s infinite; }
  .cv-status-dot.paused { background: #f59e0b; }
  .cv-status-dot.done { background: #38bdf8; }
  .cv-status-dot.error { background: #f87171; }
  .cv-status-msg { font-size: 10px; color: #3a6080; font-family: 'JetBrains Mono', monospace; }
  .cv-status-msg strong { color: #90b8d0; font-weight: 400; }
  .cv-step-ctr { margin-left: auto; font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #1e3a50; }

  /* RIGHT PANEL */
  .cv-panel {
    display: flex; flex-direction: column; overflow: hidden;
    background: #080d18;
  }
  .cv-panel-tab-bar {
    display: flex; border-bottom: 1px solid #0f1e30; flex-shrink: 0;
  }
  .cv-panel-tab {
    border: none; cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 8px 14px;
    background: transparent; color: #2a4560;
    border-bottom: 2px solid transparent;
    transition: all 0.15s; flex: 1; white-space: nowrap;
  }
  .cv-panel-tab.active { color: #38bdf8; border-bottom-color: #38bdf8; background: rgba(56,189,248,0.05); }
  .cv-panel-tab:hover:not(.active) { color: #5a7090; }
  .cv-panel-content { flex: 1; overflow-y: auto; overflow-x: hidden; }

  /* VARIABLES TABLE */
  .cv-vars-wrap { padding: 10px; }
  .cv-vars-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #1e3a50; gap: 8px; }
  .cv-vars-empty-text { font-size: 11px; font-family: 'JetBrains Mono', monospace; text-align: center; line-height: 1.6; }
  .cv-var-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid #0f1e30;
    border-radius: 7px;
    padding: 7px 10px;
    margin-bottom: 6px;
    display: flex; align-items: flex-start; gap: 8px;
    animation: cvVarIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
    transition: border-color 0.2s;
  }
  .cv-var-card.changed {
    border-color: rgba(56,189,248,0.35);
    background: rgba(56,189,248,0.04);
    animation: cvVarPop 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }
  .cv-var-card.new-var {
    border-color: rgba(52,211,153,0.35);
    background: rgba(52,211,153,0.04);
  }
  .cv-var-type {
    font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    padding: 2px 5px; border-radius: 3px;
    font-family: 'JetBrains Mono', monospace;
    flex-shrink: 0; margin-top: 1px;
  }
  .cv-var-type.int { background: rgba(251,146,60,0.18); color: #fb923c; }
  .cv-var-type.str { background: rgba(52,211,153,0.15); color: #34d399; }
  .cv-var-type.float { background: rgba(167,139,250,0.15); color: #a78bfa; }
  .cv-var-type.list { background: rgba(244,114,182,0.15); color: #f472b6; }
  .cv-var-type.dict { background: rgba(56,189,248,0.15); color: #38bdf8; }
  .cv-var-type.bool { background: rgba(234,179,8,0.15); color: #eab308; }
  .cv-var-type.none { background: rgba(100,116,139,0.2); color: #94a3b8; }
  .cv-var-name { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #38bdf8; font-weight: 500; }
  .cv-var-eq { color: #2a4560; font-size: 11px; margin: 0 3px; }
  .cv-var-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #90b8c8; word-break: break-all; flex: 1; }
  .cv-var-changed-badge {
    font-size: 8px; padding: 1px 5px; border-radius: 3px;
    background: rgba(56,189,248,0.15); color: #38bdf8;
    font-family: 'JetBrains Mono', monospace; flex-shrink: 0; margin-top: 1px;
  }

  /* OUTPUT */
  .cv-output-wrap { padding: 10px; }
  .cv-output-line {
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    line-height: 1.7; padding: 2px 0;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    animation: cvFadeIn 0.2s ease;
  }
  .cv-output-line.print { color: #90c0a0; }
  .cv-output-line.error { color: #f87171; background: rgba(239,68,68,0.05); padding: 4px 8px; border-radius: 5px; border: none; }
  .cv-output-prompt { color: #2a5070; margin-right: 6px; }

  /* EXPLANATION */
  .cv-explain-box {
    background: rgba(56,189,248,0.05);
    border: 1px solid rgba(56,189,248,0.15);
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 11.5px; line-height: 1.65; color: #6090b0;
    margin: 8px;
    animation: cvFadeIn 0.2s ease;
  }
  .cv-explain-label {
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #38bdf8; margin-bottom: 4px;
    font-family: 'JetBrains Mono', monospace; opacity: 0.8;
  }

  /* CALL STACK */
  .cv-stack-wrap { padding: 10px; }
  .cv-stack-frame {
    background: rgba(255,255,255,0.02);
    border: 1px solid #0f2030;
    border-radius: 7px; padding: 7px 10px; margin-bottom: 5px;
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    animation: cvVarIn 0.2s ease;
  }
  .cv-stack-frame-name { color: #38bdf8; margin-bottom: 3px; }
  .cv-stack-frame-line { color: #2a5070; font-size: 10px; }

  /* ERROR MODAL */
  .cv-error-box {
    background: rgba(239,68,68,0.07);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px;
    padding: 14px 16px;
    margin: 10px;
    animation: cvFadeIn 0.2s ease;
  }
  .cv-error-title {
    font-size: 13px; font-weight: 700; color: #f87171;
    margin-bottom: 6px; display: flex; align-items: center; gap: 7px;
  }
  .cv-error-type {
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    color: #f87171; background: rgba(239,68,68,0.12);
    padding: 2px 7px; border-radius: 4px;
  }
  .cv-error-msg { font-size: 12px; color: #c08080; line-height: 1.6; margin-bottom: 10px; }
  .cv-error-explain {
    font-size: 11.5px; color: #906070; line-height: 1.65;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-left: 3px solid #f87171;
    border-radius: 6px; padding: 8px 10px;
  }

  /* SAMPLES */
  .cv-samples {
    padding: 8px 14px;
    display: flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid #0f1e30;
    flex-shrink: 0; flex-wrap: wrap;
  }
  .cv-samples-label { font-size: 9px; font-weight: 700; color: #2a4560; text-transform: uppercase; letter-spacing: 0.8px; font-family: 'JetBrains Mono', monospace; white-space: nowrap; }
  .cv-sample-btn {
    border: 1px solid #0f2030; cursor: pointer;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500;
    padding: 4px 10px; border-radius: 5px;
    background: #060d18; color: #3a6080;
    transition: all 0.14s; white-space: nowrap;
  }
  .cv-sample-btn:hover { border-color: rgba(56,189,248,0.3); color: #38bdf8; background: rgba(56,189,248,0.05); }
  .cv-sample-btn.active { border-color: rgba(56,189,248,0.45); color: #38bdf8; background: rgba(56,189,248,0.08); }

  /* CONCEPT PANE below editor */
  .cv-concept-inline {
    border-top: 1px solid #0f1e30;
    background: #080d18;
    flex-shrink: 0;
    padding: 10px 16px;
    font-size: 12px; color: #5a8aaa; line-height: 1.65;
    display: flex; align-items: flex-start; gap: 10px;
  }
  .cv-concept-inline-icon { font-size: 20px; flex-shrink: 0; }
  .cv-concept-inline-body { flex: 1; }
  .cv-concept-inline-title { font-size: 11px; font-weight: 700; color: #38bdf8; margin-bottom: 3px; }

  @keyframes cvPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes cvFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cvSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes cvVarIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes cvVarPop { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }

  /* ===== MEMORY DIAGRAM ===== */
  .cv-mem-wrap {
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-x: auto;
  }
  .cv-mem-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 40px 16px;
    color: #1e3a50; gap: 10px; text-align: center;
  }
  .cv-mem-empty-icon { font-size: 32px; }
  .cv-mem-empty-text { font-size: 11px; font-family: 'JetBrains Mono', monospace; line-height: 1.7; }
  .cv-mem-section-title {
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1.1px; color: #2a4560;
    font-family: 'JetBrains Mono', monospace;
    padding: 6px 4px 4px; margin-bottom: 4px;
    border-bottom: 1px solid #0f1e30;
  }

  /* Stack frame box */
  .cv-mem-frame {
    background: rgba(14,165,233,0.06);
    border: 1px solid rgba(14,165,233,0.2);
    border-radius: 8px;
    margin-bottom: 10px;
    overflow: hidden;
    animation: cvVarIn 0.25s ease;
  }
  .cv-mem-frame-header {
    background: rgba(14,165,233,0.1);
    padding: 5px 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 700;
    color: #38bdf8;
    display: flex; align-items: center; gap: 6px;
  }
  .cv-mem-frame-active-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #38bdf8; box-shadow: 0 0 6px #38bdf8;
    animation: cvPulse 1s infinite;
  }
  .cv-mem-frame-rows { padding: 6px 8px; display: flex; flex-direction: column; gap: 4px; }

  /* A single variable row inside a frame */
  .cv-mem-var-row {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 6px;
    border-radius: 5px;
    transition: background 0.2s;
    position: relative;
  }
  .cv-mem-var-row.changed { background: rgba(56,189,248,0.08); }
  .cv-mem-var-row.new-var { background: rgba(52,211,153,0.07); }
  .cv-mem-var-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; color: #38bdf8; font-weight: 600;
    min-width: 60px; flex-shrink: 0;
  }
  .cv-mem-var-arrow {
    color: #2a5070; font-size: 11px; flex-shrink: 0;
  }

  /* Primitive value box */
  .cv-mem-prim-box {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 600;
    padding: 3px 8px; border-radius: 5px;
    border: 1px solid;
    transition: all 0.25s;
    animation: cvVarPop 0.3s ease;
  }
  .cv-mem-prim-box.int    { color: #fb923c; border-color: rgba(251,146,60,0.35); background: rgba(251,146,60,0.08); }
  .cv-mem-prim-box.float  { color: #a78bfa; border-color: rgba(167,139,250,0.35); background: rgba(167,139,250,0.08); }
  .cv-mem-prim-box.str    { color: #34d399; border-color: rgba(52,211,153,0.35); background: rgba(52,211,153,0.08); }
  .cv-mem-prim-box.bool   { color: #eab308; border-color: rgba(234,179,8,0.35); background: rgba(234,179,8,0.08); }
  .cv-mem-prim-box.none   { color: #64748b; border-color: rgba(100,116,139,0.35); background: rgba(100,116,139,0.08); }

  /* Reference pointer pill */
  .cv-mem-ref-pill {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; font-weight: 700;
    padding: 2px 7px; border-radius: 10px;
    background: rgba(244,114,182,0.12);
    color: #f472b6;
    border: 1px solid rgba(244,114,182,0.3);
    display: flex; align-items: center; gap: 4px;
    cursor: default;
  }
  .cv-mem-ref-pill.dict-ref {
    background: rgba(56,189,248,0.1);
    color: #38bdf8;
    border-color: rgba(56,189,248,0.3);
  }
  .cv-mem-ref-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

  /* Heap section */
  .cv-mem-heap { margin-top: 4px; }
  .cv-mem-heap-obj {
    background: rgba(244,114,182,0.05);
    border: 1px solid rgba(244,114,182,0.2);
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
    animation: cvVarIn 0.25s ease;
  }
  .cv-mem-heap-obj.dict-obj {
    background: rgba(56,189,248,0.05);
    border-color: rgba(56,189,248,0.2);
  }
  .cv-mem-heap-header {
    background: rgba(244,114,182,0.1);
    padding: 4px 10px;
    display: flex; align-items: center; justify-content: space-between;
    font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
    color: #f472b6; text-transform: uppercase; letter-spacing: 0.7px;
  }
  .cv-mem-heap-header.dict-hdr { background: rgba(56,189,248,0.1); color: #38bdf8; }
  .cv-mem-heap-addr { color: #3a5070; font-weight: 400; }

  /* List cells row */
  .cv-mem-list-cells {
    display: flex; align-items: stretch;
    padding: 8px 10px; gap: 3px; flex-wrap: wrap;
  }
  .cv-mem-list-cell {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    min-width: 36px;
  }
  .cv-mem-list-idx {
    font-family: 'JetBrains Mono', monospace; font-size: 8px; color: #2a4560;
  }
  .cv-mem-list-val {
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600;
    padding: 4px 6px; border-radius: 4px;
    border: 1px solid rgba(244,114,182,0.3);
    background: rgba(244,114,182,0.08); color: #f9a8d4;
    min-width: 32px; text-align: center;
    transition: all 0.2s;
    animation: cvVarPop 0.3s ease;
  }
  .cv-mem-list-val.changed-cell {
    border-color: rgba(56,189,248,0.5);
    background: rgba(56,189,248,0.12);
    color: #7dd3fc;
    box-shadow: 0 0 8px rgba(56,189,248,0.3);
  }
  .cv-mem-list-len {
    font-size: 9px; color: #3a5070;
    font-family: 'JetBrains Mono', monospace;
    padding: 0 10px 6px;
  }

  /* Dict rows */
  .cv-mem-dict-rows { padding: 6px 10px; display: flex; flex-direction: column; gap: 4px; }
  .cv-mem-dict-row {
    display: flex; align-items: center; gap: 6px;
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
  }
  .cv-mem-dict-key { color: #38bdf8; font-weight: 600; }
  .cv-mem-dict-colon { color: #2a4560; }
  .cv-mem-dict-val { color: #90b8c8; }

  /* Legend */
  .cv-mem-legend {
    display: flex; gap: 10px; flex-wrap: wrap;
    padding: 8px 4px 2px;
    border-top: 1px solid #0f1e30;
    margin-top: 4px;
  }
  .cv-mem-legend-item { display: flex; align-items: center; gap: 5px; font-size: 9px; color: #2a5070; }
  .cv-mem-legend-dot { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }

  /* Connector SVG line */
  .cv-mem-connectors { position: absolute; top: 0; left: 0; pointer-events: none; }
`;

// ============================================================
// SAMPLE PROGRAMS
// ============================================================
const SAMPLES = {
  variables: {
    label: "📦 Variables",
    concept: "variables",
    code: `# Variables store data in memory
name = "Alice"
age = 20
gpa = 3.85
is_student = True

# You can change variable values
age = age + 1

# Printing variables
print("Name:", name)
print("Age:", age)
print("GPA:", gpa)
print("Student:", is_student)`,
  },
  loop: {
    label: "🔁 For Loop",
    concept: "loops",
    code: `# A for loop repeats code multiple times
total = 0
numbers = [1, 2, 3, 4, 5]

for num in numbers:
    total = total + num
    print("Added", num, "- Total is now:", total)

print("Final total:", total)`,
  },
  while: {
    label: "⏳ While Loop",
    concept: "loops",
    code: `# While loop keeps running until condition is False
count = 1
result = 0

while count <= 5:
    result = result + count
    print("count =", count, "result =", result)
    count = count + 1

print("Loop done! Result:", result)`,
  },
  function: {
    label: "🔧 Functions",
    concept: "functions",
    code: `# Functions are reusable blocks of code
def greet(person_name):
    message = "Hello, " + person_name + "!"
    return message

def add(a, b):
    result = a + b
    return result

# Calling the functions
greeting = greet("Bob")
print(greeting)

sum_result = add(10, 25)
print("10 + 25 =", sum_result)`,
  },
  conditional: {
    label: "❓ If/Else",
    concept: "conditionals",
    code: `# If/else makes decisions based on conditions
score = 75

if score >= 90:
    grade = "A"
    print("Excellent!")
elif score >= 80:
    grade = "B"
    print("Good job!")
elif score >= 70:
    grade = "C"
    print("Satisfactory")
else:
    grade = "F"
    print("Need improvement")

print("Your grade:", grade)`,
  },
  list: {
    label: "📋 Lists",
    concept: "lists",
    code: `# Lists hold multiple values
fruits = ["apple", "banana", "cherry"]
print("Original:", fruits)

# Add items
fruits.append("mango")
print("After append:", fruits)

# Access by index
print("First fruit:", fruits[0])
print("Last fruit:", fruits[-1])

# Loop through list
for i in range(len(fruits)):
    print(i, "->", fruits[i])`,
  },
  fibonacci: {
    label: "🌀 Fibonacci",
    concept: "loops",
    code: `# Generate Fibonacci sequence
def fibonacci(n):
    a = 0
    b = 1
    sequence = []
    
    for i in range(n):
        sequence.append(a)
        next_val = a + b
        a = b
        b = next_val
    
    return sequence

result = fibonacci(8)
print("Fibonacci:", result)`,
  },
  recursion: {
    label: "🔄 Recursion",
    concept: "functions",
    code: `# Factorial using recursion
def factorial(n):
    if n == 0:
        return 1
    result = n * factorial(n - 1)
    return result

# Calculate 5!
answer = factorial(5)
print("5! =", answer)`,
  },
};

// ============================================================
// CONCEPT EXPLANATIONS
// ============================================================
const CONCEPTS = {
  variables: {
    emoji: "📦",
    title: "Variables",
    sub: "// storing & labeling data",
    what: "A variable is like a labeled box that stores a piece of data. You give it a name, and Python remembers the value for you to use later.",
    analogy:
      "🏷️ Think of a variable like a sticky note. You write a label (the name) and a value on it, and stick it somewhere you can find. When you need the value, just look for the label!",
    steps: [
      "Pick a descriptive name (like age, score, name)",
      "Use = to assign a value",
      "Python stores it in memory",
      "Use the name anywhere to get the value back",
      "You can update the value at any time",
    ],
    example: `<span class="kw">name</span> = <span class="str">"Alice"</span>      <span class="cmt"># string (text)</span>
<span class="kw">age</span>  = <span class="num">20</span>          <span class="cmt"># int (whole number)</span>
<span class="kw">gpa</span>  = <span class="num">3.85</span>        <span class="cmt"># float (decimal)</span>
<span class="kw">ok</span>   = <span class="kw">True</span>        <span class="cmt"># bool (True/False)</span>`,
    tip: "Variable names should be lowercase with underscores (snake_case). Good names make code readable!",
  },
  loops: {
    emoji: "🔁",
    title: "Loops",
    sub: "// repeating code automatically",
    what: "A loop lets you run the same block of code multiple times without rewriting it. Python has two types: for loops (known number of times) and while loops (keep going until a condition fails).",
    analogy:
      "⚙️ Imagine a washing machine cycle — it repeats the same wash/rinse steps automatically. A loop does the same: runs code over and over until the job is done.",
    steps: [
      "for loop: iterates over a list or range",
      "while loop: runs as long as condition is True",
      "The indented block runs each iteration",
      "A loop variable (like i or num) updates each time",
      "Loops end when the list runs out or condition is False",
    ],
    example: `<span class="cmt"># for loop - runs exactly 5 times</span>
<span class="kw">for</span> i <span class="kw">in</span> <span class="fn">range</span>(<span class="num">5</span>):
    <span class="fn">print</span>(<span class="str">"Step"</span>, i)

<span class="cmt"># while loop - runs until x >= 3</span>
x = <span class="num">0</span>
<span class="kw">while</span> x < <span class="num">3</span>:
    x = x + <span class="num">1</span>`,
    tip: "Careful with while loops — if the condition never becomes False, the loop runs forever (infinite loop)!",
  },
  functions: {
    emoji: "🔧",
    title: "Functions",
    sub: "// reusable blocks of code",
    what: "A function is a named block of code you can call (run) whenever you need it. You define it once with def, and call it as many times as you want. Functions can accept inputs (parameters) and return outputs.",
    analogy:
      "🍳 A function is like a recipe. You write it once (define), and follow it whenever you cook (call). You can pass different ingredients (arguments) and get a dish (return value) back.",
    steps: [
      "Use def keyword to define a function",
      "Give it a name and any parameters in ()",
      "Write the code block indented inside",
      "Use return to send a result back",
      "Call the function by name with arguments",
    ],
    example: `<span class="kw">def</span> <span class="fn">add</span>(a, b):        <span class="cmt"># define</span>
    result = a + b
    <span class="kw">return</span> result

total = <span class="fn">add</span>(<span class="num">3</span>, <span class="num">7</span>)   <span class="cmt"># call → total = 10</span>`,
    tip: "Functions make code reusable and easier to read. If you're doing the same thing in 2+ places, make it a function!",
  },
  conditionals: {
    emoji: "❓",
    title: "If / Else",
    sub: "// making decisions in code",
    what: "Conditionals let your program make decisions. Using if, elif, and else, you can run different code depending on whether a condition is True or False.",
    analogy:
      "🚦 Like traffic lights! If light is green → go. If light is yellow → slow down. If light is red → stop. Conditionals work the same way — different code runs based on the current condition.",
    steps: [
      "if: run the block if condition is True",
      "elif: check another condition (optional)",
      "else: run if none above matched (optional)",
      "Use ==, <, >, !=, >=, <= to compare",
      "Only ONE branch runs — the first that's True",
    ],
    example: `score = <span class="num">85</span>
<span class="kw">if</span> score >= <span class="num">90</span>:
    <span class="fn">print</span>(<span class="str">"A"</span>)
<span class="kw">elif</span> score >= <span class="num">80</span>:
    <span class="fn">print</span>(<span class="str">"B"</span>)   <span class="cmt"># ← this runs</span>
<span class="kw">else</span>:
    <span class="fn">print</span>(<span class="str">"C or lower"</span>)`,
    tip: "Remember: = is assignment (store a value), == is comparison (check equality). Don't mix them up in conditions!",
  },
  lists: {
    emoji: "📋",
    title: "Lists",
    sub: "// collections of values",
    what: "A list stores multiple values in a single variable, in order. You can add, remove, or change items. Each item has an index (position) starting at 0.",
    analogy:
      "🛒 A list is like a shopping list. You can add items, cross things off, check what's at position 3, or loop through every item. All in one place!",
    steps: [
      "Create with square brackets: [1, 2, 3]",
      "Access items by index: list[0] = first item",
      "Negative index: list[-1] = last item",
      "Add items with .append()",
      "Get length with len(list)",
    ],
    example: `nums = [<span class="num">10</span>, <span class="num">20</span>, <span class="num">30</span>]
<span class="fn">print</span>(nums[<span class="num">0</span>])     <span class="cmt"># → 10</span>
<span class="fn">print</span>(nums[-<span class="num">1</span>])    <span class="cmt"># → 30</span>
nums.<span class="fn">append</span>(<span class="num">40</span>)  <span class="cmt"># → [10,20,30,40]</span>`,
    tip: "Index starts at 0, not 1! So a list with 5 items has indices 0, 1, 2, 3, 4. The last valid index is always len(list) - 1.",
  },
};

// ============================================================
// PYTHON INTERPRETER (simplified simulation)
// ============================================================
function getVarType(val) {
  if (val === null || val === undefined) return "none";
  if (typeof val === "boolean") return "bool";
  if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
  if (typeof val === "string") return "str";
  if (Array.isArray(val)) return "list";
  if (typeof val === "object") return "dict";
  return "none";
}

function formatValue(val) {
  if (val === null || val === undefined) return "None";
  if (typeof val === "boolean") return val ? "True" : "False";
  if (typeof val === "string") return `"${val}"`;
  if (Array.isArray(val)) return `[${val.map(formatValue).join(", ")}]`;
  if (typeof val === "object") {
    const pairs = Object.entries(val).map(
      ([k, v]) => `${formatValue(k)}: ${formatValue(v)}`,
    );
    return `{${pairs.join(", ")}}`;
  }
  return String(val);
}

class PythonError extends Error {
  constructor(type, message, line, explanation) {
    super(message);
    this.errorType = type;
    this.line = line;
    this.explanation = explanation;
  }
}

const ERROR_EXPLANATIONS = {
  NameError: (name) =>
    `You tried to use a variable called "${name}" but it hasn't been assigned a value yet. Make sure you create the variable before using it!`,
  ZeroDivisionError: () =>
    `You tried to divide a number by zero, which is mathematically impossible. Check your division — the denominator might be 0.`,
  TypeError: (detail) =>
    `Python got the wrong type of data. ${detail || "Make sure you're using compatible types (e.g., you can't add a number to a text string directly)."}`,
  ValueError: (detail) =>
    `The value you provided is the wrong kind. ${detail || "For example, int('hello') fails because 'hello' isn't a number."}`,
  IndexError: (detail) =>
    `You tried to access index ${detail} which doesn't exist. Remember: list indices start at 0, and the last valid index is len(list) - 1.`,
  AttributeError: (detail) =>
    `You called a method that doesn't exist for this type. ${detail || "Check the method name and the type of the variable."}`,
  SyntaxError: (detail) =>
    `There's a typo or formatting mistake in your code. ${detail || "Check for missing colons (:), unmatched brackets, or wrong indentation."}`,
  RecursionError: () =>
    `Your function keeps calling itself without stopping. Make sure your recursive function has a base case (a condition that stops the recursion).`,
};

// Minimal Python interpreter that produces execution steps
function interpretPython(code) {
  const lines = code.split("\n");
  const steps = [];
  const env = {}; // variable environment
  const callStack = [{ name: "<module>", line: 0 }];
  const output = [];

  function addStep(lineNum, vars, out, explain, type = "exec") {
    steps.push({
      line: lineNum,
      vars: JSON.parse(JSON.stringify(vars)),
      output: [...out],
      explain,
      callStack: [...callStack],
      type,
    });
  }

  // Tokenizer helpers
  function evalExpr(expr, vars) {
    expr = expr.trim();
    if (!expr) return undefined;

    // String literals
    if (
      (expr.startsWith('"') && expr.endsWith('"')) ||
      (expr.startsWith("'") && expr.endsWith("'"))
    ) {
      return expr.slice(1, -1);
    }
    // None/True/False
    if (expr === "None") return null;
    if (expr === "True") return true;
    if (expr === "False") return false;

    // Number
    if (!isNaN(expr) && expr !== "") {
      return expr.includes(".") ? parseFloat(expr) : parseInt(expr);
    }

    // List literal
    if (expr.startsWith("[") && expr.endsWith("]")) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return [];
      const items = splitArgs(inner);
      return items.map((s) => evalExpr(s.trim(), vars));
    }

    // Dict literal
    if (expr.startsWith("{") && expr.endsWith("}")) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return {};
      const result = {};
      const pairs = splitArgs(inner);
      for (const pair of pairs) {
        const colonIdx = pair.indexOf(":");
        if (colonIdx >= 0) {
          const k = evalExpr(pair.slice(0, colonIdx).trim(), vars);
          const v = evalExpr(pair.slice(colonIdx + 1).trim(), vars);
          result[k] = v;
        }
      }
      return result;
    }

    // f-string (simplified)
    if (expr.startsWith('f"') || expr.startsWith("f'")) {
      let s = expr.slice(2, -1);
      s = s.replace(/\{([^}]+)\}/g, (_, inner) => {
        try {
          return String(evalExpr(inner, vars));
        } catch {
          return `{${inner}}`;
        }
      });
      return s;
    }

    // Function calls: print, range, len, int, str, float, abs, append
    const fnMatch = expr.match(/^(\w+)\((.*)\)$/s);
    if (fnMatch) {
      const fnName = fnMatch[1];
      const argsStr = fnMatch[2].trim();
      const args = argsStr
        ? splitArgs(argsStr).map((a) => evalExpr(a.trim(), vars))
        : [];

      if (fnName === "range") {
        const [start, stop, step] =
          args.length === 1
            ? [0, args[0], 1]
            : args.length === 2
              ? [args[0], args[1], 1]
              : args;
        const arr = [];
        for (let i = start; step > 0 ? i < stop : i > stop; i += step)
          arr.push(i);
        return arr;
      }
      if (fnName === "len") return args[0]?.length ?? 0;
      if (fnName === "int") {
        const v = parseInt(args[0]);
        if (isNaN(v))
          throw new PythonError(
            "ValueError",
            `int() can't convert '${args[0]}'`,
            0,
            ERROR_EXPLANATIONS.ValueError(
              `int('${args[0]}') failed because '${args[0]}' can't be converted to an integer.`,
            ),
          );
        return v;
      }
      if (fnName === "str") return String(args[0]);
      if (fnName === "float") return parseFloat(args[0]);
      if (fnName === "abs") return Math.abs(args[0]);
      if (fnName === "max")
        return Math.max(...(Array.isArray(args[0]) ? args[0] : args));
      if (fnName === "min")
        return Math.min(...(Array.isArray(args[0]) ? args[0] : args));
      if (fnName === "sum") return (args[0] || []).reduce((a, b) => a + b, 0);
      if (fnName === "list")
        return Array.isArray(args[0]) ? [...args[0]] : args;
      if (fnName === "sorted")
        return [...(args[0] || [])].sort((a, b) => a - b);
      if (fnName === "reversed") return [...(args[0] || [])].reverse();
      if (fnName === "enumerate") {
        return (args[0] || []).map((v, i) => [i, v]);
      }
      if (fnName === "zip") {
        const minLen = Math.min(...args.map((a) => a?.length ?? 0));
        return Array.from({ length: minLen }, (_, i) => args.map((a) => a[i]));
      }

      // User-defined function call
      if (
        vars[fnName] &&
        typeof vars[fnName] === "object" &&
        vars[fnName].__fn__
      ) {
        return { __call__: fnName, args };
      }

      if (!(fnName in vars)) {
        throw new PythonError(
          "NameError",
          `name '${fnName}' is not defined`,
          0,
          ERROR_EXPLANATIONS.NameError(fnName),
        );
      }
    }

    // Method calls: x.append(v), x.split(), etc.
    const methodMatch = expr.match(/^(\w+)\.(\w+)\((.*)\)$/s);
    if (methodMatch) {
      const [, objName, methodName, argsStr] = methodMatch;
      const obj = vars[objName];
      if (obj === undefined)
        throw new PythonError(
          "NameError",
          `name '${objName}' is not defined`,
          0,
          ERROR_EXPLANATIONS.NameError(objName),
        );
      const args = argsStr.trim()
        ? splitArgs(argsStr).map((a) => evalExpr(a.trim(), vars))
        : [];

      if (Array.isArray(obj)) {
        if (methodName === "append") {
          obj.push(args[0]);
          vars[objName] = obj;
          return null;
        }
        if (methodName === "pop") return obj.pop();
        if (methodName === "sort") {
          obj.sort((a, b) =>
            typeof a === "number" ? a - b : String(a).localeCompare(String(b)),
          );
          return null;
        }
        if (methodName === "reverse") {
          obj.reverse();
          return null;
        }
        if (methodName === "extend") {
          obj.push(...(args[0] || []));
          return null;
        }
        if (methodName === "index") return obj.indexOf(args[0]);
        if (methodName === "count")
          return obj.filter((x) => x === args[0]).length;
        if (methodName === "remove") {
          const i = obj.indexOf(args[0]);
          if (i >= 0) obj.splice(i, 1);
          return null;
        }
      }
      if (typeof obj === "string") {
        if (methodName === "upper") return obj.toUpperCase();
        if (methodName === "lower") return obj.toLowerCase();
        if (methodName === "strip") return obj.trim();
        if (methodName === "split")
          return obj.split(args[0] ?? " ").filter(Boolean);
        if (methodName === "join") return obj.split("").join(args[0]);
        if (methodName === "replace") return obj.replace(args[0], args[1]);
        if (methodName === "startswith") return obj.startsWith(args[0]);
        if (methodName === "endswith") return obj.endsWith(args[0]);
        if (methodName === "find") return obj.indexOf(args[0]);
      }
      if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
        if (methodName === "keys") return Object.keys(obj);
        if (methodName === "values") return Object.values(obj);
        if (methodName === "items") return Object.entries(obj);
        if (methodName === "get")
          return obj[args[0]] ?? (args.length > 1 ? args[1] : null);
        if (methodName === "update") {
          Object.assign(obj, args[0]);
          return null;
        }
        if (methodName === "pop") {
          const v = obj[args[0]];
          delete obj[args[0]];
          return v;
        }
      }
    }

    // Subscript: a[i]
    const subMatch = expr.match(/^(\w+)\[(.+)\]$/);
    if (subMatch) {
      const obj = vars[subMatch[1]];
      if (obj === undefined)
        throw new PythonError(
          "NameError",
          `name '${subMatch[1]}' is not defined`,
          0,
          ERROR_EXPLANATIONS.NameError(subMatch[1]),
        );
      const idx = evalExpr(subMatch[2], vars);
      if (Array.isArray(obj)) {
        const i = idx < 0 ? obj.length + idx : idx;
        if (i < 0 || i >= obj.length)
          throw new PythonError(
            "IndexError",
            `list index out of range`,
            0,
            ERROR_EXPLANATIONS.IndexError(idx),
          );
        return obj[i];
      }
      if (typeof obj === "object") return obj[idx];
      if (typeof obj === "string") return obj[idx < 0 ? obj.length + idx : idx];
    }

    // Attribute access: a.b
    const attrMatch = expr.match(/^(\w+)\.(\w+)$/);
    if (attrMatch) {
      const obj = vars[attrMatch[1]];
      if (obj === undefined)
        throw new PythonError(
          "NameError",
          `name '${attrMatch[1]}' is not defined`,
          0,
          ERROR_EXPLANATIONS.NameError(attrMatch[1]),
        );
      return obj?.[attrMatch[2]];
    }

    // Binary ops (handle operator precedence roughly)
    // Check for string concatenation / comparison operators
    for (const op of [
      "not in",
      "is not",
      " in ",
      " is ",
      "==",
      "!=",
      ">=",
      "<=",
      ">",
      "<",
      " and ",
      " or ",
    ]) {
      const idx = findOp(expr, op);
      if (idx >= 0) {
        const left = evalExpr(expr.slice(0, idx).trim(), vars);
        const right = evalExpr(expr.slice(idx + op.length).trim(), vars);
        if (op === "==") return left === right;
        if (op === "!=") return left !== right;
        if (op === ">=") return left >= right;
        if (op === "<=") return left <= right;
        if (op === ">") return left > right;
        if (op === "<") return left < right;
        if (op === " and ") return left && right;
        if (op === " or ") return left || right;
        if (op === " in ")
          return Array.isArray(right)
            ? right.includes(left)
            : String(right).includes(String(left));
        if (op === "not in")
          return Array.isArray(right)
            ? !right.includes(left)
            : !String(right).includes(String(left));
        if (op === " is ") return left === right;
        if (op === "is not") return left !== right;
      }
    }

    // Arithmetic (low precedence +- first, then */%)
    for (const op of ["+", "-"]) {
      const idx = findArithOp(expr, op);
      if (idx > 0) {
        const left = evalExpr(expr.slice(0, idx).trim(), vars);
        const right = evalExpr(expr.slice(idx + 1).trim(), vars);
        if (op === "+") {
          if (Array.isArray(left) && Array.isArray(right))
            return [...left, ...right];
          return left + right;
        }
        if (op === "-") return left - right;
      }
    }
    for (const op of ["**", "//", "*", "/", "%"]) {
      const idx = findArithOp(expr, op);
      if (idx > 0) {
        const left = evalExpr(expr.slice(0, idx).trim(), vars);
        const right = evalExpr(expr.slice(idx + op.length).trim(), vars);
        if (op === "**") return Math.pow(left, right);
        if (op === "//") return Math.floor(left / right);
        if (op === "*") {
          if (typeof left === "string" && typeof right === "number")
            return left.repeat(right);
          if (Array.isArray(left) && typeof right === "number") {
            const arr = [];
            for (let i = 0; i < right; i++) arr.push(...left);
            return arr;
          }
          return left * right;
        }
        if (op === "/") {
          if (right === 0)
            throw new PythonError(
              "ZeroDivisionError",
              "division by zero",
              0,
              ERROR_EXPLANATIONS.ZeroDivisionError(),
            );
          return left / right;
        }
        if (op === "%") return left % right;
      }
    }

    // Unary not
    if (expr.startsWith("not ")) return !evalExpr(expr.slice(4).trim(), vars);
    if (expr.startsWith("-")) return -evalExpr(expr.slice(1).trim(), vars);

    // Variable lookup
    if (/^\w+$/.test(expr)) {
      if (!(expr in vars)) {
        throw new PythonError(
          "NameError",
          `name '${expr}' is not defined`,
          0,
          ERROR_EXPLANATIONS.NameError(expr),
        );
      }
      return vars[expr];
    }

    // Tuple-like expressions (comma separated)
    if (expr.includes(",")) {
      return splitArgs(expr).map((s) => evalExpr(s.trim(), vars));
    }

    return undefined;
  }

  function findOp(expr, op) {
    let depth = 0;
    for (let i = 0; i <= expr.length - op.length; i++) {
      const c = expr[i];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      else if (depth === 0 && expr.slice(i, i + op.length) === op) return i;
    }
    return -1;
  }

  function findArithOp(expr, op) {
    let depth = 0;
    const n = op.length;
    for (let i = expr.length - n; i >= 1; i--) {
      const c = expr[i + n - 1];
      if (c === ")" || c === "]" || c === "}") depth++;
      else if (c === "(" || c === "[" || c === "{") depth--;
      if (depth === 0 && expr.slice(i, i + n) === op) {
        const prev = expr[i - 1];
        if (
          op === "-" &&
          (prev === "*" ||
            prev === "/" ||
            prev === "+" ||
            prev === "-" ||
            prev === "(" ||
            prev === "[")
        )
          continue;
        return i;
      }
    }
    return -1;
  }

  function splitArgs(s) {
    const args = [];
    let depth = 0,
      start = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      else if (c === "," && depth === 0) {
        args.push(s.slice(start, i).trim());
        start = i + 1;
      }
    }
    if (start < s.length) args.push(s.slice(start).trim());
    return args.filter(Boolean);
  }

  function printArgs(args, vars) {
    return args
      .map((a) => {
        const v = evalExpr(a.trim(), vars);
        if (typeof v === "boolean") return v ? "True" : "False";
        if (v === null || v === undefined) return "None";
        if (Array.isArray(v))
          return `[${v.map((x) => formatValue(x)).join(", ")}]`;
        return String(v);
      })
      .join(" ");
  }

  // Get code indent level
  function getIndent(line) {
    return line.match(/^(\s*)/)[1].length;
  }

  // Generate explanation for a line
  function explainLine(trimmed, vars) {
    if (trimmed.startsWith("#"))
      return `📝 Comment — this line is a note for humans. Python ignores it completely.`;
    if (trimmed.startsWith("print("))
      return `📤 print() displays output to the screen. This is how Python communicates results to you.`;
    if (trimmed.startsWith("def ")) {
      const name = trimmed.match(/def (\w+)/)?.[1];
      return `🔧 Defining function "${name}". The code inside is saved for later — it won't run until you call the function.`;
    }
    if (trimmed.startsWith("return ")) {
      const val = trimmed.slice(7).trim();
      return `↩️ return sends "${val}" back to whoever called this function, then exits the function.`;
    }
    if (trimmed.startsWith("for ")) {
      const parts = trimmed.match(/for (.+) in (.+):/);
      if (parts)
        return `🔁 Starting for loop. Variable "${parts[1].trim()}" will take each value from "${parts[2].trim()}" one at a time.`;
    }
    if (trimmed.startsWith("while ")) {
      const cond = trimmed.slice(6, -1).trim();
      return `⏳ while loop — keeps repeating as long as "${cond}" is True. Checks condition each time before running the block.`;
    }
    if (trimmed.startsWith("if ")) {
      const cond = trimmed.slice(3, -1).trim();
      return `❓ Checking condition: "${cond}". If this is True, the indented block below runs. If False, Python skips it.`;
    }
    if (trimmed.startsWith("elif ")) {
      const cond = trimmed.slice(5, -1).trim();
      return `↪️ elif (else-if): the previous condition was False, so now checking if "${cond}" is True.`;
    }
    if (trimmed === "else:")
      return `↪️ else: none of the above conditions were True, so this block runs as the "default" case.`;
    if (trimmed.includes("=") && !trimmed.includes("==")) {
      const eqIdx = trimmed.indexOf("=");
      const varName = trimmed.slice(0, eqIdx).trim();
      const valExpr = trimmed.slice(eqIdx + 1).trim();
      if (trimmed.includes("+="))
        return `📝 Shortcut: "${varName} += ..." means add to existing value (same as ${varName} = ${varName} + ...).`;
      if (trimmed.includes("-="))
        return `📝 Shortcut: "${varName} -= ..." means subtract from existing value.`;
      if (trimmed.includes("*="))
        return `📝 Shortcut: "${varName} *= ..." means multiply existing value.`;
      return `📦 Storing value of "${valExpr}" in variable "${varName}". Python evaluates the right side first, then saves the result.`;
    }
    if (trimmed.includes(".append("))
      return `➕ .append() adds a new item to the end of a list. The list grows by one element.`;
    if (trimmed.includes(".pop("))
      return `➖ .pop() removes and returns the last item from the list.`;
    if (trimmed.includes(".sort("))
      return `🔤 .sort() rearranges list items in ascending order (numbers: small→big, strings: A→Z).`;
    return `▶️ Executing: ${trimmed}`;
  }

  // Simple line-by-line interpreter
  try {
    const prevVars = {};
    const functions = {};

    // First pass: collect function definitions
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith("def ")) {
        const match = trimmed.match(/def (\w+)\(([^)]*)\):/);
        if (match) {
          const fnName = match[1];
          const params = match[2]
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
          const bodyLines = [];
          const fnIndent = getIndent(line);
          i++;
          while (i < lines.length) {
            const bl = lines[i];
            if (bl.trim() && getIndent(bl) <= fnIndent) break;
            bodyLines.push(bl);
            i++;
          }
          functions[fnName] = {
            params,
            bodyLines,
            startLineNum: i - bodyLines.length,
          };
          continue;
        }
      }
      i++;
    }

    // Second pass: execute
    function execLines(codeLines, localEnv, baseLineOffset = 0) {
      let idx = 0;
      while (idx < codeLines.length) {
        const rawLine = codeLines[idx];
        const trimmed = rawLine.trim();
        const lineNum = baseLineOffset + idx;

        if (!trimmed || trimmed.startsWith("#")) {
          if (trimmed.startsWith("#")) {
            addStep(
              lineNum,
              { ...localEnv },
              output,
              `📝 Comment: "${trimmed.slice(1).trim()}" — this is just a note for programmers. Python skips it.`,
              "comment",
            );
          }
          idx++;
          continue;
        }

        // Function definition (skip body in execution)
        if (trimmed.startsWith("def ")) {
          const match = trimmed.match(/def (\w+)\(([^)]*)\):/);
          if (match) {
            const fnName = match[1];
            addStep(
              lineNum,
              { ...localEnv },
              output,
              `🔧 Defining function "${fnName}" — saved for later use. Won't run until called.`,
              "def",
            );
            const fnIndent = getIndent(rawLine);
            idx++;
            while (idx < codeLines.length) {
              const bl = codeLines[idx];
              if (bl.trim() && getIndent(bl) <= fnIndent) break;
              idx++;
            }
            continue;
          }
        }

        // Return
        if (trimmed.startsWith("return")) {
          const expr = trimmed.slice(6).trim();
          const val = expr ? evalExpr(expr, localEnv) : null;
          addStep(
            lineNum,
            { ...localEnv },
            output,
            `↩️ return ${expr} → returning value ${formatValue(val)} back to the caller. Function ends here.`,
            "return",
          );
          return { returned: true, value: val };
        }

        // Break / continue
        if (trimmed === "break") {
          addStep(
            lineNum,
            { ...localEnv },
            output,
            `⛔ break — exit the loop immediately.`,
            "break",
          );
          return { break: true };
        }
        if (trimmed === "continue") {
          addStep(
            lineNum,
            { ...localEnv },
            output,
            `⏩ continue — skip the rest of this iteration and jump to the next one.`,
            "continue",
          );
          return { continue: true };
        }

        // print
        if (trimmed.startsWith("print(")) {
          const argsStr = trimmed.slice(6, -1);
          const args = splitArgs(argsStr);
          const out = printArgs(args, localEnv);
          output.push({ text: out, type: "print" });
          addStep(
            lineNum,
            { ...localEnv },
            output,
            `📤 print() → displays "${out}" to the output. Evaluating each argument and joining with spaces.`,
            "print",
          );
          idx++;
          continue;
        }

        // if / elif / else
        if (trimmed.startsWith("if ") || trimmed.startsWith("elif ")) {
          const isElif = trimmed.startsWith("elif ");
          const condStr = trimmed.slice(isElif ? 5 : 3, -1).trim();
          let condResult;
          try {
            condResult = evalExpr(condStr, localEnv);
          } catch {
            condResult = false;
          }
          addStep(
            lineNum,
            { ...localEnv },
            output,
            `❓ ${isElif ? "elif" : "if"} condition: "${condStr}" → ${condResult ? "✅ TRUE — will run the block below" : "❌ FALSE — will skip the block below"}`,
            "condition",
          );

          const ifIndent = getIndent(rawLine);
          const blockLines = [];
          idx++;
          while (idx < codeLines.length) {
            const bl = codeLines[idx];
            if (bl.trim() && getIndent(bl) <= ifIndent) break;
            blockLines.push(bl);
            idx++;
          }

          if (condResult) {
            const result = execLines(blockLines, localEnv, lineNum + 1);
            if (result?.returned) return result;
            if (result?.break) return result;
            // Skip elif/else
            while (idx < codeLines.length) {
              const bl = codeLines[idx].trim();
              if (bl.startsWith("elif ") || bl === "else:") {
                const skipIndent = getIndent(codeLines[idx]);
                idx++;
                while (idx < codeLines.length) {
                  const nb = codeLines[idx];
                  if (nb.trim() && getIndent(nb) <= skipIndent) break;
                  idx++;
                }
              } else break;
            }
          }
          continue;
        }

        if (trimmed === "else:") {
          addStep(
            lineNum,
            { ...localEnv },
            output,
            `↪️ else: — none of the if/elif conditions above were True, so this block will run as the default case.`,
            "else",
          );
          const elseIndent = getIndent(rawLine);
          const blockLines = [];
          idx++;
          while (idx < codeLines.length) {
            const bl = codeLines[idx];
            if (bl.trim() && getIndent(bl) <= elseIndent) break;
            blockLines.push(bl);
            idx++;
          }
          const result = execLines(blockLines, localEnv, lineNum + 1);
          if (result?.returned) return result;
          if (result?.break) return result;
          continue;
        }

        // for loop
        if (trimmed.startsWith("for ")) {
          const match = trimmed.match(/^for (.+) in (.+):$/);
          if (match) {
            const varPart = match[1].trim();
            const iterExpr = match[2].trim();
            let iterVal;
            try {
              iterVal = evalExpr(iterExpr, localEnv);
            } catch {
              iterVal = [];
            }
            if (!Array.isArray(iterVal))
              iterVal = iterVal !== undefined ? [iterVal] : [];

            addStep(
              lineNum,
              { ...localEnv },
              output,
              `🔁 for loop: "${varPart}" will take each value from [${iterVal.map(formatValue).join(", ")}] (${iterVal.length} iterations total)`,
              "for",
            );

            const forIndent = getIndent(rawLine);
            const blockLines = [];
            idx++;
            while (idx < codeLines.length) {
              const bl = codeLines[idx];
              if (bl.trim() && getIndent(bl) <= forIndent) break;
              blockLines.push(bl);
              idx++;
            }

            for (let iter = 0; iter < iterVal.length; iter++) {
              const item = iterVal[iter];
              if (varPart.includes(",")) {
                const parts = varPart.split(",").map((p) => p.trim());
                if (Array.isArray(item)) {
                  parts.forEach((p, pi) => {
                    localEnv[p] = item[pi];
                  });
                } else {
                  localEnv[parts[0]] = item;
                }
              } else {
                localEnv[varPart] = item;
              }
              addStep(
                lineNum,
                { ...localEnv },
                output,
                `🔁 Loop iteration ${iter + 1}/${iterVal.length}: "${varPart}" = ${formatValue(item)}`,
                "for-iter",
              );
              const result = execLines(blockLines, localEnv, lineNum + 1);
              if (result?.returned) return result;
              if (result?.break) break;
            }
            continue;
          }
        }

        // while loop
        if (trimmed.startsWith("while ")) {
          const condStr = trimmed.slice(6, -1).trim();
          const whileIndent = getIndent(rawLine);
          const blockLines = [];
          idx++;
          while (idx < codeLines.length) {
            const bl = codeLines[idx];
            if (bl.trim() && getIndent(bl) <= whileIndent) break;
            blockLines.push(bl);
            idx++;
          }

          let iteration = 0;
          const maxIter = 200;
          while (iteration < maxIter) {
            let cond;
            try {
              cond = evalExpr(condStr, localEnv);
            } catch {
              cond = false;
            }
            addStep(
              lineNum,
              { ...localEnv },
              output,
              `⏳ while "${condStr}" → ${cond ? `✅ TRUE (iteration ${iteration + 1}), entering loop body` : `❌ FALSE, loop ends after ${iteration} iterations`}`,
              "while",
            );
            if (!cond) break;
            const result = execLines(blockLines, localEnv, lineNum + 1);
            if (result?.returned) return result;
            if (result?.break) break;
            iteration++;
          }
          if (iteration >= maxIter)
            output.push({
              text: "⚠️ Loop stopped after 200 iterations (safety limit)",
              type: "error",
            });
          continue;
        }

        // Assignment (including augmented)
        const augMatch = trimmed.match(
          /^(\w+(?:\[.+\])?)\s*([+\-*\/])=\s*(.+)$/,
        );
        if (augMatch) {
          const [, varName, op, exprStr] = augMatch;
          const subscriptMatch = varName.match(/^(\w+)\[(.+)\]$/);
          let oldVal;
          if (subscriptMatch) {
            const arr = localEnv[subscriptMatch[1]];
            const idx2 = evalExpr(subscriptMatch[2], localEnv);
            oldVal = arr?.[idx2];
          } else {
            oldVal = localEnv[varName] ?? 0;
          }
          const rhs = evalExpr(exprStr, localEnv);
          let newVal;
          if (op === "+") newVal = oldVal + rhs;
          else if (op === "-") newVal = oldVal - rhs;
          else if (op === "*") newVal = oldVal * rhs;
          else if (op === "/") {
            if (rhs === 0)
              throw new PythonError(
                "ZeroDivisionError",
                "division by zero",
                lineNum,
                ERROR_EXPLANATIONS.ZeroDivisionError(),
              );
            newVal = oldVal / rhs;
          }
          if (subscriptMatch) {
            const arr = localEnv[subscriptMatch[1]];
            const idx2 = evalExpr(subscriptMatch[2], localEnv);
            arr[idx2] = newVal;
          } else {
            localEnv[varName] = newVal;
          }
          addStep(
            lineNum,
            { ...localEnv },
            output,
            `📦 ${varName} ${op}= ${exprStr}: was ${formatValue(oldVal)}, now ${formatValue(newVal)} (${formatValue(oldVal)} ${op} ${formatValue(rhs)})`,
            "assign",
          );
          idx++;
          continue;
        }

        // Multi-assignment: a, b = b, a  or  a, b = 1, 2
        const multiMatch = trimmed.match(/^([^=]+),\s*([^=]+)\s*=\s*(.+)$/);
        if (multiMatch && !trimmed.includes("==")) {
          const a = multiMatch[1].trim();
          const b = multiMatch[2].trim();
          const rhs = evalExpr(multiMatch[3].trim(), localEnv);
          if (Array.isArray(rhs)) {
            localEnv[a] = rhs[0];
            localEnv[b] = rhs[1];
          }
          addStep(
            lineNum,
            { ...localEnv },
            output,
            `📦 Multiple assignment: "${a}" = ${formatValue(localEnv[a])}, "${b}" = ${formatValue(localEnv[b])}`,
            "assign",
          );
          idx++;
          continue;
        }

        // Simple assignment: varName = expr  OR  obj[idx] = expr
        const assignMatch = trimmed.match(
          /^([a-zA-Z_]\w*(?:\[.+\])?(?:\.\w+)?)\s*=\s*(.+)$/,
        );
        if (assignMatch && !trimmed.includes("==")) {
          const lhs = assignMatch[1].trim();
          const exprStr = assignMatch[2].trim();

          // Subscript assignment
          const subAssignMatch = lhs.match(/^(\w+)\[(.+)\]$/);
          if (subAssignMatch) {
            const arr = localEnv[subAssignMatch[1]];
            const subscriptIdx = evalExpr(subAssignMatch[2], localEnv);
            const val = evalExpr(exprStr, localEnv);
            if (Array.isArray(arr))
              arr[subscriptIdx < 0 ? arr.length + subscriptIdx : subscriptIdx] =
                val;
            else if (typeof arr === "object") arr[subscriptIdx] = val;
            addStep(
              lineNum,
              { ...localEnv },
              output,
              `📦 Setting ${lhs} = ${formatValue(val)}`,
              "assign",
            );
            idx++;
            continue;
          }

          let val;
          // Check if function call
          const fnCallMatch = exprStr.match(/^(\w+)\((.*)\)$/s);
          if (fnCallMatch && functions[fnCallMatch[1]]) {
            const fn = functions[fnCallMatch[1]];
            const argsStr = fnCallMatch[2].trim();
            const argVals = argsStr
              ? splitArgs(argsStr).map((a) => evalExpr(a.trim(), localEnv))
              : [];
            const fnEnv = { ...localEnv };
            fn.params.forEach((p, pi) => {
              fnEnv[p] = argVals[pi];
            });
            callStack.push({ name: fnCallMatch[1] + "()", line: lineNum });
            addStep(
              lineNum,
              { ...localEnv },
              output,
              `📞 Calling function "${fnCallMatch[1]}" with args: ${argVals.map(formatValue).join(", ")}. Jumping into function body…`,
              "call",
            );
            const result = execLines(fn.bodyLines, fnEnv, fn.startLineNum);
            callStack.pop();
            val = result?.value ?? null;
            // Bring back any modified list/dict refs
            Object.keys(localEnv).forEach((k) => {
              if (
                fnEnv[k] !== undefined &&
                (Array.isArray(fnEnv[k]) || typeof fnEnv[k] === "object")
              ) {
                localEnv[k] = fnEnv[k];
              }
            });
          } else {
            val = evalExpr(exprStr, localEnv);
          }

          const oldVal = localEnv[lhs];
          localEnv[lhs] = val;

          addStep(
            lineNum,
            { ...localEnv },
            output,
            `📦 ${lhs} = ${formatValue(val)}${oldVal !== undefined && oldVal !== val ? ` (was ${formatValue(oldVal)})` : " (new variable!)"}. ${explainLine(trimmed, localEnv)}`,
            "assign",
          );
          idx++;
          continue;
        }

        // Standalone function/method call (no assignment)
        if (trimmed.match(/^\w+\s*\(/) || trimmed.match(/^\w+\.\w+\s*\(/)) {
          addStep(
            lineNum,
            { ...localEnv },
            output,
            explainLine(trimmed, localEnv),
            "call",
          );
          try {
            evalExpr(trimmed, localEnv);
          } catch (e) {
            /* ignore */
          }
          idx++;
          continue;
        }

        // Catch-all
        addStep(
          lineNum,
          { ...localEnv },
          output,
          explainLine(trimmed, localEnv),
          "exec",
        );
        idx++;
      }
      return { returned: false };
    }

    // Execute with all functions registered in env
    Object.keys(functions).forEach((name) => {
      env[name] = { __fn__: true, name };
    });

    execLines(lines, env);

    steps.push({
      line: -1,
      vars: { ...env },
      output: [...output],
      explain: `✅ Program finished successfully! All ${steps.length} steps completed.`,
      callStack: [{ name: "<module>", line: lines.length }],
      type: "done",
    });
  } catch (err) {
    const errorType = err.errorType || "RuntimeError";
    const errExplain = err.explanation || `An error occurred: ${err.message}`;
    steps.push({
      line: err.line ?? -1,
      vars: { ...env },
      output: [
        ...output,
        { text: `${errorType}: ${err.message}`, type: "error" },
      ],
      explain: `❌ ${errorType}: ${err.message}`,
      callStack: [...callStack],
      type: "error",
      error: { type: errorType, message: err.message, explanation: errExplain },
    });
  }

  return steps;
}

// ============================================================
// MEMORY DIAGRAM COMPONENT
// ============================================================
function MemoryDiagram({ vars, prevVars }) {
  if (!vars)
    return (
      <div className="cv-mem-empty">
        <div className="cv-mem-empty-icon">🧠</div>
        <div className="cv-mem-empty-text">
          Memory diagram appears here
          <br />
          once you start stepping through code.
        </div>
      </div>
    );

  const entries = Object.entries(vars).filter(([k]) => !k.startsWith("__"));
  if (entries.length === 0)
    return (
      <div className="cv-mem-empty">
        <div className="cv-mem-empty-icon">🧠</div>
        <div className="cv-mem-empty-text">
          No variables yet!
          <br />
          Memory fills up as Python
          <br />
          creates variables.
        </div>
      </div>
    );

  // Separate primitives from heap objects (lists, dicts)
  const primitives = entries.filter(
    ([, v]) => !Array.isArray(v) && (typeof v !== "object" || v === null),
  );
  const heapObjs = entries.filter(
    ([, v]) => Array.isArray(v) || (typeof v === "object" && v !== null),
  );

  function fmtPrim(val) {
    if (val === null || val === undefined) return "None";
    if (typeof val === "boolean") return val ? "True" : "False";
    if (typeof val === "string") return `"${val}"`;
    return String(val);
  }

  function primType(val) {
    if (val === null || val === undefined) return "none";
    if (typeof val === "boolean") return "bool";
    if (typeof val === "string") return "str";
    if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
    return "none";
  }

  function fmtCell(val) {
    if (val === null) return "None";
    if (typeof val === "boolean") return val ? "T" : "F";
    if (typeof val === "string")
      return `"${val.length > 5 ? val.slice(0, 4) + "…" : val}"`;
    if (typeof val === "number") return String(val);
    if (Array.isArray(val)) return "[…]";
    return "…";
  }

  function isChanged(name, val) {
    return JSON.stringify(prevVars?.[name]) !== JSON.stringify(val);
  }
  function isNew(name) {
    return prevVars?.[name] === undefined;
  }

  // Fake memory addresses for visual effect
  function addr(name) {
    let h = 0x1a00;
    for (let i = 0; i < name.length; i++) h += name.charCodeAt(i) * 17;
    return "0x" + (h & 0xffff).toString(16).padStart(4, "0");
  }

  return (
    <div className="cv-mem-wrap">
      {/* ── STACK FRAME ── */}
      <div className="cv-mem-section-title">📦 Stack — Variables</div>
      <div className="cv-mem-frame">
        <div className="cv-mem-frame-header">
          <div className="cv-mem-frame-active-dot" />
          &lt;module&gt; frame
        </div>
        <div className="cv-mem-frame-rows">
          {entries.length === 0 && (
            <div
              style={{
                fontSize: 10,
                color: "#2a4560",
                fontFamily: "JetBrains Mono, monospace",
                padding: "4px 0",
              }}
            >
              empty
            </div>
          )}
          {entries.map(([name, val]) => {
            const changed = isChanged(name, val);
            const newv = isNew(name);
            const isHeap =
              Array.isArray(val) || (typeof val === "object" && val !== null);
            return (
              <div
                key={name}
                className={`cv-mem-var-row${newv ? " new-var" : changed ? " changed" : ""}`}
              >
                <span className="cv-mem-var-label">{name}</span>
                <span className="cv-mem-var-arrow">→</span>
                {isHeap ? (
                  <span
                    className={`cv-mem-ref-pill${!Array.isArray(val) ? " dict-ref" : ""}`}
                  >
                    <span className="cv-mem-ref-dot" />
                    {addr(name)}
                    <span style={{ opacity: 0.6, fontSize: 8 }}>
                      {Array.isArray(val) ? "list" : "dict"}
                    </span>
                  </span>
                ) : (
                  <span className={`cv-mem-prim-box ${primType(val)}`}>
                    {fmtPrim(val)}
                  </span>
                )}
                {newv && (
                  <span
                    style={{
                      fontSize: 8,
                      color: "#34d399",
                      fontFamily: "JetBrains Mono, monospace",
                      marginLeft: 4,
                    }}
                  >
                    ✨new
                  </span>
                )}
                {changed && !newv && (
                  <span
                    style={{
                      fontSize: 8,
                      color: "#38bdf8",
                      fontFamily: "JetBrains Mono, monospace",
                      marginLeft: 4,
                    }}
                  >
                    ↑updated
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HEAP OBJECTS ── */}
      {heapObjs.length > 0 && (
        <>
          <div className="cv-mem-section-title" style={{ marginTop: 6 }}>
            🔗 Heap — Objects
          </div>
          <div className="cv-mem-heap">
            {heapObjs.map(([name, val]) => {
              const changed = isChanged(name, val);
              if (Array.isArray(val)) {
                const prevArr = prevVars?.[name] ?? [];
                return (
                  <div key={name} className="cv-mem-heap-obj">
                    <div className="cv-mem-heap-header">
                      <span>
                        list: <span style={{ color: "#f9a8d4" }}>{name}</span>
                      </span>
                      <span className="cv-mem-heap-addr">{addr(name)}</span>
                    </div>
                    <div className="cv-mem-list-cells">
                      {val.length === 0 ? (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#2a4560",
                            fontFamily: "JetBrains Mono, monospace",
                            padding: "2px 4px",
                          }}
                        >
                          [ empty list ]
                        </span>
                      ) : (
                        val.map((item, i) => {
                          const cellChanged =
                            JSON.stringify(prevArr[i]) !== JSON.stringify(item);
                          return (
                            <div key={i} className="cv-mem-list-cell">
                              <span className="cv-mem-list-idx">[{i}]</span>
                              <span
                                className={`cv-mem-list-val${cellChanged && changed ? " changed-cell" : ""}`}
                              >
                                {fmtCell(item)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="cv-mem-list-len">length: {val.length}</div>
                  </div>
                );
              } else {
                // dict
                const entries2 = Object.entries(val);
                return (
                  <div key={name} className="cv-mem-heap-obj dict-obj">
                    <div className="cv-mem-heap-header dict-hdr">
                      <span>
                        dict: <span style={{ color: "#7dd3fc" }}>{name}</span>
                      </span>
                      <span className="cv-mem-heap-addr">{addr(name)}</span>
                    </div>
                    <div className="cv-mem-dict-rows">
                      {entries2.length === 0 ? (
                        <span style={{ fontSize: 10, color: "#2a4560" }}>
                          {"{}"} empty
                        </span>
                      ) : (
                        entries2.map(([k, v]) => (
                          <div key={k} className="cv-mem-dict-row">
                            <span className="cv-mem-dict-key">"{k}"</span>
                            <span className="cv-mem-dict-colon">:</span>
                            <span className="cv-mem-dict-val">
                              {fmtPrim(v)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </>
      )}

      {/* ── HOW TO READ ── */}
      <div
        style={{
          marginTop: 8,
          padding: "8px 10px",
          background: "rgba(56,189,248,0.04)",
          border: "1px solid rgba(56,189,248,0.1)",
          borderRadius: 7,
          fontSize: 10,
          color: "#2a5070",
          lineHeight: 1.65,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        💡 <strong style={{ color: "#38bdf8" }}>How to read this:</strong>
        <br />—{" "}
        <span style={{ color: "#fb923c" }}>Orange/green/yellow boxes</span> =
        primitive values stored directly
        <br />— <span style={{ color: "#f472b6" }}>
          Pink pill with address
        </span>{" "}
        = pointer to a list in the Heap
        <br />— <span style={{ color: "#38bdf8" }}>
          Blue pill with address
        </span>{" "}
        = pointer to a dict in the Heap
        <br />— <span style={{ color: "#38bdf8" }}>↑updated</span> = value
        changed this step
      </div>

      {/* ── LEGEND ── */}
      <div className="cv-mem-legend">
        {[
          ["#fb923c", "int"],
          ["#a78bfa", "float"],
          ["#34d399", "str"],
          ["#eab308", "bool"],
          ["#f472b6", "list (heap)"],
          ["#38bdf8", "dict (heap)"],
        ].map(([c, l]) => (
          <div key={l} className="cv-mem-legend-item">
            <div className="cv-mem-legend-dot" style={{ background: c }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CONCEPT MODAL
// ============================================================
function ConceptModal({ conceptKey, onStart, onSkip }) {
  const info = CONCEPTS[conceptKey];
  if (!info) return null;
  return (
    <div
      className="cv-concept-overlay"
      onClick={(e) => e.target === e.currentTarget && onSkip()}
    >
      <div className="cv-concept-card">
        <div className="cv-concept-emoji">{info.emoji}</div>
        <div className="cv-concept-title">{info.title}</div>
        <div className="cv-concept-sub">{info.sub}</div>

        <div className="cv-concept-section">
          <div className="cv-concept-section-title">📖 What is it?</div>
          <p className="cv-concept-body">{info.what}</p>
        </div>

        <div className="cv-concept-section">
          <div className="cv-concept-section-title">🎭 Think of it like...</div>
          <div className="cv-concept-box">{info.analogy}</div>
        </div>

        <div className="cv-concept-section">
          <div className="cv-concept-section-title">🔢 How it works</div>
          <div className="cv-concept-steps">
            {info.steps.map((step, i) => (
              <div key={i} className="cv-concept-step">
                <div className="cv-concept-step-n">{i + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="cv-concept-section">
          <div className="cv-concept-section-title">💻 Example</div>
          <div
            className="cv-concept-example"
            dangerouslySetInnerHTML={{ __html: info.example }}
          />
        </div>

        <div className="cv-concept-section">
          <div className="cv-concept-section-title">💡 Pro Tip</div>
          <div
            className="cv-concept-box"
            style={{
              borderLeftColor: "#34d399",
              background: "rgba(52,211,153,0.05)",
            }}
          >
            {info.tip}
          </div>
        </div>

        <div className="cv-concept-actions">
          <button className="cv-concept-btn-start" onClick={onStart}>
            🚀 Let's Trace It!
          </button>
          <button className="cv-concept-btn-skip" onClick={onSkip}>
            Skip intro
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CodeVisualizer() {
  const [code, setCode] = useState(SAMPLES.variables.code);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [panelTab, setPanelTab] = useState("vars");
  const [activeSample, setActiveSample] = useState("variables");
  const [showConcept, setShowConcept] = useState(null);
  const [executedLines, setExecutedLines] = useState(new Set());
  const [prevVars, setPrevVars] = useState({});
  const timerRef = useRef(null);
  const textareaRef = useRef(null);
  const lineNumRef = useRef(null);
  const styleRef = useRef(false);

  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
  }, []);

  const currentData =
    currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;
  const isDone = currentStep >= steps.length - 1 && steps.length > 0;
  const lines = code.split("\n");

  // Sync line numbers scroll with textarea
  const handleScroll = () => {
    if (lineNumRef.current && textareaRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const runCode = useCallback(() => {
    const newSteps = interpretPython(code);
    setSteps(newSteps);
    setCurrentStep(-1);
    setIsPlaying(false);
    setExecutedLines(new Set());
    setPrevVars({});
    if (timerRef.current) clearInterval(timerRef.current);
  }, [code]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (isDone) {
      setIsPlaying(false);
      return;
    }
    const delay = Math.max(200, 1500 / (speed / 100));
    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          setIsPlaying(false);
          clearInterval(timerRef.current);
          return prev;
        }
        const s = steps[next];
        if (s.line >= 0) setExecutedLines((ex) => new Set([...ex, s.line]));
        setPrevVars(steps[Math.max(0, next - 1)]?.vars ?? {});
        return next;
      });
    }, delay);
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentStep, steps, speed, isDone]);

  const stepForward = () => {
    if (currentStep >= steps.length - 1) return;
    const next = currentStep + 1;
    const s = steps[next];
    if (s.line >= 0) setExecutedLines((ex) => new Set([...ex, s.line]));
    setPrevVars(steps[Math.max(0, next - 1)]?.vars ?? {});
    setCurrentStep(next);
  };

  const stepBack = () => {
    if (currentStep <= 0) {
      setCurrentStep(-1);
      setExecutedLines(new Set());
      setPrevVars({});
      return;
    }
    const prev = currentStep - 1;
    setCurrentStep(prev);
    setPrevVars(steps[Math.max(0, prev - 1)]?.vars ?? {});
  };

  const reset = () => {
    setCurrentStep(-1);
    setIsPlaying(false);
    setExecutedLines(new Set());
    setPrevVars({});
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const loadSample = (key) => {
    setActiveSample(key);
    setCode(SAMPLES[key].code);
    setSteps([]);
    setCurrentStep(-1);
    setIsPlaying(false);
    setExecutedLines(new Set());
    setPrevVars({});
    if (timerRef.current) clearInterval(timerRef.current);
    if (SAMPLES[key].concept && CONCEPTS[SAMPLES[key].concept]) {
      setShowConcept(SAMPLES[key].concept);
    }
  };

  const activeLine = currentData?.line ?? -1;
  const status = isPlaying
    ? "running"
    : isDone
      ? "done"
      : currentData?.type === "error"
        ? "error"
        : currentStep >= 0
          ? "paused"
          : "idle";

  const statusMsg = currentData
    ? currentData.type === "error"
      ? `❌ Error on line ${activeLine + 1}`
      : `Line ${activeLine + 1} — ${currentData.type}`
    : steps.length > 0
      ? "Ready to step — click ▶ Play or Step →"
      : "Paste or write Python code, then click ▶ Run";

  // Compute variable changes
  const varEntries = currentData
    ? Object.entries(currentData.vars).filter(([k]) => !k.startsWith("__"))
    : [];

  return (
    <div className="cv-root">
      {showConcept && (
        <ConceptModal
          conceptKey={showConcept}
          onStart={() => {
            setShowConcept(null);
            runCode();
          }}
          onSkip={() => setShowConcept(null)}
        />
      )}

      {/* HEADER */}
      <div className="cv-header">
        <div className="cv-logo">
          <div className="cv-logo-icon">🐍</div>
          <span className="cv-logo-text">Python</span>
          <span className="cv-logo-sub">// Visualizer</span>
        </div>
        <div className="cv-header-tabs">
          <button className="cv-header-tab active">🔍 Step Tracer</button>
        </div>
      </div>

      {/* BEGINNER BAR */}
      <div className="cv-beginner-bar">
        <div className="cv-beginner-dot" />
        <div className="cv-beginner-text">
          <strong>Beginner-friendly mode:</strong> Pick a sample program below,
          click <strong>▶ Run</strong>, then use <strong>Step →</strong> to
          trace through the code one line at a time. Watch variables change in
          real time! 💡
        </div>
      </div>

      {/* SAMPLE SELECTOR */}
      <div className="cv-samples">
        <span className="cv-samples-label">Try an example:</span>
        {Object.entries(SAMPLES).map(([key, s]) => (
          <button
            key={key}
            className={`cv-sample-btn${activeSample === key ? " active" : ""}`}
            onClick={() => loadSample(key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* WORKSPACE */}
      <div className="cv-body">
        <div className="cv-workspace">
          {/* EDITOR */}
          <div className="cv-editor-pane">
            <div className="cv-editor-header">
              <div className="cv-editor-title">
                <div className="cv-editor-dot red" />
                <div className="cv-editor-dot yellow" />
                <div className="cv-editor-dot green" />
                <span style={{ marginLeft: 6 }}>code.py</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {currentData?.type !== "error" && steps.length > 0 && (
                  <button
                    className="cv-btn cv-btn-outline-blue"
                    onClick={() => {
                      const concept = SAMPLES[activeSample]?.concept;
                      if (concept) setShowConcept(concept);
                    }}
                  >
                    ℹ️ Concept
                  </button>
                )}
                <button className="cv-btn cv-btn-blue" onClick={runCode}>
                  ▶ Run
                </button>
              </div>
            </div>

            <div className="cv-code-area">
              {/* Line number highlight overlay */}
              <div className="cv-line-numbers" ref={lineNumRef}>
                {lines.map((_, i) => (
                  <div
                    key={i}
                    className={`cv-line-num${activeLine === i ? " active" : executedLines.has(i) ? " executed" : ""}`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              <div className="cv-code-editor-wrap">
                {/* Highlight overlay */}
                <div className="cv-code-highlight">
                  {lines.map((_, i) => (
                    <div
                      key={i}
                      className={`cv-code-line-bg${activeLine === i ? " active" : executedLines.has(i) ? " executed" : currentData?.type === "error" && activeLine === i ? " error" : ""}`}
                    />
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  className="cv-textarea"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setSteps([]);
                    setCurrentStep(-1);
                    setExecutedLines(new Set());
                    setPrevVars({});
                    setActiveSample("");
                  }}
                  onScroll={handleScroll}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="# Write your Python code here..."
                  onKeyDown={(e) => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const start = e.target.selectionStart;
                      const end = e.target.selectionEnd;
                      const newCode =
                        code.substring(0, start) + "    " + code.substring(end);
                      setCode(newCode);
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd =
                          start + 4;
                      }, 0);
                    }
                  }}
                />
              </div>
            </div>

            {/* CONTROLS */}
            <div className="cv-controls">
              {!isPlaying ? (
                <button
                  className="cv-btn cv-btn-green"
                  onClick={() => {
                    if (steps.length === 0) runCode();
                    setTimeout(
                      () => setIsPlaying(true),
                      steps.length === 0 ? 50 : 0,
                    );
                  }}
                  disabled={isDone}
                >
                  ▶ Play
                </button>
              ) : (
                <button
                  className="cv-btn cv-btn-amber"
                  onClick={() => setIsPlaying(false)}
                >
                  ⏸ Pause
                </button>
              )}
              <button
                className="cv-btn cv-btn-ghost"
                onClick={stepBack}
                disabled={currentStep < 0}
              >
                ← Back
              </button>
              <button
                className="cv-btn cv-btn-blue"
                onClick={() => {
                  if (steps.length === 0) {
                    runCode();
                    setTimeout(stepForward, 50);
                    return;
                  }
                  stepForward();
                }}
                disabled={isDone && steps.length > 0}
              >
                Step →
              </button>
              <button
                className="cv-btn cv-btn-red"
                onClick={reset}
                disabled={currentStep < 0}
              >
                ↺ Reset
              </button>

              <div className="cv-speed-wrap">
                <span className="cv-speed-label">Speed</span>
                <input
                  type="range"
                  className="cv-slider"
                  min={25}
                  max={400}
                  step={25}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                />
                <span className="cv-speed-val">{speed}%</span>
              </div>
            </div>

            {/* STATUS */}
            <div className="cv-status">
              <span className={`cv-status-dot ${status}`} />
              <span className="cv-status-msg">
                <strong>{statusMsg}</strong>
              </span>
              {steps.length > 0 && currentStep >= 0 && (
                <span className="cv-step-ctr">
                  Step {currentStep + 1}/{steps.length}
                </span>
              )}
            </div>

            {/* Inline explanation */}
            {currentData?.explain && (
              <div className="cv-concept-inline">
                <div className="cv-concept-inline-icon">💡</div>
                <div className="cv-concept-inline-body">
                  <div className="cv-concept-inline-title">
                    What's happening?
                  </div>
                  {currentData.explain}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="cv-panel">
            <div className="cv-panel-tab-bar">
              {[
                ["vars", "Variables"],
                ["memory", "🧠 Memory"],
                ["output", "Output"],
                ["stack", "Call Stack"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={`cv-panel-tab${panelTab === id ? " active" : ""}`}
                  onClick={() => setPanelTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="cv-panel-content">
              {/* VARIABLES TAB */}
              {panelTab === "vars" && (
                <div className="cv-vars-wrap">
                  {varEntries.length === 0 ? (
                    <div className="cv-vars-empty">
                      <div style={{ fontSize: 32 }}>📦</div>
                      <div className="cv-vars-empty-text">
                        No variables yet!
                        <br />
                        Variables appear here as Python
                        <br />
                        creates and updates them.
                      </div>
                    </div>
                  ) : (
                    varEntries.map(([name, val]) => {
                      const type = getVarType(val);
                      const isChanged =
                        JSON.stringify(prevVars[name]) !== JSON.stringify(val);
                      const isNew = prevVars[name] === undefined;
                      return (
                        <div
                          key={name}
                          className={`cv-var-card${isNew ? " new-var" : isChanged ? " changed" : ""}`}
                        >
                          <span className={`cv-var-type ${type}`}>{type}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                flexWrap: "wrap",
                              }}
                            >
                              <span className="cv-var-name">{name}</span>
                              <span className="cv-var-eq">=</span>
                              <span className="cv-var-val">
                                {formatValue(val)}
                              </span>
                            </div>
                            {isNew && (
                              <div
                                style={{
                                  fontSize: 9,
                                  color: "#34d399",
                                  marginTop: 2,
                                  fontFamily: "JetBrains Mono, monospace",
                                }}
                              >
                                ✨ just created
                              </div>
                            )}
                          </div>
                          {isChanged && !isNew && (
                            <span className="cv-var-changed-badge">
                              changed!
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* MEMORY DIAGRAM TAB */}
              {panelTab === "memory" && (
                <MemoryDiagram
                  vars={currentData?.vars ?? null}
                  prevVars={prevVars}
                />
              )}

              {/* OUTPUT TAB */}
              {panelTab === "output" && (
                <div className="cv-output-wrap">
                  {!currentData?.output || currentData.output.length === 0 ? (
                    <div className="cv-vars-empty">
                      <div style={{ fontSize: 28 }}>📤</div>
                      <div className="cv-vars-empty-text">
                        Output appears here
                        <br />
                        when print() is called
                      </div>
                    </div>
                  ) : (
                    <>
                      {currentData?.type === "error" && currentData.error && (
                        <div className="cv-error-box">
                          <div className="cv-error-title">
                            <span>⚠️</span>
                            <span className="cv-error-type">
                              {currentData.error.type}
                            </span>
                          </div>
                          <div className="cv-error-msg">
                            {currentData.error.message}
                          </div>
                          <div className="cv-error-explain">
                            <strong>What this means: </strong>
                            {currentData.error.explanation}
                          </div>
                        </div>
                      )}
                      {currentData.output.map((line, i) => (
                        <div key={i} className={`cv-output-line ${line.type}`}>
                          {line.type === "print" && (
                            <span className="cv-output-prompt">
                              &gt;&gt;&gt;
                            </span>
                          )}
                          {line.text}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* CALL STACK TAB */}
              {panelTab === "stack" && (
                <div className="cv-stack-wrap">
                  {!currentData?.callStack ||
                  currentData.callStack.length === 0 ? (
                    <div className="cv-vars-empty">
                      <div style={{ fontSize: 28 }}>📚</div>
                      <div className="cv-vars-empty-text">
                        Call stack appears here
                        <br />
                        when functions are called
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#2a5070",
                          fontFamily: "JetBrains Mono, monospace",
                          padding: "4px 0 8px",
                          textTransform: "uppercase",
                          letterSpacing: "0.8px",
                        }}
                      >
                        Active frames (top = current)
                      </div>
                      {[...currentData.callStack].reverse().map((frame, i) => (
                        <div key={i} className="cv-stack-frame">
                          <div className="cv-stack-frame-name">
                            {i === 0 ? "▶ " : "  "}
                            {frame.name}
                          </div>
                          <div className="cv-stack-frame-line">
                            line {frame.line + 1}
                          </div>
                        </div>
                      ))}
                      <div
                        style={{
                          marginTop: 12,
                          fontSize: 11,
                          color: "#2a5070",
                          lineHeight: 1.6,
                          padding: "8px 10px",
                          background: "rgba(56,189,248,0.04)",
                          border: "1px solid rgba(56,189,248,0.1)",
                          borderRadius: 7,
                        }}
                      >
                        💡 The call stack shows which function is currently
                        active. When you call a function, it's "pushed" on top.
                        When it returns, it's "popped" off.
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
