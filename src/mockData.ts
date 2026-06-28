/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CivicIssue, LeaderboardUser, UserStats } from './types';

export const INITIAL_ISSUES: CivicIssue[] = [
  {
    id: 'issue-1',
    title: 'Huge pothole dangerous for two-wheelers',
    description: 'This deep pothole has been active for 3 weeks on the Sahid Nagar crossing junction. During rain, it fills up with water and is completely invisible. Several motorists have slipped here already.',
    category: 'Pothole',
    severity: 'High',
    location: 'Sahid Nagar, Bhubaneswar, Odisha',
    gps: { lat: 20.2970, lng: 85.8260 },
    photoUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
    upvotes: 42,
    status: 'In Progress',
    date: '2026-06-21',
    reporterName: 'Anand Kumar',
    comments: [
      {
        id: 'c-1',
        userName: 'Priya Sharma',
        text: 'I almost fell here yesterday. Thanks for reporting, upvoted!',
        date: '2026-06-21'
      },
      {
        id: 'c-2',
        userName: 'BMC Ward Inspector (System)',
        text: 'Issue assigned to the road maintenance engineer for Ward 80.',
        date: '2026-06-22'
      }
    ]
  },
  {
    id: 'issue-2',
    title: 'Drinking water pipeline leak wasting liters',
    description: 'Fresh clean drinking water is gushing out from a ruptured underground pipe near the park gate. It has flooded the walking path and is attracting mosquitoes.',
    category: 'Water Leakage',
    severity: 'Medium',
    location: 'Acharya Vihar, Bhubaneswar, Odisha',
    gps: { lat: 20.2940, lng: 85.8220 },
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600',
    upvotes: 28,
    status: 'Open',
    date: '2026-06-23',
    reporterName: 'Meera Hegde',
    comments: [
      {
        id: 'c-3',
        userName: 'Rohan Deshmukh',
        text: 'Such a tragedy to see drinking water being wasted. WATCO needs to look into this immediately.',
        date: '2026-06-23'
      }
    ]
  },
  {
    id: 'issue-3',
    title: 'Streetlights dark since 5 days',
    description: 'An entire stretch of 5 streetlights is completely dead. The lane is pitch black after 7 PM, making it extremely unsafe for women and children returning from the metro station.',
    category: 'Damaged Streetlight',
    severity: 'High',
    location: 'Jayadev Vihar, Bhubaneswar, Odisha',
    gps: { lat: 20.2920, lng: 85.8290 },
    photoUrl: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=600',
    upvotes: 61,
    status: 'Open',
    date: '2026-06-20',
    reporterName: 'Siddharth Rao',
    comments: [
      {
        id: 'c-4',
        userName: 'Kiran Patel',
        text: 'Very dangerous spot. There are no security cameras here either.',
        date: '2026-06-20'
      },
      {
        id: 'c-5',
        userName: 'Ayesha Khan',
        text: 'Agreed, this is a major safety concern. Let us keep upvoting to push it to top priority!',
        date: '2026-06-21'
      }
    ]
  },
  {
    id: 'issue-4',
    title: 'Illegal garbage dumping on pavement',
    description: 'Commercial waste and plastic bags are being dumped on the pedestrian walkway, blocking the path entirely and creating a heavy stench.',
    category: 'Waste Dumping',
    severity: 'Medium',
    location: 'VSS Nagar, Bhubaneswar, Odisha',
    gps: { lat: 20.3010, lng: 85.8210 },
    photoUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600',
    upvotes: 19,
    status: 'Resolved',
    date: '2026-06-18',
    reporterName: 'Vikram Singh',
    comments: [
      {
        id: 'c-6',
        userName: 'Ritu Sen',
        text: 'Smells terrible. Thank you for reporting.',
        date: '2026-06-18'
      },
      {
        id: 'c-7',
        userName: 'CivicAI Clean Marshal',
        text: 'Local municipal waste collector cleared this pile today morning. Resolving issue!',
        date: '2026-06-19'
      }
    ]
  }
];

