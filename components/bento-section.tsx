//@ts-expect-error: error
const BentoCard = ({ title, description, Component, accentColor = "emerald" }) => {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:border-emerald-400/40 hover:bg-white/10 hover:shadow-xl hover:shadow-emerald-500/10">
      {/* Accent glow on hover (brand-aligned) */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        style={{
          background: `radial-gradient(circle at center, rgba(16, 185, 129, 0.2), transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 flex flex-col h-full">
        <div className="mb-4">
          <h3 className="text-white text-xl font-bold leading-snug group-hover:text-emerald-100 transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-emerald-100/70 text-sm md:text-base leading-relaxed">
            {description}
          </p>
        </div>

        {/* Illustration area */}
        <div className="mt-auto w-full h-40 flex justify-center items-center">
          <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/3 to-white/1 shadow-inner">
            <Component />
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------- Upgraded Illustration Components --------------------
const CropHealthMonitoring = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-2">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full animate-pulse opacity-70"></div>
      <div className="absolute inset-2 bg-gradient-to-r from-green-300 to-emerald-500 rounded-full flex items-center justify-center">
        <span className="text-white text-xs font-bold">🌱</span>
      </div>
    </div>
    <p className="mt-3 text-green-200 text-xs font-medium">NDVI Health Map</p>
  </div>
);

const RealTimeFarmPreviews = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-2">
    <div className="relative">
      <div className="w-24 h-16 bg-gradient-to-r from-teal-500 to-cyan-400 rounded-lg opacity-80"></div>
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-emerald-400 rounded-full"></div>
    </div>
    <p className="mt-3 text-teal-200 text-xs font-medium">Live Satellite Feed</p>
  </div>
);

const SmartIrrigationIllustration = () => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-blue-400/30 rounded-full flex items-center justify-center">
        <div className="w-6 h-6 bg-blue-500 rounded-full animate-bounce"></div>
      </div>
      <div className="absolute -right-2 top-1/2 w-6 h-0.5 bg-blue-300"></div>
      <div className="absolute -left-2 top-1/2 w-6 h-0.5 bg-blue-300"></div>
    </div>
    <p className="mt-3 text-blue-200 text-xs font-medium">Auto Watering</p>
  </div>
);

const SoilAnalysisIllustration = () => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="w-10 h-2 bg-amber-600 rounded-full mb-1"></div>
      <div className="w-14 h-2 bg-amber-500 rounded-full mb-1"></div>
      <div className="w-12 h-2 bg-amber-400 rounded-full"></div>
    </div>
    <p className="mt-3 text-amber-200 text-xs font-medium">Nutrient Profile</p>
  </div>
);

const ParallelFarmAgents = () => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div className="flex space-x-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center animate-ping"
          style={{ animationDelay: `${i * 0.3}s`, animationDuration: "2s" }}
        >
          <span className="text-white text-[8px] font-bold">🤖</span>
        </div>
      ))}
    </div>
    <p className="mt-3 text-purple-200 text-xs font-medium">AI Agents Sync</p>
  </div>
);

const EasyDeployment = () => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div className="relative">
      <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
        <span className="text-gray-200 text-lg">🚜</span>
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
        <span className="text-white text-[10px]">✓</span>
      </div>
    </div>
    <p className="mt-3 text-gray-200 text-xs font-medium">Plug & Play</p>
  </div>
);

// -------------------- BentoSection --------------------
export function BentoSection() {
  const cards = [
    {
      title: "Crop Health Monitoring",
      description: "Detect diseases early and track growth with AI-powered satellite & drone insights.",
      Component: CropHealthMonitoring,
    },
    {
      title: "Real-time Farm Previews",
      description: "Access live field maps, weather overlays, and operational dashboards.",
      Component: RealTimeFarmPreviews,
    },
    {
      title: "Smart Irrigation Systems",
      description: "Reduce water waste by 40% with AI-driven soil moisture optimization.",
      Component: SmartIrrigationIllustration,
    },
    {
      title: "Soil Analysis & Recommendations",
      description: "Get real-time nutrient levels and custom fertilizer plans.",
      Component: SoilAnalysisIllustration,
    },
    {
      title: "Parallel Farm Agents",
      description: "Run AI models for pest control, yield prediction, and logistics—simultaneously.",
      Component: ParallelFarmAgents,
    },
    {
      title: "Easy Deployment & Integration",
      description: "Go from sign-up to full operation in under 24 hours—no hardware needed.",
      Component: EasyDeployment,
    },
  ];

  return (
    <section className="w-full px-4 md:px-6 py-16 md:py-24 relative overflow-hidden">
      {/* Subtle background gradient blob (non-intrusive) */}
      <div
        className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-400/5 rounded-full blur-3xl opacity-30"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-l from-green-600/5 to-transparent rounded-full blur-3xl opacity-20"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Empower Your Farm with <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">AI</span>
          </h2>
          <p className="mt-6 max-w-3xl mx-auto text-emerald-100/80 text-lg md:text-xl font-medium leading-relaxed">
            Monitor crops, manage resources efficiently, and get actionable insights to optimize your farm operations with FarmSmart AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <BentoCard key={i} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}