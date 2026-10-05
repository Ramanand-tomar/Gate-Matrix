import Link from 'next/link';

export default function Home() {
  const branches = [
    { code: 'CS', name: 'Computer Science & IT', papers: '467 Test Papers', desc: 'Algorithms, DBMS, OS, Computer Networks, Theory of Computation.' },
    { code: 'DA', name: 'Data Science & Artificial Intelligence', papers: '77 Test Papers', desc: 'Machine Learning, Linear Algebra, Probability & Statistics, Python.' },
    { code: 'EE', name: 'Electrical Engineering', papers: '238 Test Papers', desc: 'Power Systems, Control Systems, Circuit Theory, Electrical Machines.' },
    { code: 'EC', name: 'Electronics & Communication', papers: '98 Test Papers', desc: 'Signals & Systems, Analog Circuits, Communications, Electromagnetics.' },
    { code: 'ME', name: 'Mechanical Engineering', papers: '97 Test Papers', desc: 'Thermodynamics, Fluid Mechanics, Engineering Mechanics, Manufacturing.' },
    { code: 'CE', name: 'Civil Engineering', papers: '84 Test Papers', desc: 'Structural Engineering, Geotechnical, Transportation, Hydraulics.' },
  ];

  const features = [
    {
      icon: '🎯',
      title: 'Official GATE CBT Engine',
      desc: 'Practice on an authentic Computer Based Test interface matching IIT GATE standards with real-time timers and NAT keypads.',
    },
    {
      icon: '📊',
      title: 'Topic Accuracy & Diagnostic Analytics',
      desc: 'Pinpoint weak topics, eliminate negative marking mistakes, and track accuracy across subject domains.',
    },
    {
      icon: '🧮',
      title: 'KaTeX Mathematical Explanations',
      desc: 'Study clear, step-by-step mathematical solutions rendered with high-precision KaTeX math typography.',
    },
    {
      icon: '⚡',
      title: 'Branch Pass & All-Access Series',
      desc: 'Gain 365-day access to all full-length mocks, subject tests, and future additions with a single Branch Pass.',
    },
  ];

  const faqs = [
    {
      q: 'What makes GATEPrep Studio test series unique for GATE aspirants?',
      a: 'GATEPrep Studio provides authentic GATE Computer Based Test (CBT) practice with question types (MCQ, MSQ, NAT), exact negative marking rules, and instant topic-level accuracy diagnostics.',
    },
    {
      q: 'How does the Branch Pass work?',
      a: 'The Branch Pass grants 365-day access to all published and upcoming test series in your selected engineering discipline (CS, DA, EE, EC, ME, or CE).',
    },
    {
      q: 'Are solutions provided for numerical answer type (NAT) questions?',
      a: 'Yes! Every question includes comprehensive, step-by-step solutions rendered with mathematical equations using KaTeX.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#14213d] to-[#0f172a] text-white py-16 md:py-24 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7">
            <span className="inline-flex items-center gap-2 bg-[#0f766e]/30 text-[#8be0ce] border border-[#0f766e]/50 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-[#8be0ce] animate-pulse"></span>
              GATE 2025 / 2026 Preparation Platform
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              Crack GATE with <br />
              <span className="bg-gradient-to-r from-[#8be0ce] to-[#38bdf8] bg-clip-text text-transparent">
                Precision Analytics & CBT Mocks
              </span>
            </h1>
            <p className="text-gray-300 text-base md:text-lg mb-8 max-w-xl leading-relaxed">
              Elevate your GATE rank with authentic IIT-pattern mock tests, topic-level weak area diagnosis, and step-by-step mathematical solutions across all 6 engineering streams.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/catalog"
                className="bg-[#0f766e] hover:bg-[#115e59] text-white font-extrabold px-7 py-3.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-emerald-950/50 active:scale-95 flex items-center gap-2"
              >
                Explore GATE Test Series →
              </Link>
              <Link
                href="/exam"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-7 py-3.5 rounded-xl text-sm border border-white/20 transition-all active:scale-95"
              >
                Launch Mock Engine
              </Link>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-6 rounded-3xl shadow-2xl">
              <div className="bg-[#14213d] border border-white/10 rounded-2xl p-6 shadow-inner">
                <span className="text-[11px] font-bold text-[#8be0ce] uppercase tracking-wider block mb-2">
                  Live Diagnostic Snapshot
                </span>
                <div className="text-3xl font-black text-white mb-1">
                  1,061+ <span className="text-sm font-medium text-gray-300">Verified GATE Papers</span>
                </div>
                <p className="text-xs text-gray-400 mb-6">Indexed across CS, DA, EE, EC, ME, and CE</p>

                <div className="space-y-4 border-t border-white/10 pt-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Official Exam Layout</span>
                    <span className="text-[#8be0ce] font-bold">IIT CBT Standard</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Question Types</span>
                    <span className="text-white font-bold">MCQ · MSQ · NAT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Evaluation Engine</span>
                    <span className="text-[#8be0ce] font-bold">Instant Score & Accuracy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-2">
            Why Top Rankers Choose GATEPrep Studio
          </span>
          <h2 className="text-3xl font-extrabold text-[#14213d] tracking-tight">
            Engineered specifically for GATE aspirants
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-[#dce3ec] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold text-[#14213d] mb-2">{f.title}</h3>
              <p className="text-xs text-[#526079] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Engineering Branch Grid */}
      <section className="py-12 px-6 bg-white border-y border-[#dce3ec]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-between items-end mb-8 gap-4">
            <div>
              <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-1">
                Target Engineering Disciplines
              </span>
              <h2 className="text-2xl font-extrabold text-[#14213d]">GATE Test Series by Branch</h2>
            </div>
            <Link href="/catalog" className="text-xs font-bold text-[#0f766e] hover:underline">
              View All Test Series →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {branches.map((b) => (
              <Link
                key={b.code}
                href="/catalog"
                className="bg-[#f8fafc] border border-[#dce3ec] p-6 rounded-2xl hover:border-[#0f766e] hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-[#e7f4f0] text-[#0f766e] font-extrabold text-sm px-3 py-1 rounded-lg group-hover:bg-[#0f766e] group-hover:text-white transition-colors">
                      {b.code}
                    </span>
                    <span className="text-xs text-[#526079] font-bold">{b.papers}</span>
                  </div>
                  <h3 className="font-bold text-[#14213d] text-base mb-1">{b.name}</h3>
                  <p className="text-xs text-[#526079] leading-relaxed mb-4">{b.desc}</p>
                </div>
                <span className="text-xs font-bold text-[#0f766e] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Tests & Mocks →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 px-6 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-extrabold text-[#14213d] text-center mb-8">
          Frequently Asked Questions (GATE Preparation)
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-[#dce3ec] p-6 rounded-2xl shadow-sm">
              <h3 className="text-base font-bold text-[#14213d] mb-2">{faq.q}</h3>
              <p className="text-xs text-[#526079] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#dce3ec] bg-white py-10 px-6 text-xs text-[#526079] mt-auto">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-6">
          <div>
            <div className="font-extrabold text-base text-[#14213d] mb-1">GATEPrep Studio</div>
            <p className="text-xs text-[#526079]">Comprehensive GATE Exam Test Series & Performance Analytics</p>
          </div>
          <div className="flex gap-6 font-semibold">
            <Link href="/" className="hover:text-[#0f766e]">Home</Link>
            <Link href="/catalog" className="hover:text-[#0f766e]">Test Catalogue</Link>
            <Link href="/dashboard" className="hover:text-[#0f766e]">Workspace</Link>
            <Link href="/exam" className="hover:text-[#0f766e]">Test Engine</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-[#dce3ec] mt-6 pt-6 text-center text-[11px]">
          © 2026 GATEPrep Studio · All Rights Reserved. Prepared for GATE 2025/2026 Aspirants.
        </div>
      </footer>
    </div>
  );
}
