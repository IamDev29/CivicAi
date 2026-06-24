/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, Trophy, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GamificationStripProps {
  points: number;
  badge: string;
  rank: number;
  level: number;
  pointsToNextLevel: number;
}

export default function GamificationStrip({
  points,
  badge,
  rank,
  level,
  pointsToNextLevel
}: GamificationStripProps) {
  const levelProgress = (points % pointsToNextLevel) / pointsToNextLevel * 100;
  
  return (
    <div className="bg-[#f8f9fa] border-b border-gray-200 py-3 px-6 shadow-2xs">
      <div className="max-w-lg mx-auto flex flex-col space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
          
          {/* Level & Points Indicator */}
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full shadow-xs border border-gray-200">
            <Award className="w-4 h-4 text-[#1a73e8]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Level <span className="text-[#1a73e8] font-extrabold">{level}</span>
            </span>
            <span className="text-gray-300">|</span>
            <div className="flex items-center space-x-0.5 text-xs">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={points}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  className="text-gray-800 font-extrabold"
                >
                  {points}
                </motion.span>
              </AnimatePresence>
              <span className="text-gray-500 font-medium text-[10px] uppercase">pts</span>
            </div>
          </div>

          {/* Badge Display */}
          <div className="flex items-center space-x-1.5 bg-[#e8f0fe] text-[#1a73e8] px-3 py-1.5 rounded-full border border-blue-100">
            <span className="text-[10px] font-black uppercase tracking-wider">{badge}</span>
          </div>

          {/* Rank Display */}
          <div className="flex items-center space-x-1 bg-white px-3 py-1.5 rounded-full shadow-xs border border-gray-200">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] uppercase font-bold text-gray-600">
              Rank: <span className="text-amber-600 font-extrabold">#{rank}</span>
            </span>
          </div>

        </div>

        {/* Level Progress Bar */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden border border-gray-300/10 shadow-inner">
            <motion.div 
              className="bg-[#1a73e8] h-full rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-extrabold tracking-wider whitespace-nowrap uppercase">
            {points % pointsToNextLevel}/{pointsToNextLevel} to Lvl {level + 1}
          </span>
        </div>
      </div>
    </div>
  );
}
