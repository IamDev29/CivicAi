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
  { rank: 2, name: 'Rajesh Hegde', points: 1200, badge: 'Super Validator ⚡' },
  { rank: 3, name: 'Amit Patil', points: 950, badge: 'Pavement Guardian 🛡️' },
  { rank: 4, name: 'You (Ankit Kumar)', points: 450, badge: 'Active Citizen ⭐', isCurrentUser: true },
  { rank: 5, name: 'Sunita Rao', points: 410, badge: 'Eco Warrior 🌿' },
  { rank: 6, name: 'Sandeep V', points: 320, badge: 'Street Watcher 👁️' },
  { rank: 7, name: 'Priya Nair', points: 290, badge: 'Pothole Patrol 🚨' },
  { rank: 8, name: 'Rohan Deshmukh', points: 240, badge: 'Water Savior 💧' },
  { rank: 9, name: 'Vikram Malhotra', points: 180, badge: 'Light Bringer 💡' },
  { rank: 10, name: 'Meera Sen', points: 120, badge: 'Clean Marshal 🗑️' }
];

export const MOCK_USER_STATS: UserStats = {
  name: 'Ankit Kumar',
  points: 450,
  badge: 'Active Citizen ⭐',
  rank: 4,
  reportsCount: 5,
  resolvedCount: 3,
  level: 3,
  upvotesGiven: 12,
  badges: ['First Reporter', 'Hero']
};
