import type { MessageTemplate } from '@/types';

// ============================================================
// Built-in Message Templates
// Organized by: message type × contact role × commonality
// Variables: {firstName}, {company}, {department}, {sharedValue},
//            {icebreaker}, {calendarLink}, {userFirstName}
// ============================================================

export const DEFAULT_TEMPLATES: Omit<MessageTemplate, 'timesUsed' | 'repliesReceived'>[] = [
  // -------------------------------------------------------
  // CONNECTION NOTES (max 300 chars — LinkedIn limit)
  // -------------------------------------------------------
  {
    id: 'cn_recruiter_default',
    name: 'Recruiter — Default',
    type: 'connection_note',
    targetRole: 'recruiter',
    commonalityType: 'none',
    body: `Hi {firstName}, I'm really interested in opportunities at {company}. Would love to connect and learn more about what the team is looking for!`,
    isCustom: false,
  },
  {
    id: 'cn_recruiter_university',
    name: 'Recruiter — Same University',
    type: 'connection_note',
    targetRole: 'recruiter',
    commonalityType: 'university',
    body: `Hi {firstName}! Fellow {sharedValue} alum here. I'm interested in {company} and would love to connect!`,
    isCustom: false,
  },
  {
    id: 'cn_recruiter_language',
    name: 'Recruiter — Same Language',
    type: 'connection_note',
    targetRole: 'recruiter',
    commonalityType: 'language',
    body: `Hi {firstName}! Noticed you also speak {sharedValue} — always cool to find that in common. I'm interested in {company}, would love to connect!`,
    isCustom: false,
  },
  {
    id: 'cn_team_default',
    name: 'Team Member — Default',
    type: 'connection_note',
    targetRole: 'team_member',
    commonalityType: 'none',
    body: `Hi {firstName}, I admire the work {company}'s team is doing. I'm exploring roles in this space and would love to connect!`,
    isCustom: false,
  },
  {
    id: 'cn_hiring_manager_default',
    name: 'Hiring Manager — Default',
    type: 'connection_note',
    targetRole: 'hiring_manager',
    commonalityType: 'none',
    body: `Hi {firstName}, I'm really interested in your team at {company}. Would love to connect and learn about the work you're doing!`,
    isCustom: false,
  },

  // -------------------------------------------------------
  // INITIAL MESSAGES (after acceptance — the main event)
  // -------------------------------------------------------

  // --- With commonalities ---

  {
    id: 'im_university',
    name: 'Initial — Same University',
    type: 'initial_message',
    targetRole: 'any',
    commonalityType: 'university',
    body: `Hey {firstName}! {icebreaker} I've been really impressed by what {company} is building. Would you be open to a quick 15-min coffee chat? I'd love to hear about your experience and any advice for someone looking to break in. Happy to work around your schedule!`,
    isCustom: false,
  },
  {
    id: 'im_language',
    name: 'Initial — Same Language',
    type: 'initial_message',
    targetRole: 'any',
    commonalityType: 'language',
    body: `Hey {firstName}! {icebreaker} I'm really interested in the work {company} is doing. Would you have a few minutes for a quick virtual coffee? I'd love to hear about your path there and what the team looks for. Totally flexible on timing!`,
    isCustom: false,
  },
  {
    id: 'im_last_name',
    name: 'Initial — Same Last Name',
    type: 'initial_message',
    targetRole: 'any',
    commonalityType: 'last_name',
    body: `Hey {firstName}! {icebreaker} On a more serious note, I've been eyeing {company} and your role really caught my eye. Would you be down for a quick 15-min chat? I'd love to hear about your experience. Happy to work around your schedule!`,
    isCustom: false,
  },
  {
    id: 'im_company',
    name: 'Initial — Shared Previous Company',
    type: 'initial_message',
    targetRole: 'any',
    commonalityType: 'company',
    body: `Hey {firstName}! {icebreaker} I'm looking to make a similar move and {company} is at the top of my list. Would you be open to a quick coffee chat about how you made the transition? I'd really value your perspective. Totally flexible on timing!`,
    isCustom: false,
  },
  {
    id: 'im_location',
    name: 'Initial — Same Location',
    type: 'initial_message',
    targetRole: 'any',
    commonalityType: 'location',
    body: `Hey {firstName}! {icebreaker} I've been following what {company} is building and I'm really interested. Would you be open to a quick 15-min chat? Would love to hear about your experience on the team. Happy to work around your schedule!`,
    isCustom: false,
  },

  // --- Without commonalities (fallback) ---

  {
    id: 'im_recruiter_default',
    name: 'Initial — Recruiter (No Commonality)',
    type: 'initial_message',
    targetRole: 'recruiter',
    commonalityType: 'none',
    body: `Hey {firstName}, thanks for connecting! I've been following what {company} is building and I'm really impressed. Would you be open to a quick 15-min virtual coffee? I'd love to hear about what the team is looking for and any advice you might have. Happy to work around your schedule!`,
    isCustom: false,
  },
  {
    id: 'im_hiring_manager_default',
    name: 'Initial — Hiring Manager (No Commonality)',
    type: 'initial_message',
    targetRole: 'hiring_manager',
    commonalityType: 'none',
    body: `Hey {firstName}, really appreciate the connection! I've been following the work your team at {company} is doing and it's exciting. Would you have a few minutes for a quick chat? I'd love to learn about what you look for in candidates and any advice you'd share. Totally flexible on timing!`,
    isCustom: false,
  },
  {
    id: 'im_team_default',
    name: 'Initial — Team Member (No Commonality)',
    type: 'initial_message',
    targetRole: 'team_member',
    commonalityType: 'none',
    body: `Hey {firstName}, thanks for accepting! I'm a big fan of what {company} is building. I'm exploring opportunities in this space and your team caught my eye. If you ever have a few minutes for a quick chat, I'd really appreciate the chance to learn from your perspective. No pressure at all!`,
    isCustom: false,
  },
  {
    id: 'im_generic_default',
    name: 'Initial — Generic Fallback',
    type: 'initial_message',
    targetRole: 'any',
    commonalityType: 'none',
    body: `Hey {firstName}, thanks for connecting! I've been really interested in {company} and would love to learn more about the team. Would you be open to a quick 15-min virtual coffee? Happy to work around your schedule!`,
    isCustom: false,
  },

  // -------------------------------------------------------
  // FOLLOW-UP MESSAGES
  // -------------------------------------------------------
  {
    id: 'fu_nudge',
    name: 'Follow-Up — Gentle Nudge (5 days)',
    type: 'follow_up',
    targetRole: 'any',
    commonalityType: 'none',
    body: `Hey {firstName}! Just wanted to bump this in case it got buried — I know how busy things get. If you ever have 15 minutes, I'd love to chat. No rush at all!`,
    isCustom: false,
  },
  {
    id: 'fu_final',
    name: 'Follow-Up — Final Check-In (12 days)',
    type: 'nudge',
    targetRole: 'any',
    commonalityType: 'none',
    body: `Hi {firstName}, just a final check-in! I know how busy things get. If now isn't a great time, no worries at all — I appreciate the connection regardless. Feel free to reach out anytime if you'd ever like to chat. Wishing you a great rest of the week!`,
    isCustom: false,
  },
];

/**
 * Find the best matching template for a given context
 */
export function findBestTemplate(
  templates: MessageTemplate[],
  type: string,
  role: string,
  commonalityType: string
): MessageTemplate | undefined {
  // Try exact match: type + role + commonality
  let match = templates.find(
    t => t.type === type && t.targetRole === role && t.commonalityType === commonalityType
  );
  if (match) return match;

  // Try: type + 'any' role + commonality
  match = templates.find(
    t => t.type === type && t.targetRole === 'any' && t.commonalityType === commonalityType
  );
  if (match) return match;

  // Try: type + role + 'none' commonality
  match = templates.find(
    t => t.type === type && t.targetRole === role && t.commonalityType === 'none'
  );
  if (match) return match;

  // Fallback: type + 'any' role + 'none' commonality
  match = templates.find(
    t => t.type === type && t.targetRole === 'any' && t.commonalityType === 'none'
  );
  return match;
}

/**
 * Fill template variables with actual data
 */
export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}
