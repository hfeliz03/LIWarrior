// ============================================================
// LIWarrior Type Definitions
// ============================================================

// Pipeline stages for a contact
export type ContactStatus =
  | 'discovered'
  | 'request_sent'
  | 'accepted'
  | 'messaged'
  | 'replied'
  | 'meeting_set'
  | 'cold';

// Types of commonalities we detect
export type CommonalityType =
  | 'university'
  | 'language'
  | 'last_name'
  | 'location'
  | 'company'
  | 'volunteer'
  | 'certification'
  | 'industry';

// Message template categories
export type MessageType =
  | 'connection_note'
  | 'initial_message'
  | 'follow_up'
  | 'nudge';

// Contact role categories
export type ContactRole =
  | 'recruiter'
  | 'hiring_manager'
  | 'team_member'
  | 'alumni'
  | 'unknown';

// ============================================================
// Core Data Models
// ============================================================

export interface UserProfile {
  id: 'self';
  firstName: string;
  lastName: string;
  headline: string;
  universities: string[];
  languages: string[];
  currentLocation: string;
  previousLocations: string[];
  companies: string[];
  certifications: string[];
  volunteerOrgs: string[];
  targetRoles: string[];
  targetLevel: string;
  calendarLinks: {
    min15?: string;
    min30?: string;
    hr1?: string;
  };
  updatedAt: Date;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  company: string;
  profileUrl: string;
  imageUrl: string;
  role: ContactRole;
  // Profile data for commonality matching
  universities: string[];
  languages: string[];
  locations: string[];
  previousCompanies: string[];
  certifications: string[];
  volunteerOrgs: string[];
  // Pipeline status
  status: ContactStatus;
  companyId: string;
  // Commonality data
  commonalities: CommonalityResult[];
  commonalityScore: number;
  // Timestamps
  discoveredAt: Date;
  requestSentAt?: Date;
  acceptedAt?: Date;
  messagedAt?: Date;
  repliedAt?: Date;
  meetingSetAt?: Date;
  // Message tracking
  messagesSent: number;
  lastMessageDraft: string;
  // User notes
  notes: string;
  tags: string[];
}

export interface TargetCompany {
  id: string;
  name: string;
  linkedInUrl: string;
  logoUrl: string;
  addedAt: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: MessageType;
  targetRole: ContactRole | 'any';
  commonalityType: CommonalityType | 'none';
  body: string;
  timesUsed: number;
  repliesReceived: number;
  isCustom: boolean;
}

export interface ActivityLog {
  id?: number;
  contactId: string;
  companyId: string;
  action: string;
  timestamp: Date;
  details: string;
  templateUsed?: string;
}

export interface CommonalityResult {
  type: CommonalityType;
  priority: number;
  userValue: string;
  contactValue: string;
  matchStrength: 'exact' | 'partial';
  suggestedIcebreaker: string;
}

// ============================================================
// Message Types (between content scripts and service worker)
// ============================================================

export type ExtensionMessage =
  | { type: 'PROFILE_SCRAPED'; data: Partial<Contact> }
  | { type: 'CONNECTION_SENT'; data: { profileUrl: string; name: string } }
  | { type: 'CONNECTION_ACCEPTED'; data: { name: string; profileUrl?: string } }
  | { type: 'SEARCH_RESULTS_SCRAPED'; data: Partial<Contact>[] }
  | { type: 'GET_CONTACTS'; filter?: Partial<{ status: ContactStatus; companyId: string }> }
  | { type: 'GET_COMPANIES' }
  | { type: 'GET_USER_PROFILE' }
  | { type: 'SAVE_USER_PROFILE'; data: Partial<UserProfile> }
  | { type: 'ADD_COMPANY'; data: Partial<TargetCompany> }
  | { type: 'UPDATE_CONTACT_STATUS'; data: { contactId: string; status: ContactStatus } }
  | { type: 'GENERATE_MESSAGE'; data: { contactId: string; type: MessageType } }
  | { type: 'GET_STATS' }
  | { type: 'GET_TEMPLATES' }
  | { type: 'SAVE_TEMPLATE'; data: Partial<MessageTemplate> }
  | { type: 'TRACK_CONTACT'; data: Partial<Contact> }
  | { type: 'OPEN_SIDEPANEL'; data?: { contactId: string } };

// Dashboard stats
export interface DashboardStats {
  totalContacts: number;
  requestsSent: number;
  connectionsAccepted: number;
  messaged: number;
  replied: number;
  meetingsSet: number;
  acceptanceRate: number;
  replyRate: number;
  companiesTracked: number;
}
