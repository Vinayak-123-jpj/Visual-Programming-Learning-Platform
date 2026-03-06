import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeatureCard from "../components/FeatureCard";

export default function Home() {
  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="px-10 py-20 bg-black">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">
          Powerful Learning Features
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            title="Step-by-Step Code Execution"
            description="Watch your Python code execute line by line with real-time variable updates."
          />

          <FeatureCard
            title="Algorithm Visualizer"
            description="Understand sorting and graph algorithms with interactive animations."
          />

          <FeatureCard
            title="Beginner Friendly Explanations"
            description="Get simple explanations for errors and algorithm logic."
          />
        </div>
      </section>
    </div>
  );
}
