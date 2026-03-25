import { db, upsertContact, getContacts, getCompanies, getUserProfile, saveUserProfile, addCompany, getStats, getTemplates, logActivity, generateContactId } from '@/lib/db';
import { findCommonalities, calculateCommonalityScore } from '@/lib/commonality';
import { DEFAULT_TEMPLATES, findBestTemplate, fillTemplate } from '@/lib/templates';
import type { ExtensionMessage, Contact, MessageTemplate, UserProfile } from '@/types';

// ============================================================
// LIWarrior Service Worker
// Background logic: processes data from content scripts,
// runs the Commonality Engine, generates message drafts,
// and sends notifications.
// ============================================================

console.log('[LIWarrior] Service worker started');

// ============================================================
// Seed default templates on install
// ============================================================

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[LIWarrior] First install — seeding default templates');
    const existingTemplates = await getTemplates();
    if (existingTemplates.length === 0) {
      for (const template of DEFAULT_TEMPLATES) {
        await db.templates.put({
          ...template,
          timesUsed: 0,
          repliesReceived: 0,
        } as MessageTemplate);
      }
    }
  }
});

// ============================================================
// Message handler — receives data from content scripts
// ============================================================

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) => {
        console.error('[LIWarrior] Error handling message:', err);
        sendResponse({ error: err.message });
      });
    return true; // Keep message channel open for async response
  }
);

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case 'SEARCH_RESULTS_SCRAPED':
      return handleSearchResults(message.data);

    case 'PROFILE_SCRAPED':
      return handleProfileScraped(message.data);

    case 'CONNECTION_SENT':
      return handleConnectionSent(message.data);

    case 'CONNECTION_ACCEPTED':
      return handleConnectionAccepted(message.data);

    case 'GET_CONTACTS':
      return getContacts(message.filter);

    case 'GET_COMPANIES':
      return getCompanies();

    case 'GET_USER_PROFILE':
      return getUserProfile();

    case 'SAVE_USER_PROFILE':
      await saveUserProfile(message.data);
      return { success: true };

    case 'ADD_COMPANY':
      return addCompany(message.data);

    case 'UPDATE_CONTACT_STATUS':
      await db.contacts.update(message.data.contactId, {
        status: message.data.status,
        ...(message.data.status === 'messaged' ? { messagedAt: new Date() } : {}),
        ...(message.data.status === 'replied' ? { repliedAt: new Date() } : {}),
        ...(message.data.status === 'meeting_set' ? { meetingSetAt: new Date() } : {}),
      });
      return { success: true };

    case 'GENERATE_MESSAGE':
      return generateMessage(message.data.contactId, message.data.type);

    case 'GET_STATS':
      return getStats();

    case 'GET_TEMPLATES':
      return getTemplates();

    case 'SAVE_TEMPLATE':
      await db.templates.put(message.data as MessageTemplate);
      return { success: true };

    case 'TRACK_CONTACT':
      return upsertContact(message.data);

    case 'OPEN_SIDEPANEL':
      // Open side panel in the current window
      if (message.data?.contactId) {
        await chrome.storage.local.set({
          sidepanelContactId: message.data.contactId,
        });
      }
      return { success: true };

    default:
      console.warn('[LIWarrior] Unknown message type:', (message as any).type);
      return null;
  }
}

// ============================================================
// Event Handlers
// ============================================================

async function handleSearchResults(contacts: Partial<Contact>[]): Promise<void> {
  const userProfile = await getUserProfile();

  for (const contact of contacts) {
    // Check if already tracked
    if (contact.profileUrl) {
      const id = btoa(contact.profileUrl).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
      const existing = await db.contacts.get(id);
      if (existing) continue; // Already tracked, skip
    }

    // Run commonality engine if user profile exists
    if (userProfile) {
      const commonalities = findCommonalities(userProfile, contact as Contact);
      contact.commonalities = commonalities;
      contact.commonalityScore = calculateCommonalityScore(commonalities);
    }

    // Store (but don't auto-track — user decides)
    // We cache these in a temporary store for the UI to display
    await chrome.storage.local.set({
      [`search_cache_${contact.profileUrl}`]: contact,
    });
  }

  // Store the count for the popup badge
  const currentCache = (await chrome.storage.local.get('searchCacheCount'))?.searchCacheCount || 0;
  await chrome.storage.local.set({
    searchCacheCount: currentCache + contacts.length,
  });
}

async function handleProfileScraped(data: Partial<Contact>): Promise<void> {
  if (!data.profileUrl) return;

  const id = btoa(data.profileUrl).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  const existing = await db.contacts.get(id);

  if (existing) {
    // Update with richer profile data
    const userProfile = await getUserProfile();
    let commonalities = existing.commonalities;
    let commonalityScore = existing.commonalityScore;

    if (userProfile) {
      const merged = { ...existing, ...data } as Contact;
      commonalities = findCommonalities(userProfile, merged);
      commonalityScore = calculateCommonalityScore(commonalities);
    }

    await db.contacts.update(id, {
      ...data,
      commonalities,
      commonalityScore,
    });
  } else {
    // Cache for potential tracking
    const userProfile = await getUserProfile();
    if (userProfile) {
      const commonalities = findCommonalities(userProfile, data as Contact);
      data.commonalities = commonalities;
      data.commonalityScore = calculateCommonalityScore(commonalities);
    }
    await chrome.storage.local.set({
      [`profile_cache_${data.profileUrl}`]: data,
    });
  }
}

