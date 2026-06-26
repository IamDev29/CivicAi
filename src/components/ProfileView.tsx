/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Award, 
  Trophy, 
  User, 
  Sparkles, 
  Heart, 
  MapPin, 
  FileText,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';
import { UserStats, LeaderboardUser, CivicIssue } from '../types';

interface ProfileViewProps {
  userStats: UserStats;
  leaderboard: LeaderboardUser[];
  userIssues: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
  onSwitchTab: (tab: string) => void;
  onLogout?: () => void;
}

export default function ProfileView({
  userStats,
  leaderboard,
  userIssues,
  onSelectIssue,
  onSwitchTab,
  onLogout
}: ProfileViewProps) {
  
  const reportsCount = userStats.reportsCount;
  const resolvedCount = userStats.resolvedCount;
  const upvotesGiven = userStats.upvotesGiven || 0;

  const BADGES_LIST = [
    {
      id: 'badge-first-reporter',
      title: 'First Reporter',
      description: 'First issue reported in an area.',
      unlocked: reportsCount >= 1,
      metric: `${Math.min(reportsCount, 1)}/1 report`,
      percent: Math.min((reportsCount / 1) * 100, 100),
      icon: '🥇',
      color: 'from-amber-400 to-yellow-600'
    },
    {
      id: 'badge-watchdog',
      title: 'Watchdog',
      description: 'Logged 10+ reports across Bhubaneswar.',
      unlocked: reportsCount >= 10,
      metric: `${reportsCount}/10 reports`,
      percent: Math.min((reportsCount / 10) * 100, 100),
      icon: '🐕',
      color: 'from-blue-400 to-indigo-600'
    },
    {
      id: 'badge-hero',
      title: 'Hero',
      description: 'Granted to citizens with resolved reports.',
      unlocked: resolvedCount >= 1,
      metric: `${resolvedCount}/1 resolved`,
      percent: Math.min((resolvedCount / 1) * 100, 100),
      icon: '🦸‍♂️',
      color: 'from-emerald-400 to-teal-600'
    },
    {
      id: 'badge-validator',
      title: 'Validator',
      description: 'Voted on 50+ community street spots.',
      unlocked: upvotesGiven >= 50,
      metric: `${upvotesGiven}/50 upvotes`,
      percent: Math.min((upvotesGiven / 50) * 100, 100),
      icon: '⚡',
      color: 'from-purple-400 to-fuchsia-600'
    }
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-10">
      
      {/* 1. User Badge Card */}
      <div className="bg-linear-to-br from-[#1a73e8] to-[#1557b0] text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
        
        {/* Abstract background graphics */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute right-4 top-4 bg-white/10 p-2 rounded-xl">
          <Sparkles className="w-6 h-6 text-amber-300 fill-amber-300" />
        </div>

        <div className="flex items-center space-x-4">
          {/* User Avatar */}
          <div className="w-16 h-16 bg-white/20 border-2 border-white/40 rounded-full flex items-center justify-center text-2xl font-black">
            AK
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-black">{userStats.name}</h3>
              <span className="bg-amber-400 text-gray-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Level {userStats.level}
              </span>
            </div>
            <p className="text-xs text-white/85 font-semibold mt-0.5">
              👑 Current Rank: <span className="text-amber-300">#{userStats.rank} in Bhubaneswar Central</span>
            </p>
            <p className="text-[10px] text-white/70 mt-1">
              Bhubaneswar Ward 42 • Citizen Validator since May 2026
            </p>
          </div>
        </div>

        {/* Level bar metrics */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl p-2">
            <p className="text-[9px] text-white/60 font-bold uppercase">BMC Points</p>
            <p className="text-lg font-black text-amber-300">{userStats.points}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2">
            <p className="text-[9px] text-white/60 font-bold uppercase">Reports Filed</p>
            <p className="text-lg font-black text-white">{userStats.reportsCount}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2">
            <p className="text-[9px] text-white/60 font-bold uppercase">Resolved</p>
            <p className="text-lg font-black text-green-300">{userStats.resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* 2. Leaderboard list (Indian civic focus) */}
      <div id="profile-leaderboard-section" className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-50 pb-2">
          <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Ward Leaderboard (Bhubaneswar Central)</span>
          </h4>
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">BMC Ward 42</span>
        </div>

        <div className="space-y-2">
          {leaderboard.map((user) => (
            <div 
              key={user.rank}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                user.isCurrentUser 
                  ? 'bg-blue-50/55 border-blue-200 ring-1 ring-blue-100' 
                  : 'bg-white border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                {/* Rank number or crown */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  user.rank === 1 
                    ? 'bg-amber-100 text-amber-800' 
                    : user.rank === 2 
                    ? 'bg-slate-100 text-slate-800' 
                    : user.rank === 3 
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.rank}
                </div>

                <div className="min-w-0">
                  <p className={`text-xs truncate ${user.isCurrentUser ? 'font-black text-gray-950' : 'font-bold text-gray-900'}`}>
                    {user.name}
                  </p>
                  <p className="text-[9px] text-gray-400 font-semibold">{user.badge}</p>
                </div>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-gray-900">{user.points}</span>
                <span className="text-[9px] text-gray-500 font-medium ml-0.5">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Achievements Strip */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5 border-b border-gray-50 pb-2">
          <Award className="w-4 h-4 text-[#1a73e8]" />
          <span>My Civic Achievements & Badges</span>
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {BADGES_LIST.map((ach) => (
            <div 
              key={ach.id}
              className={`p-3 rounded-xl border flex flex-col justify-between h-36 relative overflow-hidden transition-all ${
                ach.unlocked 
                  ? 'bg-emerald-50/25 border-emerald-200 shadow-2xs' 
                  : 'bg-gray-50/50 border-gray-100 opacity-65'
              }`}
            >
              {/* Overlay Checkmark */}
              {ach.unlocked ? (
                <div className="absolute right-2.5 top-2.5 text-emerald-600 bg-emerald-100 p-0.5 rounded-full shadow-3xs">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              ) : (
                <div className="absolute right-2.5 top-2.5 text-gray-400 bg-gray-200/60 p-0.5 rounded-full">
                  <Target className="w-3 h-3" />
                </div>
              )}

              <div>
                <span className="text-xl mb-1.5 block">{ach.icon}</span>
                <h5 className="text-[11px] font-extrabold text-gray-900 truncate">{ach.title}</h5>
                <p className="text-[9px] text-gray-500 leading-normal mt-0.5 line-clamp-2">{ach.description}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[8px] font-bold text-gray-400">
                  <span>Progress</span>
                  <span className={ach.unlocked ? 'text-emerald-600 font-extrabold' : 'text-gray-500'}>{ach.metric}</span>
                </div>
                <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 bg-linear-to-r ${ach.unlocked ? ach.color : 'from-gray-400 to-gray-500'}`}
                    style={{ width: `${ach.percent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. My Reported Issues Feed */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5 border-b border-gray-50 pb-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span>My Reported Issues ({userIssues.length})</span>
        </h4>

        {userIssues.length > 0 ? (
          <div className="space-y-2">
            {userIssues.map((issue) => (
              <div 
                key={issue.id}
                onClick={() => {
                  onSelectIssue(issue);
                  onSwitchTab('Dashboard');
                }}
                className="flex items-center space-x-3 p-2 bg-gray-50 hover:bg-gray-100/70 border border-gray-100 rounded-xl cursor-pointer transition"
              >
                <img 
                  src={issue.photoUrl} 
                  alt={issue.title} 
                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] bg-blue-100 text-blue-700 font-extrabold uppercase px-1.5 py-0.2 rounded-full shrink-0">
                      {issue.category}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium">{issue.date}</span>
                  </div>
                  <h5 className="text-[11px] font-bold text-gray-900 truncate mt-0.5">
                    {issue.title}
                  </h5>
                  <p className="text-[9px] text-gray-400 truncate">
                    📍 {issue.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">You haven't reported any issues yet.</p>
            <button 
              onClick={() => onSwitchTab('Report')}
              className="text-xs text-[#1a73e8] font-bold mt-2 underline cursor-pointer"
            >
              Report Your First Issue
            </button>
          </div>
        )}
      </div>

      {/* 5. Log Out Action */}
      {onLogout && (
        <button
          onClick={onLogout}
          id="btn-logout"
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center space-x-1.5 cursor-pointer mt-6 shadow-3xs hover:shadow-2xs"
        >
          <span>Log Out of Session</span>
        </button>
      )}

    </div>
  );
}