export const MOCK_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: 'Ananya Sharma', points: 1450, badge: 'Civic Legend 👑' },
  { rank: 2, name: 'You (Ankit Kumar)', points: 1120, badge: 'City Hero 👑', isCurrentUser: true },
  { rank: 3, name: 'Rajesh Hegde', points: 950, badge: 'Super Validator ⚡' },
  { rank: 4, name: 'Amit Patil', points: 820, badge: 'Pavement Guardian 🛡️' },
  { rank: 5, name: 'Sunita Rao', points: 410, badge: 'Eco Warrior 🌿' },
  { rank: 6, name: 'Sandeep V', points: 320, badge: 'Street Watcher 👁️' },
  { rank: 7, name: 'Priya Nair', points: 290, badge: 'Pothole Patrol 🚨' },
  { rank: 8, name: 'Rohan Deshmukh', points: 240, badge: 'Water Savior 💧' },
  { rank: 9, name: 'Vikram Malhotra', points: 180, badge: 'Light Bringer 💡' },
  { rank: 10, name: 'Meera Sen', points: 120, badge: 'Clean Marshal 🗑️' }
];

export const MOCK_USER_STATS: UserStats = {
  name: 'Ankit Kumar',
  points: 1120,
  badge: 'City Hero 👑',
  rank: 2,
  reportsCount: 12,
  resolvedCount: 8,
  level: 6,
  upvotesGiven: 136,
  badges: ['First Reporter', 'Watchdog', 'Hero', 'Validator', 'Evidence Master', 'Ward Protector'],
  streakCount: 5,
  streakDays: [true, true, true, true, true, false, false],
  hasActionToday: false,
  challengesClaimed: []
};

export const DEMO_ISSUES: CivicIssue[] = [
  {
    id: "demo-issue-1",
    title: "Large pothole damaging vehicles",
    description: "A very deep and dangerous pothole right in the middle of MG Road Junction. Several vehicles have suffered tire damage already.",
    category: "Pothole",
    severity: "Critical",
    location: "MG Road Junction",
    gps: { lat: 20.2961, lng: 85.8245 },
    photoUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    upvotes: 47,
    status: "Open",
    date: "2 days ago",
    reporterName: "Amit Das",
    comments: [
      { id: "c1", userName: "Sunita Mishra", text: "This is extremely dangerous at night!", date: "1 day ago" }
    ],
    isAiVerified: true,
    aiTrustScore: 98,
    aiAnalysisFeedback: "Gemini Vision has verified this pothole and categorized it under Public Works Department (PWD)."
  },
  {
    id: "demo-issue-2",
    title: "Street light not working 3 weeks",
    description: "Entire street light pole is out, making the corner at Patia Square dark and unsafe for pedestrians.",
    category: "Damaged Streetlight",
    severity: "High",
    location: "Patia Square",
    gps: { lat: 20.3588, lng: 85.8333 },
    photoUrl: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=600",
    upvotes: 23,
    status: "In Progress",
    date: "5 days ago",
    reporterName: "Priya Patel",
    comments: [
      { id: "c2", userName: "Rahul Sharma", text: "Electricity Board team said they are waiting for bulbs.", date: "2 days ago" }
    ],
    isAiVerified: true,
    aiTrustScore: 92,
    aiAnalysisFeedback: "Assigned to Electricity Board for repair."
  },
  {
    id: "demo-issue-3",
    title: "Water pipeline leaking on footpath",
    description: "Fresh drinking water is leaking and flooding the footpath near Nayapalli Colony.",
    category: "Water Leakage",
    severity: "Medium",
    location: "Nayapalli Colony",
    gps: { lat: 20.2905, lng: 85.8012 },
    photoUrl: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?auto=format&fit=crop&q=80&w=600",
    upvotes: 12,
    status: "Open",
    date: "7 days ago",
    reporterName: "Rajan Mohanty",
    comments: [],
    isAiVerified: true,
    aiTrustScore: 85,
    aiAnalysisFeedback: "Community verified leakage reported to WATCO."
  },
  {
    id: "demo-issue-4",
    title: "Garbage not collected 10 days",
    description: "Huge pile of solid waste dumped in the public collection corner at Saheed Nagar Ward 12.",
    category: "Waste Dumping",
    severity: "High",
    location: "Saheed Nagar",
    gps: { lat: 20.2882, lng: 85.8436 },
    photoUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    upvotes: 31,
    status: "Open",
    date: "1 day ago",
    reporterName: "Rahul Sharma",
    comments: [],
    isAiVerified: true,
    aiTrustScore: 96,
    aiAnalysisFeedback: "Sanitation waste pile detected, auto-scheduled for BMC pickup."
  },
  {
    id: "demo-issue-5",
    title: "Broken footpath causing accidents",
    description: "Footpath slabs are broken and open near Bhubaneswar Old Town temple complex.",
    category: "Broken Footpath",
    severity: "Medium",
    location: "Old Town",
    gps: { lat: 20.2444, lng: 85.8439 },
    photoUrl: "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?auto=format&fit=crop&q=80&w=600",
    upvotes: 18,
    status: "Resolved",
    date: "15 days ago",
    reporterName: "Deepa Nair",
    comments: [],
    isAiVerified: true,
    aiTrustScore: 89,
    resolutionPhotoUrl: "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?auto=format&fit=crop&q=80&w=600",
    resolutionAiVerdict: {
      isResolved: true,
      confidence: 95,
      explanation: "Footpath tiles replaced and visual check confirms flat path surface.",
      whatChanged: "New concrete slabs installed.",
      whatRemains: "None."
    }
  }
];

