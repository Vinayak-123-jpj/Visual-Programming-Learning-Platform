import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// ─── Floating code particles ───────────────────────────────────
const CODE_SNIPPETS = [
  "for i in range(n)",
  "O(n log n)",
  "def merge(arr)",
  "pivot = arr[mid]",
  "BFS(graph)",
  "stack.push(v)",
  "if left < right:",
  "return sorted",
  "while lo ≤ hi:",
  "n * fact(n-1)",
  "arr[j], arr[j+1]",
  "queue.dequeue()",
  "visited.add(x)",
  "mid = (l+r)//2",
  "swap(a, b)",
  "DFS(node)",
];

function FloatingParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    class Particle {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : canvas.height + 40;
        this.vy = -(0.18 + Math.random() * 0.32);
        this.vx = (Math.random() - 0.5) * 0.15;
        this.alpha = 0;
        this.targetAlpha = 0.07 + Math.random() * 0.13;
        this.text =
          CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
        this.size = 9 + Math.random() * 5;
        this.hue = Math.random() > 0.5 ? 210 : 270;
        this.life = 0;
        this.maxLife = 300 + Math.random() * 400;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        if (this.life < 40)
          this.alpha += (this.targetAlpha - this.alpha) * 0.05;
        if (this.life > this.maxLife - 60) this.alpha *= 0.97;
        if (this.life > this.maxLife || this.y < -30) this.reset();
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.font = `${this.size}px "JetBrains Mono", "Fira Code", monospace`;
        ctx.fillStyle = `hsl(${this.hue}, 80%, 72%)`;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
      }
    }

    for (let i = 0; i < 28; i++) particles.push(new Particle());

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 1,
      }}
    />
  );
}

// ─── Animated counter ──────────────────────────────────────────
function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const step = () => {
          start += Math.ceil(to / 60);
          if (start >= to) {
            setVal(to);
            return;
          }
          setVal(start);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Feature card ──────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent, delay }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid rgba(255,255,255,0.07)`,
        borderRadius: 16,
        padding: "28px 26px",
        position: "relative",
        overflow: "hidden",
        animationDelay: delay,
        animation: "cardUp 0.7s cubic-bezier(0.34,1.56,0.64,1) both",
        transition: "transform 0.2s, border-color 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.borderColor = accent + "60";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      {/* accent glow corner */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          background: `radial-gradient(circle at top right, ${accent}18, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ fontSize: 30, marginBottom: 14 }}>{icon}</div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#f0f0ff",
          marginBottom: 10,
          letterSpacing: "-0.3px",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 13, color: "#8090b0", lineHeight: 1.7 }}>{desc}</p>
      <div
        style={{
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 700,
          color: accent,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.5px",
        }}
      >
        <span
          style={{
            width: 18,
            height: 2,
            background: accent,
            display: "inline-block",
            transition: "width 0.2s",
          }}
        />
        EXPLORE
      </div>
    </div>
  );
}

