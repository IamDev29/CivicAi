import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  ClipboardList, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  LogOut, 
  Loader2, 
  ArrowRight, 
  Clock, 
  FileText, 
  Calendar, 
  Send, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  RefreshCw,
  ThumbsUp,
  MessageSquare,
  MapPin
} from 'lucide-react';
import { CivicIssue, IssueStatus, Comment } from '../types';

interface AuthorityDashboardProps {
  currentUser: {
    name: string;
    role: string;
    department?: string;
    isDemo?: boolean;
  };
  issues: CivicIssue[];
  onLogout: () => void;
  onUpdateIssueStatus: (id: string, status: IssueStatus, extraData?: any) => void;
  onAddComment: (issueId: string, text: string) => void;
  triggerAlert: (msg: string) => void;
}

// Utility to map category to department
export function getIssueDepartment(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('pothole') || cat.includes('footpath') || cat.includes('road')) {
    return 'Public Works Dept (PWD)';
  } else if (cat.includes('water') || cat.includes('leakage') || cat.includes('drain') || cat.includes('sewage')) {
    return 'Water & Sewerage Board';
  } else if (cat.includes('light') || cat.includes('electricity') || cat.includes('lamp') || cat.includes('power')) {
    return 'Electricity Board';
  } else if (cat.includes('waste') || cat.includes('garbage') || cat.includes('dump') || cat.includes('sanitation') || cat.includes('flooding')) {
    return 'Municipal Corporation';
  } else {
    return 'Urban Planning';
  }
}

