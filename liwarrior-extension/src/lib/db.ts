import Dexie, { type EntityTable } from 'dexie';
import type {
  UserProfile,
  Contact,
  TargetCompany,
  MessageTemplate,
  ActivityLog,
} from '@/types';

// ============================================================
// LIWarrior Database (IndexedDB via Dexie.js)
// All data stays local — nothing leaves the browser.
// ============================================================

class LIWarriorDB extends Dexie {
  userProfile!: EntityTable<UserProfile, 'id'>;
  contacts!: EntityTable<Contact, 'id'>;
  companies!: EntityTable<TargetCompany, 'id'>;
  templates!: EntityTable<MessageTemplate, 'id'>;
  activityLog!: EntityTable<ActivityLog, 'id'>;

  constructor() {
    super('LIWarriorDB');

    this.version(1).stores({
      userProfile: 'id',
      contacts: 'id, status, companyId, company, commonalityScore, discoveredAt, [status+companyId]',
      companies: 'id, name, addedAt',
      templates: 'id, type, targetRole, commonalityType, [type+targetRole+commonalityType]',
      activityLog: '++id, contactId, companyId, action, timestamp',
    });
  }
}

export const db = new LIWarriorDB();

// ============================================================
// Helper functions
// ============================================================

export async function getUserProfile(): Promise<UserProfile | undefined> {
  return db.userProfile.get('self');
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
  const existing = await getUserProfile();
  if (existing) {
    await db.userProfile.update('self', { ...profile, updatedAt: new Date() });
  } else {
    await db.userProfile.put({
      id: 'self',
      firstName: '',
      lastName: '',
      headline: '',
      universities: [],
      languages: [],
      currentLocation: '',
      previousLocations: [],
      companies: [],
      certifications: [],
      volunteerOrgs: [],
      targetRoles: [],
      targetLevel: '',
      calendarLinks: {},
      updatedAt: new Date(),
      ...profile,
    } as UserProfile);
  }
}

export async function getContacts(filter?: {
  status?: string;
  companyId?: string;
}): Promise<Contact[]> {
  let collection = db.contacts.toCollection();

  if (filter?.status && filter?.companyId) {
    return db.contacts
      .where('[status+companyId]')
      .equals([filter.status, filter.companyId])
      .reverse()
      .sortBy('discoveredAt');
  }

  if (filter?.status) {
    return db.contacts
      .where('status')
      .equals(filter.status)
      .reverse()
      .sortBy('discoveredAt');
  }

  if (filter?.companyId) {
    return db.contacts
      .where('companyId')
      .equals(filter.companyId)
      .reverse()
      .sortBy('discoveredAt');
  }

  return db.contacts.reverse().sortBy('discoveredAt');
}

export function normalizeProfileUrl(url: string): string {
  if (!url) return '';
  // Remove query params, hash, trailing slashes
  let clean = url.split('?')[0].split('#')[0].replace(/\/+$/, '');
  // Force https://www.linkedin.com/in/ format (strip locale subdomains like uk.linkedin.com)
  clean = clean.replace(/https?:\/\/[a-z]{2,3}\.linkedin\.com/, 'https://www.linkedin.com');
  return clean.toLowerCase();
}

export function generateContactId(url: string | undefined): string {
  if (!url) return `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const clean = normalizeProfileUrl(url);
  // UTF-8 safe base64 encoding to handle special characters in URLs/names
  try {
    const utf8Safe = btoa(encodeURIComponent(clean).replace(/%([0-9A-F]{2})/g, (match, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
    return utf8Safe.replace(/[^a-zA-Z0-9]/g, '');
  } catch (e) {
    // Fallback if btoa fails - use full cleaned URL sanitized for ID usage
    return clean.replace(/[^a-zA-Z0-9]/g, '');
  }
}

export async function upsertContact(contact: Partial<Contact>): Promise<string> {
  if (!contact.id) {
    // Generate ID from normalized profile URL or fallback
    contact.id = generateContactId(contact.profileUrl);
  }

  const existing = await db.contacts.get(contact.id);
  if (existing) {
    await db.contacts.update(contact.id, contact);
  } else {
    await db.contacts.put({
      id: contact.id,
      firstName: '',
      lastName: '',
      fullName: '',
      title: '',
      company: '',
      profileUrl: '',
      imageUrl: '',
      role: 'unknown',
      universities: [],
      languages: [],
      locations: [],
      previousCompanies: [],
      certifications: [],
      volunteerOrgs: [],
      status: 'discovered',
      companyId: '',
      commonalities: [],
      commonalityScore: 0,
      discoveredAt: new Date(),
      messagesSent: 0,
      lastMessageDraft: '',
      notes: '',
      tags: [],
      ...contact,
    } as Contact);
  }

  return contact.id;
}

export async function getCompanies(): Promise<TargetCompany[]> {
  return db.companies.reverse().sortBy('addedAt');
}

export async function addCompany(company: Partial<TargetCompany>): Promise<string> {
  const id = company.id || `company_${Date.now()}`;
  await db.companies.put({
    id,
    name: '',
    linkedInUrl: '',
    logoUrl: '',
    addedAt: new Date(),
    ...company,
  } as TargetCompany);
  return id;
}

export async function getTemplates(): Promise<MessageTemplate[]> {
  return db.templates.toArray();
}

export async function logActivity(log: Omit<ActivityLog, 'id'>): Promise<void> {
  await db.activityLog.add(log as ActivityLog);
}

export async function getActivityLog(contactId?: string): Promise<ActivityLog[]> {
  if (contactId) {
    return db.activityLog
      .where('contactId')
      .equals(contactId)
      .reverse()
      .sortBy('timestamp');
  }
  return db.activityLog.reverse().sortBy('timestamp');
}

export async function getStats() {
  const allContacts = await db.contacts.toArray();
  const total = allContacts.length;
  
  // Count anyone whose status moved beyond 'discovered'
  const requestsSent = allContacts.filter(c => 
    !['discovered', 'untracked'].includes(c.status)
  ).length;

  const accepted = allContacts.filter(c =>
    ['accepted', 'messaged', 'replied', 'meeting_set'].includes(c.status)
  ).length;

  const messaged = allContacts.filter(c =>
    ['messaged', 'replied', 'meeting_set'].includes(c.status)
  ).length;

  const replied = allContacts.filter(c =>
    ['replied', 'meeting_set'].includes(c.status)
  ).length;

  const meetings = allContacts.filter(c => c.status === 'meeting_set').length;
  const companies = await db.companies.count();

  return {
    totalContacts: total,
    requestsSent,
    connectionsAccepted: accepted,
    messaged,
    replied,
    meetingsSet: meetings,
    acceptanceRate: requestsSent > 0 ? Math.round((accepted / requestsSent) * 100) : 0,
    replyRate: messaged > 0 ? Math.round((replied / messaged) * 100) : 0,
    companiesTracked: companies,
  };
}