// ─── Algorithm preview pill ────────────────────────────────────
function AlgoPill({ label, color }) {
  return (
    <div
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        background: color + "18",
        border: `1px solid ${color}35`,
        color: color,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.4px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}

// ─── Styles injected once ──────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=JetBrains+Mono:wght@300;400;600;700&display=swap');

  .home-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .home-root {
    font-family: 'Syne', sans-serif;
    background: #07070f;
    color: #e2e8f0;
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }

  /* ── Grid background ── */
  .home-root::before {
    content: '';
    position: fixed; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(100,120,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(100,120,255,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }

  /* ── Orb glows ── */
  .home-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Navbar ── */
  .home-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 48px;
    background: rgba(7,7,15,0.7);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    animation: navDown 0.6s ease both;
  }
  .home-nav-logo {
    font-weight: 900; font-size: 18px; letter-spacing: -0.5px;
    background: linear-gradient(135deg, #7c6af7, #38bdf8, #34d399);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .home-nav-links { display: flex; gap: 6px; }
  .home-nav-btn {
    border: none; cursor: pointer; font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 700; letter-spacing: 0.4px;
    padding: 8px 16px; border-radius: 8px; transition: all 0.15s;
    background: transparent; color: #606080;
  }
  .home-nav-btn:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }
  .home-nav-cta {
    background: linear-gradient(135deg, #7c6af7, #5b4de3);
    color: #fff; border-radius: 8px; padding: 8px 18px;
    font-weight: 700; font-size: 12px; border: none;
    cursor: pointer; letter-spacing: 0.4px; font-family: 'Syne', sans-serif;
    box-shadow: 0 2px 14px rgba(124,106,247,0.4);
    transition: all 0.15s;
  }
  .home-nav-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 22px rgba(124,106,247,0.55); }

  /* ── Hero ── */
  .home-hero {
    position: relative; z-index: 1;
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 100px 24px 60px;
  }
  .home-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 14px; border-radius: 999px;
    background: rgba(124,106,247,0.12);
    border: 1px solid rgba(124,106,247,0.3);
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
    color: #a78bfa; text-transform: uppercase;
    margin-bottom: 32px;
    animation: fadeUp 0.7s ease both;
    font-family: 'JetBrains Mono', monospace;
  }
  .home-eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #a78bfa;
    box-shadow: 0 0 6px #a78bfa;
    animation: pulse 2s infinite;
  }
  .home-h1 {
    font-size: clamp(44px, 8vw, 96px);
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -3px;
    margin-bottom: 28px;
    animation: fadeUp 0.7s 0.1s ease both;
  }
  .home-h1-line1 { color: #f0f0ff; display: block; }
  .home-h1-line2 {
    display: block;
    background: linear-gradient(135deg, #7c6af7 0%, #38bdf8 50%, #34d399 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-size: 200% 100%;
    animation: shimmer 4s linear infinite;
  }
  .home-sub {
    font-size: clamp(14px, 2vw, 18px);
    color: #6070a0;
    max-width: 540px;
    line-height: 1.7;
    margin-bottom: 44px;
    animation: fadeUp 0.7s 0.2s ease both;
    font-weight: 400;
  }
  .home-cta-row {
    display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
    animation: fadeUp 0.7s 0.3s ease both;
  }
  .home-btn-primary {
    display: flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #7c6af7, #5b4de3);
    color: #fff; border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    padding: 14px 28px; border-radius: 12px;
    box-shadow: 0 4px 24px rgba(124,106,247,0.45);
    transition: all 0.18s; letter-spacing: 0.2px;
  }
  .home-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(124,106,247,0.6); }
  .home-btn-secondary {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.12);
    color: #a0aec0; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    padding: 14px 28px; border-radius: 12px;
    transition: all 0.18s; letter-spacing: 0.2px;
  }
  .home-btn-secondary:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; border-color: rgba(255,255,255,0.22); }

  /* ── Stats bar ── */
  .home-stats {
    position: relative; z-index: 1;
    display: flex; justify-content: center; flex-wrap: wrap;
    gap: 0;
    margin: 0 24px 80px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    overflow: hidden;
    animation: fadeUp 0.7s 0.4s ease both;
    max-width: 860px;
    margin-left: auto; margin-right: auto;
  }
  .home-stat {
    flex: 1; min-width: 140px;
    padding: 24px 20px;
    text-align: center;
    border-right: 1px solid rgba(255,255,255,0.06);
    position: relative;
  }
  .home-stat:last-child { border-right: none; }
  .home-stat-num {
    font-size: 32px; font-weight: 900; letter-spacing: -1px;
    background: linear-gradient(135deg, #7c6af7, #38bdf8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    display: block; margin-bottom: 5px;
  }
  .home-stat-label { font-size: 11px; color: #4a5568; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; }

  /* ── Features section ── */
  .home-features {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
    padding: 20px 24px 100px;
  }
  .home-section-label {
    display: flex; align-items: center; gap: 10px;
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    color: #4a5568; text-transform: uppercase;
    margin-bottom: 16px;
    font-family: 'JetBrains Mono', monospace;
  }
  .home-section-label::before {
    content: '';
    display: block; width: 28px; height: 1px;
    background: linear-gradient(90deg, #7c6af7, transparent);
  }
  .home-features-title {
    font-size: clamp(28px, 4vw, 48px);
    font-weight: 900; letter-spacing: -1.5px;
    color: #f0f0ff; margin-bottom: 12px; line-height: 1.1;
  }
  .home-features-sub {
    font-size: 14px; color: #6070a0; margin-bottom: 52px;
    max-width: 440px; line-height: 1.6;
  }
  .home-features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 18px;
  }

  /* ── Algo showcase ── */
  .home-algo-section {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
    padding: 0 24px 100px;
  }
  .home-algo-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 40px;
    display: flex; align-items: center; gap: 48px;
    flex-wrap: wrap;
    overflow: hidden; position: relative;
  }
  .home-algo-card::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 80% at 80% 50%, rgba(56,189,248,0.06), transparent);
    pointer-events: none;
  }
  .home-algo-text { flex: 1; min-width: 240px; }
  .home-algo-pills { flex: 1; min-width: 240px; display: flex; flex-wrap: wrap; gap: 8px; }
  .home-algo-pills-title {
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
    color: #4a5568; text-transform: uppercase; margin-bottom: 12px; width: 100%;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── CTA banner ── */
  .home-cta-banner {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
    padding: 0 24px 100px;
  }
  .home-cta-inner {
    background: linear-gradient(135deg, rgba(124,106,247,0.15), rgba(56,189,248,0.08));
    border: 1px solid rgba(124,106,247,0.25);
    border-radius: 24px;
    padding: 60px 48px;
    text-align: center;
    position: relative; overflow: hidden;
  }
  .home-cta-inner::after {
    content: '';
    position: absolute; inset: 0;
    background: repeating-linear-gradient(
      45deg, transparent, transparent 40px,
      rgba(124,106,247,0.02) 40px, rgba(124,106,247,0.02) 41px
    );
    pointer-events: none;
  }
  .home-footer {
    position: relative; z-index: 1;
    text-align: center; padding: 24px;
    border-top: 1px solid rgba(255,255,255,0.05);
    font-size: 11px; color: #2a2a4a;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Animations ── */
  @keyframes navDown { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes cardUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
  @keyframes pulse { 0%,100% { opacity: 1; box-shadow: 0 0 6px #a78bfa; } 50% { opacity: 0.5; box-shadow: 0 0 14px #a78bfa; } }
  @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

  /* ── Code window ── */
  .home-code-window {
    background: rgba(13,13,24,0.95);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; overflow: hidden;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; line-height: 1.7;
    animation: floatY 4s ease-in-out infinite;
    max-width: 340px;
    flex-shrink: 0;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .home-code-topbar {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 14px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .home-code-dot { width: 10px; height: 10px; border-radius: 50%; }
  .home-code-body { padding: 16px 18px; }
  .t-kw { color: #c084fc; }
  .t-fn { color: #60a5fa; }
  .t-num { color: #f59e0b; }
  .t-str { color: #34d399; }
  .t-cm { color: #4a5568; }
  .t-var { color: #e2e8f0; }
  .t-op { color: #818cf8; }
`;

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const el = document.createElement("style");
    el.id = "home-styles";
    el.textContent = STYLES;
    if (!document.getElementById("home-styles")) {
      document.head.appendChild(el);
    }
    return () => {
      const existing = document.getElementById("home-styles");
      if (existing) document.head.removeChild(existing);
    };
  }, []);

  return (
    <div className="home-root">
      <FloatingParticles />

      {/* Orb glows */}
      <div
        className="home-orb"
        style={{
          width: 600,
          height: 600,
          top: -200,
          left: -200,
          background:
            "radial-gradient(circle, rgba(124,106,247,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        className="home-orb"
        style={{
          width: 500,
          height: 500,
          top: 100,
          right: -150,
          background:
            "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="home-orb"
        style={{
          width: 400,
          height: 400,
          bottom: 100,
          left: "40%",
          background:
            "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ── Navbar ── */}
      <nav className="home-nav">
        <div className="home-nav-logo">⚡ VisualProg</div>
        <div className="home-nav-links">
          <button
            className="home-nav-btn"
            onClick={() => navigate("/visualizer")}
          >
            Code Visualizer
          </button>
          <button
            className="home-nav-btn"
            onClick={() => navigate("/algorithms")}
          >
            Algorithms
          </button>
          <button
            className="home-nav-cta"
            onClick={() => navigate("/visualizer")}
          >
            Try Free →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-eyebrow">
          <span className="home-eyebrow-dot" />
          Interactive Learning Platform
        </div>

        <h1 className="home-h1">
          <span className="home-h1-line1">Code that you</span>
          <span className="home-h1-line2">can actually see</span>
        </h1>

        <p className="home-sub">
          Watch your Python run step-by-step. Understand every algorithm with
          live animations, call stacks, and beginner-friendly explanations.
        </p>

        <div className="home-cta-row">
          <button
            className="home-btn-primary"
            onClick={() => navigate("/visualizer")}
          >
            <span>▶</span> Start Visualizing
          </button>
          <button
            className="home-btn-secondary"
            onClick={() => navigate("/algorithms")}
          >
            <span>⚡</span> Explore Algorithms
          </button>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="home-stats">
        {[
          { num: 8, suffix: "", label: "Algorithms" },
          { num: 5, suffix: "", label: "Sort Methods" },
          { num: 100, suffix: "%", label: "Free to Use" },
          { num: 0, suffix: " ms", label: "Setup Time" },
        ].map((s, i) => (
          <div key={i} className="home-stat">
            <span className="home-stat-num">
              {s.num === 0 ? "Zero" : <Counter to={s.num} suffix={s.suffix} />}
            </span>
            <span className="home-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section className="home-features">
        <div className="home-section-label">What you get</div>
        <h2 className="home-features-title">Everything a learner needs</h2>
        <p className="home-features-sub">
          From raw Python execution to complex graph traversals — visualized
          beautifully.
        </p>

        <div className="home-features-grid">
          {[
            {
              icon: "🔍",
              title: "Step-by-Step Execution",
              desc: "Execute Python line-by-line. Watch variables mutate, loops iterate, and functions push onto the call stack in real time.",
              accent: "#7c6af7",
              delay: "0.05s",
            },
            {
              icon: "📊",
              title: "Algorithm Visualizer",
              desc: "Bubble, Merge, Quick, Insertion — all animated with color-coded bars, pseudocode highlighting, and live step logs.",
              accent: "#38bdf8",
              delay: "0.15s",
            },
            {
              icon: "🌐",
              title: "Graph Traversals",
              desc: "BFS and DFS on interactive node graphs. Watch the queue/stack fill and drain as nodes light up in traversal order.",
              accent: "#34d399",
              delay: "0.25s",
            },
            {
              icon: "🎓",
              title: "Beginner Mode",
              desc: "Toggle friendly plain-english explanations. Perfect for students who want to understand the 'why', not just the 'how'.",
              accent: "#f59e0b",
              delay: "0.35s",
            },
            {
              icon: "🔴",
              title: "Breakpoints",
              desc: "Click the gutter to set breakpoints. Play runs and pauses automatically — just like a real debugger.",
              accent: "#f87171",
              delay: "0.45s",
            },
            {
              icon: "📈",
              title: "Variable History",
              desc: "Every assignment is logged with before/after values. Filter by variable name and jump to any change instantly.",
              accent: "#c084fc",
              delay: "0.55s",
            },
          ].map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* ── Algo Showcase ── */}
      <section className="home-algo-section">
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: "40px",
            display: "flex",
            alignItems: "center",
            gap: 48,
            flexWrap: "wrap",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* bg glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse 60% 80% at 20% 50%, rgba(124,106,247,0.07), transparent)",
            }}
          />

          {/* Code window */}
          <div className="home-code-window">
            <div className="home-code-topbar">
              <div
                className="home-code-dot"
                style={{ background: "#ef4444" }}
              />
              <div
                className="home-code-dot"
                style={{ background: "#f59e0b" }}
              />
              <div
                className="home-code-dot"
                style={{ background: "#22c55e" }}
              />
              <span style={{ marginLeft: 8, fontSize: 10, color: "#4a5568" }}>
                visualizer.py
              </span>
            </div>
            <div className="home-code-body">
              <div>
                <span className="t-kw">def </span>
                <span className="t-fn">fact</span>
                <span className="t-var">(n):</span>
              </div>
              <div>
                &nbsp;&nbsp;<span className="t-kw">if </span>
                <span className="t-var">n </span>
                <span className="t-op">==</span>
                <span className="t-num"> 1</span>
                <span className="t-var">:</span>
              </div>
              <div>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="t-kw">return </span>
                <span className="t-num">1</span>
              </div>
              <div>
                &nbsp;&nbsp;<span className="t-kw">return </span>
                <span className="t-var">n </span>
                <span className="t-op">*</span>
                <span className="t-fn"> fact</span>
                <span className="t-var">(n</span>
                <span className="t-op">-</span>
                <span className="t-num">1</span>
                <span className="t-var">)</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <span className="t-cm"># Step 7 → n=4, returns 24</span>
              </div>
              <div
                style={{
                  marginTop: 10,
                  padding: "6px 10px",
                  background: "rgba(124,106,247,0.15)",
                  border: "1px solid rgba(124,106,247,0.3)",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#c084fc",
                }}
              >
                ▶ n ← 4 → fact(4-1) = 24
              </div>
            </div>
          </div>

          {/* Text side */}
          <div
            style={{ flex: 1, minWidth: 240, position: "relative", zIndex: 1 }}
          >
            <div className="home-section-label" style={{ marginBottom: 14 }}>
              Algorithms covered
            </div>
            <h2
              style={{
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 900,
                letterSpacing: "-1px",
                color: "#f0f0ff",
                lineHeight: 1.2,
                marginBottom: 14,
              }}
            >
              8 algorithms.
              <br />
              All visualized.
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#6070a0",
                lineHeight: 1.7,
                marginBottom: 22,
              }}
            >
              Every algorithm comes with step-by-step animation, complexity
              info, pseudocode highlighting, and a real-time step log.
            </p>

            {/* Pills */}
            <div
              style={{
                marginBottom: 8,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "1.5px",
                color: "#4a5568",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              SORTING
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 7,
                marginBottom: 14,
              }}
            >
              {[
                ["Bubble", "#7c6af7"],
                ["Selection", "#38bdf8"],
                ["Insertion", "#34d399"],
                ["Merge", "#f59e0b"],
                ["Quick", "#f87171"],
              ].map(([l, c]) => (
                <AlgoPill key={l} label={l} color={c} />
              ))}
            </div>
            <div
              style={{
                marginBottom: 8,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "1.5px",
                color: "#4a5568",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              SEARCH & GRAPH
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {[
                ["Binary Search", "#c084fc"],
                ["BFS", "#38bdf8"],
                ["DFS", "#34d399"],
              ].map(([l, c]) => (
                <AlgoPill key={l} label={l} color={c} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="home-cta-banner">
        <div className="home-cta-inner">
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "1.5px",
              color: "#7c6af7",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 16,
            }}
          >
            Ready to understand code?
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 52px)",
              fontWeight: 900,
              letterSpacing: "-1.5px",
              color: "#f0f0ff",
              lineHeight: 1.1,
              marginBottom: 14,
              position: "relative",
              zIndex: 1,
            }}
          >
            Stop guessing.
            <br />
            Start seeing.
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#6070a0",
              marginBottom: 36,
              maxWidth: 380,
              margin: "0 auto 36px",
              lineHeight: 1.7,
              position: "relative",
              zIndex: 1,
            }}
          >
            No installs. No account needed. Just paste your code and watch it
            come alive.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            <button
              className="home-btn-primary"
              onClick={() => navigate("/visualizer")}
            >
              ▶ Open Code Visualizer
            </button>
            <button
              className="home-btn-secondary"
              onClick={() => navigate("/algorithms")}
            >
              ⚡ Browse Algorithms
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        built with ⚡ Visual Programming Platform
      </footer>
    </div>
  );
}