async function handleConnectionSent(data: { profileUrl: string; name: string }): Promise<void> {
  console.log('[LIWarrior][SW] handleConnectionSent called:', data);
  // Find the contact by profile URL and update status
  const id = generateContactId(data.profileUrl);
  console.log('[LIWarrior][SW] Generated ID:', id, 'from', data.profileUrl);
  const existing = await db.contacts.get(id);
  console.log('[LIWarrior][SW] Existing contact?', !!existing);

  if (existing) {
    await db.contacts.update(id, {
      status: 'request_sent',
      requestSentAt: new Date(),
    });
  } else {
    // Auto-track if they sent a connection request
    console.log('[LIWarrior][SW] Upserting new contact for', data.name);
    const nameParts = data.name.split(' ');
    await upsertContact({
      id,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      fullName: data.name,
      profileUrl: data.profileUrl,
      status: 'request_sent',
      requestSentAt: new Date(),
    });
  }

  console.log('[LIWarrior][SW] Logging activity...');
  await logActivity({
    contactId: id,
    companyId: '',
    action: 'request_sent',
    timestamp: new Date(),
    details: `Connection request sent to ${data.name}`,
  });
}

async function handleConnectionAccepted(data: { name: string; profileUrl?: string }): Promise<void> {
  // Find the contact by name match in our pending list
  const pendingContacts = await getContacts({ status: 'request_sent' });
  const nameNorm = data.name.toLowerCase().trim();

  let contact = pendingContacts.find(
    c => c.fullName.toLowerCase().trim() === nameNorm
  );

  // Also try matching by profile URL
  if (!contact && data.profileUrl) {
    const id = btoa(data.profileUrl).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    contact = await db.contacts.get(id) || undefined;
  }

  if (contact) {
    await db.contacts.update(contact.id, {
      status: 'accepted',
      acceptedAt: new Date(),
    });

    // Generate a message draft
    const draft = await generateMessage(contact.id, 'initial_message');

    // Send browser notification
    chrome.notifications.create(`acceptance_${contact.id}`, {
      type: 'basic',
      iconUrl: '/public/icons/icon128.png',
      title: 'Connection Accepted!',
      message: `${contact.fullName} accepted your connection. Draft message ready!`,
      priority: 2,
    });

    await logActivity({
      contactId: contact.id,
      companyId: contact.companyId,
      action: 'accepted',
      timestamp: new Date(),
      details: `${contact.fullName} accepted connection request`,
    });
  }
}

// ============================================================
// Message Generation
// ============================================================

async function generateMessage(
  contactId: string,
  type: string
): Promise<{ draft: string; template: string; commonality?: string } | null> {
  const contact = await db.contacts.get(contactId);
  if (!contact) return null;

  const userProfile = await getUserProfile();
  const templates = await getTemplates();

  // Determine the best commonality to use
  const topCommonality = contact.commonalities?.[0];
  const commonalityType = topCommonality?.type || 'none';

  // Find best matching template
  const template = findBestTemplate(
    templates,
    type,
    contact.role,
    commonalityType
  );

  if (!template) {
    return { draft: '', template: 'none' };
  }

  // Build calendar links block
  const links = userProfile?.calendarLinks;
  let calendarBlock = '';
  if (links) {
    const parts: string[] = [];
    if (links.min15) parts.push(`⏱ 15 min: ${links.min15}`);
    if (links.min30) parts.push(`⏱ 30 min: ${links.min30}`);
    if (links.hr1)   parts.push(`⏱ 1 hour: ${links.hr1}`);
    if (parts.length > 0) {
      calendarBlock = '\n\nPick a time that works for you:\n' + parts.join('\n');
    }
  }

  // Build template variables
  const vars: Record<string, string> = {
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company,
    department: extractDepartment(contact.title),
    contactTitle: contact.title,
    userFirstName: userProfile?.firstName || '',
    sharedValue: topCommonality?.contactValue || '',
    icebreaker: topCommonality?.suggestedIcebreaker || '',
    calendarBlock,
  };

  const draft = fillTemplate(template.body, vars);

  // Save draft to contact
  await db.contacts.update(contactId, { lastMessageDraft: draft });

  return {
    draft,
    template: template.id,
    commonality: topCommonality?.type,
  };
}

function extractDepartment(title: string): string {
  // Try to extract department/team from title
  const parts = title.split(/[,|·–-]/);
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return title;
}

// ============================================================
// Notification click handler — open side panel
// ============================================================

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('acceptance_')) {
    const contactId = notificationId.replace('acceptance_', '');
    chrome.storage.local.set({ sidepanelContactId: contactId });
    // Try to open side panel (requires user gesture in some contexts)
  }
});
