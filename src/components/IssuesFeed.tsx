/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ThumbsUp, 
  MessageSquare, 
  MapPin, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  User,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  Users,
  Award,
  Sparkles,
  Layers,
  AlertTriangle,
  Share2,
  Camera,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { CivicIssue, IssueCategory, IssueStatus } from '../types';
import WardScorecard from './WardScorecard';

interface IssuesFeedProps {
  issues: CivicIssue[];
  onUpvoteIssue: (id: string) => void;
  onAddComment: (issueId: string, commentText: string) => void;
  selectedIssueFromMap?: CivicIssue | null;
  clearSelectedIssueFromMap?: () => void;
  onResolveIssue?: (id: string) => void;
  onVerifyResolution?: (
    id: string,
    isResolved: boolean,
    confidence: number,
    explanation: string,
    whatChanged: string,
    whatRemains: string,
    uploadedPhotoUrl: string
  ) => void;
  triggerAlert?: (msg: string) => void;
}

export default function IssuesFeed({
  issues,
  onUpvoteIssue,
  onAddComment,
  selectedIssueFromMap,
  clearSelectedIssueFromMap,
  onResolveIssue,
  onVerifyResolution,
  triggerAlert
}: IssuesFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [newCommentTexts, setNewCommentTexts] = useState<{ [key: string]: string }>({});
  const [copiedIssueId, setCopiedIssueId] = useState<string | null>(null);

  // States for verification
  const [verifyingIssues, setVerifyingIssues] = useState<{ [key: string]: boolean }>({});
  const [verifyErrors, setVerifyErrors] = useState<{ [key: string]: string | null }>({});

  const handleVerifyUpload = async (e: React.ChangeEvent<HTMLInputElement>, issue: CivicIssue) => {
    const file = e.target.files?.[0];
    if (!file || !onVerifyResolution) return;

    const issueId = issue.id;
    setVerifyingIssues(prev => ({ ...prev, [issueId]: true }));
    setVerifyErrors(prev => ({ ...prev, [issueId]: null }));

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      try {
        const response = await fetch('/api/gemini/compare-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            originalPhotoUrl: issue.photoUrl,
            newPhotoUrl: base64Data,
            category: issue.category
          })
        });

        if (!response.ok) {
          throw new Error('AI Resolution verification failed.');
        }

        const result = await response.json();
        onVerifyResolution(
          issueId,
          result.isResolved,
          result.confidence,
          result.explanation,
          result.whatChanged,
          result.whatRemains,
          base64Data
        );
      } catch (err: any) {
        console.error('Error in resolution verification:', err);
        setVerifyErrors(prev => ({ ...prev, [issueId]: err.message || 'Verification process failed.' }));
      } finally {
        setVerifyingIssues(prev => ({ ...prev, [issueId]: false }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Sub-tab state
  const [subTab, setSubTab] = useState<'Feed' | 'Insights' | 'Validate' | 'Scorecard'>('Feed');

  // AI Insights State
  const [insights, setInsights] = useState<any>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues })
      });
      if (!res.ok) {
        throw new Error('Failed to fetch AI insights analysis');
      }
      const data = await res.json();
      setInsights(data);
    } catch (err: any) {
      console.error(err);
      setInsightsError(err.message || 'Failed to retrieve predictive insights');
    } finally {
      setIsInsightsLoading(false);
    }
  };

  React.useEffect(() => {
    if (subTab === 'Insights') {
      fetchInsights();
    }
  }, [subTab, issues]);

  // Auto-expand issue if selected from the Map tab
  React.useEffect(() => {
    if (selectedIssueFromMap) {
      setSubTab('Feed');
      setExpandedIssueId(selectedIssueFromMap.id);
      // Clear it after expanding to let user collapse it freely
      if (clearSelectedIssueFromMap) clearSelectedIssueFromMap();
    }
  }, [selectedIssueFromMap]);

  // Statistics
  const totalIssuesCount = issues.length;
  const openCount = issues.filter(i => i.status === 'Open').length;
  const inProgressCount = issues.filter(i => i.status === 'In Progress').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved').length;

  // Filter & Search Logic
  const filteredIssues = issues.filter((issue) => {
    const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (subTab === 'Validate') {
      return matchesCategory && matchesSearch && issue.status !== 'Resolved' && issue.upvotes < 5;
    }
    return matchesCategory && matchesSearch;
  });

  // Sort: Newest first, with Open/In Progress taking precedence over Resolved
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    // If status is different, keep resolved at the bottom
    if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
    if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
    // Otherwise, newer first
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const getCategoryIcon = (category: IssueCategory) => {
    switch (category) {
      case 'Pothole': return '🕳️';
      case 'Water Leakage': return '💧';
      case 'Damaged Streetlight': return '💡';
      case 'Waste Dumping': return '🗑️';
      case 'Broken Footpath': return '🧱';
      case 'Flooding': return '🌊';
      case 'Other': return '📌';
      default: return '📌';
    }
  };

  const getCategoryColor = (category: IssueCategory) => {
    switch (category) {
      case 'Pothole': return 'bg-red-50 text-red-700 border-red-200';
      case 'Water Leakage': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Damaged Streetlight': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Waste Dumping': return 'bg-green-50 text-green-700 border-green-200';
      case 'Broken Footpath': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Flooding': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Other': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getSeverityStyle = (severity: 'Low' | 'Medium' | 'High' | 'Critical') => {
    switch (severity) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Critical': return 'bg-purple-100 text-purple-800 border-purple-200 animate-pulse font-extrabold';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusStyle = (status: IssueStatus) => {
    switch (status) {
      case 'Open': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Resolved': return 'bg-green-50 text-green-700 border border-green-200';
    }
  };

  const handlePostComment = (issueId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = newCommentTexts[issueId];
    if (!commentText || !commentText.trim()) return;

    onAddComment(issueId, commentText.trim());
    
    // Clear the specific comment text field
    setNewCommentTexts(prev => ({
      ...prev,
      [issueId]: ''
    }));
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      
      {/* 1. Community Stats Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-center shadow-xs">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Total Reports</p>
          <p className="text-lg font-black text-gray-900 mt-0.5">{totalIssuesCount}</p>
        </div>
        <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100 text-center shadow-xs">
          <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wide">Pending</p>
          <p className="text-lg font-black text-orange-600 mt-0.5">{openCount}</p>
        </div>
        <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-center shadow-xs">
          <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wide">Active Fix</p>
          <p className="text-lg font-black text-blue-600 mt-0.5">{inProgressCount}</p>
        </div>
        <div className="bg-green-50/50 p-2.5 rounded-xl border border-green-100 text-center shadow-xs">
          <p className="text-[9px] font-bold text-green-600 uppercase tracking-wide">Resolved</p>
          <p className="text-lg font-black text-green-700 mt-0.5">{resolvedCount}</p>
        </div>
      </div>

      {/* Subtab Navigation: Feed vs Validate vs Insights vs Scorecard */}
      <div className="grid grid-cols-4 p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setSubTab('Feed')}
          className={`py-2 text-center rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
            subTab === 'Feed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>Feed</span>
        </button>
        <button
          onClick={() => setSubTab('Validate')}
          className={`py-2 text-center rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
            subTab === 'Validate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="relative">
            Validate
            {issues.filter(i => i.status !== 'Resolved' && i.upvotes < 5 && !i.hasUpvoted).length > 0 && (
              <span className="absolute -top-1 -right-1.5 w-1 h-1 bg-red-500 rounded-full"></span>
            )}
          </span>
        </button>
        <button
          onClick={() => setSubTab('Insights')}
          className={`py-2 text-center rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
            subTab === 'Insights' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-500 fill-purple-500/20 shrink-0" />
          <span>Insights</span>
        </button>
        <button
          onClick={() => setSubTab('Scorecard')}
          id="subtab-scorecard"
          className={`py-2 text-center rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
            subTab === 'Scorecard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Scorecard</span>
        </button>
      </div>

      {subTab === 'Scorecard' ? (
        <WardScorecard />
      ) : subTab !== 'Insights' ? (
        <>
          {/* Environmental & Civic Impact Dashboard */}
          <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden space-y-3">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Award className="w-5 h-5 text-amber-300 fill-amber-300/20 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider">Bhubaneswar Green Impact</h3>
              </div>
              <span className="bg-white/20 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest">Live Ward 42</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                <span className="text-[8px] text-emerald-100 font-extrabold uppercase tracking-wide block">CO2 Saved Estimate</span>
                <span className="text-base font-black text-amber-300 block mt-0.5">{resolvedCount * 20}kg</span>
                <span className="text-[7px] text-emerald-150 leading-none block mt-0.5">Vehicle damage prevented</span>
              </div>
              
              <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                <span className="text-[8px] text-emerald-100 font-extrabold uppercase tracking-wide block">Hazards Resolved</span>
                <span className="text-base font-black text-white block mt-0.5">{totalIssuesCount > 0 ? Math.round((resolvedCount / totalIssuesCount) * 100) : 0}%</span>
                <span className="text-[7px] text-emerald-150 leading-none block mt-0.5">{resolvedCount} of {totalIssuesCount} spots fixed</span>
              </div>

              <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                <span className="text-[8px] text-emerald-100 font-extrabold uppercase tracking-wide block">Avg Resolution Time</span>
                <span className="text-base font-black text-emerald-200 block mt-0.5">4.2 Days</span>
                <span className="text-[7px] text-emerald-150 leading-none block mt-0.5">Against 14d city standard</span>
              </div>
            </div>
          </div>
          {/* 2. Filter & Search Utility Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-2xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search issues, streets, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#1a73e8] focus:bg-white transition"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-1" />
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition ${
              selectedCategory === 'All'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Issues
          </button>
          {(['Pothole', 'Water Leakage', 'Damaged Streetlight', 'Waste Dumping', 'Broken Footpath', 'Flooding', 'Other'] as IssueCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition flex items-center space-x-1 ${
                selectedCategory === cat
                  ? 'bg-[#1a73e8] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{getCategoryIcon(cat)}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Feed List */}
      <div className="space-y-4">
        {sortedIssues.length > 0 ? (
          sortedIssues.map((issue) => {
            const isExpanded = expandedIssueId === issue.id;

            return (
              <motion.div
                key={issue.id}
                layout
                id={`issue-card-${issue.id}`}
                className={`bg-white rounded-xl overflow-hidden border transition-all ${
                  isExpanded ? 'border-gray-300 shadow-md ring-1 ring-gray-100' : 'border-gray-100 hover:border-gray-300 shadow-2xs'
                }`}
              >
                {/* Image & Badges Container */}
                <div className="relative h-44 bg-gray-50 overflow-hidden">
                  <img
                    src={issue.photoUrl}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent"></div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${getCategoryColor(issue.category)}`}>
                      {getCategoryIcon(issue.category)} {issue.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${getSeverityStyle(issue.severity)}`}>
                      {issue.severity} Severity
                    </span>
                    {issue.upvotes >= 5 && (
                      <span className="text-[10px] bg-emerald-600 border border-emerald-500 text-white font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                        <span>🛡️ Community Verified</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-gray-200 font-medium tracking-wide flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Logged {issue.date}</span>
                      </span>
                    </div>
                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded shadow-xs uppercase tracking-wider ${getStatusStyle(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                </div>

                {/* AI trust check banner */}
                {(() => {
                  const score = issue.aiTrustScore ?? (issue.id === 'issue-3' ? 95 : issue.id === 'issue-1' ? 91 : issue.id === 'issue-2' ? 84 : 45);
                  const feedback = issue.aiAnalysisFeedback ?? "AI system verified reported category matches visual details.";
                  const isVerified = score >= 70;
                  return (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {isVerified ? (
                          <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-sm text-[9px] flex items-center space-x-1">
                            <span>AI Verified ✓</span>
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-sm text-[9px] flex items-center space-x-1 animate-pulse">
                            <span>Needs Review ⚠️</span>
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-bold">Trust: {score}%</span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-semibold truncate max-w-[200px] text-right" title={feedback}>
                        {feedback}
                      </span>
                    </div>
                  );
                })()}

                {/* Card Info Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between space-x-2">
                    <h4 className="text-sm font-extrabold text-gray-900 leading-snug">
                      {issue.title}
                    </h4>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">
                    {issue.description}
                  </p>

                  <div className="flex items-center space-x-1 text-[11px] text-gray-600 font-semibold bg-gray-50 px-2 py-1 rounded">
                    <MapPin className="w-3.5 h-3.5 text-[#1a73e8]" />
                    <span className="truncate">{issue.location}</span>
                  </div>

                  {/* Actions summary strip */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                    <div className="flex items-center space-x-4">
                      {/* Upvotes */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpvoteIssue(issue.id);
                        }}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                          issue.hasUpvoted
                            ? 'bg-blue-100 text-[#1a73e8] font-bold'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${issue.hasUpvoted ? 'fill-blue-500 text-[#1a73e8]' : ''}`} />
                        <span>{issue.upvotes}</span>
                      </button>

                      {/* Comments count indicator */}
                      <button 
                        onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                        className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-700 font-medium"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{issue.comments.length} Comments</span>
                      </button>

                      {/* Share Issue button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const mockUrl = `https://civicai.bhubaneswar.gov.in/issue/${issue.id}`;
                          navigator.clipboard.writeText(mockUrl).then(() => {
                            setCopiedIssueId(issue.id);
                            setTimeout(() => setCopiedIssueId(null), 2000);
                          });
                        }}
                        className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-700 font-medium relative cursor-pointer"
                        title="Share this report"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copiedIssueId === issue.id ? 'Copied! 📋' : 'Share'}</span>
                      </button>
                    </div>

                    {/* Expand Toggle */}
                    <button
                      onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                      className="text-[#1a73e8] font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Collapse' : 'Verify & Comment'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Section with detailed description and real commenting thread */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100 bg-gray-50/50 overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        {/* Timeline Progress View */}
                        {(() => {
                          const isVerified = issue.upvotes >= 5 || (issue.aiTrustScore !== undefined ? issue.aiTrustScore >= 70 : false) || issue.status === 'In Progress' || issue.status === 'Resolved';
                          const isAssigned = isVerified || issue.status === 'In Progress' || issue.status === 'Resolved';
                          const isInProgress = issue.status === 'In Progress' || issue.status === 'Resolved';
                          const isResolved = issue.status === 'Resolved';

                          const steps = [
                            { label: 'Reported', completed: true },
                            { label: 'Verified', completed: isVerified },
                            { label: 'Assigned', completed: isAssigned },
                            { label: 'In Progress', completed: isInProgress },
                            { label: 'Resolved', completed: isResolved }
                          ];

                          const activeStepIndex = isResolved ? 4 : isInProgress ? 3 : isAssigned ? 2 : isVerified ? 1 : 0;

                          return (
                            <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-3xs space-y-2.5">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Hazard Progress Timeline</p>
                              
                              <div className="relative w-full py-1">
                                {/* Connector Line */}
                                <div className="absolute top-[13px] left-[8%] right-[8%] h-[2px] bg-gray-100 -translate-y-1/2 z-0">
                                  <div 
                                    className="h-full bg-blue-600 transition-all duration-500"
                                    style={{ 
                                      width: `${(activeStepIndex / 4) * 100}%` 
                                    }}
                                  />
                                </div>
                                
                                {/* Steps dots */}
                                <div className="relative z-10 flex justify-between">
                                  {steps.map((step, idx) => {
                                    const completed = step.completed;
                                    const current = idx === activeStepIndex;
                                    return (
                                      <div key={idx} className="flex flex-col items-center w-[18%]">
                                        <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-300 ${
                                          completed 
                                            ? 'bg-blue-600 text-white ring-4 ring-blue-50' 
                                            : current 
                                            ? 'bg-amber-100 border-2 border-amber-500 text-amber-700 animate-pulse'
                                            : 'bg-white border-2 border-gray-200 text-gray-400'
                                        }`}>
                                          {completed ? '✓' : idx + 1}
                                        </div>
                                        <span className={`text-[8px] font-black uppercase mt-1.5 text-center leading-none tracking-tighter ${
                                          completed ? 'text-gray-800' : current ? 'text-amber-600 font-extrabold' : 'text-gray-400'
                                        }`}>
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Resolution Verification System Section */}
                        {issue.status === 'Resolved' && !issue.resolutionAiVerdict && (
                          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/60 rounded-xl p-4.5 space-y-3.5 shadow-3xs">
                            <div className="flex items-start space-x-3">
                              <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0 text-base">
                                🏢
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Citizen Verification Required</h4>
                                <p className="text-[11px] text-gray-600 leading-normal font-semibold">
                                  The municipality says this is fixed. Can you verify if it is indeed fixed? Please upload a new photo of the location to trigger the autonomous AI auditor.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <label
                                htmlFor={`verify-upload-${issue.id}`}
                                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-extrabold text-[10px] px-3.5 py-2 rounded-lg cursor-pointer transition shadow-3xs uppercase tracking-wider flex items-center space-x-1.5"
                              >
                                <Camera className="w-4 h-4" />
                                <span>Can you verify?</span>
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                id={`verify-upload-${issue.id}`}
                                onChange={(e) => handleVerifyUpload(e, issue)}
                                className="hidden"
                                disabled={verifyingIssues[issue.id]}
                              />
                            </div>

                            {verifyingIssues[issue.id] && (
                              <div className="flex items-center space-x-2.5 text-xs text-[#1a73e8] bg-white p-3 rounded-lg border border-blue-100 animate-pulse">
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                <span className="font-extrabold text-[10px] uppercase tracking-wider">AI Vision verification agent is comparing images...</span>
                              </div>
                            )}

                            {verifyErrors[issue.id] && (
                              <div className="bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-100 text-[10px] font-bold flex items-center space-x-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span>{verifyErrors[issue.id]}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Side-by-Side Resolution Audit and Before/After Card */}
                        {issue.resolutionAiVerdict && (
                          <div className="space-y-3.5">
                            {issue.resolutionAiVerdict.isResolved ? (
                              <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-4 space-y-2 shadow-3xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                    <span>AI Verified Resolved ✓</span>
                                  </span>
                                  <span className="text-[10px] font-black text-emerald-700">({issue.resolutionAiVerdict.confidence}% confidence)</span>
                                </div>
                                <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${issue.resolutionAiVerdict.confidence}%` }} />
                                </div>
                                <p className="text-[11px] text-emerald-800 leading-normal font-bold">
                                  {issue.resolutionAiVerdict.explanation}
                                </p>
                              </div>
                            ) : (
                              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 space-y-2 shadow-3xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-amber-700 bg-amber-100/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                    <span>Not fully resolved ⚠️</span>
                                  </span>
                                  <span className="text-[10px] font-black text-amber-700">Auto-Reopened & Notified</span>
                                </div>
                                <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: `${100 - issue.resolutionAiVerdict.confidence}%` }} />
                                </div>
                                <p className="text-[11px] text-amber-800 leading-normal font-bold">
                                  {issue.resolutionAiVerdict.explanation}
                                </p>
                              </div>
                            )}

                            {/* Side-by-Side Before / After Images */}
                            <div className="grid grid-cols-2 gap-3.5 bg-white p-3.5 rounded-xl border border-gray-150 shadow-3xs">
                              <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-none">Before: Reported Issue</p>
                                <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50 shadow-3xs">
                                  <img
                                    src={issue.photoUrl}
                                    alt="Before report"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">After: Citizen Verification</p>
                                <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50 shadow-3xs">
                                  <img
                                    src={issue.resolutionPhotoUrl}
                                    alt="After verification upload"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>

                              <div className="col-span-2 pt-2.5 border-t border-gray-100 space-y-2 text-[10px]">
                                <div>
                                  <span className="font-extrabold text-gray-500 uppercase tracking-widest text-[9px]">What Changed:</span>
                                  <p className="text-gray-700 font-bold mt-0.5 leading-relaxed bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                    {issue.resolutionAiVerdict.whatChanged}
                                  </p>
                                </div>
                                {!issue.resolutionAiVerdict.isResolved && (
                                  <div>
                                    <span className="font-extrabold text-amber-600 uppercase tracking-widest text-[9px]">What Remains:</span>
                                    <p className="text-amber-800 font-bold mt-0.5 leading-relaxed bg-amber-50/20 p-2 rounded-lg border border-amber-100">
                                      {issue.resolutionAiVerdict.whatRemains}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reporter details */}
                        <div className="flex items-center space-x-2 text-xs text-gray-500 border-b border-gray-100 pb-2">
                          <div className="bg-gray-200 p-1.5 rounded-full">
                            <User className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                          <span>
                            Reported by <strong>{issue.reporterName}</strong> | Ward Citizen
                          </span>
                        </div>

                        {/* Tracking ID & Department Metadata */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#1a73e8]/5 rounded-xl border border-[#1a73e8]/10 text-xs w-full">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="font-extrabold text-[#1a73e8]">AI Route:</span>
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-100 shadow-3xs text-gray-700">
                              {issue.id.startsWith('issue-') ? `CIVIC-2025-${issue.id.slice(-4).toUpperCase()}` : issue.id}
                            </span>
                            <span className="font-bold text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-100 shadow-3xs">
                              {issue.category === 'Pothole' || issue.category === 'Broken Footpath' ? 'PWD' : 
                               issue.category === 'Water Leakage' ? 'Water Board' : 
                               issue.category === 'Damaged Streetlight' ? 'Electricity Board' : 'Municipal Corporation'}
                            </span>
                          </div>
                          {issue.status !== 'Resolved' && onResolveIssue && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onResolveIssue(issue.id);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition shadow-3xs uppercase tracking-wider cursor-pointer flex items-center space-x-1 shrink-0"
                            >
                              <span>Mark Resolved ✓</span>
                            </button>
                          )}
                        </div>

                        {/* Extended Description */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-gray-700">Detailed Description:</p>
                          <p className="text-xs text-gray-600 leading-relaxed bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
                            {issue.description}
                          </p>
                        </div>

                        {/* Comment Threads Section */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold text-gray-800 flex items-center space-x-1">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                            <span>Community Validation Thread ({issue.comments.length})</span>
                          </h5>

                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {issue.comments.map((comment) => (
                              <div key={comment.id} className="bg-white rounded-lg p-2.5 border border-gray-100 text-xs shadow-3xs space-y-1">
                                <div className="flex items-center justify-between text-gray-500 font-medium">
                                  <span className="font-extrabold text-[#1a73e8] flex items-center space-x-1">
                                    <span>{comment.userName}</span>
                                    {comment.userName.includes('System') || comment.userName.includes('Marshal') ? (
                                      <span className="bg-green-100 text-green-700 font-extrabold px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider">Official</span>
                                    ) : null}
                                  </span>
                                  <span className="text-[9px]">{comment.date}</span>
                                </div>
                                <p className="text-gray-700 leading-normal">{comment.text}</p>
                              </div>
                            ))}
                          </div>

                          {/* Submit New Comment Form */}
                          <form onSubmit={(e) => handlePostComment(issue.id, e)} className="flex space-x-2 mt-2">
                            <input
                              type="text"
                              placeholder="Validate this issue or add a comment..."
                              value={newCommentTexts[issue.id] || ''}
                              onChange={(e) => setNewCommentTexts(prev => ({
                                ...prev,
                                [issue.id]: e.target.value
                              }))}
                              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#1a73e8]"
                            />
                            <button
                              type="submit"
                              className="bg-gray-900 hover:bg-gray-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                            >
                              Post
                            </button>
                          </form>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white border border-gray-100 rounded-xl space-y-2">
            <Search className="w-8 h-8 text-gray-300 mx-auto" />
            <h4 className="text-sm font-extrabold text-gray-800">No matching reports found</h4>
            <p className="text-xs text-gray-500">Try checking other categories or clearing filters</p>
          </div>
        )}
      </div>
        </>
      ) : (
        /* Predictive Insights Tab */
        <div className="space-y-5 pb-8">
          {isInsightsLoading ? (
            <div className="space-y-4 animate-pulse">
              {/* Summary Card Skeleton */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>

              {/* Bento Grid Skeleton */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs space-y-2">
                  <div className="h-2.5 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3.5 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs space-y-2">
                  <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3.5 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="col-span-2 bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs space-y-2">
                  <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3.5 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>

              {/* Chart Skeletons */}
              <div className="bg-white p-4 h-52 rounded-xl border border-gray-100 shadow-2xs space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-50 rounded-lg flex items-end p-2 space-x-4 justify-around">
                  <div className="bg-gray-200 w-12 h-1/3 rounded-t"></div>
                  <div className="bg-gray-200 w-12 h-2/3 rounded-t"></div>
                  <div className="bg-gray-200 w-12 h-1/2 rounded-t"></div>
                  <div className="bg-gray-200 w-12 h-4/5 rounded-t"></div>
                </div>
              </div>
            </div>
          ) : insightsError ? (
            <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-200 text-xs font-semibold text-center space-y-3 shadow-3xs max-w-sm mx-auto">
              <AlertCircle className="w-8 h-8 mx-auto text-red-500 animate-bounce" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-red-800">Connection Standard Deferred</h4>
                <p className="text-red-600 leading-normal font-medium">
                  We encountered a temporary connection issue. Tap 'Retry Analysis' to safely regenerate AI insights.
                </p>
              </div>
              <button 
                onClick={fetchInsights}
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-xl text-[10px] font-bold cursor-pointer transition shadow-xs"
              >
                Retry Analysis
              </button>
            </div>
          ) : insights ? (
            <div className="space-y-4">
              {/* Natural Language Summary Card */}
              <div className="bg-[#1a73e8]/5 border border-[#1a73e8]/10 rounded-2xl p-4 space-y-2 shadow-3xs">
                <div className="flex items-center space-x-2 text-[#1a73e8]">
                  <Sparkles className="w-4 h-4 fill-[#1a73e8]/20" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">AI Analytical Summary</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                  {insights.naturalLanguageSummary}
                </p>
              </div>

              {/* Bento-grid KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs space-y-1">
                  <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Highest Density Ward</span>
                  <p className="text-xs font-black text-gray-900 mt-1">{insights.topLocality}</p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs space-y-1">
                  <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Top 3 Concerns</span>
                  <div className="mt-1 space-y-0.5">
                    {insights.top3Categories.map((cat: string, idx: number) => (
                      <p key={idx} className="text-[10px] font-bold text-red-600 truncate">
                        {idx + 1}. {cat}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs space-y-1">
                  <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Predictive Foresight (Next Month)</span>
                  <p className="text-xs text-gray-700 mt-1 font-medium leading-relaxed">
                    {insights.predictedNextMonth}
                  </p>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs space-y-2">
                <div className="flex items-center space-x-1.5 text-gray-800">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">Issues by Category</h3>
                </div>
                <div className="h-44 text-[9px] font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights.categoryStats} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <XAxis dataKey="category" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#1a73e8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line Chart */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs space-y-2">
                <div className="flex items-center space-x-1.5 text-gray-800">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">Weekly Report Trend</h3>
                </div>
                <div className="h-44 text-[9px] font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.weeklyTrend} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="week" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

    </div>
  );
}
