'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  Target,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Brain,
  Compass,
  ChevronRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface PaperDoc {
  id: string;
  paper_id: string;
  title: string;
  branch: string;
  total_questions: number;
}

export default function Home() {
  const [featuredPapers, setFeaturedPapers] = useState<PaperDoc[]>([]);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/papers?branch=CS');
        const data = await res.json();
        if (data.success && data.papers) {
          setFeaturedPapers(data.papers.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch homepage featured papers:', err);
      }
    }
    fetchFeatured();
  }, []);

  const branches = [
    {
      code: 'CS',
      name: 'Computer Science & IT',
      papers: '467 Test Papers',
      desc: 'Algorithms, DBMS, Operating Systems, Computer Networks, Theory of Computation, Compiler Design.',
    },
    {
      code: 'DA',
      name: 'Data Science & Artificial Intelligence',
      papers: '77 Test Papers',
      desc: 'Machine Learning, Linear Algebra, Probability & Statistics, Python Data Structures, AI Search.',
    },
    {
      code: 'EE',
      name: 'Electrical Engineering',
      papers: '238 Test Papers',
      desc: 'Power Systems, Control Systems, Circuit Theory, Electrical Machines, Signals & Systems.',
    },
    {
      code: 'EC',
      name: 'Electronics & Communication',
      papers: '98 Test Papers',
      desc: 'Signals & Systems, Analog Circuits, Digital Electronics, Communications, Electromagnetics.',
    },
    {
      code: 'ME',
      name: 'Mechanical Engineering',
      papers: '97 Test Papers',
      desc: 'Thermodynamics, Fluid Mechanics, Engineering Mechanics, Manufacturing Science, Machine Design.',
    },
    {
      code: 'CE',
      name: 'Civil Engineering',
      papers: '84 Test Papers',
      desc: 'Structural Engineering, Geotechnical, Environmental, Transportation, Hydraulics.',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'DISCOVER',
      subtitle: 'Target Practice Series',
      desc: 'Select your GATE branch and explore topic tests, subject bundles, and full-length CBT mocks.',
      icon: Compass,
    },
    {
      step: '02',
      title: 'PRACTICE',
      subtitle: 'Official IIT CBT Engine',
      desc: 'Attempt tests with real timers, NAT virtual keypads, MSQ multi-selects, and precise negative marking.',
      icon: Target,
    },
    {
      step: '03',
      title: 'ANALYZE',
      subtitle: 'Diagnostic Weak Areas',
      desc: 'Uncover weak topics, accuracy trends, and step-by-step KaTeX mathematical solution guides.',
      icon: Brain,
    },
    {
      step: '04',
      title: 'IMPROVE',
      subtitle: 'Targeted Repeat Drills',
      desc: 'Execute recommended topic practice to fix weak points and elevate your GATE score rank.',
      icon: TrendingUp,
    },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: 'Official GATE CBT Engine',
      desc: 'Practice on an authentic Computer Based Test interface matching IIT GATE standards with real-time timers and NAT keypads.',
    },
    {
      icon: TrendingUp,
      title: 'Topic Accuracy Analytics',
      desc: 'Pinpoint weak topics, eliminate negative marking mistakes, and track accuracy across subject domains.',
    },
    {
      icon: Zap,
      title: 'KaTeX Math Explanations',
      desc: 'Study clear, step-by-step mathematical solutions rendered with high-precision KaTeX math typography.',
    },
    {
      icon: Award,
      title: 'Branch Pass All-Access',
      desc: 'Gain 365-day access to all full-length mocks, subject tests, and future additions with a single Branch Pass.',
    },
  ];

  const faqs = [
    {
      q: 'What makes GATE Matrix test series unique for GATE aspirants?',
      a: 'GATE Matrix provides authentic GATE Computer Based Test (CBT) practice with exact question types (MCQ, MSQ, NAT), official negative marking rules, and instant topic-level accuracy diagnostics.',
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
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-b from-[#14213d] via-[#14213d] to-[#0f172a] text-white py-16 md:py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7">
            <span className="inline-flex items-center gap-2 bg-[#0f766e]/30 text-[#8be0ce] border border-[#0f766e]/50 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-[#8be0ce] animate-pulse"></span>
              GATE 2025 / 2026 Preparation Platform
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              Prepare smarter <br />
              <span className="bg-gradient-to-r from-[#8be0ce] via-[#38bdf8] to-white bg-clip-text text-transparent">
                for GATE examination.
              </span>
            </h1>
            <p className="text-gray-300 text-base md:text-lg mb-8 max-w-xl leading-relaxed">
              Practice realistic GATE tests, understand your performance, identify weak topics, and know exactly what to practice next.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/catalog">
                <Button variant="emerald" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Test Series
                </Button>
              </Link>
              <Link href="/exam">
                <Button variant="secondary" size="lg">
                  Take a Free Test
                </Button>
              </Link>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-6 rounded-3xl shadow-2xl">
              <div className="bg-[#14213d] border border-white/10 rounded-2xl p-6 shadow-inner">
                <span className="text-[11px] font-extrabold text-[#8be0ce] uppercase tracking-wider block mb-2">
                  Live Platform Credibility
                </span>
                <div className="text-4xl font-black text-white mb-1 tracking-tight">
                  1,061+ <span className="text-sm font-medium text-gray-300">Verified Papers</span>
                </div>
                <p className="text-xs text-gray-400 mb-6">Indexed across CS, DA, EE, EC, ME, and CE</p>

                <div className="space-y-4 border-t border-white/10 pt-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Exam Layout</span>
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

      {/* 2. Platform Credibility Bar */}
      <section className="bg-white border-y border-[#dce3ec] py-6 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div>
            <div className="text-2xl font-black text-[#14213d]">1,061+</div>
            <div className="text-xs text-[#526079] font-bold">Test Papers</div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#14213d]">21,000+</div>
            <div className="text-xs text-[#526079] font-bold">Exam Questions</div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#0f766e]">6 Branches</div>
            <div className="text-xs text-[#526079] font-bold">Engineering Streams</div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#14213d]">100%</div>
            <div className="text-xs text-[#526079] font-bold">CBT Standard</div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="text-2xl font-black text-[#0f766e]">Real-Time</div>
            <div className="text-xs text-[#526079] font-bold">Topic Analytics</div>
          </div>
        </div>
      </section>

      {/* 3. Choose your GATE Branch */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-wrap justify-between items-end mb-10 gap-4">
          <div>
            <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-1">
              Engineering Streams
            </span>
            <h2 className="text-3xl font-black text-[#14213d] tracking-tight">Choose Your GATE Branch</h2>
          </div>
          <Link href="/catalog" className="text-xs font-bold text-[#0f766e] hover:underline flex items-center gap-1">
            <span>Explore All Test Series</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((b) => (
            <Card key={b.code} hoverEffect className="flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="emerald" size="md">
                    {b.code}
                  </Badge>
                  <span className="text-xs text-[#526079] font-extrabold">{b.papers}</span>
                </div>
                <h3 className="font-extrabold text-[#14213d] text-lg mb-2 group-hover:text-[#0f766e] transition-colors">
                  {b.name}
                </h3>
                <p className="text-xs text-[#526079] leading-relaxed mb-6">{b.desc}</p>
              </div>
              <Link href={`/catalog?branch=${b.code}`}>
                <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View {b.code} Test Series
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Popular Test Series */}
      {featuredPapers.length > 0 && (
        <section className="py-16 px-6 bg-white border-y border-[#dce3ec]">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-1">
                  Popular Practice Series
                </span>
                <h2 className="text-2xl font-black text-[#14213d]">Featured GATE CS Mock Papers</h2>
              </div>
              <Link href="/catalog" className="text-xs font-bold text-[#0f766e] hover:underline">
                View Full Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPapers.map((p) => (
                <Card key={p.id} hoverEffect className="flex flex-col justify-between">
                  <div>
                    <Badge variant="emerald" className="mb-3">
                      {p.branch}
                    </Badge>
                    <h3 className="text-base font-bold text-[#14213d] mb-2">{p.title}</h3>
                    <p className="text-xs text-[#526079] mb-4">Official CBT Pattern Mock Series</p>
                  </div>
                  <div className="pt-4 border-t border-[#dce3ec] flex justify-between items-center">
                    <span className="text-xs font-bold text-[#0f766e]">{p.total_questions} Questions</span>
                    <Link href={`/exam?paperId=${p.paper_id}`}>
                      <Button variant="emerald" size="sm">
                        Attempt Test →
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. How the Platform Works */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-2">
            The Preparation Cycle
          </span>
          <h2 className="text-3xl font-black text-[#14213d] tracking-tight">How GATE Matrix Works</h2>
          <p className="text-xs text-[#526079] mt-2">
            A systematic, data-driven workflow designed to optimize your GATE score.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((ws, i) => {
            const Icon = ws.icon;
            return (
              <Card key={i} className="relative overflow-hidden">
                <span className="text-4xl font-black text-slate-100 absolute top-3 right-4 select-none">
                  {ws.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#e7f4f0] text-[#0f766e] flex items-center justify-center font-bold mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-[#0f766e] uppercase tracking-wider block mb-1">
                  {ws.title}
                </span>
                <h3 className="text-base font-bold text-[#14213d] mb-2">{ws.subtitle}</h3>
                <p className="text-xs text-[#526079] leading-relaxed">{ws.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 6. Performance Analytics Preview */}
      <section className="py-16 px-6 bg-gradient-to-br from-[#14213d] to-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-6">
            <span className="text-[#8be0ce] text-xs font-extrabold uppercase tracking-widest block mb-2">
              Deep Analytics
            </span>
            <h2 className="text-3xl font-black tracking-tight leading-tight mb-4">
              Turn test attempts into score-boosting insights.
            </h2>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-6">
              Our evaluation engine breaks down every attempt into topic-level accuracy, time spent per question, and negative marking penalties, showing you exactly where to focus next.
            </p>
            <Link href="/performance">
              <Button variant="emerald" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore Performance Features
              </Button>
            </Link>
          </div>

          <div className="md:col-span-6">
            <div className="bg-white/10 border border-white/15 p-6 rounded-3xl backdrop-blur-md space-y-4 text-xs">
              <div className="flex justify-between items-center font-bold text-[#8be0ce]">
                <span>Topic Accuracy Snapshot</span>
                <span>Target: 80%+</span>
              </div>
              {[
                { name: 'Data Structures & Algorithms', val: 88 },
                { name: 'Database Management Systems', val: 82 },
                { name: 'Operating Systems', val: 74 },
                { name: 'Computer Networks', val: 62 },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold">{item.name}</span>
                    <span className="font-black text-[#8be0ce]">{item.val}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#8be0ce] h-2 rounded-full" style={{ width: `${item.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Why GATE Matrix */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-2">
            Why Top Rankers Choose Us
          </span>
          <h2 className="text-3xl font-black text-[#14213d] tracking-tight">
            Engineered specifically for GATE aspirants
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} hoverEffect>
                <div className="w-10 h-10 rounded-xl bg-[#e7f4f0] text-[#0f766e] flex items-center justify-center font-bold mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#14213d] mb-2">{f.title}</h3>
                <p className="text-xs text-[#526079] leading-relaxed">{f.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 8. Frequently Asked Questions */}
      <section className="py-16 px-6 max-w-4xl mx-auto w-full border-t border-[#dce3ec]">
        <h2 className="text-2xl font-black text-[#14213d] text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <Card key={idx} padding="md">
              <h3 className="text-base font-bold text-[#14213d] mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0f766e]" />
                {faq.q}
              </h3>
              <p className="text-xs text-[#526079] leading-relaxed pl-6">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="bg-[#14213d] text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-black tracking-tight">Ready to elevate your GATE rank?</h2>
          <p className="text-gray-300 text-sm max-w-lg mx-auto">
            Enroll in full-length mock series, master topic accuracy, and practice with authentic CBT examination papers.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/catalog">
              <Button variant="emerald" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore GATE Test Series
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
