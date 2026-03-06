import { useState } from "react";
import BubbleSort from "../visualizers/BubbleSort";

export default function Algorithms() {
  const [algo, setAlgo] = useState("bubble");

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1 style={{ marginBottom: "30px" }}>Algorithm Visualizations</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setAlgo("bubble")}>Bubble Sort</button>
        <button onClick={() => setAlgo("binary")}>Binary Search</button>
        <button onClick={() => setAlgo("bfs")}>BFS</button>
      </div>

      {algo === "bubble" && <BubbleSort />}
    </div>
  );
}
