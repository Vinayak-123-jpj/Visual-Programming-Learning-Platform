export default function FeatureCard({ title, description }) {
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-blue-500 transition-all duration-300 hover:scale-105">
      <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
