import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, PlayCircle, SkipForward, Landmark, UserCheck, ShieldCheck, X } from 'lucide-react';

interface AutoDemoWalkthroughProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTakeControl: () => void;
  onSeeAuthorityPortal: () => void;
}

interface Step {
  step: number;
  title: string;
  text: string;
  targetId: string;
  tab: string;
}

const STEPS: Step[] = [
  {
    step: 1,
    title: "Meet CivicAI",
    text: "The AI platform turning citizen complaints into resolved civic issues. Watch how it works.",
    targetId: "",
    tab: "Dashboard"
  },
  {
    step: 2,
    title: "Your Ward's Issues",
    text: "All civic problems in Ward 12, Saheed Nagar — sorted by priority and severity automatically.",
    targetId: "issues-feed-container",
    tab: "Dashboard"
  },
  {
    step: 3,
    title: "AI Categorized This",
    text: "Gemini Vision analyzed the photo and flagged this as Critical — automatically routed to PWD department.",
    targetId: "issue-card-demo-issue-1",
    tab: "Dashboard"
  },
  {
    step: 4,
    title: "Live Issue Map",
    text: "Every reported issue plotted on Google Maps with a heatmap showing problem hotspots.",
    targetId: "tab-button-map",
    tab: "Map"
  },
  {
    step: 5,
    title: "Report in 10 Seconds",
    text: "Take a photo, speak in Hindi or English — Gemini fills the entire form automatically.",
    targetId: "tab-button-report",
    tab: "Dashboard"
  },
  {
    step: 6,
    title: "Earn Points & Badges",
    text: "Rahul is ranked #2 in the ward with 340 points and the Watchdog badge for 10+ reports.",
    targetId: "profile-leaderboard-section",
    tab: "Profile"
  },
  {
    step: 7,
    title: "Ask CivicBot Anything",
    text: "An AI assistant that knows every issue in the city. Ask it: What's the worst area in Ward 12?",
    targetId: "civicbot-chat-panel",
    tab: "Dashboard"
  },
  {
    step: 8,
    title: "Built for Government Too",
    text: "Officials get a separate portal — department-filtered queues, AI work orders, and performance analytics.",
    targetId: "btn-logout",
    tab: "Profile"
  }
];

