/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory = 'Pothole' | 'Water Leakage' | 'Damaged Streetlight' | 'Waste Dumping' | 'Broken Footpath' | 'Flooding' | 'Other';
export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Assigned';

export interface Comment {
  id: string;
  userName: string;
  text: string;
  date: string;
}

export interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  location: string;
  gps: {
    lat: number;
    lng: number;
  } | null;
  photoUrl: string;
  upvotes: number;
  status: IssueStatus;
  date: string;
  reporterName: string;
  comments: Comment[];
  hasUpvoted?: boolean;
  isAiVerified?: boolean;
  customBadge?: string;
  aiTrustScore?: number;
  aiAnalysisFeedback?: string;
  yesVotes?: number;
  noVotes?: number;
  isAnonymous?: boolean;
  messages?: { id: string; sender: 'user' | 'officer'; text: string; date: string }[];
  userVotedYes?: boolean;
  userVotedNo?: boolean;
  resolutionPhotoUrl?: string;
  resolutionAiVerdict?: {
    isResolved: boolean;
    confidence: number;
    explanation: string;
    whatChanged: string;
    whatRemains: string;
  };
  isSpotlight?: boolean;
  isNominated?: boolean;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  badge: string;
  isCurrentUser?: boolean;
}

export interface UserStats {
  name: string;
  points: number;
  badge: string;
  rank: number;
  reportsCount: number;
  resolvedCount: number;
  level: number;
  upvotesGiven?: number;
  badges?: string[];
  
  // Daily Streak
  streakCount?: number;
  streakDays?: boolean[]; // M T W T F S S
  hasActionToday?: boolean;
  
  // Weekly Challenges completed tracking
  challengesClaimed?: string[]; // IDs of claimed challenges

  // CivicCoins Perks
  spentCoins?: number;
  customTitle?: string;
  hasVerifiedBadge?: boolean;
  hasGoldBorder?: boolean;
  accentColor?: string;

  // Civic Privileges
  isPriorityReporter?: boolean;
  hasDirectMessaging?: boolean;
  hasMonthlyDigest?: boolean;
  isAnonymousMode?: boolean;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  progress: number;
  max: number;
  claimed: boolean;
  type: 'personal' | 'collective';
}

export interface CitizenTier {
  name: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
  colorHex: string;
}

export function getTier(points: number): CitizenTier {
  if (points >= 1000) {
    return {
      name: 'City Hero',
      borderColor: 'border-amber-400 ring-4 ring-amber-400/30',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      badgeText: 'text-amber-500',
      icon: '👑',
      colorHex: '#fbbf24'
    };
  } else if (points >= 500) {
    return {
      name: 'Guardian',
      borderColor: 'border-emerald-500 ring-4 ring-emerald-500/30',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badgeText: 'text-emerald-500',
      icon: '🛡️',
      colorHex: '#10b981'
    };
  } else if (points >= 100) {
    return {
      name: 'Watchdog',
      borderColor: 'border-blue-500 ring-4 ring-blue-500/30',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
      badgeText: 'text-blue-500',
      icon: '🐕',
      colorHex: '#3b82f6'
    };
  } else {
    return {
      name: 'Newcomer',
      borderColor: 'border-gray-300 ring-4 ring-gray-300/30',
      badgeBg: 'bg-gray-100 text-gray-700 border-gray-200',
      badgeText: 'text-gray-400',
      icon: '🌱',
      colorHex: '#9ca3af'
    };
  }
}

export function getReporterTier(reporterName: string, currentUserPoints: number): CitizenTier {
  const cleanName = reporterName.replace(/\s*\(You\)\s*/g, '').replace(/\s*You\s*\(/g, '').replace(/\)/g, '').trim();
  
  if (
    cleanName.toLowerCase().includes('you') || 
    cleanName.toLowerCase().includes('ankit kumar') || 
    cleanName.toLowerCase().includes('rahul sharma')
  ) {
    return getTier(currentUserPoints);
  }

  // Look up mock users' points
  const pointsMap: { [key: string]: number } = {
    'Ananya Sharma': 1450,
    'Rajesh Hegde': 1200,
    'Amit Patil': 950,
    'Sunita Rao': 410,
    'Sandeep V': 320,
    'Priya Nair': 290,
    'Rohan Deshmukh': 240,
    'Vikram Malhotra': 180,
    'Meera Sen': 120,
    
    // Demo mode
    'Priya Patel': 892,
    'Amit Das': 287,
    'Sunita Mishra': 245,
    'Rajan Mohanty': 198,
    'Deepa Nair': 176,
    'Vikram Singh': 134,
    'Ananya Roy': 98,
    'Kiran Kumar': 67,
    'Meena Sharma': 43,
    'Siddharth Rao': 310,
  };

  const points = pointsMap[cleanName] ?? 85;
  return getTier(points);
}