export default function AuthorityDashboard({
  currentUser,
  issues,
  onLogout,
  onUpdateIssueStatus,
  onAddComment,
  triggerAlert
}: AuthorityDashboardProps) {
  const department = currentUser.department || 'Public Works Dept (PWD)';
  
  // Filter issues to this department only
  const deptIssues = issues.filter(issue => getIssueDepartment(issue.category) === department);

  // Sorting state
  const [sortBy, setSortBy] = useState<'priority' | 'oldest' | 'upvotes'>('priority');

  // Expanded issue details ID state
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    if (currentUser.isDemo && currentUser.role === 'authority') {
      return "demo-auth-issue-1";
    }
    return null;
  });

  const [showWorkOrderHighlight, setShowWorkOrderHighlight] = useState<boolean>(() => {
    return !!(currentUser.isDemo && currentUser.role === 'authority');
  });

  // Modal / Action states per issue
  const [expectedDates, setExpectedDates] = useState<{ [key: string]: string }>({});
  const [moreInfoNotes, setMoreInfoNotes] = useState<{ [key: string]: string }>({});
  
  // Active sub-actions inside expanding panel
  const [activeActionId, setActiveActionId] = useState<{ [key: string]: 'progress' | 'resolve' | 'info' | null }>({});

  // AI Work order state
  const [generatingWorkOrderId, setGeneratingWorkOrderId] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<{ [key: string]: { workOrder: string; orderNumber: string } }>({});
  const [viewingWorkOrderId, setViewingWorkOrderId] = useState<string | null>(null);

  // Resolution photo states
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [comparingImages, setComparingImages] = useState(false);
  const [comparisonVerdict, setComparisonVerdict] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);

  // Helper to calculate days open
  const getDaysOpen = (dateStr: string) => {
    const issueDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - issueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper to map severity to priority score for sorting
  const getPriorityScore = (severity: string) => {
    switch (severity) {
      case 'Critical': return 4;
      case 'High': return 3;
      case 'Medium': return 2;
      case 'Low': return 1;
      default: return 0;
    }
  };

  // Sort logic
  const sortedIssues = [...deptIssues].sort((a, b) => {
    if (sortBy === 'priority') {
      const scoreA = getPriorityScore(a.severity);
      const scoreB = getPriorityScore(b.severity);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return getDaysOpen(b.date) - getDaysOpen(a.date); // older first as secondary
    } else if (sortBy === 'oldest') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      // upvotes
      return b.upvotes - a.upvotes;
    }
  });

  // Calculate Department Stats
  const isDemoMode = !!currentUser.isDemo;
  const issuesAssigned = isDemoMode ? 12 : deptIssues.length;
  const issuesResolved = isDemoMode ? 8 : deptIssues.filter(i => i.status === 'Resolved').length;
  
  // Calculate average resolution time (mock + actual mix)
  const avgResTime = isDemoMode ? '4.2' : (deptIssues.filter(i => i.status === 'Resolved').length > 0
    ? (deptIssues.filter(i => i.status === 'Resolved').reduce((acc, curr) => acc + getDaysOpen(curr.date), 0) / issuesResolved).toFixed(1)
    : '3.4');

  // Overdue count (not resolved and days open > 5)
  const overdueCount = isDemoMode ? 2 : deptIssues.filter(i => i.status !== 'Resolved' && getDaysOpen(i.date) > 5).length;

  // Handle Mark In Progress
  const handleMarkInProgress = (issueId: string) => {
    const targetDate = expectedDates[issueId] || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Call props callback to trigger state transition
    onUpdateIssueStatus(issueId, 'In Progress', { expectedCompletionDate: targetDate });

    // Add professional comment
    onAddComment(issueId, `🛠️ Department response: Action initiated. Expected completion scheduled on or before ${new Date(targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`);

    triggerAlert('Issue status updated to IN PROGRESS ⚡');
    
    // Reset action state
    setActiveActionId(prev => ({ ...prev, [issueId]: null }));
  };

  // Handle Request More Info
  const handleRequestMoreInfo = (issueId: string) => {
    const note = moreInfoNotes[issueId];
    if (!note || !note.trim()) {
      triggerAlert('Please write a note before submitting ⚠️');
      return;
    }

    // Post comment from department requesting clarification
    onAddComment(issueId, `❓ Official Inquiry from ${department}: "${note.trim()}"`);
    
    triggerAlert('Clarification note posted to citizen timeline 📬');
    
    // Clear state
    setMoreInfoNotes(prev => ({ ...prev, [issueId]: '' }));
    setActiveActionId(prev => ({ ...prev, [issueId]: null }));
  };

  // Handle before/after photo resolution upload
  const handlePhotoResolutionUpload = async (e: React.ChangeEvent<HTMLInputElement>, issue: CivicIssue) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setComparingImages(true);
    setVerificationError(null);
    setComparisonVerdict(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      setUploadedBase64(base64Data);

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
          throw new Error('AI comparison server returned an error.');
        }

        const data = await response.json();
        setComparisonVerdict(data);
      } catch (err: any) {
        console.error('Error comparing resolution images:', err);
        setVerificationError(err.message || 'Image comparison failed.');
      } finally {
        setComparingImages(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Confirm and Save Verified Resolution
  const handleConfirmResolution = (issueId: string) => {
    if (!uploadedBase64) return;

    const verdict = comparisonVerdict || {
      isResolved: true,
      confidence: 95,
      explanation: 'Manual override: the repair work was visually inspected and approved by department official.'
    };

    // Update status to Resolved
    onUpdateIssueStatus(issueId, 'Resolved', {
      resolutionPhotoUrl: uploadedBase64,
      resolutionAiVerdict: verdict
    });

    // Add official resolution report comment
    onAddComment(issueId, `✅ Resolved & Closed: Verified by Department Official. AI Audit Confidence: ${verdict.confidence}%. ${verdict.explanation}`);

    triggerAlert('Resolution recorded & AI verified successfully! 🎉');

    // Reset resolving states
    setUploadedBase64(null);
    setComparisonVerdict(null);
    setActiveActionId(prev => ({ ...prev, [issueId]: null }));
  };

  // Handle AI Work Order Generation
  const handleGenerateWorkOrder = async (issue: CivicIssue) => {
    setGeneratingWorkOrderId(issue.id);
    try {
      const res = await fetch('/api/gemini/work-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue })
      });

      if (!res.ok) {
        throw new Error('Failed to generate work order');
      }

      const data = await res.json();
      setWorkOrders(prev => ({
        ...prev,
        [issue.id]: {
          workOrder: data.workOrder,
          orderNumber: data.orderNumber
        }
      }));
      setViewingWorkOrderId(issue.id);
      triggerAlert('AI Work Order generated successfully! 📑');
    } catch (err: any) {
      console.error(err);
      triggerAlert('Failed to generate official work order ⚠️');
    } finally {
      setGeneratingWorkOrderId(null);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'High': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Medium': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'Low': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f172a] text-slate-100 overflow-y-auto h-full scrollbar-none pb-24">
      
      {/* HEADER SECTION */}
      <header className="sticky top-0 bg-[#1e293b]/95 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-lg font-black shadow-lg shadow-indigo-600/30">
            🏛️
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase">CivicAI</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Authority Portal</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-full uppercase tracking-wider">
            {department}
          </span>
          <button 
            onClick={onLogout}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* BODY CONTAINER */}
      <div className="p-4 space-y-6">

        {/* SECTION 2 — DEPARTMENT STATS */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-[#1e293b] border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden">
            <div className="absolute right-2.5 top-2.5 opacity-10">
              <ClipboardList className="w-12 h-12 text-indigo-400" />
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Assigned</p>
            <p className="text-2xl font-black text-white mt-1 leading-none">{issuesAssigned}</p>
            <p className="text-[8px] text-slate-400 font-semibold mt-1">This Month</p>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden">
            <div className="absolute right-2.5 top-2.5 opacity-10">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-black text-emerald-400 mt-1 leading-none">{issuesResolved}</p>
            <p className="text-[8px] text-slate-400 font-semibold mt-1">SLA Verified</p>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden">
            <div className="absolute right-2.5 top-2.5 opacity-10">
              <Clock className="w-12 h-12 text-sky-400" />
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Avg Resolution</p>
            <p className="text-2xl font-black text-sky-400 mt-1 leading-none">{avgResTime}d</p>
            <p className="text-[8px] text-slate-400 font-semibold mt-1">Target: 4.2d</p>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden">
            <div className="absolute right-2.5 top-2.5 opacity-10 text-rose-500">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Overdue SLA</p>
            <p className={`text-2xl font-black mt-1 leading-none ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {overdueCount}
            </p>
            <p className="text-[8px] text-slate-400 font-semibold mt-1">Requires Action</p>
          </div>
        </section>

        {/* SECTION 1 — MY QUEUE */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1.5">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-white">Departmental Queue</h2>
            </div>
            
            {/* SORT BUTTONS */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button 
                onClick={() => setSortBy('priority')}
                className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                  sortBy === 'priority' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Priority
              </button>
              <button 
                onClick={() => setSortBy('oldest')}
                className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                  sortBy === 'oldest' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Oldest
              </button>
              <button 
                onClick={() => setSortBy('upvotes')}
                className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                  sortBy === 'upvotes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Upvotes
              </button>
            </div>
          </div>

          {sortedIssues.length === 0 ? (
            <div className="bg-[#1e293b]/50 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-xl mx-auto">
                🎉
              </div>
              <p className="text-xs font-black text-white">All Clear!</p>
              <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">
                No active complaints reported in Bhubaneswar for {department} this period.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedIssues.map((issue) => {
                const isExpanded = expandedId === issue.id;
                const activeAction = activeActionId[issue.id] || null;
                const daysOpen = getDaysOpen(issue.date);

                return (
                  <div 
                    key={issue.id} 
                    className={`bg-[#1e293b] border ${isExpanded ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/5' : 'border-slate-800'} rounded-2xl overflow-hidden transition-all`}
                  >
                    
                    {/* Collapsed Header Info */}
                    <div 
                      onClick={() => {
                        setExpandedId(isExpanded ? null : issue.id);
                        setActiveActionId(prev => ({ ...prev, [issue.id]: null }));
                      }}
                      className="p-4 flex items-start justify-between cursor-pointer space-x-3 select-none"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${getSeverityBadgeClass(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${getStatusBadgeClass(issue.status)}`}>
                            {issue.status}
                          </span>
                          {issue.customBadge && (
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              issue.customBadge === 'URGENT'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : issue.customBadge === 'escalated'
                                  ? 'bg-amber-600 text-slate-900 font-extrabold'
                                  : 'bg-indigo-600 text-white'
                            }`}>
                              {issue.customBadge}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xs font-black text-white leading-tight truncate">{issue.title}</h3>
                        
                        <div className="flex items-center space-x-3 text-[9px] text-slate-400">
                          <span className="flex items-center space-x-1 min-w-0">
                            <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="truncate">{issue.location}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between self-stretch shrink-0 text-right">
                        <span className="text-[10px] font-extrabold text-indigo-300">
                          {issue.id === 'demo-auth-issue-1' 
                            ? '2 days overdue' 
                            : issue.id === 'demo-auth-issue-2' 
                              ? 'assigned today' 
                              : `${daysOpen} ${daysOpen === 1 ? 'day' : 'days'} open`}
                        </span>
                        
                        <div className="text-[8px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                          {new Date(issue.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400 mt-2" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 mt-2" />
                        )}
                      </div>
                    </div>

                    {/* EXPANDED CONTENT AREA */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-800 bg-slate-900/60"
                        >
                          <div className="p-4 space-y-4">
                            
                            {/* Description and Image Preview */}
                            <div className="flex space-x-3">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                                <img 
                                  src={issue.photoUrl} 
                                  alt={issue.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Citizen Description</p>
                                <p className="text-[11px] text-slate-300 leading-normal">{issue.description}</p>
                              </div>
                            </div>

                            {/* Additional Metadata Strip */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/80 text-[10px]">
                              <div>
                                <span className="text-slate-400 font-bold">Reporter:</span>{' '}
                                <span className="text-slate-200 font-bold">{issue.reporterName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold">Upvotes:</span>{' '}
                                <span className="text-slate-200 font-bold">👍 {issue.upvotes} validation(s)</span>
                              </div>
                            </div>

                            {/* SECTION 3 — AI WORK ORDER GENERATOR ATTACHMENT */}
                            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Administrative Actions</span>
                              
                              <div className="relative">
                                <button
                                  id="btn-generate-work-order"
                                  onClick={() => {
                                    handleGenerateWorkOrder(issue);
                                    setShowWorkOrderHighlight(false);
                                  }}
                                  disabled={generatingWorkOrderId === issue.id}
                                  className={`flex items-center space-x-1.5 text-[9px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer relative ${
                                    showWorkOrderHighlight && issue.id === 'demo-auth-issue-1'
                                      ? 'bg-amber-500 text-slate-900 border-2 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.7)] animate-pulse'
                                      : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30'
                                  }`}
                                >
                                  {generatingWorkOrderId === issue.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                                      <span>Generating Order...</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileText className={`w-3 h-3 ${showWorkOrderHighlight && issue.id === 'demo-auth-issue-1' ? 'text-slate-900' : 'text-indigo-400'}`} />
                                      <span>Generate AI Work Order</span>
                                    </>
                                  )}
                                </button>

                                {showWorkOrderHighlight && issue.id === 'demo-auth-issue-1' && (
                                  <div className="absolute top-full mt-2.5 right-0 w-52 bg-slate-900 border border-amber-500/40 text-slate-100 rounded-2xl p-3 shadow-2xl z-50 text-[10.5px] font-bold leading-normal">
                                    <div className="absolute top-0 right-8 -translate-y-1 w-2.5 h-2.5 bg-slate-900 rotate-45 border-l border-t border-amber-500/40" />
                                    <p className="text-amber-400 mb-1 flex items-center space-x-1 uppercase text-[9px] tracking-wider font-black">
                                      <span>⚡ AI Smart Work Order</span>
                                    </p>
                                    <p className="text-slate-300 font-medium">Click this to generate an official government work order using Gemini</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowWorkOrderHighlight(false);
                                      }}
                                      className="mt-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[9px] font-black px-2.5 py-1 rounded-lg transition active:scale-95"
                                    >
                                      Got it
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* ACTION TRIGGERS BAR */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <button
                                onClick={() => setActiveActionId(prev => ({ 
                                  ...prev, 
                                  [issue.id]: activeAction === 'progress' ? null : 'progress' 
                                }))}
                                className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-colors flex items-center justify-center space-x-1 cursor-pointer ${
                                  issue.status === 'Resolved' 
                                    ? 'bg-slate-800/30 text-slate-500 border-slate-800/50 cursor-not-allowed'
                                    : activeAction === 'progress'
                                      ? 'bg-blue-600 text-white border-blue-500'
                                      : 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700'
                                }`}
                                disabled={issue.status === 'Resolved'}
                              >
                                <span>🛠️ Mark In-Progress</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveActionId(prev => ({ 
                                    ...prev, 
                                    [issue.id]: activeAction === 'resolve' ? null : 'resolve' 
                                  }));
                                  setResolvingId(issue.id);
                                  setComparisonVerdict(null);
                                  setUploadedBase64(null);
                                  setVerificationError(null);
                                }}
                                className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-colors flex items-center justify-center space-x-1 cursor-pointer ${
                                  issue.status === 'Resolved'
                                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 cursor-not-allowed'
                                    : activeAction === 'resolve'
                                      ? 'bg-emerald-600 text-white border-emerald-500'
                                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                                }`}
                                disabled={issue.status === 'Resolved'}
                              >
                                <span>✅ Mark Resolved</span>
                              </button>

                              <button
                                onClick={() => setActiveActionId(prev => ({ 
                                  ...prev, 
                                  [issue.id]: activeAction === 'info' ? null : 'info' 
                                }))}
                                className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-colors flex items-center justify-center space-x-1 cursor-pointer ${
                                  activeAction === 'info'
                                    ? 'bg-purple-600 text-white border-purple-500'
                                    : 'bg-slate-800 hover:bg-slate-700 text-purple-400 border-slate-700'
                                }`}
                              >
                                <span>❓ Request Info</span>
                              </button>
                            </div>

                            {/* NESTED DYNAMIC ACTION SUBPANELS */}
                            <AnimatePresence mode="wait">
                              
                              {/* MARK IN PROGRESS SUBPANEL */}
                              {activeAction === 'progress' && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-2.5"
                                >
                                  <p className="text-[9px] font-black uppercase text-slate-300 tracking-wider">Set Expected Completion SLA</p>
                                  <div className="flex space-x-2">
                                    <input 
                                      type="date"
                                      value={expectedDates[issue.id] || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                      onChange={(e) => setExpectedDates(prev => ({ ...prev, [issue.id]: e.target.value }))}
                                      className="bg-slate-950 border border-slate-700 text-xs font-bold text-slate-100 rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                      onClick={() => handleMarkInProgress(issue.id)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg tracking-wider cursor-pointer transition flex items-center space-x-1"
                                    >
                                      <span>Dispatch Crew</span>
                                    </button>
                                  </div>
                                </motion.div>
                              )}

                              {/* REQUEST MORE INFO SUBPANEL */}
                              {activeAction === 'info' && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-2.5"
                                >
                                  <p className="text-[9px] font-black uppercase text-slate-300 tracking-wider">Clarification inquiry details</p>
                                  <div className="space-y-2">
                                    <textarea
                                      rows={2}
                                      placeholder="e.g. Please clarify where the leakage is or upload a closer photo..."
                                      value={moreInfoNotes[issue.id] || ''}
                                      onChange={(e) => setMoreInfoNotes(prev => ({ ...prev, [issue.id]: e.target.value }))}
                                      className="w-full bg-slate-950 border border-slate-700 text-[11px] font-bold text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-purple-500"
                                    />
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() => handleRequestMoreInfo(issue.id)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg tracking-wider cursor-pointer transition flex items-center space-x-1"
                                      >
                                        <Send className="w-3 h-3" />
                                        <span>Send Inquiry</span>
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {/* MARK RESOLVED SUBPANEL (IMAGE COMPARISON FLOW) */}
                              {activeAction === 'resolve' && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-3"
                                >
                                  <p className="text-[9px] font-black uppercase text-slate-300 tracking-wider">
                                    Before/After Resolution Verification
                                  </p>

                                  {!uploadedBase64 ? (
                                    <div className="border border-dashed border-slate-600 rounded-xl p-4 text-center hover:bg-slate-800 cursor-pointer transition relative">
                                      <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => handlePhotoResolutionUpload(e, issue)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                      />
                                      <Camera className="w-6 h-6 mx-auto text-emerald-400 opacity-80" />
                                      <p className="text-[10px] font-bold text-slate-200 mt-1.5">Upload Site Resolution Photo</p>
                                      <p className="text-[8px] text-slate-400">AI will automatically compare original and current images</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {comparingImages ? (
                                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                                          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                                          <p className="text-[10px] text-slate-400 font-extrabold animate-pulse uppercase tracking-wider">AI Audit Comparing Images...</p>
                                        </div>
                                      ) : (
                                        <div className="space-y-3">
                                          {/* Mini comparison block */}
                                          <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">Original (Before)</p>
                                              <img src={issue.photoUrl} className="w-full h-20 object-cover rounded-lg border border-slate-700" referrerPolicy="no-referrer" />
                                            </div>
                                            <div className="space-y-1">
                                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">New Upload (After)</p>
                                              <img src={uploadedBase64} className="w-full h-20 object-cover rounded-lg border border-slate-700" referrerPolicy="no-referrer" />
                                            </div>
                                          </div>

                                          {/* AI Verdict Display */}
                                          {comparisonVerdict && (
                                            <div className={`p-2.5 rounded-lg border text-[9px] ${
                                              comparisonVerdict.isResolved 
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                            }`}>
                                              <div className="flex items-center space-x-1 font-black uppercase">
                                                <span>{comparisonVerdict.isResolved ? '✅ AI APPROVED' : '⚠️ AI FLAG INCOMPLETE'}</span>
                                                <span>•</span>
                                                <span>Confidence: {comparisonVerdict.confidence}%</span>
                                              </div>
                                              <p className="mt-1 font-medium leading-relaxed">{comparisonVerdict.explanation}</p>
                                              <p className="mt-1 font-bold">Changes: {comparisonVerdict.whatChanged}</p>
                                              {!comparisonVerdict.isResolved && (
                                                <p className="mt-0.5 text-rose-300 font-bold">Outstanding: {comparisonVerdict.whatRemains}</p>
                                              )}
                                            </div>
                                          )}

                                          {verificationError && (
                                            <p className="text-[9px] text-rose-400 font-bold bg-rose-500/15 p-2 rounded-lg">
                                              ⚠️ {verificationError}
                                            </p>
                                          )}

                                          {/* Save/Re-upload triggers */}
                                          <div className="flex space-x-2 pt-1">
                                            <button
                                              onClick={() => {
                                                setUploadedBase64(null);
                                                setComparisonVerdict(null);
                                              }}
                                              className="border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider flex-1 hover:bg-slate-800 cursor-pointer"
                                            >
                                              Upload Another
                                            </button>
                                            
                                            <button
                                              onClick={() => handleConfirmResolution(issue.id)}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider flex-1 cursor-pointer transition flex items-center justify-center space-x-1"
                                            >
                                              <span>Confirm Resolution</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              )}

                            </AnimatePresence>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* WORK ORDER VIEWING MODAL DIALOG OVERLAY */}
      <AnimatePresence>
        {viewingWorkOrderId && workOrders[viewingWorkOrderId] && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl overflow-hidden flex flex-col justify-between max-h-[640px] shadow-2xl"
            >
              {/* Modal Title */}
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Work Order Sheet</span>
                </span>
                <span className="text-[9px] font-bold text-slate-500 font-mono">
                  {workOrders[viewingWorkOrderId].orderNumber}
                </span>
              </div>

              {/* Printable Typewriter Formatted Document Body */}
              <div className="p-4 flex-1 overflow-y-auto font-mono text-[9px] leading-relaxed text-slate-300 space-y-4 bg-slate-950/40 select-text scrollbar-none">
                <pre className="whitespace-pre-wrap font-sans select-text select-all leading-normal text-slate-300">
                  {workOrders[viewingWorkOrderId].workOrder}
                </pre>
              </div>

              {/* Action trigger footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex space-x-2 shrink-0">
                <button
                  onClick={() => {
                    const el = document.createElement('textarea');
                    el.value = workOrders[viewingWorkOrderId].workOrder;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    triggerAlert('Work Order copied to clipboard! 📋');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex-1 cursor-pointer transition text-center"
                >
                  Copy Document
                </button>
                <button
                  onClick={() => setViewingWorkOrderId(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider flex-1 cursor-pointer transition text-center"
                >
                  Close Sheet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
