/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  Compass, 
  Info, 
  ThumbsUp, 
  ArrowRight,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { CivicIssue, IssueCategory, IssueStatus } from '../types';

interface InteractiveMapProps {
  issues: CivicIssue[];
  onUpvoteIssue: (id: string) => void;
  onSelectIssue: (issue: CivicIssue) => void;
}

export default function InteractiveMap({
  issues,
  onUpvoteIssue,
  onSelectIssue
}: InteractiveMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | 'All'>('All');
  const [activePinId, setActivePinId] = useState<string | null>(null);

  // Filter issues to display as pins
  const filteredIssues = issues.filter(issue => {
    const matchCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchStatus = selectedStatus === 'All' || issue.status === selectedStatus;
    return matchCategory && matchStatus;
  });

  const activeIssue = issues.find(i => i.id === activePinId);

  // SVG dimensions for the neighborhood mock map
  const mapWidth = 500;
  const mapHeight = 350;

  // Let's project real lat/lng coordinates (Bengaluru bbox) into SVG space
  // Bounds around Bengaluru central landmarks:
  // Lat: 12.9300 to 12.9900
  // Lng: 77.6000 to 77.6500
  const projectCoords = (gps: { lat: number; lng: number } | null) => {
    if (!gps) return { x: mapWidth / 2, y: mapHeight / 2 };
    const minLat = 12.9300;
    const maxLat = 12.9900;
    const minLng = 77.6000;
    const maxLng = 77.6500;

    // Standard linear projection
    const x = ((gps.lng - minLng) / (maxLng - minLng)) * mapWidth;
    // SVGs have y going downwards
    const y = mapHeight - (((gps.lat - minLat) / (maxLat - minLat)) * mapHeight);

    // Keep pins inside reasonable bounds
    return {
      x: Math.min(Math.max(x, 40), mapWidth - 40),
      y: Math.min(Math.max(y, 40), mapHeight - 40)
    };
  };

  const getPinColor = (category: IssueCategory) => {
    switch (category) {
      case 'Pothole': return '#ea4335'; // Red
      case 'Water Leak': return '#1a73e8'; // Blue
      case 'Streetlight': return '#fbbc05'; // Yellow/Orange
      case 'Waste': return '#34a853'; // Green
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden max-w-lg mx-auto flex flex-col h-[580px]">
      
      {/* 1. Map Header & Toggles */}
      <div className="bg-gray-50 border-b border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
            <Compass className="w-4 h-4 text-[#1a73e8] animate-spin" style={{ animationDuration: '6s' }} />
            <span>Interactive Ward Map</span>
          </h3>
          <span className="text-[10px] bg-green-50 border border-green-100 text-green-700 font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
            <span>Live Ward 80</span>
          </span>
        </div>

        {/* Filter Badges */}
        <div className="space-y-2">
          {/* Category Filter */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-1" />
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition ${
                selectedCategory === 'All' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Types
            </button>
            {(['Pothole', 'Water Leak', 'Streetlight', 'Waste'] as IssueCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition flex items-center space-x-1 ${
                  selectedCategory === cat
                    ? 'bg-[#1a73e8] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{cat === 'Pothole' ? '🕳️' : cat === 'Water Leak' ? '💧' : cat === 'Streetlight' ? '💡' : '🗑️'}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider shrink-0">Status:</span>
            {(['All', 'Open', 'In Progress', 'Resolved'] as (IssueStatus | 'All')[]).map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  selectedStatus === st
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Custom SVG Styled Map Grid */}
      <div className="flex-1 bg-sky-50/30 relative overflow-hidden border-b border-gray-100 min-h-[300px]">
        
        {/* Map Elements Background SVG */}
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${mapWidth} ${mapHeight}`} 
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 select-none"
        >
          {/* Grid lines (blueprint grid) */}
          <defs>
            <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Landscaped Areas: Parks */}
          <rect x="40" y="50" width="120" height="90" rx="10" fill="#e8f5e9" stroke="#c8e6c9" strokeWidth="1" />
          <text x="50" y="70" fill="#2e7d32" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Indiranagar Park 🌳</text>
          
          <rect x="340" y="230" width="120" height="80" rx="10" fill="#e8f5e9" stroke="#c8e6c9" strokeWidth="1" />
          <text x="350" y="250" fill="#2e7d32" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Defence Colony Playground</text>

          {/* Blue Metro Rail Route */}
          <path d="M -10,180 L 120,180 L 260,180 L 510,180" fill="none" stroke="#e8f0fe" strokeWidth="14" strokeLinecap="round" />
          <path d="M -10,180 L 120,180 L 260,180 L 510,180" fill="none" stroke="#1a73e8" strokeWidth="3" strokeDasharray="6,4" strokeLinecap="round" />
          <text x="10" y="172" fill="#1557b0" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Namma Metro Purple Line 🚇</text>

          {/* Metro Station Spot */}
          <circle cx="260" cy="180" r="7" fill="white" stroke="#1a73e8" strokeWidth="3" />
          <circle cx="260" cy="180" r="3" fill="#1a73e8" />
          <text x="272" y="184" fill="#1a73e8" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Metro Station Exit</text>

          {/* Major Roads (Gray paths) */}
          {/* 100 Feet Road */}
          <path d="M 180,-10 L 180,360" fill="none" stroke="#e5e7eb" strokeWidth="18" />
          <path d="M 180,-10 L 180,360" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
          
          {/* 12th Main Road */}
          <path d="M 300,-10 L 300,360" fill="none" stroke="#e5e7eb" strokeWidth="14" />
          
          {/* 80 Feet Road Crossing */}
          <path d="M -10,80 L 510,80" fill="none" stroke="#e5e7eb" strokeWidth="14" />
          
          {/* Minor Road */}
          <path d="M -10,280 L 510,280" fill="none" stroke="#e5e7eb" strokeWidth="10" />

          {/* Road Name Labels */}
          <text x="186" y="30" fill="#9ca3af" fontSize="8" fontWeight="bold" transform="rotate(90, 186, 30)" fontFamily="sans-serif">100 FEET ROAD</text>
          <text x="306" y="120" fill="#9ca3af" fontSize="8" fontWeight="bold" transform="rotate(90, 306, 120)" fontFamily="sans-serif">12TH MAIN ROAD</text>
          <text x="20" y="93" fill="#9ca3af" fontSize="8" fontWeight="bold" fontFamily="sans-serif">80 FEET ROAD, KORAMANGALA</text>
        </svg>

        {/* Live Clickable Issue Pins */}
        {filteredIssues.map((issue) => {
          const { x, y } = projectCoords(issue.gps);
          const color = getPinColor(issue.category);
          const isActive = activePinId === issue.id;

          return (
            <button
              key={issue.id}
              onClick={() => setActivePinId(issue.id)}
              className="absolute focus:outline-none transition-transform hover:scale-125 z-10"
              style={{ 
                left: `${(x / mapWidth) * 100}%`, 
                top: `${(y / mapHeight) * 100}%`,
                transform: 'translate(-50%, -100%)' 
              }}
            >
              <div className="relative flex flex-col items-center">
                {/* Visual Pin Aura */}
                {isActive && (
                  <span className="absolute -inset-2.5 bg-gray-900/10 rounded-full animate-ping"></span>
                )}
                
                {/* Pin Bubble */}
                <div 
                  className={`px-2 py-1 rounded-full text-[11px] font-extrabold text-white flex items-center space-x-1 shadow-md transition-all border-2 ${
                    isActive ? 'border-gray-900 scale-110 z-20 shadow-lg' : 'border-white hover:border-[#1a73e8]'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  <span>{issue.category === 'Pothole' ? '🕳️' : issue.category === 'Water Leak' ? '💧' : issue.category === 'Streetlight' ? '💡' : '🗑️'}</span>
                  <span className="max-w-[45px] truncate text-[8px] font-bold uppercase">{issue.category}</span>
                </div>
                
                {/* Pin Point Needle */}
                <div 
                  className="w-1.5 h-1.5 -mt-0.5 shadow-xs rotate-45"
                  style={{ backgroundColor: color }}
                ></div>
              </div>
            </button>
          );
        })}

        {/* Mini Compass Icon */}
        <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-xs p-1.5 rounded-full shadow-xs text-gray-500 flex items-center justify-center">
          <Compass className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Floating Overlay Card for selected Pin */}
      <div className="bg-gray-50 border-t border-gray-100 p-4 h-[160px] flex items-center justify-center">
        {activeIssue ? (
          <div className="bg-white rounded-xl p-3 shadow-xs border border-gray-100 flex space-x-3 w-full transition-all">
            {/* Issue Image */}
            <img 
              src={activeIssue.photoUrl} 
              alt={activeIssue.title} 
              className="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
              referrerPolicy="no-referrer"
            />

            {/* Issue Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  {/* Category and Severity */}
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white`}
                    style={{ backgroundColor: getPinColor(activeIssue.category) }}
                  >
                    {activeIssue.category}
                  </span>

                  {/* Status Indicator */}
                  <span className={`text-[9px] font-extrabold flex items-center space-x-1 ${
                    activeIssue.status === 'Resolved' ? 'text-green-600' : activeIssue.status === 'In Progress' ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {activeIssue.status === 'Resolved' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    <span>{activeIssue.status}</span>
                  </span>
                </div>

                <h4 className="text-xs font-bold text-gray-900 mt-1.5 truncate">
                  {activeIssue.title}
                </h4>
                <p className="text-[10px] text-gray-500 truncate">
                  📍 {activeIssue.location}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50">
                {/* Upvote Button */}
                <button
                  onClick={() => onUpvoteIssue(activeIssue.id)}
                  className={`flex items-center space-x-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                    activeIssue.hasUpvoted 
                      ? 'bg-blue-100 text-[#1a73e8]' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <ThumbsUp className={`w-3 h-3 ${activeIssue.hasUpvoted ? 'fill-blue-500' : ''}`} />
                  <span>{activeIssue.upvotes} {activeIssue.hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
                </button>

                {/* Inspect Details */}
                <button
                  onClick={() => onSelectIssue(activeIssue)}
                  className="text-[10px] text-[#1a73e8] font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                >
                  <span>Verify Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 space-y-1 py-4">
            <MapPin className="w-6 h-6 text-gray-300 mx-auto animate-bounce" />
            <p className="text-xs font-semibold">Tap a color-coded pin on the map</p>
            <p className="text-[10px]">Select a community issue to inspect status and validate</p>
          </div>
        )}
      </div>

    </div>
  );
}
