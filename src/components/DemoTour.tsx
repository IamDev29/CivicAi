import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Volume2, 
  MapPin, 
  Bot, 
  Check, 
  HelpCircle,
  Eye
} from 'lucide-react';

interface DemoTourProps {
  demoMode: boolean;
  setDemoMode: (active: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface TourStep {
  title: string;
  description: string;
  targetId: string;
  placement: 'top' | 'bottom' | 'center' | 'left' | 'right';
  action?: () => void;
}

export default function DemoTour({ demoMode, setDemoMode, activeTab, setActiveTab }: DemoTourProps) {
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 is the initial key features overlay
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const timerRef = useRef<any>(null);
  const progressRef = useRef<any>(null);

  // Define the 5 key differentiators
  const differentiators = [
    { id: 1, title: 'AI Autonomous Inspector', desc: 'Auto-detects photo category, severity & optimal routing with 96% confidence.' },
    { id: 2, title: 'Bilingual Voice Reporter', desc: 'Supports unstructured English & Hindi speech with instant AI schema mapping.' },
    { id: 3, title: 'CivicBot AI Companion', desc: 'WhatsApp-style virtual assistant with Gemini function calling & real-time database access.' },
    { id: 4, title: 'Bhubaneswar Ward Scorecard', desc: 'Live BMC corporator grades ranking resolution speeds, SLA% & citizen ratings.' },
    { id: 5, title: 'Duplicate Report Prevention', desc: 'Smart 200-meter spatial verification prevents duplicate municipal claims.' }
  ];

  const steps: TourStep[] = [
    {
      title: "Welcome to CivicAI Tour",
      description: "Let's explore the future of citizen-led governance in Bhubaneswar! This guided tour will show you the exact AI-powered systems keeping Bhubaneswar clean and safe.",
      targetId: "header-title",
      placement: "bottom"
    },
    {
      title: "Bhubaneswar Ward Scorecard",
      description: "We are starting in the Live Scorecard tab. Here, all 10 wards are graded based on on-time SLA fixes, resolution speed, and public satisfaction. Tap columns to sort them!",
      targetId: "subtab-scorecard",
      placement: "bottom",
      action: () => {
        setActiveTab('Dashboard');
        // Let's click the Scorecard tab inside IssuesFeed
        setTimeout(() => {
          const btn = document.querySelector('button[onClick*="Scorecard"]') as HTMLElement || document.getElementById('subtab-scorecard');
          if (btn) btn.click();
          // Also simulate click on the last subtab if selector exists
          const subtabs = document.querySelectorAll('button');
          subtabs.forEach(b => {
            if (b.textContent?.includes('Scorecard')) {
              b.click();
            }
          });
        }, 150);
      }
    },
    {
      title: "AI Accountability Audit",
      description: "We've triggered Gemini on Ward 15 (Saheed Nagar). It analyzed raw scorecard numbers and generated a hard-hitting accountability audit calling out responsible departments (PWD/WATCO).",
      targetId: "ward-scorecard-section",
      placement: "top",
      action: () => {
        setActiveTab('Dashboard');
        setTimeout(() => {
          // Trigger the analysis on the poorest performing ward (Ward 15)
          const aiBtn = document.querySelector('.bg-purple-50') as HTMLElement;
          if (aiBtn) aiBtn.click();
        }, 400);
      }
    },
    {
      title: "AI Autonomous Inspector",
      description: "We have pre-filled a realistic pothole on MG Road. Notice how the AI Inspector automatically extracted category, High severity, and the Public Works Department (PWD) routing with 96% confidence!",
      targetId: "report-form-container",
      placement: "top",
      action: () => {
        // Close previous modal if open
        const closeBtn = document.querySelector('.text-white\\/80') as HTMLElement;
        if (closeBtn) closeBtn.click();
        
        setActiveTab('Report');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('reportform-prefill'));
        }, 150);
      }
    },
    {
      title: "Bilingual Voice Reporter",
      description: "Citizens can report verbal details in English or Hindi. CivicAI uses Web Speech API + Gemini processing to structure unstructured speech into actionable coordinates.",
      targetId: "voice-assistant-card",
      placement: "bottom",
      action: () => {
        setActiveTab('Report');
      }
    },
    {
      title: "CivicBot Virtual Assistant",
      description: "We've opened CivicBot, our WhatsApp-style floating helper. It automatically ran a dynamic location query on the live Bhubaneswar database to find problem hotspots.",
      targetId: "civicbot-bubble-toggle",
      placement: "top",
      action: () => {
        window.dispatchEvent(new CustomEvent('civicbot-toggle', { detail: true }));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('civicbot-send-message', { detail: "What are the biggest problems near Patia?" }));
        }, 500);
      }
    },
    {
      title: "Spatial Verification Maps",
      description: "CivicAI maps reports with pinpoint accuracy. Before submission, our AI routes issues and checks a 200m radius to auto-merge duplicates, avoiding wasted municipal funds.",
      targetId: "tab-button-map",
      placement: "top",
      action: () => {
        // Close CivicBot
        window.dispatchEvent(new CustomEvent('civicbot-toggle', { detail: false }));
        setActiveTab('Map');
      }
    }
  ];

  // Handle tour progress and auto-play
  useEffect(() => {
    if (!demoMode) {
      setCurrentStep(-1);
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    if (currentStep === -1) {
      setIsPlaying(false);
      return;
    }

    // Trigger action associated with the current step
    const step = steps[currentStep];
    if (step && step.action) {
      step.action();
    }

    if (isPlaying) {
      setProgress(0);
      const stepDuration = 7000; // 7 seconds per step
      const updateInterval = 100;
      let elapsed = 0;

      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);

      progressRef.current = setInterval(() => {
        elapsed += updateInterval;
        setProgress(Math.min((elapsed / stepDuration) * 100, 100));
      }, updateInterval);

      timerRef.current = setTimeout(() => {
        handleNext();
      }, stepDuration);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentStep, isPlaying, demoMode]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finished Tour, close chatbot and reset
      window.dispatchEvent(new CustomEvent('civicbot-toggle', { detail: false }));
      setDemoMode(false);
      setCurrentStep(-1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const startTour = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  if (!demoMode) return null;

  // Render Key Features Overlay
  if (currentStep === -1) {
    return (
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-gray-150 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 space-y-1 relative">
            <button 
              onClick={() => setDemoMode(false)}
              className="absolute right-4 top-4 text-white/80 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1.5 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300/20" />
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-200">Interactive Demo Mode</span>
            </div>
            <h3 className="text-lg font-black tracking-tight pt-1">5 Key Differentiators</h3>
            <p className="text-[10px] text-blue-100 font-medium uppercase tracking-wider">How CivicAI stands out to judges</p>
          </div>

          {/* Differentiators Checklist */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {differentiators.map((diff) => (
              <div key={diff.id} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-2xl border border-gray-150/80">
                <div className="bg-emerald-100 text-emerald-800 p-1 rounded-lg shrink-0 mt-0.5 border border-emerald-200 shadow-3xs">
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-gray-950">{diff.title}</h4>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">{diff.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Action */}
          <div className="p-5 border-t border-gray-100 space-y-2 shrink-0 bg-gray-50/50">
            <button
              onClick={startTour}
              className="w-full bg-[#1a73e8] hover:bg-blue-700 text-white py-3.5 rounded-2xl text-xs font-black tracking-wider uppercase transition cursor-pointer flex items-center justify-center space-x-2 shadow-md active:scale-98"
            >
              <Eye className="w-4.5 h-4.5" />
              <span>Auto-Play Guided Tour</span>
            </button>
            <button
              onClick={() => setDemoMode(false)}
              className="w-full text-center text-xs font-bold text-gray-500 hover:text-gray-700 py-1 cursor-pointer"
            >
              Explore Manually
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentTourStep = steps[currentStep];

  return (
    <>
      {/* Target Pulsing Highlight Overlay */}
      {currentTourStep.targetId && (
        <HighlightRing targetId={currentTourStep.targetId} />
      )}

      {/* Persistent Tiny Checklist Indicator on Screen Side */}
      <div className="fixed top-1/4 left-4 z-40 hidden xl:flex flex-col space-y-2 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-gray-200 shadow-xl max-w-[200px] select-none pointer-events-auto">
        <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-2">
          <Sparkles className="w-4 h-4 text-[#1a73e8] fill-blue-500/10" />
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-900">Key Pillars</span>
        </div>
        <ul className="space-y-2.5 pt-1">
          {differentiators.map((d, i) => {
            const isCompleted = currentStep >= i + 1;
            return (
              <li key={d.id} className="flex items-start space-x-1.5">
                <span className={`p-0.5 rounded-md mt-0.5 shrink-0 ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'}`}>
                  <Check className="w-2.5 h-2.5 stroke-[3px]" />
                </span>
                <span className={`text-[9px] font-black leading-tight ${isCompleted ? 'text-gray-800 font-extrabold line-through' : 'text-gray-400 font-bold'}`}>
                  {d.title}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Floating Guided Tour Tooltip Box */}
      <div className="fixed inset-x-4 bottom-20 z-50 flex justify-center pointer-events-none">
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          className="bg-gray-950/95 text-white p-4.5 rounded-[24px] shadow-2xl border border-gray-800 w-full max-w-sm pointer-events-auto flex flex-col space-y-3.5"
        >
          {/* Header & Steps Counter */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-2 shrink-0">
            <div className="flex items-center space-x-1.5">
              <span className="bg-[#1a73e8] text-white p-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 fill-blue-500/20" />
              </span>
              <h4 className="text-xs font-black tracking-tight">{currentTourStep.title}</h4>
            </div>
            <div className="text-[9px] font-mono font-bold text-gray-400 uppercase bg-gray-900 border border-gray-800 px-2 py-0.5 rounded-full shrink-0">
              Step {currentStep + 1} / {steps.length}
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] font-semibold text-gray-300 leading-relaxed">
            {currentTourStep.description}
          </p>

          {/* Progress Bar */}
          {isPlaying && (
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden shrink-0">
              <div 
                className="h-full bg-blue-500 transition-all duration-100 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-1 shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-gray-400 hover:text-white transition p-1.5 rounded-full hover:bg-gray-900 border border-gray-800 cursor-pointer active:scale-90"
              title={isPlaying ? 'Pause auto-play' : 'Resume auto-play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-gray-400 stroke-none" /> : <Play className="w-3.5 h-3.5 fill-gray-400 stroke-none" />}
            </button>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition px-2.5 py-1.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-xl text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>
              <button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white transition px-3.5 py-1.5 rounded-xl text-[10px] font-black flex items-center space-x-1 cursor-pointer active:scale-95 shadow-md shadow-blue-500/10"
              >
                <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// Inline component to compute highlight coordinates dynamically
function HighlightRing({ targetId }: { targetId: string }) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const updateCoordinates = () => {
      const el = document.getElementById(targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateCoordinates();
    
    // Polling is robust for reactive SPA layouts
    const interval = setInterval(updateCoordinates, 300);
    window.addEventListener('resize', updateCoordinates);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateCoordinates);
    };
  }, [targetId]);

  if (!coords) return null;

  return (
    <div 
      className="absolute pointer-events-none z-50 transition-all duration-300"
      style={{
        top: `${coords.top - 4}px`,
        left: `${coords.left - 4}px`,
        width: `${coords.width + 8}px`,
        height: `${coords.height + 8}px`
      }}
    >
      {/* Outer pulsing shadow ring */}
      <span className="absolute inset-0 rounded-xl border-4 border-[#1a73e8] animate-ping opacity-65"></span>
      {/* Solid high-precision border */}
      <span className="absolute inset-0 rounded-xl border-2 border-amber-400 shadow-md"></span>
    </div>
  );
}
