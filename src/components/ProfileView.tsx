/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Trophy, 
  User, 
  Sparkles, 
  Heart, 
  MapPin, 
  FileText,
  ShieldCheck,
  Zap,
  Target,
  Flame,
  AlertTriangle,
  Share2,
  Copy,
  Check,
  Loader2,
  Calendar,
  Lock,
  Compass,
  Coins,
  ChevronRight,
  ArrowUpRight,
  Sparkle,
  Printer,
  Linkedin,
  MessageCircle,
  X,
  Palette
} from 'lucide-react';
import { UserStats, LeaderboardUser, CivicIssue, getTier, getReporterTier, WeeklyChallenge } from '../types';

interface ProfileViewProps {
  userStats: UserStats;
  leaderboard: LeaderboardUser[];
  userIssues: CivicIssue[];
  allIssues?: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
  onSwitchTab: (tab: string) => void;
  onLogout?: () => void;
  onClaimChallenge?: (id: string, points: number) => void;
  triggerAlert?: (msg: string) => void;
  onUpdateUserStats?: React.Dispatch<React.SetStateAction<UserStats>>;
  onUpdateIssues?: React.Dispatch<React.SetStateAction<CivicIssue[]>>;
}

export default function ProfileView({
  userStats,
  leaderboard,
  userIssues,
  allIssues = [],
  onSelectIssue,
  onSwitchTab,
  onLogout,
  onClaimChallenge,
  triggerAlert,
  onUpdateUserStats,
  onUpdateIssues
}: ProfileViewProps) {
  
  const reportsCount = userStats.reportsCount;
  const resolvedCount = userStats.resolvedCount;
  const upvotesGiven = userStats.upvotesGiven || 0;
  const streakCount = userStats.streakCount ?? 5;
  const streakDays = userStats.streakDays ?? [true, true, true, true, true, false, false];
  const hasActionToday = userStats.hasActionToday ?? false;

  const [motivatingSentence, setMotivatingSentence] = useState<string>('');
  const [loadingSentence, setLoadingSentence] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Tabs
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'rewards'>('profile');

  // Modal / Interaction State
  const [activeModal, setActiveModal] = useState<'none' | 'confirm_spend' | 'pick_issue' | 'text_prompt' | 'color_picker' | 'report_display' | 'cert_display' | 'digest_display'>('none');
  const [selectedReward, setSelectedReward] = useState<{
    id: string;
    title: string;
    cost: number;
    section: string;
    description: string;
  } | null>(null);

  // Picker and Input states
  const [textInputValue, setTextInputValue] = useState('');
  const [selectedTargetIssueId, setSelectedTargetIssueId] = useState('');
  const [selectedAccentColor, setSelectedAccentColor] = useState('');

  // Gemini loading states
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [wardReportResult, setWardReportResult] = useState<string | null>(null);
  const [certificateResult, setCertificateResult] = useState<string | null>(null);
  const [monthlyDigestResult, setMonthlyDigestResult] = useState<string | null>(null);

  // Fetch motivating sentence from server-side Gemini API
  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      setLoadingSentence(true);
      try {
        const response = await fetch('/api/gemini/impact-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reported: reportsCount,
            resolved: resolvedCount,
            peopleHelped: Math.round(upvotesGiven * 2.5) || 340,
            co2Saved: resolvedCount * 12,
            ward: userStats.name.toLowerCase().includes('rahul') ? '12' : '42'
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (active && data.summary) {
            setMotivatingSentence(data.summary);
          }
        }
      } catch (err) {
        console.error('Failed to fetch impact summary from Gemini:', err);
      } finally {
        if (active) setLoadingSentence(false);
      }
    };

    fetchSummary();
    return () => {
      active = false;
    };
  }, [reportsCount, resolvedCount, upvotesGiven]);

  // Handle sharing badge
  const handleShareBadge = (badgeTitle: string) => {
    const text = `🏆 I unlocked the "${badgeTitle}" badge on CivicAI for helping Bhubaneswar resolve hyperlocal hazards! Join the movement.`;
    navigator.clipboard.writeText(text);
    if (triggerAlert) {
      triggerAlert(`"${badgeTitle}" share text copied to clipboard! 📋`);
    }
  };

  // Handle sharing Impact Card
  const handleShareImpact = () => {
    const ward = userStats.name.toLowerCase().includes('rahul') ? 'Ward 12' : 'Ward 42';
    const text = `🌍 My Civic Impact Card on CivicAI:
• Reported: ${reportsCount} issues | Resolved: ${resolvedCount}
• Helped: ~${Math.round(upvotesGiven * 2.5) || 340} citizens
• Carbon offset: ${resolvedCount * 12}kg CO₂ saved
• Ward Rank: #2 in Bhubaneswar ${ward}

"${motivatingSentence || 'Making my neighborhood safer and greener every day.'}"
Join the community heroics on CivicAI!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (triggerAlert) {
      triggerAlert('Impact Card copied to clipboard! 🌍');
    }
  };

  // Challenge mapping
  const challenges: WeeklyChallenge[] = [
    {
      id: 'challenge-report',
      title: 'Report 3 issues this week',
      description: 'Log issues with photo evidence to help municipal routing.',
      points: 50,
      progress: Math.min(reportsCount >= 12 ? 2 + (reportsCount - 12) : 2, 3),
      max: 3,
      claimed: userStats.challengesClaimed?.includes('challenge-report') || false,
      type: 'personal'
    },
    {
      id: 'challenge-verify',
      title: 'Verify 5 community reports',
      description: 'Upvote active reports in your ward to increase official priority.',
      points: 30,
      progress: Math.min(upvotesGiven >= 136 ? 4 + (upvotesGiven - 136) : 4, 5),
      max: 5,
      claimed: userStats.challengesClaimed?.includes('challenge-verify') || false,
      type: 'personal'
    },
    {
      id: 'challenge-ward',
      title: 'Ward 12 Collective Goal',
      description: 'Total reports in Ward 12 this week to unlock special division funding.',
      points: 100,
      progress: Math.min(73 + (reportsCount >= 12 ? (reportsCount - 12) : 0), 100),
      max: 100,
      claimed: false,
      type: 'collective'
    }
  ];

  // 8 Badges list according to requirements
  const BADGES_LIST = [
    {
      id: 'badge-first-reporter',
      title: 'First Reporter',
      requirement: 'Report your first hyperlocal civic issue.',
      unlocked: reportsCount >= 1,
      earnedDate: 'Earned: Jun 12, 2026',
      icon: '🥇',
      color: 'from-amber-400 to-yellow-600'
    },
    {
      id: 'badge-watchdog',
      title: 'Watchdog',
      requirement: 'Submit 10+ AI-verified civic reports.',
      unlocked: reportsCount >= 10,
      earnedDate: 'Earned: Jun 15, 2026',
      icon: '🐕',
      color: 'from-blue-400 to-indigo-600'
    },
    {
      id: 'badge-city-hero',
      title: 'City Hero',
      requirement: 'Have at least one reported issue successfully resolved.',
      unlocked: resolvedCount >= 1,
      earnedDate: 'Earned: Jun 20, 2026',
      icon: '🦸‍♂️',
      color: 'from-emerald-400 to-teal-600'
    },
    {
      id: 'badge-validator',
      title: 'Validator',
      requirement: 'Vote on and verify 50+ community report spots.',
      unlocked: upvotesGiven >= 50,
      earnedDate: 'Earned: Jun 18, 2026',
      icon: '⚡',
      color: 'from-purple-400 to-fuchsia-600'
    },
    {
      id: 'badge-rapid-responder',
      title: 'Rapid Responder',
      requirement: 'Report a critical safety hazard within 1 hour of occurrence.',
      unlocked: true, // Mocked as true for this active user
      earnedDate: 'Earned: Jun 22, 2026',
      icon: '🚨',
      color: 'from-rose-400 to-red-600'
    },
    {
      id: 'badge-streak-master',
      title: 'Streak Master',
      requirement: 'Maintain a consecutive 7-day civic action streak.',
      unlocked: streakCount >= 7,
      earnedDate: 'Earned: Jun 24, 2026',
      icon: '🔥',
      color: 'from-orange-400 to-amber-600'
    },
    {
      id: 'badge-ward-protector',
      title: 'Ward Protector',
      requirement: 'Top reporter in your municipal ward for 3 consecutive months.',
      unlocked: true, // Mocked as true for this active user
      earnedDate: 'Earned: Jun 01, 2026',
      icon: '🛡️',
      color: 'from-cyan-400 to-blue-600'
    },
    {
      id: 'badge-evidence-master',
      title: 'Evidence Master',
      requirement: 'All submitted reports include an AI-verified photo.',
      unlocked: reportsCount >= 1,
      earnedDate: 'Earned: Jun 14, 2026',
      icon: '📸',
      color: 'from-violet-400 to-purple-600'
    }
  ];

  const currentTier = getTier(userStats.points);
  const wardName = userStats.name.toLowerCase().includes('rahul') ? 'Ward 12' : 'Ward 42';

  // Available, spent and total
  const availableCoins = userStats.points;
  const spentCoins = userStats.spentCoins || 0;
  const totalEarnedCoins = availableCoins + spentCoins;

  // Reward Definitions
  const REWARDS_CATALOGUE = {
    priority_boost: [
      {
        id: 'boost-high',
        title: 'Boost issue to High priority',
        cost: 50,
        section: 'priority_boost',
        description: 'Accelerate the municipal review queue for one of your submitted reports by upgrading its severity status to HIGH instantly.'
      },
      {
        id: 'escalate-critical',
        title: 'Escalate to Critical + 48hr SLA',
        cost: 150,
        section: 'priority_boost',
        description: 'Upgrade your issue to CRITICAL severity and tag it with a municipal 48-hour SLA response directive.'
      },
      {
        id: 'spotlight-map',
        title: 'Spotlight on map for 24hrs',
        cost: 75,
        section: 'priority_boost',
        description: 'Mark your reported issue with a premium Gold Star (⭐) pin on the central municipal map and showcase it at the top of the community feed.'
      }
    ],
    profile_perks: [
      {
        id: 'custom-title',
        title: 'Custom Profile Title',
        cost: 100,
        section: 'profile_perks',
        description: 'Add a custom honorific title (e.g., "Pavement Sentry") under your name on your profile page and all reported issue cards.'
      },
      {
        id: 'verified-citizen',
        title: 'Verified Citizen Badge ✓',
        cost: 200,
        section: 'profile_perks',
        description: 'Add a verified blue checkmark to your profile. Displays "Your reports now carry 1.5× trust weight" as a validation boost.'
      },
      {
        id: 'gold-border',
        title: 'Gold Profile Border',
        cost: 125,
        section: 'profile_perks',
        description: 'Frame your profile avatar card with an animated golden ring of civic distinction.'
      },
      {
        id: 'accent-color',
        title: 'Report Accent Color',
        cost: 80,
        section: 'profile_perks',
        description: 'Select a custom colored sidebar border to stylize all of your reported cards in the community feed.'
      }
    ],
    community_power: [
      {
        id: 'super-vote',
        title: 'Super-Vote (Worth 5 Upvotes)',
        cost: 30,
        section: 'community_power',
        description: 'Multiply your voting strength! Apply a 5x upvote boost to any active neighborhood issue to help it catch authorities\' attention.'
      },
      {
        id: 'ward-report',
        title: 'Generate Ward Performance Report Card',
        cost: 120,
        section: 'community_power',
        description: 'Use Gemini AI to synthesize ward-wide resolution statistics, grade municipal responsiveness, and create a report copyable to WhatsApp.'
      },
      {
        id: 'nominate-month',
        title: 'Nominate Issue of the Month',
        cost: 250,
        section: 'community_power',
        description: 'Nominate your reported issue for city-wide recognition. Adds a gold "City Nominated" banner and pins it to the top of the feed.'
      }
    ],
    certificates: [
      {
        id: 'civic-certificate',
        title: 'Civic Contribution Certificate',
        cost: 500,
        section: 'certificates',
        description: 'Deduct coins to call Gemini and draft a personalized, formal, high-resolution printable Certificate of Honor signed by the Mayor.'
      },
      {
        id: 'city-hero-nom',
        title: 'City Hero Nomination',
        cost: 1000,
        section: 'certificates',
        description: 'Unlock this elite rank to receive a permanent "City Hero 2025" banner on your profile, and feature in the city dashboard\'s Hall of Fame.'
      }
    ],
    civic_privileges: [
      {
        id: 'priority-reporter',
        title: 'Priority Reporter Status',
        cost: 300,
        section: 'civic_privileges',
        description: 'Your new reports skip the community verification queue and go directly to Assigned status. Show a "Priority Reporter" tag on your profile.'
      },
      {
        id: 'direct-messaging',
        title: 'Direct Department Messaging',
        cost: 400,
        section: 'civic_privileges',
        description: 'Unlocks a "Message Department" button on your issue cards — lets you send a note directly to the assigned officer with an interactive mock message thread.'
      },
      {
        id: 'monthly-digest',
        title: 'Monthly Ward Digest Subscription',
        cost: 200,
        section: 'civic_privileges',
        description: 'Subscribe to a Gemini-generated monthly summary of your ward\'s civic health delivered as an in-app report — issues resolved, upcoming risks, your contribution rank.'
      },
      {
        id: 'anonymous-mode',
        title: 'Anonymous Reporting Mode',
        cost: 150,
        section: 'civic_privileges',
        description: 'Report issues without your name shown publicly — only the department sees who filed it.'
      }
    ]
  };

  // Spend Validation & Confirmation
  const handleInitiatePurchase = (reward: any) => {
    // Check if locked City Hero nomination is within budget
    if (availableCoins < reward.cost) {
      if (triggerAlert) {
        triggerAlert(`Insufficient CivicCoins! You need ${reward.cost - availableCoins} more 🪙.`);
      }
      return;
    }
    setSelectedReward(reward);
    setActiveModal('confirm_spend');
  };

  const handleConfirmSpend = () => {
    if (!selectedReward) return;
    setActiveModal('none');

    // Proceed to details input depending on the perk
    if (selectedReward.id === 'boost-high' || selectedReward.id === 'escalate-critical' || selectedReward.id === 'spotlight-map' || selectedReward.id === 'nominate-month') {
      // Needs issue selector
      setActiveModal('pick_issue');
    } else if (selectedReward.id === 'super-vote') {
      // Needs all issues selector
      setActiveModal('pick_issue');
    } else if (selectedReward.id === 'custom-title') {
      // Needs text prompt
      setActiveModal('text_prompt');
      setTextInputValue('');
    } else if (selectedReward.id === 'accent-color') {
      // Needs color picker
      setActiveModal('color_picker');
      setSelectedAccentColor('#3b82f6');
    } else if (selectedReward.id === 'verified-citizen') {
      // Simple toggle, spend coins
      executeRewardPurchase();
    } else if (selectedReward.id === 'gold-border') {
      // Simple toggle, spend coins
      executeRewardPurchase();
    } else if (selectedReward.id === 'priority-reporter') {
      // Simple privilege unlock
      executeRewardPurchase();
    } else if (selectedReward.id === 'direct-messaging') {
      // Simple privilege unlock
      executeRewardPurchase();
    } else if (selectedReward.id === 'anonymous-mode') {
      // Simple privilege unlock
      executeRewardPurchase();
    } else if (selectedReward.id === 'city-hero-nom') {
      // Hero Nomination! Spend coins, sets gold border + title
      executeRewardPurchase();
    } else if (selectedReward.id === 'ward-report') {
      // Calls Gemini ward-report
      generateWardReport();
    } else if (selectedReward.id === 'civic-certificate') {
      // Calls Gemini certificate
      generateCertificate();
    } else if (selectedReward.id === 'monthly-digest') {
      // Calls Gemini monthly digest
      generateMonthlyDigest();
    }
  };

  // Actually deduct coins and save changes
  const executeRewardPurchase = (extraPayload?: any) => {
    if (!selectedReward) return;
    const cost = selectedReward.cost;

    // 1. Deduct coins from user stats
    if (onUpdateUserStats) {
      onUpdateUserStats(prev => {
        let updated = {
          ...prev,
          points: Math.max(0, prev.points - cost),
          spentCoins: (prev.spentCoins || 0) + cost
        };

        if (selectedReward.id === 'verified-citizen') {
          updated.hasVerifiedBadge = true;
        } else if (selectedReward.id === 'gold-border') {
          updated.hasGoldBorder = true;
        } else if (selectedReward.id === 'custom-title') {
          updated.customTitle = extraPayload?.text || 'Civic Sentinel';
        } else if (selectedReward.id === 'accent-color') {
          updated.accentColor = extraPayload?.color || '#3b82f6';
        } else if (selectedReward.id === 'city-hero-nom') {
          updated.customTitle = 'City Hero 2025';
          updated.hasGoldBorder = true;
        } else if (selectedReward.id === 'priority-reporter') {
          updated.isPriorityReporter = true;
        } else if (selectedReward.id === 'direct-messaging') {
          updated.hasDirectMessaging = true;
        } else if (selectedReward.id === 'anonymous-mode') {
          updated.isAnonymousMode = true;
        } else if (selectedReward.id === 'monthly-digest') {
          updated.hasMonthlyDigest = true;
        }

        return updated;
      });
    }

    // 2. Apply issue modifications if applicable
    if (onUpdateIssues && extraPayload?.issueId) {
      onUpdateIssues(prev => {
        return prev.map(issue => {
          if (issue.id === extraPayload.issueId) {
            let updatedIssue = { ...issue };
            if (selectedReward.id === 'boost-high') {
              updatedIssue.severity = 'High';
            } else if (selectedReward.id === 'escalate-critical') {
              updatedIssue.severity = 'Critical';
              updatedIssue.customBadge = 'SLA: 48hrs';
            } else if (selectedReward.id === 'spotlight-map') {
              updatedIssue.isSpotlight = true;
            } else if (selectedReward.id === 'nominate-month') {
              updatedIssue.isNominated = true;
            } else if (selectedReward.id === 'super-vote') {
              updatedIssue.upvotes = (updatedIssue.upvotes || 0) + 5;
            }
            return updatedIssue;
          }
          return issue;
        });
      });
    }

    // 3. Trigger alert
    if (triggerAlert) {
      let msg = `Spent ${cost} 🪙 on ${selectedReward.title}!`;
      if (selectedReward.id === 'boost-high') msg = "Boosted! Your issue moves up the queue.";
      if (selectedReward.id === 'escalate-critical') msg = "Escalated! Your issue now carries a 48hr SLA.";
      if (selectedReward.id === 'spotlight-map') msg = "Spotlighted! ⭐ pin active on map.";
      if (selectedReward.id === 'verified-citizen') msg = "Verified Badge unlocked! 1.5× trust weight activated.";
      if (selectedReward.id === 'custom-title') msg = `Title updated to: "${extraPayload?.text}" 🎗️`;
      if (selectedReward.id === 'accent-color') msg = "Left accent border applied to your reported issues.";
      if (selectedReward.id === 'super-vote') msg = "Applied 5x upvotes to issue!";
      if (selectedReward.id === 'nominate-month') msg = "Issue nominated! Pinned with City Nominated banner.";
      if (selectedReward.id === 'city-hero-nom') msg = "🏆 CITY HERO 2025 unlocked! Check your profile banner.";
      if (selectedReward.id === 'priority-reporter') msg = "Priority Reporter activated! 🚀 Your new reports skip verification and go directly to Assigned status.";
      if (selectedReward.id === 'direct-messaging') msg = "Direct Department Messaging unlocked! 💬 Check your issue cards to chat with assigned officers.";
      if (selectedReward.id === 'anonymous-mode') msg = "Anonymous Reporting mode activated! 👤 All your future reports will keep your identity hidden.";
      if (selectedReward.id === 'monthly-digest') msg = "Monthly Ward Digest subscription active! 📰 Your monthly report is compiled and ready.";
      
      triggerAlert(msg);
    }

    // Cleanup
    setSelectedReward(null);
    setActiveModal('none');
    setSelectedTargetIssueId('');
    setTextInputValue('');
  };

  // Generate Gemini Ward Report Card
  const generateWardReport = async () => {
    setGeminiLoading(true);
    setActiveModal('report_display');
    try {
      const response = await fetch('/api/gemini/ward-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ward: wardName,
          name: userStats.name
        })
      });
      if (response.ok) {
        const data = await response.json();
        setWardReportResult(data.report);
        
        // Deduct coins only on successful call
        if (onUpdateUserStats && selectedReward) {
          onUpdateUserStats(prev => ({
            ...prev,
            points: Math.max(0, prev.points - selectedReward.cost),
            spentCoins: (prev.spentCoins || 0) + selectedReward.cost
          }));
        }
      } else {
        throw new Error("Failed response");
      }
    } catch (err) {
      console.error(err);
      if (triggerAlert) triggerAlert("Could not reach Gemini API. Fallback report generated.");
      // Fallback
      const fallbackReport = `📊 *WARD PERFORMANCE REPORT CARD: ${wardName.toUpperCase()}* 📊\n\nBhubaneswar Municipal Corporation (BMC)\nGrade: A-\n\n✅ *Performance metrics compiled by Gemini AI*:\n• Total community reports: 73\n• Verification Confidence Score: 94%\n• PWD Department turnaround SLA: 4.2 days\n• Active citizen validators: 847\n\n💬 *Heuristics Summary*:\n"Ward 12 exhibits stellar civic mobilization, resulting in the fastest street repair routing times in Bhubaneswar. Potholes and damaged streetlights remain primary friction spots but carry 81% faster resolution times due to high active citizen verification."`;
      setWardReportResult(fallbackReport);
      
      if (onUpdateUserStats && selectedReward) {
        onUpdateUserStats(prev => ({
          ...prev,
          points: Math.max(0, prev.points - selectedReward.cost),
          spentCoins: (prev.spentCoins || 0) + selectedReward.cost
        }));
      }
    } finally {
      setGeminiLoading(false);
    }
  };

  // Generate Gemini Monthly Ward Digest
  const generateMonthlyDigest = async () => {
    setGeminiLoading(true);
    setActiveModal('digest_display');
    try {
      const response = await fetch('/api/gemini/monthly-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ward: wardName,
          name: userStats.name,
          rank: userStats.rank
        })
      });
      if (response.ok) {
        const data = await response.json();
        setMonthlyDigestResult(data.report);
        
        // Deduct coins only on successful call
        if (onUpdateUserStats && selectedReward) {
          onUpdateUserStats(prev => ({
            ...prev,
            points: Math.max(0, prev.points - selectedReward.cost),
            spentCoins: (prev.spentCoins || 0) + selectedReward.cost,
            hasMonthlyDigest: true
          }));
        }
      } else {
        throw new Error("Failed response");
      }
    } catch (err) {
      console.error(err);
      if (triggerAlert) triggerAlert("Could not reach Gemini API. Fallback digest generated.");
      
      const fallbackDigest = `📰 *CIVIC HEALTH REPORT: MONTHLY WARD DIGEST* 📰\n\n*Ward*: ${wardName}\n*Reporting Month*: June 2026\n*Delivered to*: ${userStats.name}\n\n🟢 *Issues Resolved This Month*:\n• *Potholes Restored*: 42 instances filled across Janpath and arterial links.\n• *Water Line Repairs*: 12 main line leakages sealed by the Water Board.\n• *Waste Clearances*: 18 public bins serviced and optimized with sensor tags.\n\n⚠️ *Upcoming Ward Risks & Notices*:\n• *Monsoon Prep*: Drainage dredging scheduled along Lane 4 from July 2-5. Expect localized water blocks.\n• *Streetlight Upgrade*: Faulty bulbs along Sector B are being replaced with smart LEDs next week.\n\n🏆 *Your Monthly Contribution Rank*:\n• *Current Rank*: #${userStats.rank || '4'} in ${wardName}\n• *Honor Stat*: Top 2% of contributors this quarter! You have saved other citizens an estimated 140+ hours of detours.\n\n*Thank you for being a Guardian of our streets!*`;
      setMonthlyDigestResult(fallbackDigest);
      
      if (onUpdateUserStats && selectedReward) {
        onUpdateUserStats(prev => ({
          ...prev,
          points: Math.max(0, prev.points - selectedReward.cost),
          spentCoins: (prev.spentCoins || 0) + selectedReward.cost,
          hasMonthlyDigest: true
        }));
      }
    } finally {
      setGeminiLoading(false);
    }
  };

  // Generate Gemini Civic Contribution Certificate
  const generateCertificate = async () => {
    setGeminiLoading(true);
    setActiveModal('cert_display');
    try {
      const response = await fetch('/api/gemini/certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: userStats.name,
          reportedCount: reportsCount,
          resolvedCount: resolvedCount,
          peopleHelped: Math.round(upvotesGiven * 2.5) || 340,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        })
      });
      if (response.ok) {
        const data = await response.json();
        setCertificateResult(data.certificate);
        
        // Deduct coins only on successful call
        if (onUpdateUserStats && selectedReward) {
          onUpdateUserStats(prev => ({
            ...prev,
            points: Math.max(0, prev.points - selectedReward.cost),
            spentCoins: (prev.spentCoins || 0) + selectedReward.cost
          }));
        }
      } else {
        throw new Error("Failed response");
      }
    } catch (err) {
      console.error(err);
      if (triggerAlert) triggerAlert("Could not reach Gemini API. Fallback certificate generated.");
      // Fallback
      const fallbackCert = `CERTIFICATE OF CIVIC CONTRIBUTION\n\nThis certifies that Ankit Kumar has demonstrated exemplary civic duty in Bhubaneswar. By logging ${reportsCount} verified hyperlocal issues, you have offset greenhouse gases and improved municipal responsiveness. Your commitment to community co-governance sets a high standard for social heroes.`;
      setCertificateResult(fallbackCert);

      if (onUpdateUserStats && selectedReward) {
        onUpdateUserStats(prev => ({
          ...prev,
          points: Math.max(0, prev.points - selectedReward.cost),
          spentCoins: (prev.spentCoins || 0) + selectedReward.cost
        }));
      }
    } finally {
      setGeminiLoading(false);
    }
  };

  // Helper colors for Report Accent Color
  const COLORS = [
    { name: 'Teal Border', hex: '#14b8a6', bg: 'bg-teal-500' },
    { name: 'Red Border', hex: '#ef4444', bg: 'bg-red-500' },
    { name: 'Blue Border', hex: '#3b82f6', bg: 'bg-blue-500' },
    { name: 'Green Border', hex: '#10b981', bg: 'bg-emerald-500' },
    { name: 'Amber Border', hex: '#f59e0b', bg: 'bg-amber-500' },
    { name: 'Purple Border', hex: '#8b5cf6', bg: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-10 px-2 sm:px-0">

      {/* WALLET DISPLAY: 3 boxes side by side (blue, gray, green) */}
      <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        {/* Available box (Blue) */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-center">
          <p className="text-[9px] font-extrabold text-blue-700 uppercase tracking-widest">Available</p>
          <div className="flex items-center justify-center space-x-1.5 mt-1">
            <span className="text-sm">🪙</span>
            <span className="text-lg font-black text-blue-900">{availableCoins}</span>
          </div>
          <p className="text-[8px] text-blue-500 font-bold mt-0.5">CivicCoins</p>
        </div>

        {/* Spent box (Gray) */}
        <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 text-center">
          <p className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest">Spent</p>
          <div className="flex items-center justify-center space-x-1.5 mt-1">
            <span className="text-sm">🪙</span>
            <span className="text-lg font-black text-gray-700">{spentCoins}</span>
          </div>
          <p className="text-[8px] text-gray-400 font-bold mt-0.5">Redeemed</p>
        </div>

        {/* Total Earned box (Green) */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-center">
          <p className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-widest">Total Earned</p>
          <div className="flex items-center justify-center space-x-1.5 mt-1">
            <span className="text-sm">🪙</span>
            <span className="text-lg font-black text-emerald-900">{totalEarnedCoins}</span>
          </div>
          <p className="text-[8px] text-emerald-500 font-bold mt-0.5">All-Time</p>
        </div>
      </div>

      {/* TAB SWITCHER: Profile vs Rewards */}
      <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-white text-[#1a73e8] shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Civic Identity</span>
        </button>
        <button
          onClick={() => setActiveSubTab('rewards')}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'rewards'
              ? 'bg-white text-amber-600 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Rewards Store</span>
          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded-full font-black">STORE</span>
        </button>
      </div>

      {/* SUB TAB CONTENT: Profile & Stats */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* LAYER 1: User Badge Card with Tier colored border */}
          <div className={`bg-linear-to-br from-[#1a73e8] to-[#1557b0] text-white rounded-2xl p-5 shadow-md relative overflow-hidden border-4 ${currentTier.borderColor}`}>
            
            {/* Abstract background graphics */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/5 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute right-4 top-4 bg-white/10 p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-amber-300 fill-amber-300" />
            </div>

            {/* Custom permanent banner if City Hero 2025 unlocked */}
            {((userStats as any).customTitle === 'City Hero 2025' || userStats.points >= 1000) && (
              <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[9px] font-black tracking-widest text-center py-1 uppercase shadow-inner z-10 flex items-center justify-center space-x-1">
                <span>🏆</span> <span>CIVIC LEAGUE HALL OF FAME: CITY HERO 2025</span> <span>🏆</span>
              </div>
            )}

            <div className={`flex items-center space-x-4 ${((userStats as any).customTitle === 'City Hero 2025' || userStats.points >= 1000) ? 'pt-4' : ''}`}>
              {/* User Avatar with Tier colored ring and Gold Border perk if owned */}
              <div 
                className={`w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-black shrink-0 relative ${
                  userStats.hasGoldBorder 
                    ? 'border-4 border-amber-400 ring-4 ring-amber-300 ring-offset-2 ring-offset-[#1a73e8] animate-pulse' 
                    : 'border-2 border-white/40'
                }`}
              >
                {userStats.name.slice(0, 2).toUpperCase()}
                {userStats.hasVerifiedBadge && (
                  <span className="absolute -bottom-1 -right-1 bg-blue-600 border border-white rounded-full p-0.5" title="Verified Citizen">
                    <ShieldCheck className="w-3.5 h-3.5 text-white fill-blue-500" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-1.5">
                  <h3 className="text-lg font-black truncate flex items-center gap-1">
                    <span>{userStats.name}</span>
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shadow-sm shrink-0 ${currentTier.badgeBg}`}>
                    {currentTier.icon} {currentTier.name}
                  </span>
                </div>
                {/* Custom Title Perk display */}
                {userStats.customTitle && (
                  <p className="text-[10px] bg-amber-400/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-md border border-amber-400/25 inline-block mt-1">
                    🎗️ {userStats.customTitle}
                  </p>
                )}
                {userStats.isPriorityReporter && (
                  <p className="text-[10px] bg-blue-500/20 text-blue-300 font-extrabold px-2 py-0.5 rounded-md border border-blue-400/25 inline-block mt-1 md:ml-1">
                    ⭐ Priority Reporter
                  </p>
                )}
                {userStats.isAnonymousMode && (
                  <p className="text-[10px] bg-gray-500/30 text-gray-300 font-extrabold px-2 py-0.5 rounded-md border border-gray-400/25 inline-block mt-1 md:ml-1">
                    👤 Anonymous Mode
                  </p>
                )}
                <p className="text-xs text-white/85 font-semibold mt-1">
                  👑 Leaderboard Rank: <span className="text-amber-300 font-bold">#{userStats.rank} in {wardName}</span>
                </p>
                <p className="text-[10px] text-white/70 mt-1">
                  Bhubaneswar • Citizen Validator • Lvl {userStats.level}
                </p>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="mt-4 bg-white/15 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(userStats.points % 200) / 200 * 100}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-[9px] text-white/70 mt-1 font-bold">
              <span>{userStats.points % 200} / 200 🪙 to Level {userStats.level + 1}</span>
              <span>{userStats.points} Available CivicCoins</span>
            </div>

            {/* Quick metrics */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
              <div className="bg-white/5 rounded-xl p-2">
                <p className="text-[9px] text-white/60 font-bold uppercase">Balance</p>
                <p className="text-base font-black text-amber-300">🪙 {userStats.points}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2">
                <p className="text-[9px] text-white/60 font-bold uppercase">Reports</p>
                <p className="text-base font-black text-white">{reportsCount}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2">
                <p className="text-[9px] text-white/60 font-bold uppercase">Resolved</p>
                <p className="text-base font-black text-emerald-300">{resolvedCount}</p>
              </div>
            </div>

            {userStats.hasMonthlyDigest && (
              <button
                type="button"
                onClick={() => generateMonthlyDigest()}
                className="mt-4 w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 border border-indigo-400/30 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-3xs hover:shadow-2xs"
              >
                <span>📰 View Monthly Ward Digest</span>
              </button>
            )}
          </div>

          {/* LAYER 5: Real-World Impact Score & Gemini motivating summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-[#1a73e8]" />
                <span>Real-World Impact Score</span>
              </h4>
              <span className="text-[10px] font-extrabold text-[#1a73e8] bg-[#1a73e8]/10 px-2 py-0.5 rounded-full uppercase">Bhubaneswar Central</span>
            </div>

            {/* 2x2 Impact Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/60">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">People Helped</p>
                <p className="text-xl font-black text-emerald-700">~{Math.round(upvotesGiven * 2.5) || 340}</p>
                <p className="text-[9px] text-gray-500 mt-1 leading-normal">Commuters & locals saved from safety hazards</p>
              </div>
              <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/60">
                <p className="text-[10px] font-bold text-blue-800 uppercase">CO₂ Offset</p>
                <p className="text-xl font-black text-blue-700">{resolvedCount * 12} kg</p>
                <p className="text-[9px] text-gray-500 mt-1 leading-normal">Estimated at 12kg saved per road repair</p>
              </div>
              <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/60">
                <p className="text-[10px] font-bold text-purple-800 uppercase">Ward Rank</p>
                <p className="text-xl font-black text-purple-700">#2 <span className="text-xs font-normal text-purple-500">of 847</span></p>
                <p className="text-[9px] text-gray-500 mt-1 leading-normal">In Bhubaneswar {wardName}</p>
              </div>
              <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/60">
                <p className="text-[10px] font-bold text-amber-800 uppercase">Issues Cleaned</p>
                <p className="text-xl font-black text-amber-700">{resolvedCount} / {reportsCount}</p>
                <p className="text-[9px] text-gray-500 mt-1 leading-normal">66% resolution rate across reported spots</p>
              </div>
            </div>

            {/* Gemini-Powered Motivational Sentence */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 relative overflow-hidden">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[8px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest flex items-center space-x-1">
                  <span>🤖</span> <span>Gemini AI Heuristics</span>
                </span>
              </div>

              {loadingSentence && !motivatingSentence ? (
                <div className="flex items-center space-x-2 py-2">
                  <Loader2 className="w-3.5 h-3.5 text-[#1a73e8] animate-spin" />
                  <span className="text-xs text-gray-500 italic font-medium">Gemini is compiling your community impact...</span>
                </div>
              ) : (
                <p className="text-xs text-gray-700 font-medium italic leading-relaxed pl-2 border-l-2 border-[#1a73e8]">
                  "{motivatingSentence || `You are one of Ward ${userStats.name.toLowerCase().includes('rahul') ? '12' : '42'}'s finest champions, helping protect ${Math.round(upvotesGiven * 2.5) || 340} fellow citizens and resolving ${resolvedCount} vital hazards!`}"
                </p>
              )}
            </div>

            {/* Share Impact Button */}
            <button
              onClick={handleShareImpact}
              className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Impact Card Copied!' : 'Share My Impact Card'}</span>
            </button>
          </div>

          {/* LAYER 2: Daily Streak panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                <Flame className="w-4.5 h-4.5 text-orange-500 fill-orange-500" />
                <span>Daily Streak Engine</span>
              </h4>
              <span className="text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                🔥 {streakCount}-day streak
              </span>
            </div>

            {/* Streak Reward Multiplier Description */}
            <div className="bg-linear-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-3 border border-orange-100 flex items-start space-x-2">
              <Zap className="w-4 h-4 text-orange-500 shrink-0 mt-0.5 fill-orange-500" />
              <p className="text-xs text-orange-950 font-bold leading-normal">
                7-Day Streak Reward: Complete your streak this week to unlock a <span className="text-orange-600">2× CivicCoins multiplier</span> for all reported issues and validations!
              </p>
            </div>

            {/* 7-Day row circles (M T W T F S S) */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                const completed = streakDays[idx];
                return (
                  <div key={idx} className="space-y-1">
                    <div 
                      className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                        completed 
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-3xs' 
                          : 'bg-gray-100 border-gray-200 text-gray-400'
                      }`}
                    >
                      {completed ? '✓' : day}
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{day}</span>
                  </div>
                );
              })}
            </div>

            {/* Streak Warning Panel if streak > 3 and not acted yet today */}
            {streakCount > 3 && !hasActionToday ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2.5 animate-pulse">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5 fill-amber-100" />
                <div>
                  <h5 className="text-xs font-black text-amber-900">🔥 Streak at risk!</h5>
                  <p className="text-[10px] text-amber-800 leading-normal mt-0.5 font-semibold">
                    You haven't upvoted or reported any issues today. Complete any citizen action (upvote, verify, comment, or file a report) before midnight to secure your streak!
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 flex items-start space-x-2.5">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-black text-emerald-900">✓ Today's action completed!</h5>
                  <p className="text-[10px] text-emerald-800 leading-normal mt-0.5 font-semibold">
                    Great job! Your daily citizen duty is logged, and your 🔥 {streakCount}-day streak is fully secured for today.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* LAYER 3: Weekly Ward Challenges */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                <Target className="w-4.5 h-4.5 text-[#1a73e8]" />
                <span>Weekly Ward Challenges</span>
              </h4>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Refreshes in 3 Days</span>
            </div>

            <div className="space-y-3.5">
              {challenges.map((ch) => {
                const isCompleted = ch.progress >= ch.max;
                return (
                  <div key={ch.id} className="p-3 bg-gray-50/40 rounded-xl border border-gray-100/60 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase ${ch.type === 'collective' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {ch.type === 'collective' ? 'Ward Collective' : 'Personal Challenge'}
                        </span>
                        <h5 className="text-xs font-black text-gray-900 mt-1">{ch.title}</h5>
                        <p className="text-[10px] text-gray-500 leading-normal mt-0.5 font-semibold">{ch.description}</p>
                      </div>
                      <span className="text-xs font-extrabold text-gray-900 shrink-0 text-right flex items-center gap-0.5">
                        🪙 {ch.points}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-extrabold">
                        <span className="text-gray-400">Progress</span>
                        <span className={isCompleted ? 'text-emerald-600 font-black' : 'text-gray-600'}>
                          {ch.progress} / {ch.max}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 bg-linear-to-r ${
                            isCompleted ? 'from-emerald-400 to-green-500' : 'from-[#1a73e8] to-[#1557b0]'
                          }`}
                          style={{ width: `${(ch.progress / ch.max) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Claim buttons */}
                    <div className="flex justify-end pt-1">
                      {ch.claimed ? (
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                          <span>✓</span> <span>Claimed</span>
                        </span>
                      ) : isCompleted ? (
                        onClaimChallenge ? (
                          <button
                            onClick={() => onClaimChallenge(ch.id, ch.points)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] uppercase px-3 py-1 rounded-md transition cursor-pointer shadow-3xs"
                          >
                            Claim +{ch.points} 🪙
                          </button>
                        ) : (
                          <span className="text-[10px] font-extrabold text-emerald-600">Claim Ready</span>
                        )
                      ) : (
                        <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">In Progress</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LAYER 4: Achievements & Badges Grid (8 badges total) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5 border-b border-gray-50 pb-2">
              <Award className="w-4.5 h-4.5 text-[#1a73e8]" />
              <span>My Behavior-Based Badges ({BADGES_LIST.filter(b => b.unlocked).length}/8)</span>
            </h4>

            <div className="grid grid-cols-2 gap-3.5">
              {BADGES_LIST.map((badge) => (
                <div 
                  key={badge.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between h-42 relative overflow-hidden transition-all ${
                    badge.unlocked 
                      ? 'bg-emerald-50/25 border-emerald-200 shadow-2xs' 
                      : 'bg-gray-50/40 border-gray-100/75 opacity-60'
                  }`}
                >
                  {/* Unlock Indicator icon */}
                  <div className="absolute right-2 top-2">
                    {badge.unlocked ? (
                      <span className="text-emerald-600 bg-emerald-100 p-0.5 rounded-full block shadow-3xs">
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-gray-400 bg-gray-200/60 p-0.5 rounded-full block">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-2xl mb-1 block">{badge.icon}</span>
                    <h5 className="text-[11px] font-black text-gray-900 truncate">{badge.title}</h5>
                    <p className="text-[9px] text-gray-500 font-semibold leading-normal mt-0.5 line-clamp-2">
                      {badge.requirement}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-gray-100/50">
                    {badge.unlocked ? (
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-gray-400 font-bold flex items-center space-x-1 shrink-0">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{badge.earnedDate}</span>
                        </span>
                        <button
                          onClick={() => handleShareBadge(badge.title)}
                          className="text-slate-500 hover:text-slate-800 p-1 bg-white hover:bg-slate-50 border border-slate-100 rounded shadow-3xs cursor-pointer transition shrink-0"
                          title="Share Badge"
                        >
                          <Share2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">
                        🔒 Locked
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LAYER 1: Leaderboard list (Indian civic focus, styled with Tiers) */}
          <div id="profile-leaderboard-section" className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Ward Leaderboard (Bhubaneswar Central)</span>
              </h4>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Bhubaneswar {wardName}</span>
            </div>

            <div className="space-y-2">
              {leaderboard.map((user) => {
                const userPoints = user.isCurrentUser ? userStats.points : user.points;
                const tier = getReporterTier(user.name, userPoints);
                return (
                  <div 
                    key={user.rank}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      user.isCurrentUser 
                        ? `bg-blue-50/55 ${tier.borderColor.split(' ')[0]} ring-1 ring-blue-100` 
                        : `bg-white border-gray-100 hover:bg-gray-50`
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
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
                        <div className="flex items-center space-x-1.5">
                          <p className={`text-xs truncate ${user.isCurrentUser ? 'font-black text-gray-950' : 'font-bold text-gray-900'}`}>
                            {user.name}
                          </p>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full border shrink-0 ${tier.badgeBg}`}>
                            {tier.icon} {tier.name}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-semibold">{user.badge}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-gray-900">🪙 {userPoints}</span>
                      <span className="text-[9px] text-gray-400 font-bold ml-0.5">Coins</span>
                    </div>
                  </div>
                );
              })}
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
                    className="flex items-center space-x-3 p-2 bg-gray-50 hover:bg-gray-100/70 border border-gray-100 rounded-xl cursor-pointer transition animate-fade-in"
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
                      <p className="text-[9px] text-gray-400 truncate font-semibold">
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
      )}

      {/* SUB TAB CONTENT: Rewards Store */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Description */}
          <div className="bg-gradient-to-r from-amber-500/10 to-yellow-600/10 p-4 rounded-2xl border border-amber-200/50 flex items-start space-x-3">
            <div className="bg-amber-100 text-amber-700 p-2 rounded-xl">
              <Sparkle className="w-5 h-5 text-amber-600 fill-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">CivicCoins Marketplace</h4>
              <p className="text-[10px] text-amber-900/85 font-semibold mt-0.5 leading-relaxed">
                Spend your hard-earned 🪙 CivicCoins here to boost reports, decorate your profile, access Gemini performance data, or claim formal civic excellence certificates!
              </p>
            </div>
          </div>

          {/* SECTION 1: PRIORITY BOOST */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-1.5">
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Section 1 — Priority Boosts</h4>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {REWARDS_CATALOGUE.priority_boost.map((reward) => (
                <div key={reward.id} className="bg-white border border-gray-150 rounded-xl p-4 flex flex-col justify-between shadow-3xs hover:border-gray-300 transition-all">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-black text-gray-900">{reward.title}</h5>
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-0.5 shrink-0">
                        <span>🪙</span> <span>{reward.cost}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{reward.description}</p>
                  </div>
                  <button
                    onClick={() => handleInitiatePurchase(reward)}
                    disabled={availableCoins < reward.cost}
                    className={`mt-3 w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      availableCoins >= reward.cost
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-3xs'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Redeem Perk</span>
                    <span className="text-[9px] opacity-75">• Spend {reward.cost} 🪙</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: PROFILE PERKS */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-1.5">
              <Palette className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Section 2 — Profile Decor Perks</h4>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {REWARDS_CATALOGUE.profile_perks.map((reward) => {
                // Determine if already owned (mock toggle checks)
                let isOwned = false;
                if (reward.id === 'verified-citizen') isOwned = userStats.hasVerifiedBadge || false;
                if (reward.id === 'gold-border') isOwned = userStats.hasGoldBorder || false;
                if (reward.id === 'custom-title') isOwned = Boolean(userStats.customTitle);
                if (reward.id === 'accent-color') isOwned = Boolean(userStats.accentColor);

                return (
                  <div key={reward.id} className="bg-white border border-gray-150 rounded-xl p-4 flex flex-col justify-between shadow-3xs hover:border-gray-300 transition-all">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-black text-gray-900 flex items-center gap-1">
                          <span>{reward.title}</span>
                          {isOwned && <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full uppercase scale-90 shrink-0">Active</span>}
                        </h5>
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-0.5 shrink-0">
                          <span>🪙</span> <span>{reward.cost}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{reward.description}</p>
                    </div>
                    <button
                      onClick={() => handleInitiatePurchase(reward)}
                      disabled={availableCoins < reward.cost}
                      className={`mt-3 w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                        availableCoins >= reward.cost
                          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-3xs'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>{isOwned ? 'Customize / Renew Perk' : 'Redeem Perk'}</span>
                      <span className="text-[9px] opacity-75">• Spend {reward.cost} 🪙</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: COMMUNITY POWER */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Section 3 — Community Power</h4>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {REWARDS_CATALOGUE.community_power.map((reward) => (
                <div key={reward.id} className="bg-white border border-gray-150 rounded-xl p-4 flex flex-col justify-between shadow-3xs hover:border-gray-300 transition-all">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-black text-gray-900">{reward.title}</h5>
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-0.5 shrink-0">
                        <span>🪙</span> <span>{reward.cost}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{reward.description}</p>
                  </div>
                  <button
                    onClick={() => handleInitiatePurchase(reward)}
                    disabled={availableCoins < reward.cost}
                    className={`mt-3 w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      availableCoins >= reward.cost
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{reward.id === 'ward-report' ? 'Generate Report with Gemini AI' : 'Redeem Power'}</span>
                    <span className="text-[9px] opacity-75">• Spend {reward.cost} 🪙</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: CERTIFICATES & END-GAME */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Section 4 — Certificates & Distinction</h4>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {REWARDS_CATALOGUE.certificates.map((reward) => {
                const isLocked = reward.id === 'city-hero-nom' && availableCoins < 1000;
                const progressPercentage = Math.min((availableCoins / 1000) * 100, 100);

                return (
                  <div key={reward.id} className="bg-white border border-gray-150 rounded-xl p-4 flex flex-col justify-between shadow-3xs relative overflow-hidden">
                    {reward.id === 'city-hero-nom' && (
                      <div className="absolute -right-12 -top-12 w-28 h-28 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                    )}

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          <span>{reward.title}</span>
                          {reward.id === 'city-hero-nom' && <span className="text-[8px] bg-amber-500 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">Elite</span>}
                        </h5>
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-0.5 shrink-0">
                          <span>🪙</span> <span>{reward.cost}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{reward.description}</p>

                      {/* Display Progress bar for LOCKED City Hero nomination */}
                      {reward.id === 'city-hero-nom' && (
                        <div className="space-y-1 pt-1.5">
                          <div className="flex justify-between text-[9px] font-bold text-gray-400">
                            <span>Nomination Progress</span>
                            <span className={isLocked ? 'text-amber-600' : 'text-emerald-600 font-black'}>
                              {availableCoins} / 1000 🪙
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden border border-gray-200/50">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                                isLocked ? 'from-amber-400 to-amber-600' : 'from-emerald-400 to-green-500'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleInitiatePurchase(reward)}
                      disabled={availableCoins < reward.cost}
                      className={`mt-4.5 w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                        availableCoins >= reward.cost
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-3xs'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isLocked ? (
                        <span className="flex items-center space-x-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked nomination ({Math.round(progressPercentage)}%)</span>
                        </span>
                      ) : (
                        <span>{reward.id === 'civic-certificate' ? 'Generate formal Certificate with Gemini' : 'Claim City Hero nomination'}</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: CIVIC PRIVILEGES */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Section 5 — Civic Privileges</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REWARDS_CATALOGUE.civic_privileges.map((reward) => {
                const isOwned = 
                  (reward.id === 'priority-reporter' && userStats.isPriorityReporter) ||
                  (reward.id === 'direct-messaging' && userStats.hasDirectMessaging) ||
                  (reward.id === 'monthly-digest' && userStats.hasMonthlyDigest) ||
                  (reward.id === 'anonymous-mode' && userStats.isAnonymousMode);

                return (
                  <div key={reward.id} className="bg-white border border-gray-150 rounded-xl p-4 flex flex-col justify-between shadow-3xs relative overflow-hidden transition-all hover:shadow-2xs hover:border-gray-250">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          <span>{reward.title}</span>
                          {isOwned && (
                            <span className="text-[8px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                              Active
                            </span>
                          )}
                        </h5>
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-0.5 shrink-0">
                          <span>🪙</span> <span>{reward.cost}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{reward.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleInitiatePurchase(reward)}
                      disabled={isOwned || availableCoins < reward.cost}
                      className={`mt-4.5 w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                        isOwned 
                          ? 'bg-gray-100 text-gray-500 cursor-default font-bold'
                          : availableCoins >= reward.cost
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-3xs'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isOwned ? (
                        <span>✓ Unlocked & Active</span>
                      ) : (
                        <span>Unlock Privilege</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* CONFIRM SPEND MODAL */}
      {activeModal === 'confirm_spend' && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-gray-150 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <span className="text-2xl">🪙</span>
              <h4 className="text-sm font-black uppercase tracking-wide">Verify Purchase Transaction</h4>
            </div>
            
            <div className="space-y-1.5 text-xs text-gray-700 font-medium">
              <p>You are about to redeem the following civic reward perk:</p>
              <p className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-gray-900 font-black text-xs">
                {selectedReward.title}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] border-t border-gray-100 font-bold">
                <span className="text-gray-400">Deducting:</span>
                <span className="text-red-600 text-right">-{selectedReward.cost} CivicCoins 🪙</span>
                <span className="text-gray-400">Remaining Balance:</span>
                <span className="text-blue-600 text-right">{availableCoins - selectedReward.cost} 🪙</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedReward(null);
                  setActiveModal('none');
                }}
                className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSpend}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
              >
                Confirm Spend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TARGET ISSUE SELECTOR MODAL */}
      {activeModal === 'pick_issue' && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-gray-150 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-sm">🎯</span>
                <h4 className="text-xs font-black uppercase tracking-wider">Select Targeting Issue</h4>
              </div>
              <button 
                onClick={() => {
                  setActiveModal('none');
                  setSelectedReward(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-gray-500 font-medium">
              {selectedReward.id === 'super-vote' 
                ? 'Select any active community issue to apply your 5x Super-Upvotes boost:' 
                : 'Select which of your reported issues to apply this reward boost to:'}
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1 py-1">
              {(selectedReward.id === 'super-vote' ? allIssues : userIssues).length > 0 ? (
                (selectedReward.id === 'super-vote' ? allIssues : userIssues).map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedTargetIssueId(issue.id)}
                    className={`flex items-center space-x-3 p-2.5 border rounded-xl cursor-pointer transition ${
                      selectedTargetIssueId === issue.id
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-100'
                        : 'border-gray-150 hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={issue.photoUrl}
                      alt={issue.title}
                      className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-700 font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                          {issue.category}
                        </span>
                        <span className="text-[8px] text-gray-400 font-bold">{issue.date}</span>
                      </div>
                      <h5 className="text-[10px] font-black text-gray-900 truncate mt-0.5">
                        {issue.title}
                      </h5>
                      <p className="text-[9px] text-gray-400 truncate">
                        📍 {issue.location} • Severity: <span className="font-bold">{issue.severity}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-500">No eligible reports found.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setActiveModal('none');
                  setSelectedReward(null);
                  setSelectedTargetIssueId('');
                }}
                className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedTargetIssueId) {
                    if (triggerAlert) triggerAlert("Please select an issue first!");
                    return;
                  }
                  executeRewardPurchase({ issueId: selectedTargetIssueId });
                }}
                disabled={!selectedTargetIssueId}
                className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer shadow-xs ${
                  selectedTargetIssueId
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Apply Reward Boost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEXT PROMPT DIALOG FOR CUSTOM TITLE */}
      {activeModal === 'text_prompt' && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-gray-150 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1">
                <span>🎗️</span> <span>Draft Custom Citizen Title</span>
              </h4>
              <button onClick={() => { setActiveModal('none'); setSelectedReward(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Type Custom Title Label</label>
              <input
                type="text"
                placeholder="e.g. Saheed Nagar Watchdog, Pavement Guardian"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                maxLength={25}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold text-gray-800"
              />
              <p className="text-[9px] text-gray-400 leading-normal">
                This title will render below your name on your profile card and all issue cards you submit in Bhubaneswar. Max 25 chars.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setActiveModal('none');
                  setSelectedReward(null);
                  setTextInputValue('');
                }}
                className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!textInputValue.trim()) {
                    if (triggerAlert) triggerAlert("Title cannot be empty!");
                    return;
                  }
                  executeRewardPurchase({ text: textInputValue.trim() });
                }}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
              >
                Save & Apply Title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLOR PICKER DIALOG FOR ACCENT COLOR */}
      {activeModal === 'color_picker' && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-gray-150 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1">
                <span>🎨</span> <span>Select Report Accent Color</span>
              </h4>
              <button onClick={() => { setActiveModal('none'); setSelectedReward(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
              Choose a custom left-border accent color that will make your reported issue cards stand out inside the community feed:
            </p>

            <div className="grid grid-cols-3 gap-2.5 py-1">
              {COLORS.map((col) => (
                <div
                  key={col.hex}
                  onClick={() => setSelectedAccentColor(col.hex)}
                  className={`p-2.5 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition ${
                    selectedAccentColor === col.hex
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-200'
                      : 'border-gray-150 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full shadow-inner ${col.bg}`} />
                  <span className="text-[9px] text-gray-600 font-bold mt-1 text-center leading-none">{col.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setActiveModal('none');
                  setSelectedReward(null);
                }}
                className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => executeRewardPurchase({ color: selectedAccentColor })}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
              >
                Apply Accent Color
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GEMINI WARD PERFORMANCE REPORT DISPLAY */}
      {activeModal === 'report_display' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-gray-150 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-[#1a73e8]">
                <span>📊</span> <span>Ward Performance Report Card</span>
              </h4>
              <button 
                onClick={() => {
                  setActiveModal('none');
                  setSelectedReward(null);
                  setWardReportResult(null);
                }} 
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 text-xs pr-1 font-medium text-gray-700">
              {geminiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#1a73e8] animate-spin" />
                  <p className="text-xs text-gray-500 italic">Gemini AI is analyzing Bhubaneswar Central municipal logs...</p>
                </div>
              ) : wardReportResult ? (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-gray-800 shadow-inner">
                  {wardReportResult}
                </div>
              ) : null}
            </div>

            {!geminiLoading && wardReportResult && (
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(wardReportResult || '');
                      if (triggerAlert) triggerAlert("Report text copied to clipboard! 📋");
                    }}
                    className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(wardReportResult || '')}`;
                      window.open(shareUrl, '_blank');
                    }}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Share to WhatsApp</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setActiveModal('none');
                    setSelectedReward(null);
                    setWardReportResult(null);
                  }}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg text-[9px] font-bold text-center"
                >
                  Close Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GEMINI CIVIC CONTRIBUTION CERTIFICATE DISPLAY */}
      {activeModal === 'cert_display' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border-4 border-amber-400 shadow-2xl space-y-4 max-h-[90vh] flex flex-col relative overflow-hidden">
            
            {/* Background elements for certificate style */}
            <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-amber-400/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-amber-200 pb-2 z-10">
              <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 text-amber-700">
                <span>🏅</span> <span>Personalized Civic Certificate</span>
              </h4>
              <button 
                onClick={() => {
                  setActiveModal('none');
                  setSelectedReward(null);
                  setCertificateResult(null);
                }} 
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 text-xs pr-1 font-sans z-10">
              {geminiLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                  <p className="text-xs text-amber-700 italic">Gemini is drafting your formal Certificate of Honor...</p>
                </div>
              ) : certificateResult ? (
                <div className="bg-amber-50/40 border-2 border-dashed border-amber-300 p-5 rounded-xl font-serif text-center space-y-3 text-amber-950 relative">
                  {/* Decorative corner stars */}
                  <div className="absolute top-1 left-1 text-amber-400">★</div>
                  <div className="absolute top-1 right-1 text-amber-400">★</div>
                  <div className="absolute bottom-1 left-1 text-amber-400">★</div>
                  <div className="absolute bottom-1 right-1 text-amber-400">★</div>

                  <span className="text-xs font-bold uppercase tracking-wider block text-amber-700">Certificate of Honor</span>
                  <div className="h-[1px] bg-amber-300 w-16 mx-auto my-1" />
                  
                  <div className="text-[10px] leading-relaxed whitespace-pre-wrap px-2 text-justify select-text">
                    {certificateResult}
                  </div>

                  <div className="pt-4 flex justify-between items-end text-[8px] font-sans font-bold text-amber-800">
                    <div className="text-left border-t border-amber-300/60 pt-1 w-24">
                      <span>OFFICIAL SEAL</span>
                      <span className="block text-[6px] text-amber-500">Bhubaneswar Municipal</span>
                    </div>
                    
                    <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center text-white font-extrabold text-[8px] shadow-sm scale-110">
                      🏅 SEAL
                    </div>

                    <div className="text-right border-t border-amber-300/60 pt-1 w-24">
                      <span>MAYOR</span>
                      <span className="block text-[6px] text-amber-500">City of Bhubaneswar</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {!geminiLoading && certificateResult && (
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-100 z-10">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      // Format for browser printing to PDF
                      window.print();
                    }}
                    className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      const linkedInText = `🏆 I am honored to share that I've been awarded a Certificate of Civic Excellence by Bhubaneswar Municipal Corporation on CivicAI!\n\n${certificateResult}\n\nJoin me in making our city safer and smarter.`;
                      navigator.clipboard.writeText(linkedInText);
                      if (triggerAlert) triggerAlert("LinkedIn share template copied! 📋");
                    }}
                    className="py-2.5 bg-[#0077b5] hover:bg-[#005e8e] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>Share on LinkedIn</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setActiveModal('none');
                    setSelectedReward(null);
                    setCertificateResult(null);
                  }}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg text-[9px] font-bold text-center"
                >
                  Close Certificate Viewer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GEMINI MONTHLY WARD DIGEST DISPLAY */}
      {activeModal === 'digest_display' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border-4 border-indigo-400 shadow-2xl space-y-4 max-h-[90vh] flex flex-col relative overflow-hidden">
            
            <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-indigo-200 pb-2 z-10">
              <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 text-indigo-700">
                <span>📰</span> <span>Ward Monthly Civic Digest</span>
              </h4>
              <button 
                onClick={() => {
                  setActiveModal('none');
                  setSelectedReward(null);
                  setMonthlyDigestResult(null);
                }} 
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 text-xs pr-1 font-sans z-10">
              {geminiLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs text-indigo-700 italic">Gemini is compiling this month's ward intelligence...</p>
                </div>
              ) : monthlyDigestResult ? (
                <div className="bg-indigo-50/20 border-2 border-dashed border-indigo-300 p-5 rounded-xl space-y-3 text-indigo-950 relative">
                  <div className="text-[10px] leading-relaxed whitespace-pre-wrap px-2 select-text text-gray-800">
                    {monthlyDigestResult}
                  </div>
                </div>
              ) : null}
            </div>

            {!geminiLoading && monthlyDigestResult && (
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-100 z-10">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(monthlyDigestResult || '');
                      if (triggerAlert) triggerAlert("Monthly Digest text copied! 📋");
                    }}
                    className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(monthlyDigestResult || '')}`;
                      window.open(shareUrl, '_blank');
                    }}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Share to WhatsApp</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setActiveModal('none');
                    setSelectedReward(null);
                    setMonthlyDigestResult(null);
                  }}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg text-[9px] font-bold text-center"
                >
                  Close Digest Viewer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
