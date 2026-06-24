/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Compass, 
  Layers, 
  User, 
  Sparkles,
  Award,
  Bell,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types & Mock Data
import { CivicIssue, LeaderboardUser, UserStats, IssueStatus } from './types';
import { INITIAL_ISSUES, MOCK_LEADERBOARD, MOCK_USER_STATS } from './mockData';

// Subcomponents
import Header from './components/Header';
import GamificationStrip from './components/GamificationStrip';
import ReportForm from './components/ReportForm';
import InteractiveMap from './components/InteractiveMap';
import IssuesFeed from './components/IssuesFeed';
import ProfileView from './components/ProfileView';
import OnboardingModal from './components/OnboardingModal';
import CivicBot from './components/CivicBot';
import { APIProvider } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('Report');
  const [issues, setIssues] = useState<CivicIssue[]>(INITIAL_ISSUES);
  const [userStats, setUserStats] = useState<UserStats>(MOCK_USER_STATS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(MOCK_LEADERBOARD);
  
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !localStorage.getItem('civic_onboarding_completed');
    }
    return true;
  });
  
  // Selected issue from Map to auto-expand in Dashboard
  const [selectedIssueFromMap, setSelectedIssueFromMap] = useState<CivicIssue | null>(null);

  // Status Alerts for points or level up
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState<boolean>(false);

  // Helper to trigger points alert
  const triggerAlert = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => {
      setAlertMessage(null);
    }, 3000);
  };

  // Add points & handle potential level ups (Level is every 200 points)
  const handleAddPoints = (pts: number) => {
    setUserStats(prev => {
      const newPoints = prev.points + pts;
      const pointsToNext = 200;
      const expectedLevel = Math.floor(newPoints / pointsToNext) + 1;
      let levelUpOccurred = false;

      if (expectedLevel > prev.level) {
        levelUpOccurred = true;
        setShowLevelUp(true);
      }

      // Update current user rank on the leaderboard
      setLeaderboard(lead => {
        const updatedList = lead.map(u => {
          if (u.isCurrentUser) {
            const updatedPts = u.points + pts;
            // Determine a new rank or badge if points change significantly
            return {
              ...u,
              points: updatedPts,
              badge: updatedPts >= 500 ? 'Active Citizen ⭐' : 'Initiate Citizen 🌱'
            };
          }
          return u;
        });
        return updatedList
          .sort((a, b) => b.points - a.points)
          .map((u, index) => ({
            ...u,
            rank: index + 1
          }));
      });

      // Recalculate rank for userStats
      setTimeout(() => {
        setLeaderboard(lead => {
          const self = lead.find(u => u.isCurrentUser);
          if (self) {
            setUserStats(s => ({
              ...s,
              rank: self.rank,
              badge: self.badge
            }));
          }
          return lead;
        });
      }, 100);

      return {
        ...prev,
        points: newPoints,
        level: expectedLevel,
        reportsCount: pts === 50 ? prev.reportsCount + 1 : prev.reportsCount
      };
    });

    triggerAlert(`+${pts} Civic XP Added! ⚡`);
  };

  // Handle a new issue submission from Report tab
  const handleSubmitIssue = (newIssueData: Partial<CivicIssue>, routeResult?: any) => {
    if (routeResult?.status === 'duplicate') {
      const duplicateId = routeResult.duplicateIssueId;
      setIssues(prev => {
        return prev.map(issue => {
          if (issue.id === duplicateId) {
            return {
              ...issue,
              upvotes: issue.hasUpvoted ? issue.upvotes : issue.upvotes + 1,
              hasUpvoted: true
            };
          }
          return issue;
        });
      });
      triggerAlert('Matched duplicate report! Your upvote has been merged automatically. 🔔');
    } else {
      const trackingId = routeResult?.trackingId || `issue-${Date.now()}`;
      const formattedIssue: CivicIssue = {
        id: trackingId,
        title: newIssueData.title || 'Untitled Issue',
        description: newIssueData.description || '',
        category: newIssueData.category || 'Pothole',
        severity: newIssueData.severity || 'Medium',
        location: newIssueData.location || '',
        gps: newIssueData.gps || null,
        photoUrl: newIssueData.photoUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
        upvotes: 0,
        status: 'Open',
        date: new Date().toISOString().split('T')[0],
        reporterName: 'You (Ankit Kumar)',
        comments: []
      };

      // Prepend to issue list
      setIssues(prev => [formattedIssue, ...prev]);
    }

    // Automatically transition to the Dashboard tab so they can see their report
    setTimeout(() => {
      setActiveTab('Dashboard');
    }, 1200);
  };

  // Upvote issue and grant validation points if upvoting for the first time
  const handleUpvoteIssue = (id: string) => {
    let wasUpvoted = false;
    setIssues(prev => {
      return prev.map(issue => {
        if (issue.id === id) {
          wasUpvoted = !issue.hasUpvoted;
          return {
            ...issue,
            upvotes: issue.hasUpvoted ? issue.upvotes - 1 : issue.upvotes + 1,
            hasUpvoted: !issue.hasUpvoted
          };
        }
        return issue;
      });
    });

    if (wasUpvoted) {
      handleAddPoints(5); // 5 points for validating!
      triggerAlert('Issue validated! +5 BMC points ⭐');
    } else {
      setUserStats(prev => ({
        ...prev,
        points: Math.max(0, prev.points - 5)
      }));
      triggerAlert('Upvote retracted');
    }
  };

  // Add Comment & grant engagement points (+10 XP)
  const handleAddComment = (issueId: string, commentText: string) => {
    const newComment = {
      id: `comment-${Date.now()}`,
      userName: 'You (Ankit Kumar)',
      text: commentText,
      date: new Date().toISOString().split('T')[0]
    };

    setIssues(prev => {
      return prev.map(issue => {
        if (issue.id === issueId) {
          return {
            ...issue,
            comments: [...issue.comments, newComment]
          };
        }
        return issue;
      });
    });

    handleAddPoints(10); // 10 points for commenting!
    triggerAlert('Comment posted! +10 Engagement points 💬');
  };

  // Set selected issue from Map for deep inspection in Dashboard
  const handleSelectIssueFromMap = (issue: CivicIssue) => {
    setSelectedIssueFromMap(issue);
    setActiveTab('Dashboard');
  };

  const handleResolveIssue = (issueId: string) => {
    setIssues(prev => {
      return prev.map(issue => {
        if (issue.id === issueId) {
          return {
            ...issue,
            status: 'Resolved' as IssueStatus,
            comments: [
              ...issue.comments,
              {
                id: `comment-res-${Date.now()}`,
                userName: 'Department Marshal (System)',
                text: 'The department has completed the repairs at the site and marked this issue as RESOLVED. Reporting citizens, please verify if this has been fixed successfully by uploading a verification photo!',
                date: new Date().toISOString().split('T')[0]
              }
            ]
          };
        }
        return issue;
      });
    });
    triggerAlert('Issue marked as Resolved by department! Waiting for citizen verification. 🔔');
  };

  const handleVerifyResolution = (
    issueId: string, 
    isResolved: boolean, 
    confidence: number, 
    explanation: string, 
    whatChanged: string, 
    whatRemains: string, 
    uploadedPhotoUrl: string
  ) => {
    setIssues(prev => {
      return prev.map(issue => {
        if (issue.id === issueId) {
          const updatedStatus = isResolved ? ('Resolved' as IssueStatus) : ('Open' as IssueStatus);
          
          const commentText = isResolved
            ? `🤖 AI Resolution Audit: VERIFIED RESOLVED (${confidence}% confidence). ${explanation}. Visible changes: ${whatChanged}`
            : `🚨 AI Resolution Audit: REJECTED (Confidence: ${100 - confidence}%). Issue is NOT fully resolved. ${explanation}. What remains: ${whatRemains}. Automatically re-opened.`;

          return {
            ...issue,
            status: updatedStatus,
            resolutionPhotoUrl: uploadedPhotoUrl,
            resolutionAiVerdict: {
              isResolved,
              confidence,
              explanation,
              whatChanged,
              whatRemains
            },
            comments: [
              ...issue.comments,
              {
                id: `comment-ver-${Date.now()}`,
                userName: 'AI Verification Agent (System)',
                text: commentText,
                date: new Date().toISOString().split('T')[0]
              }
            ]
          };
        }
        return issue;
      });
    });

    if (isResolved) {
      handleAddPoints(20);
      triggerAlert('AI verified resolution! +20 BMC verification points 🏆');
    } else {
      triggerAlert('AI flagged incomplete repair. Issue re-opened & department notified! ⚠️');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-0 md:py-6 px-0 md:px-4 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {!hasValidKey ? (
        <div className="w-full max-w-md md:rounded-[40px] md:shadow-2xl md:border-[12px] md:border-gray-900 overflow-hidden bg-white flex flex-col h-screen md:h-[840px] justify-center items-center p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-[#1a73e8] rounded-2xl flex items-center justify-center text-3xl font-bold shadow-sm">
            🗺️
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900">Google Maps Key Required</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              CivicAI requires a Google Maps Platform API key to visualize street hazards in real-time.
            </p>
          </div>
          
          <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left space-y-3">
            <p className="text-xs font-bold text-gray-800">Follow these simple steps:</p>
            <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside font-medium leading-relaxed">
              <li>
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#1a73e8] hover:underline font-bold"
                >
                  Get a Google Maps API Key
                </a>
              </li>
              <li>
                Open <span className="font-bold text-gray-900">Settings</span> (⚙️ gear icon, top-right corner)
              </li>
              <li>
                Go to <span className="font-bold text-gray-900">Secrets</span>, create <code className="bg-gray-200 px-1 py-0.5 rounded text-[10px] font-mono text-gray-800">GOOGLE_MAPS_PLATFORM_KEY</code>
              </li>
              <li>
                Paste your API key and save. The app builds automatically.
              </li>
            </ol>
          </div>

          <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
            CivicAI India • Bhubaneswar
          </div>
        </div>
      ) : (
        <APIProvider apiKey={API_KEY} version="weekly">
          {/* 
            Phone Mockup Frame on Desktop, 
            Edge-to-Edge Native Application on Mobile 
          */}
          <div className="w-full max-w-md md:rounded-[40px] md:shadow-2xl md:border-[12px] md:border-gray-900 overflow-hidden bg-white flex flex-col h-screen md:h-[840px] relative">
            
            {/* Sticky Header */}
            <Header />

            {/* Onboarding Screen for First-Time Users */}
            <AnimatePresence>
              {showOnboarding && (
                <OnboardingModal 
                  onComplete={() => {
                    localStorage.setItem('civic_onboarding_completed', 'true');
                    setShowOnboarding(false);
                  }}
                />
              )}
            </AnimatePresence>

            {/* Gamification Indicator Strip */}
            <GamificationStrip 
              points={userStats.points}
              badge={userStats.badge}
              rank={userStats.rank}
              level={userStats.level}
              pointsToNextLevel={200}
            />

            {/* Real-time Popup alert for point bonuses */}
            <AnimatePresence>
              {alertMessage && (
                <motion.div
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  className="absolute top-36 left-4 right-4 bg-gray-900 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg z-50 flex items-center justify-between border border-gray-800"
                >
                  <span>{alertMessage}</span>
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Level Up Celebration Screen Overlay */}
            <AnimatePresence>
              {showLevelUp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 z-50 flex flex-col justify-center items-center text-white p-6"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white text-gray-950 p-6 rounded-3xl text-center space-y-6 max-w-xs shadow-2xl relative overflow-hidden"
                  >
                    {/* Decorative confetti particles */}
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-blue-500"></div>

                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold animate-bounce">
                      👑
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest">Congratulations!</p>
                      <h3 className="text-xl font-black">Level Up Reached!</h3>
                      <p className="text-sm font-extrabold text-blue-600">You are now Level {userStats.level}</p>
                    </div>

                    <p className="text-xs text-gray-500 leading-normal">
                      Thank you for keeping Bhubaneswar's streets secure and validating community hazards. You have unlocked new municipal priorities!
                    </p>

                    <button
                      onClick={() => setShowLevelUp(false)}
                      className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md"
                    >
                      Awesome, Continue
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content Area (Scrollable Section) */}
            <main className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] relative scrollbar-none pb-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {activeTab === 'Report' && (
                    <ReportForm 
                      onSubmitIssue={handleSubmitIssue}
                      onAddPoints={handleAddPoints}
                      issues={issues}
                    />
                  )}

                  {activeTab === 'Map' && (
                    <InteractiveMap 
                      issues={issues}
                      onUpvoteIssue={handleUpvoteIssue}
                      onSelectIssue={handleSelectIssueFromMap}
                    />
                  )}

                  {activeTab === 'Dashboard' && (
                    <IssuesFeed 
                      issues={issues}
                      onUpvoteIssue={handleUpvoteIssue}
                      onAddComment={handleAddComment}
                      selectedIssueFromMap={selectedIssueFromMap}
                      clearSelectedIssueFromMap={() => setSelectedIssueFromMap(null)}
                      onResolveIssue={handleResolveIssue}
                      onVerifyResolution={handleVerifyResolution}
                    />
                  )}

                  {activeTab === 'Profile' && (
                    <ProfileView 
                      userStats={userStats}
                      leaderboard={leaderboard}
                      userIssues={issues.filter(i => i.reporterName === 'You (Ankit Kumar)')}
                      onSelectIssue={handleSelectIssueFromMap}
                      onSwitchTab={setActiveTab}
                    />
                  )}
                </motion.div>
              </AnimatePresence>


            </main>

            {/* CivicBot Floating Chat Assistant */}
            <CivicBot issues={issues} />

            {/* 
              Sticky Bottom Navigation Bar 
              With 4 Tabs: Report, Map, Dashboard, Profile
            */}
            <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-2.5 flex justify-around items-center z-40 shadow-lg">
              <button
                onClick={() => {
                  setActiveTab('Report');
                  setSelectedIssueFromMap(null);
                }}
                className={`flex flex-col items-center space-y-1 transition-all ${
                  activeTab === 'Report' ? 'text-[#1a73e8] scale-105' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <AlertTriangle className={`w-5.5 h-5.5 ${activeTab === 'Report' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] font-bold">Report</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('Map');
                  setSelectedIssueFromMap(null);
                }}
                className={`flex flex-col items-center space-y-1 transition-all ${
                  activeTab === 'Map' ? 'text-[#1a73e8] scale-105' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Compass className={`w-5.5 h-5.5 ${activeTab === 'Map' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] font-bold">Map</span>
              </button>

              <button
                onClick={() => setActiveTab('Dashboard')}
                className={`flex flex-col items-center space-y-1 transition-all ${
                  activeTab === 'Dashboard' ? 'text-[#1a73e8] scale-105' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Layers className={`w-5.5 h-5.5 ${activeTab === 'Dashboard' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] font-bold">Feed</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('Profile');
                  setSelectedIssueFromMap(null);
                }}
                className={`flex flex-col items-center space-y-1 transition-all ${
                  activeTab === 'Profile' ? 'text-[#1a73e8] scale-105' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <User className={`w-5.5 h-5.5 ${activeTab === 'Profile' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] font-bold">Profile</span>
              </button>
            </nav>

          </div>
        </APIProvider>
      )}
    </div>
  );
}
