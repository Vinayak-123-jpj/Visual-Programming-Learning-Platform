import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CodeVisualizer from "./pages/CodeVisualizer";
import Algorithms from "./pages/Algorithms";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/visualizer" element={<CodeVisualizer />} />
      <Route path="/algorithms" element={<Algorithms />} />
    </Routes>
  );
}

export default App;
