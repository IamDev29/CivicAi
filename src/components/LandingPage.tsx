import React from 'react';
import { motion } from 'motion/react';
import { 
  Camera, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles,
  Award,
  Lock
} from 'lucide-react';

interface LandingPageProps {
  onStartReporting: () => void;
  onAuthorityLogin: () => void;
}

export default function LandingPage({ onStartReporting, onAuthorityLogin }: LandingPageProps) {
  // Social proof avatars (realistic local names and high-quality UI avatars)
  const citizens = [
    { name: 'Priyabrata', color: 'bg-blue-100 text-blue-800', initial: 'P' },
    { name: 'Lipika', color: 'bg-emerald-100 text-emerald-800', initial: 'L' },
    { name: 'Sandeep', color: 'bg-amber-100 text-amber-800', initial: 'S' },
    { name: 'Ananya', color: 'bg-purple-100 text-purple-800', initial: 'A' },
    { name: 'Amit', color: 'bg-rose-100 text-rose-800', initial: 'A' }
  ];

  // Ticker items
  const tickerItems = [
    { text: "🔴 Pothole reported — MG Road, Ward 12" },
    { text: "✅ Streetlight fixed — Patia, Ward 7" },
    { text: "🟡 Water leak assigned — Saheed Nagar" },
    { text: "🔴 Garbage pile reported — Damana, Ward 6" },
    { text: "✅ Drainage overflow fixed — Master Canteen" }
  ];

  // Stats for counter row
  const stats = [
    { label: "Issues Reported", value: "2,847", change: "+14% this week" },
    { label: "Resolved", value: "1,203", change: "89% SLA rate" },
    { label: "Wards Active", value: "94 / 100", change: "Bhubaneswar" },
    { label: "Avg Resolution", value: "4.2 days", change: "Fastest ever" }
  ];

  return (
    <div className="bg-white h-full overflow-y-auto scrollbar-none flex flex-col justify-between relative overflow-x-hidden">
      
      {/* Self-contained CSS for smooth marquee scrolling & animation keyframes */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>

      {/* Decorative background grid and pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>

      {/* Hero Section */}
      <div className="px-5 pt-8 pb-6 flex-1 flex flex-col justify-center space-y-7 relative z-10">
        
        {/* Brand Header Logo */}
        <div className="flex items-center space-x-2.5 mx-auto">
          <div className="w-9 h-9 bg-[#1a73e8] rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-base font-black">C</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-black tracking-tight text-gray-950">CivicAI</span>
              <span className="bg-[#e8f0fe] text-[#1a73e8] px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wider uppercase">Bhubaneswar</span>
            </div>
            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Autonomous Citizen Auditing</span>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="text-center space-y-3">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-4xl font-extrabold tracking-tight text-gray-950 font-sans leading-none"
          >
            Fix Your City.<br />
            <span className="text-[#1a73e8] bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Together.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-xs text-gray-500 font-semibold leading-relaxed max-w-sm mx-auto"
          >
            Report civic issues, track resolutions, and hold local government accountable — powered by AI.
          </motion.p>
        </div>

        {/* Side-by-Side Call To Action Buttons */}
        <div className="grid grid-cols-2 gap-3.5 max-w-xs mx-auto w-full pt-1">
          <button
            onClick={onStartReporting}
            id="btn-landing-report"
            className="bg-[#1a73e8] hover:bg-blue-700 text-white py-3.5 px-3 rounded-2xl text-[10px] font-extrabold tracking-wider uppercase transition flex items-center justify-center space-x-1 shadow-md hover:shadow-lg cursor-pointer active:scale-95"
          >
            <span>Report Issue</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3px]" />
          </button>
          
          <button
            onClick={onAuthorityLogin}
            id="btn-landing-login"
            className="border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 py-3.5 px-3 rounded-2xl text-[10px] font-extrabold tracking-wider uppercase transition flex items-center justify-center space-x-1 cursor-pointer active:scale-95 bg-white/70"
          >
            <Lock className="w-3 h-3 text-gray-400" />
            <span>Authority Login</span>
          </button>
        </div>

        {/* Live Counters Stats Row */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3.5 grid grid-cols-2 gap-4 max-w-sm mx-auto w-full shadow-3xs">
          {stats.map((st, i) => (
            <div key={i} className="text-center space-y-0.5 border-r last:border-r-0 border-gray-150 p-1">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{st.label}</div>
              <div className="text-base font-black text-gray-950 font-mono tracking-tight">{st.value}</div>
              <div className="text-[8px] text-blue-600 font-extrabold uppercase tracking-widest">{st.change}</div>
            </div>
          ))}
        </div>

      </div>

      {/* How It Works Section */}
      <div className="px-5 py-6 bg-gray-50 border-y border-gray-100 space-y-4 relative z-10 shrink-0">
        <div className="text-center space-y-0.5">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#1a73e8]">Democratic Civic Oversight</p>
          <h3 className="text-sm font-black text-gray-950 uppercase tracking-tight">How it works</h3>
        </div>

        <div className="grid grid-cols-1 gap-2.5 max-w-sm mx-auto">
          {/* Card 1 */}
          <div className="bg-white p-3 rounded-xl border border-gray-150 flex items-center space-x-3 shadow-3xs">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
              <Camera className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-bold text-gray-950">1. Snap & Report</h4>
              <p className="text-[9px] text-gray-500 font-medium">Take a photo of any road hazard or water leak. Gemini AI identifies category and severity instantly.</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-3 rounded-xl border border-gray-150 flex items-center space-x-3 shadow-3xs">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
              <Users className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-bold text-gray-950">2. Community Validates</h4>
              <p className="text-[9px] text-gray-500 font-medium">Neighbors upvote active concerns. Multi-source spatial matching filters out redundant or fake entries.</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-3 rounded-xl border border-gray-150 flex items-center space-x-3 shadow-3xs">
            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0 border border-purple-100">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-bold text-gray-950">3. Track to Resolution</h4>
              <p className="text-[9px] text-gray-500 font-medium">Watch local authorities receive tickets, assign contractors, and mark completions transparently on-map.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Issues Ticker Strip */}
      <div className="bg-blue-600 text-white py-2 relative overflow-hidden z-10 shrink-0 border-y border-blue-700 flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-blue-600 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-600 to-transparent z-20 pointer-events-none"></div>
        
        <div className="flex whitespace-nowrap animate-marquee">
          {/* We duplicate the array to guarantee seamless wrapping */}
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
            <span key={index} className="inline-flex items-center text-[10px] font-bold tracking-tight px-6 select-none uppercase">
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Social Proof & App Branding */}
      <div className="px-5 py-5 space-y-3 shrink-0 relative z-10 bg-white">
        <div className="text-center space-y-2">
          <p className="text-[10px] text-gray-500 font-extrabold tracking-tight">
            Join 12,000+ citizens making Bhubaneswar better
          </p>
          
          <div className="flex justify-center -space-x-1.5 pt-1 overflow-hidden">
            {citizens.map((citizen, idx) => (
              <div 
                key={idx}
                className={`w-7 h-7 rounded-full ${citizen.color} border-2 border-white flex items-center justify-center text-[9px] font-black shadow-2xs shrink-0`}
                title={citizen.name}
              >
                {citizen.initial}
              </div>
            ))}
          </div>

          <p className="text-[9px] text-gray-400 font-semibold italic">
            Active in Saheed Nagar, Patia, Khandagiri, and across BMC wards
          </p>
        </div>
      </div>

      {/* Elegant Public Footer */}
      <footer className="bg-gray-950 text-gray-400 py-4 px-5 text-center text-[8px] font-bold tracking-widest uppercase border-t border-gray-900 shrink-0 relative z-10">
        <div>Built with Gemini AI | Google AI Studio | Made for Bhubaneswar</div>
      </footer>

    </div>
  );
}