export default function AutoDemoWalkthrough({
  activeTab,
  setActiveTab,
  onTakeControl,
  onSeeAuthorityPortal
}: AutoDemoWalkthroughProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3000); // 3000ms per step
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number; opacity: number } | null>(null);
  
  const stepTimerRef = useRef<any>(null);
  const coordPollIntervalRef = useRef<any>(null);

  const currentStep = STEPS[currentStepIndex];
  const isFinalScreen = currentStepIndex >= STEPS.length;

  // Sync tab with step
  useEffect(() => {
    if (!isFinalScreen && currentStep) {
      if (activeTab !== currentStep.tab) {
        setActiveTab(currentStep.tab);
      }
    }
  }, [currentStepIndex, isFinalScreen]);

  // Special events trigger on steps
  useEffect(() => {
    if (!isFinalScreen && currentStep) {
      if (currentStep.step === 7) {
        // Trigger simulated typing in CivicBot
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('civicbot-demo-type'));
        }, 100);
      }
    }
  }, [currentStepIndex, isFinalScreen]);

  // 3-second Auto Advance Countdown Loop
  useEffect(() => {
    if (isFinalScreen) {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      return;
    }

    setTimeLeft(3000);

    const intervalMs = 50;
    stepTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= intervalMs) {
          // Advance to next step
          setCurrentStepIndex((curr) => curr + 1);
          return 3000;
        }
        return prev - intervalMs;
      });
    }, intervalMs);

    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [currentStepIndex, isFinalScreen]);

  // Update Highlight Bounding Box Coordinates (with adaptive polling)
  useEffect(() => {
    const updateCoordinates = () => {
      if (isFinalScreen || !currentStep || !currentStep.targetId) {
        setCoords(null);
        return;
      }

      const container = document.querySelector('.max-w-md'); // phone mockup container
      const element = document.getElementById(currentStep.targetId);

      if (container && element) {
        // Scroll the element into view cleanly to prevent cutouts pointing offscreen
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        setCoords({
          top: elementRect.top - containerRect.top - 4,
          left: elementRect.left - containerRect.left - 4,
          width: elementRect.width + 8,
          height: elementRect.height + 8,
          opacity: 1
        });
      } else {
        setCoords(null);
      }
    };

    // Run immediately
    updateCoordinates();

    // Poll coordinates to sync during layout changes or scroll animations
    coordPollIntervalRef.current = setInterval(updateCoordinates, 250);

    return () => {
      if (coordPollIntervalRef.current) clearInterval(coordPollIntervalRef.current);
    };
  }, [currentStepIndex, isFinalScreen, activeTab]);

  const progressPercentage = ((currentStepIndex + 1) / STEPS.length) * 100;
  const currentStepProgress = (timeLeft / 3000) * 100;

  return (
    <div className="absolute inset-0 z-[70] pointer-events-none select-none overflow-hidden">
      {/* Top Slim Overall Progress Bar */}
      {!isFinalScreen && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gray-900/30 z-[90] pointer-events-auto">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Spotlight/Cutout Backdrop Overlay */}
      <AnimatePresence>
        {!isFinalScreen && (
          <>
            {coords ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute border border-blue-500/50 rounded-2xl transition-all duration-300 ease-out pointer-events-none z-[80]"
                style={{
                  top: coords.top,
                  left: coords.left,
                  width: coords.width,
                  height: coords.height,
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.72)',
                }}
              />
            ) : (
              // Full Screen Overlay when no specific cutout is active
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/72 z-[80] pointer-events-none transition-all"
              />
            )}
          </>
        )}
      </AnimatePresence>

      {/* Walkthrough floating cards */}
      <div className="absolute inset-x-4 top-24 z-[85] flex flex-col items-center pointer-events-auto">
        <AnimatePresence mode="wait">
          {!isFinalScreen ? (
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-2xl p-5 space-y-4"
            >
              {/* Header with Step Indicator & Inline Slide countdown */}
              <div className="flex items-center justify-between">
                <span className="bg-blue-50 text-[#1a73e8] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Step {currentStep.step} of 8 — Product Demo
                </span>
                
                {/* Visual visual timer countdown block */}
                <div className="w-12 bg-gray-100 h-1.5 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-50"
                    style={{ width: `${currentStepProgress}%` }}
                  />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-gray-900 tracking-tight leading-snug">
                  {currentStep.title}
                </h4>
                <p className="text-[11.5px] font-medium text-gray-500 leading-relaxed">
                  {currentStep.text}
                </p>
              </div>
            </motion.div>
          ) : (
            /* FINAL CHOICES SCREEN */
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute inset-x-0 top-16 mx-auto w-11/12 max-w-xs bg-slate-900 border border-slate-800 text-white rounded-[32px] p-6 shadow-2xl space-y-6 text-center select-none z-[100] pointer-events-auto"
            >
              <div className="w-16 h-16 bg-[#1a73e8] text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 text-2xl font-bold animate-bounce">
                🎉
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                  You've seen CivicAI in action.
                </h3>
                <p className="text-[11px] font-medium text-gray-400 leading-normal">
                  Experience the complete loop of citizen reporting, community verification, and government resolution.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={onTakeControl}
                  className="w-full bg-[#1a73e8] hover:bg-blue-600 text-white py-3 rounded-xl text-xs font-bold transition shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Explore Freely →</span>
                </button>
                
                <button
                  onClick={onSeeAuthorityPortal}
                  className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 py-3 rounded-xl text-xs font-bold transition active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>See Authority Portal →</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Always Visible Bottom-Right Take Control Button */}
      {!isFinalScreen && (
        <div className="absolute bottom-20 right-4 z-[90] pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTakeControl}
            className="bg-[#1a73e8] hover:bg-blue-600 text-white font-extrabold text-[10px] px-3.5 py-2.5 rounded-xl shadow-xl flex items-center space-x-1.5 uppercase tracking-wider transition cursor-pointer border border-blue-400/20"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Take Control</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
