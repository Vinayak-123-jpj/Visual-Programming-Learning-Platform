import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="h-[80vh] flex flex-col justify-center items-center text-center bg-gradient-to-br from-gray-900 via-black to-gray-950 text-white px-6">
      <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Learn Programming Visually 🚀
      </h2>

      <p className="text-gray-400 max-w-xl mb-8 text-lg">
        See how your code runs step by step. Understand algorithms with
        interactive animations.
      </p>

      <div className="space-x-4">
        <button
          onClick={() => navigate("/visualizer")}
          className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/30"
        >
          Start Coding
        </button>

        <button
          onClick={() => navigate("/algorithms")}
          className="border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-800 hover:scale-105 transition-all duration-300"
        >
          Explore Algorithms
        </button>
      </div>
    </section>
  );
}
