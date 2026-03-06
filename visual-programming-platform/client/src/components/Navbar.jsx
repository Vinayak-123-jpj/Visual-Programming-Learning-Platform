export default function Navbar() {
  return (
    <nav className="w-full px-8 py-4 flex justify-between items-center bg-gray-900 text-white">
      <h1 className="text-xl font-bold">Visual Programming</h1>

      <div className="space-x-6">
        <button className="hover:text-blue-400 transition">
          Code Visualizer
        </button>
        <button className="hover:text-blue-400 transition">Algorithms</button>
      </div>
    </nav>
  );
}
