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
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CivicIssue, IssueCategory, IssueStatus } from '../types';

interface IssuesFeedProps {
  issues: CivicIssue[];
  onUpvoteIssue: (id: string) => void;
  onAddComment: (issueId: string, commentText: string) => void;
  selectedIssueFromMap?: CivicIssue | null;
  clearSelectedIssueFromMap?: () => void;
}

export default function IssuesFeed({
  issues,
  onUpvoteIssue,
  onAddComment,
  selectedIssueFromMap,
  clearSelectedIssueFromMap
}: IssuesFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [newCommentTexts, setNewCommentTexts] = useState<{ [key: string]: string }>({});

  // Auto-expand issue if selected from the Map tab
  React.useEffect(() => {
    if (selectedIssueFromMap) {
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
      case 'Water Leak': return '💧';
      case 'Streetlight': return '💡';
      case 'Waste': return '🗑️';
    }
  };

  const getCategoryColor = (category: IssueCategory) => {
    switch (category) {
      case 'Pothole': return 'bg-red-50 text-red-700 border-red-200';
      case 'Water Leak': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Streetlight': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Waste': return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const getSeverityStyle = (severity: 'Low' | 'Medium' | 'High') => {
    switch (severity) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
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
          {(['Pothole', 'Water Leak', 'Streetlight', 'Waste'] as IssueCategory[]).map(cat => (
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
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${getCategoryColor(issue.category)}`}>
                      {getCategoryIcon(issue.category)} {issue.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${getSeverityStyle(issue.severity)}`}>
                      {issue.severity} Severity
                    </span>
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
                        {/* Reporter details */}
                        <div className="flex items-center space-x-2 text-xs text-gray-500 border-b border-gray-100 pb-2">
                          <div className="bg-gray-200 p-1.5 rounded-full">
                            <User className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                          <span>
                            Reported by <strong>{issue.reporterName}</strong> | Ward Citizen
                          </span>
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

    </div>
  );
}
