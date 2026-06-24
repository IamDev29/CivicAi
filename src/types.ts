/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory = 'Pothole' | 'Water Leak' | 'Streetlight' | 'Waste';
export type IssueSeverity = 'Low' | 'Medium' | 'High';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved';

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
}