export const DEMO_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: "Priya Patel", points: 892, badge: "🏆 Hero" },
  { rank: 2, name: "Rahul Sharma (You)", points: 340, badge: "👁 Watchdog", isCurrentUser: true },
  { rank: 3, name: "Amit Das", points: 287, badge: "⭐ Validator" },
  { rank: 4, name: "Sunita Mishra", points: 245, badge: "🔍 First Reporter" },
  { rank: 5, name: "Rajan Mohanty", points: 198, badge: "👁 Watchdog" },
  { rank: 6, name: "Deepa Nair", points: 176, badge: "⭐ Validator" },
  { rank: 7, name: "Vikram Singh", points: 134, badge: "🔍 First Reporter" },
  { rank: 8, name: "Ananya Roy", points: 98, badge: "🌱 New Member" },
  { rank: 9, name: "Kiran Kumar", points: 67, badge: "🌱 New Member" },
  { rank: 10, name: "Meena Sharma", points: 43, badge: "🌱 New Member" }
];

export const DEMO_USER_STATS: UserStats = {
  name: "Rahul Sharma",
  points: 340,
  badge: "Watchdog 🐕",
  rank: 2,
  reportsCount: 12,
  resolvedCount: 8,
  level: 2,
  upvotesGiven: 136,
  badges: ["First Reporter", "Watchdog", "Hero", "Validator", "Evidence Master", "Ward Protector"],
  streakCount: 4,
  streakDays: [true, true, true, true, false, false, false],
  hasActionToday: false,
  challengesClaimed: []
};

export const DEMO_AUTHORITY_ISSUES: CivicIssue[] = [
  {
    id: "demo-auth-issue-1",
    title: "Critical pothole MG Road",
    description: "A very deep and dangerous pothole right in the middle of MG Road Junction. Several vehicles have suffered tire damage already.",
    category: "Pothole",
    severity: "Critical",
    location: "MG Road Junction",
    gps: { lat: 20.2961, lng: 85.8245 },
    photoUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    upvotes: 47,
    status: "Open",
    date: "2026-06-24", // 2 days open/overdue
    reporterName: "Amit Das",
    comments: [
      { id: "c1", userName: "Sunita Mishra", text: "This is extremely dangerous at night!", date: "1 day ago" }
    ],
    isAiVerified: true,
    aiTrustScore: 98,
    customBadge: "URGENT"
  },
  {
    id: "demo-auth-issue-2",
    title: "Broken footpath Old Town",
    description: "Footpath slabs are broken and open near Bhubaneswar Old Town temple complex.",
    category: "Broken Footpath",
    severity: "Medium",
    location: "Old Town",
    gps: { lat: 20.2444, lng: 85.8439 },
    photoUrl: "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?auto=format&fit=crop&q=80&w=600",
    upvotes: 18,
    status: "In Progress",
    date: "2026-06-26", // today
    reporterName: "Deepa Nair",
    comments: [],
    isAiVerified: true,
    aiTrustScore: 89,
    customBadge: "assigned today"
  },
  {
    id: "demo-auth-issue-3",
    title: "Road cave-in near Station",
    description: "Main road has caved in near Bhubaneswar Railway Station, blocking one entire lane.",
    category: "Pothole",
    severity: "High",
    location: "Station Road",
    gps: { lat: 20.2744, lng: 85.8439 },
    photoUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    upvotes: 61,
    status: "Open",
    date: "2026-06-22", // 4 days ago
    reporterName: "Rajan Mohanty",
    comments: [],
    isAiVerified: true,
    aiTrustScore: 94,
    customBadge: "escalated"
  }
];

