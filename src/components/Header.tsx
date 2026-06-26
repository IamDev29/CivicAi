/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Flame, Bell, Sparkles } from 'lucide-react';

interface HeaderProps {
}

export default function Header({ }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center space-x-3" id="header-title">
          {/* Logo */}
          <div className="w-10 h-10 bg-[#1a73e8] rounded-lg flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-sans font-extrabold text-2xl tracking-tight text-[#1a73e8]">
                Civic<span className="text-gray-900">AI</span>
              </span>
              <span className="bg-[#e8f0fe] text-[#1a73e8] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                India
              </span>
            </div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Report. Validate. Resolve.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          {/* Quick Streak */}
          <div className="hidden sm:flex items-center space-x-1 bg-[#f1f3f4] text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-tight">4d Streak</span>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-[#1a73e8] rounded-full hover:bg-gray-100 transition relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
