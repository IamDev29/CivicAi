/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MapPin, Award, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

interface Slide {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      title: "Smart Civic Reporting",
      subtitle: "Autonomous AI Routing",
      description: "Snap a photo of street hazards, potholes, or broken lights. Our custom Gemini AI instantly classifies, assesses severity, and directs it to the right department.",
      icon: (
        <div className="relative w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-5xl shadow-md border-4 border-blue-100">
          📸
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-500 fill-amber-400 animate-bounce" />
        </div>
      ),
      colorClass: "from-blue-500 to-indigo-600"
    },
    {
      title: "Live Hazards Map",
      subtitle: "Community Verification",
      description: "Explore reported issues on the live Bhubaneswar map. Upvote and validate reports around your locality to verify their accuracy and help coordinate city priorities.",
      icon: (
        <div className="relative w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-5xl shadow-md border-4 border-emerald-100">
          🗺️
          <MapPin className="absolute bottom-1 right-1 w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
        </div>
      ),
      colorClass: "from-emerald-500 to-teal-600"
    },
    {
      title: "Earn Municipal Badges",
      subtitle: "Get Recognized on Leaderboards",
      description: "Level up your civic volunteer rating by reporting and validating spots. Earn badges like 'Active Citizen' and watch your rank grow on the Bhubaneswar leaderboard!",
      icon: (
        <div className="relative w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-5xl shadow-md border-4 border-amber-100">
          👑
          <Award className="absolute -top-1 -right-1 w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
        </div>
      ),
      colorClass: "from-amber-500 to-orange-600"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-white rounded-3xl overflow-hidden w-full max-w-xs shadow-2xl relative flex flex-col justify-between"
        style={{ minHeight: "460px" }}
      >
        {/* Top Progress bar */}
        <div className="flex h-1.5 w-full bg-gray-100">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-full transition-all duration-300 ${
                idx <= currentSlide ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              style={{ width: `${100 / slides.length}%` }}
            ></div>
          ))}
        </div>

        {/* Carousel Content */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 flex flex-col items-center"
            >
              {/* Slide Icon */}
              <div className="mb-2">
                {slides[currentSlide].icon}
              </div>

              {/* Text Info */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest block">
                  {slides[currentSlide].subtitle}
                </span>
                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                  {slides[currentSlide].title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium pt-1 px-1">
                  {slides[currentSlide].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {/* Back button or Skip */}
          {currentSlide > 0 ? (
            <button
              onClick={handlePrev}
              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-800 font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="text-xs text-gray-400 hover:text-gray-600 font-bold transition cursor-pointer"
            >
              Skip
            </button>
          )}

          {/* Dots Indicator */}
          <div className="flex space-x-1.5">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'bg-blue-600 w-4' : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>

          {/* Next / Start Button */}
          <button
            onClick={handleNext}
            className="flex items-center space-x-1 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>{currentSlide === slides.length - 1 ? 'Start' : 'Next'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
