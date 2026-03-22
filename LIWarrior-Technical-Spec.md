# LIWarrior — Technical Specification

**Version:** 2.0
**Date:** March 20, 2026
**Status:** Planning Phase

---

## 1. Product Overview

**LIWarrior** is a LinkedIn networking assistant and tracker built for job seekers who don't have LinkedIn Premium. Rather than a fully automated bot, LIWarrior operates as a **smart assistant** — it finds the right people at your target companies, monitors your connection requests, and when someone accepts, it generates a personalized message draft for you to review and send yourself. Think of it as a CRM + smart copilot for your LinkedIn job search grind.

### Why "Semi-Automated" Instead of "Fully Automated"

Most LinkedIn automation tools (Dux-Soup, Expandi, etc.) take full control — they click buttons, send messages, and act on your behalf. That's exactly what LinkedIn's detection systems are built to catch. LIWarrior takes a fundamentally different approach:

| Action | Fully Automated Tools | LIWarrior |
|--------|----------------------|-----------|
| Find recruiters at a company | Bot scrapes and stores | Extension reads visible search results while YOU browse |
| Send connection requests | Bot clicks "Connect" programmatically | YOU click "Connect" — extension just tracks it |
| Detect acceptance | Bot polls your connections page | Extension watches your **notification feed** for acceptance events |
| Send follow-up message | Bot types and sends automatically | Extension **generates a draft** → shows it to you → YOU hit send |

**Why this matters:**
- Every real action (clicking Connect, hitting Send) comes from a human click — not injected JavaScript
- LinkedIn's detection algorithms look for programmatic DOM interactions. If the human is always the one clicking, there's nothing to detect
- This positions LIWarrior as a **productivity tool** (like Grammarly or Teal), not an automation bot
- This makes it safe to advertise on LinkedIn itself

### Core Value Proposition

LIWarrior does the tedious research and drafting so you can focus on the human part — actually connecting. It finds who to talk to, tells you when they've accepted, writes a message that feels personal (because it IS personal — it finds real commonalities), and you send it with one click.

### Target Users

- College students targeting internships and campus recruiting
- Early-career professionals (0–3 years) breaking into specific companies
- Mid-career professionals pivoting industries or leveling up
- Anyone job hunting without LinkedIn Premium

---

## 2. Competitive Landscape

### Existing Tools

| Tool | Type | Price | Approach | Risk Level |
|------|------|-------|----------|------------|
| Dux-Soup | Chrome Extension | $14–99/mo | Full automation, DOM manipulation | High |
| Linked Helper | Desktop App | $15–45/mo | Full automation, standalone | Medium |
| PhantomBuster | Cloud Platform | $69–159/mo | Cloud-based automation | High |
| Expandi | Cloud Platform | $99/mo | Full automation, residential IPs | Medium |
| Teal | Web App | Free–$29/mo | Job tracker, no LinkedIn automation | None |
| Huntr | Web App | Free–$40/mo | Job tracker, no LinkedIn automation | None |
| Careerflow | Chrome Extension | Free–$12/mo | Profile optimizer, basic tracking | Low |

### LIWarrior's Position

LIWarrior sits in a unique gap: **Teal/Huntr-level safety** with **Dux-Soup-level intelligence**. It's a tracker and assistant (safe to advertise, safe to use) that's actually smart about who you should connect with and what you should say to them.

Key differentiators:
- **Zero automation risk** — you click every button, the tool just helps you decide what and when
- **Commonality-based personalization** — finds shared universities, languages, backgrounds, even last names
- **Recruiter-specific** — not a generic sales tool; optimized for the job search grind
- **Free or very low cost** — undercuts everything in the market

---

## 3. Architecture

### Design Philosophy: Observer + Advisor, Not Actor

LIWarrior never performs actions on LinkedIn. It only:
1. **Reads** what's on the page (search results, profiles, notifications)
2. **Stores** contact data locally
3. **Generates** message drafts
4. **Notifies** you when something needs your attention

```
┌──────────────────────────────────────────────────────────┐
│                 LIWARRIOR ARCHITECTURE                     │
│               "Observer + Advisor" Model                   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  LINKEDIN TAB (what the user sees)                        │
│  ┌──────────────────────────────────────────────────┐     │
│  │                                                    │     │
│  │  Content Script (READ-ONLY observer)              │     │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐  │     │
│  │  │ Page       │ │ Profile    │ │ Notification │  │     │
│  │  │ Scanner    │ │ Reader     │ │ Watcher      │  │     │
│  │  │            │ │            │ │              │  │     │
│  │  │ Reads      │ │ Extracts   │ │ Detects new  │  │     │
│  │  │ search     │ │ name,      │ │ connection   │  │     │
│  │  │ results    │ │ title,     │ │ acceptances  │  │     │
│  │  │ as you     │ │ education, │ │ from the     │  │     │
│  │  │ browse     │ │ languages, │ │ notification │  │     │
│  │  │            │ │ etc.       │ │ bell         │  │     │
│  │  └─────┬──────┘ └─────┬──────┘ └──────┬───────┘  │     │
│  │        │              │               │           │     │
│  └────────┼──────────────┼───────────────┼───────────┘     │
│           │              │               │                  │
│           ▼              ▼               ▼                  │
│  ┌──────────────────────────────────────────────────┐     │
│  │ Service Worker (Background)                       │     │
│  │                                                    │     │
│  │ - Receives data from content scripts              │     │
│  │ - Stores contacts in IndexedDB                    │     │
│  │ - Runs Commonality Engine on new profiles         │     │
│  │ - Generates message drafts                        │     │
│  │ - Sends browser notifications on acceptance       │     │
│  │ - NEVER interacts with LinkedIn DOM               │     │
│  └─────────────────────┬────────────────────────────┘     │
│                         │                                   │
│           ┌─────────────┼─────────────┐                    │
│           ▼             ▼             ▼                    │
│  ┌──────────────┐ ┌──────────┐ ┌────────────────────┐    │
│  │ Popup Panel  │ │ Side     │ │ Dashboard          │    │
│  │              │ │ Panel    │ │ (Options Page)     │    │
│  │ Quick stats  │ │          │ │                    │    │
│  │ & alerts     │ │ Shows    │ │ Full CRM view     │    │
│  │              │ │ message  │ │ Companies          │    │
│  │              │ │ draft +  │ │ Contacts           │    │
│  │              │ │ "Copy"   │ │ Analytics          │    │
│  │              │ │ button   │ │ Templates          │    │
│  └──────────────┘ └──────────┘ └────────────────────┘    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │ Local Storage (IndexedDB via Dexie.js)            │     │
│  │                                                    │     │
│  │ - Contacts + commonality data                     │     │
│  │ - Companies                                       │     │
│  │ - Message templates + drafts                      │     │
│  │ - Activity log                                    │     │
│  │ - User profile (for commonality matching)         │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Why This Architecture Is Safe

1. **No DOM manipulation** — Content scripts only READ the page, never click buttons or fill inputs
2. **No programmatic navigation** — The user browses LinkedIn normally; the extension just watches
3. **No network requests to LinkedIn** — No hidden API calls, no session hijacking
4. **Human-in-the-loop** — Every action that modifies LinkedIn state requires the user to physically click
5. **Standard extension behavior** — Reading page content is what thousands of extensions do (password managers, Grammarly, ad blockers)

---

## 4. Technical Stack

### Chrome Extension (Core)

| Component | Technology | Why |
|-----------|-----------|-----|
| Manifest | Manifest V3 | Required by Chrome since 2025 |
| Content Scripts | TypeScript | Read-only observers on LinkedIn pages |
| Service Worker | TypeScript | Data processing, commonality engine, draft generation |
| Extension UI | React + Tailwind | Popup, side panel, and dashboard |
| Storage | IndexedDB (Dexie.js) | Structured local data with querying |
| Build | Vite + CRXJS | Fast builds with HMR for dev |

### Dashboard (Extension Options Page)

| Component | Technology |
|-----------|-----------|
| Framework | React 18 |
| Styling | Tailwind CSS |
| State | Zustand |
| Charts | Recharts |
| Tables | TanStack Table |

### Optional Backend (Phase 2)

| Component | Technology |
|-----------|-----------|
| API | Node.js + Hono |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Supabase Auth (free tier) |
| Hosting | Railway or Fly.io |

---

## 5. The Commonality Engine — Killer Feature

This is what makes LIWarrior's messages feel genuinely personal instead of template-spammy. When you view a recruiter's profile on LinkedIn, the content script extracts their public profile data and compares it against YOUR profile to find shared connections points.

### Commonality Detection Matrix

| Commonality | How It's Detected | Priority | Example Output |
|-------------|-------------------|----------|----------------|
| Same university | Match education section | 1 (highest) | "Fellow Longhorn here! Hook 'em" |
| Same languages (non-English) | Match languages section | 2 | "I noticed you also speak Portuguese — sempre bom encontrar outros brasileiros na área!" |
| Same last name | String comparison | 3 | "Love seeing another Hernandez in tech — what if we're long-lost cousins? haha" |
| Same hometown/region | Match location history | 4 | "Always great to connect with someone from the Bay Area" |
| Shared previous company | Match experience sections | 5 | "I see you were at Google too — small world!" |
| Same volunteer causes | Match volunteer section | 6 | "Noticed we're both involved in Girls Who Code" |
| Shared certifications | Match certifications | 7 | "Fellow AWS certified professional!" |
| Same industry background | Match experience history | 8 | "I see you also started in consulting before moving to tech" |

### How It Works Technically

```typescript
interface UserProfile {
  firstName: string;
  lastName: string;
  universities: string[];        // ["UT Austin", "Rice University"]
  languages: string[];            // ["Spanish", "Portuguese"]
  locations: string[];            // ["Austin, TX", "São Paulo, Brazil"]
  companies: string[];            // ["Google", "Meta"]
  certifications: string[];       // ["AWS Solutions Architect"]
  volunteerOrgs: string[];        // ["Girls Who Code"]
  industries: string[];           // ["Consulting", "Tech"]
}

interface CommonalityResult {
  type: 'university' | 'language' | 'last_name' | 'location' |
        'company' | 'volunteer' | 'certification' | 'industry';
  priority: number;              // 1 = highest
  userValue: string;             // What the user has
  contactValue: string;          // What the contact has
  matchStrength: 'exact' | 'partial';
  suggestedIcebreaker: string;   // Pre-written opener for this match
}

// The engine returns ranked commonalities
function findCommonalities(
  userProfile: UserProfile,
  contactProfile: UserProfile
): CommonalityResult[] {
  // ... compare all fields, rank by priority
  // Returns top 1-2 commonalities for message use
}
```

### Commonality-Powered Message Generation

When a connection is accepted and the user wants to message them, LIWarrior generates a draft that weaves in the strongest commonality:

**Example: Same university**
```
Hey Sarah! Fellow Longhorn here — always great to connect with
UT alumni in tech. I've been really impressed by what Microsoft's
Azure team is building, especially in the AI space. Would you be
open to a quick 15-min coffee chat? I'd love to hear about your
experience on the team and any advice for someone looking to
break in. Happy to work around your schedule!
```

**Example: Same non-English language**
```
Hey Carlos! Noticed you also speak Portuguese — sempre bom
encontrar outros na área! I'm really interested in the work
Google's Cloud team is doing. Would you have a few minutes for
a quick virtual coffee? I'd love to hear about your path there
and what the team looks for. Totally flexible on timing!
```

**Example: Same last name**
```
Hey Diego Hernandez! Can't help but notice we share the last
name — what if we're long-lost cousins? haha. On a more serious
note, I've been eyeing Amazon's AWS team and your role there
really caught my eye. Would you be down for a quick 15-min chat?
I'd love to hear about your experience. Happy to work around
your schedule!
```

**Example: Shared previous company**
```
Hey Priya! Small world — I see you were at Deloitte before
making the jump to Meta. I'm looking to make a similar transition
into tech. Would you be open to a quick coffee chat about how you
made the switch? I'd really value your perspective. Totally
flexible on timing!
```

**Example: No strong commonality found (fallback)**
```
Hey James! Thanks for connecting. I've been following what
Microsoft's DevDiv team is building and I'm really impressed.
Would you be open to a quick 15-min virtual coffee? I'd love
to hear about your experience and any advice for someone
looking to join the team. Happy to work around your schedule!
```

### The User Flow for Messaging

1. Contact accepts your connection request
2. LIWarrior detects it via the notification feed
3. Browser notification pops up: "Sarah Chen accepted! Draft ready."
4. User clicks notification → side panel opens with:
   - Contact info summary
   - Detected commonalities (highlighted)
   - Generated message draft
   - "Copy to clipboard" button
   - "Edit" button to tweak before sending
5. User copies the message, opens LinkedIn chat, pastes, and sends
6. LIWarrior marks the contact as "Messaged" in the tracker

**Alternative flow (even smoother):**
- Side panel shows the draft with a "Open Chat" button
- Clicking it navigates to the LinkedIn messaging thread with that person
- User pastes the pre-copied message and sends
- Still 100% human-initiated — just streamlined

---

## 6. Feature Breakdown

### Phase 1: MVP (Weeks 1–4)

#### 6.1 User Profile Setup (Onboarding)

On first install, user fills in their profile data that powers the Commonality Engine:

- Name
- Universities attended
- Languages spoken (besides English)
- Current/past companies
- Target role type (SWE, PM, Design, Data, etc.)
- Target experience level (Intern, New Grad, Mid, Senior)
- Certifications
- Location history
- Calendly/Cal.com link (optional, for including in messages)

This data stays 100% local — never leaves the browser.

#### 6.2 Company Targeting

**What it does:** User adds target companies to their hit list.

**How it works:**
1. User types a company name in the LIWarrior dashboard
2. Dashboard stores it and provides a "Search on LinkedIn" button
3. Button opens LinkedIn's people search pre-filtered for that company + recruiter-type titles
4. As the user browses results normally, the content script passively reads visible profiles
5. User can click "Track" on any profile card the extension highlights
6. Tracked contacts are saved to IndexedDB

**Key difference from v1 spec:** The extension doesn't navigate or scrape automatically. The USER browses, and the extension reads what's on screen. This is the same thing a screen reader or accessibility tool does.

**Title filter keywords (configurable):**
- Recruiter, Talent Acquisition, Campus Recruiter, University Recruiter
- Hiring Manager, Engineering Manager, Team Lead
- HR, People Operations, People Partner
- Technical Recruiter, Sourcer

#### 6.3 Connection Request Tracking

**What it does:** Tracks connection requests you send manually.

**How it works:**
1. When the user is on a LinkedIn profile and clicks "Connect" (themselves)
2. The content script detects the connection request was sent (via DOM observation)
3. Logs the contact as "Request Sent" with timestamp
4. The extension does NOT click anything — it just observes the state change

**Optional connection note assist:**
- When the user clicks "Connect" → "Add a note", the extension can pre-populate a suggested note in the clipboard
- User pastes it into LinkedIn's note field and clicks "Send" themselves
- Note is personalized using the Commonality Engine if profile was already scanned

#### 6.4 Acceptance Detection & Notification

**What it does:** Watches for accepted connection requests and alerts you.

**How it works:**
- Content script watches LinkedIn's notification dropdown/page when the user has LinkedIn open
- When it spots a "X accepted your connection request" notification, it fires an event
- Service worker matches the name against the "Request Sent" list in IndexedDB
- If matched → generates message draft → sends browser notification to user
- If no match (organic acceptance) → still offers to generate a message

**Why notification watching is safer than polling:**
- No hidden page navigation
- Only reads what's already loaded in the user's current session
- Works passively while user is using LinkedIn normally

#### 6.5 Message Draft Generation

**What it does:** Generates a personalized message draft when a connection is accepted.

**How it works:**
1. Acceptance detected (via notifications)
2. Commonality Engine compares user profile vs. contact profile
3. Selects best template based on: contact role + strongest commonality
4. Fills in template variables
5. Presents draft in side panel with:
   - The message text
   - Which commonality was used (highlighted)
   - "Copy" button
   - "Edit" button
   - "Open chat with {name}" button

**The user always sends manually.** LIWarrior never types into LinkedIn's message box or clicks Send.

#### 6.6 Connection Tracker Dashboard

**What it does:** CRM-like interface showing your networking pipeline.

**Pipeline stages:**

| Status | Icon | Description |
|--------|------|------------|
| Discovered | magnifier | Found while browsing, tracked but not connected |
| Request Sent | outgoing arrow | You sent a connection request |
| Accepted | handshake | They accepted, message draft ready |
| Messaged | message bubble | You sent the follow-up message |
| Replied | reply arrow | They responded |
| Meeting Set | calendar | You've scheduled a call/chat |
| Cold | snowflake | No response after 14+ days |

**Dashboard features:**
- Kanban board view (drag contacts between stages)
- Table view with sorting and filtering
- Company-level aggregation ("Microsoft: 3 connected, 2 replied, 1 meeting")
- Activity timeline per contact
- Response rate analytics
- Export to CSV
- Daily/weekly summary notifications

### Phase 2: Enhanced Features (Weeks 5–8)

#### 6.7 Follow-Up Reminder System
- If no reply after 5 days → reminder notification: "Nudge Sarah? Draft ready."
- Generates a follow-up draft (different from original message)
- User sends it themselves
- Max 2 follow-ups tracked to avoid being pushy

#### 6.8 Message Performance Analytics
- Track which commonality types get the best response rates
- Track which message templates perform best
- Suggest optimizations: "University-based messages get 34% more replies for you"

#### 6.9 Profile Match Score
- When browsing LinkedIn, show a small badge on profiles indicating how many commonalities exist
- "3 things in common" badge makes it easier to prioritize who to connect with

#### 6.10 Smart Scheduling Integration
- If user has a Calendly/Cal.com link, auto-include it in message drafts
- Track when meetings are booked (user marks manually or via calendar integration)

### Phase 3: Growth Features (Weeks 9–12)

#### 6.11 Optional Backend Sync
- Cross-device dashboard access
- Anonymized community data: "Microsoft recruiters respond to 23% of messages"
- Shared template library

#### 6.12 Job Board Integration
- Track job postings alongside networking contacts
- Match: "You're networking with 3 people at Microsoft AND they have 2 open SWE roles"

---

## 7. Messaging Strategy Deep Dive

### What the Research Says

- Personalized connection requests get ~9.4% reply rate vs. 5.4% for blank requests
- Messages under 500 characters perform best (mobile readability)
- Recruiters/HR have a 12% response rate — highest of any job function
- Multi-step sequences (2–3 follow-ups) push response rates to 20–30%
- Best days: Tuesday, Wednesday, Thursday
- Best times: 9–11 AM, 1–2 PM in recipient's timezone

### Message Design Principles

1. **Lead with the commonality** — it's the hook that makes them actually read the message
2. **One clear ask** — coffee chat OR role question, not both
3. **Under 100 words** — respect their time, especially on mobile
4. **Conversational, not corporate** — "would you be down for" beats "I would appreciate the opportunity to"
5. **Low-pressure close** — "no pressure at all" / "totally flexible" signals you're not desperate
6. **Include a scheduling link** if available — removes friction for saying yes

### Template System

Templates are organized by two axes: **contact role** and **commonality type**.

**Role categories:**
- Recruiter (general, campus, technical)
- Hiring Manager / Team Lead
- Team Member (potential peer)
- Alumni in the company

**Commonality categories:**
- University match
- Language match (non-English)
- Last name match
- Location match
- Previous company match
- Volunteer/cause match
- Certification match
- Industry background match
- No match (fallback)

This creates a matrix of ~36 template combinations, each with 2–3 variants for A/B testing.

### Template Variables

| Variable | Source | Example |
|----------|--------|---------|
| `{firstName}` | Contact profile | "Sarah" |
| `{lastName}` | Contact profile | "Chen" |
| `{company}` | Target company | "Microsoft" |
| `{department}` | Contact title | "Azure Engineering" |
| `{contactTitle}` | Contact title | "Senior Technical Recruiter" |
| `{userFullName}` | User profile | "Heo" |
| `{userRole}` | User profile | "Software Engineer" |
| `{sharedUni}` | Commonality Engine | "UT Austin" |
| `{sharedLanguage}` | Commonality Engine | "Portuguese" |
| `{sharedCompany}` | Commonality Engine | "Deloitte" |
| `{sharedLastName}` | Commonality Engine | "Hernandez" |
| `{calendarLink}` | User settings | "calendly.com/heo" |

### Follow-Up Templates

**Nudge (5 days, no reply):**
```
Hey {firstName}! Just wanted to bump this in case it got buried.
Totally understand if you're swamped — recruiters always are!
If you ever have 15 minutes, I'd love to chat. No rush at all.
```

**Final check-in (12 days, no reply):**
```
Hi {firstName}, just a final check-in! I know how busy things
get. If now isn't a great time, no worries at all — I appreciate
the connection regardless. Feel free to reach out anytime if
you'd ever like to chat about {department}. Wishing you a
great rest of the week!
```

---

## 8. Safety, Legal & Marketing Strategy

### Why LIWarrior Is Legally Defensible

The semi-automated approach fundamentally changes the risk profile:

| Concern | Fully Automated Tool | LIWarrior |
|---------|---------------------|-----------|
| LinkedIn ToS violation | Yes — programmatic actions | Minimal — reads page content (like any extension) |
| Account ban risk | High — detectable patterns | Very low — all actions are human-initiated |
| Chrome Web Store risk | May be removed | Standard extension behavior, should be approved |
| Legal liability | Tool performs banned actions | Tool only reads data and generates text |
| CFAA exposure | Gray area (authenticated automation) | Very low (read-only, no injection) |

### Advertising on LinkedIn — How to Do It

**Positioning is everything.** Here's how to market it safely:

**DO say:**
- "Track your networking pipeline"
- "Smart message assistant for job seekers"
- "Never forget to follow up with a recruiter"
- "Your job search CRM that lives in Chrome"
- "Personalized networking made easy"

**DON'T say:**
- "Automate your LinkedIn outreach"
- "Send messages automatically"
- "Bot", "automation", "scraper"
- "Bypass LinkedIn Premium"

**Comparable tools that advertise on LinkedIn successfully:**
- Teal — "Track your job search" (free Chrome extension + web app)
- Careerflow — "AI job search tools" (Chrome extension)
- Huntr — "Organize your job search" (web app)

These all have LinkedIn ad campaigns and Chrome Web Store listings. LIWarrior fits in this exact category.

**LinkedIn Ad Strategy:**
- Target: Job seekers, students, career changers
- Messaging: "Tired of losing track of recruiter connections? LIWarrior keeps your network organized."
- CTA: "Add to Chrome — Free"
- Format: Sponsored content + conversation ads

### Chrome Web Store Distribution

Since LIWarrior only reads page content and doesn't inject actions, it should pass Chrome Web Store review. Many similar extensions exist:

- Password managers read and fill forms
- Grammarly reads and suggests text
- LinkedIn-specific tools like Teal's extension read job listings

**Store listing positioning:** "Job search networking tracker and message assistant"

### Disclaimers to Include

Even though LIWarrior is much safer, still include:
- "LIWarrior is a productivity tool. All actions on LinkedIn are performed by you."
- "LIWarrior reads publicly visible profile information to help you craft better messages."
- "Your data never leaves your browser."
- Privacy policy explaining what data is read and stored locally

---

## 9. Database Schema

```typescript
// User's own profile (for Commonality Engine)
interface UserProfile {
  id: 'self';
  firstName: string;
  lastName: string;
  universities: string[];
  languages: string[];           // Non-English languages
  currentLocation: string;
  previousLocations: string[];
  companies: string[];           // Current + past
  certifications: string[];
  volunteerOrgs: string[];
  targetRoles: string[];         // "SWE", "PM", "Data Scientist"
  targetLevel: string;           // "Intern", "New Grad", "Mid", "Senior"
  calendarLink?: string;
}

// Tracked contacts
interface Contact {
  id: string;                    // LinkedIn profile slug or generated ID
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  company: string;
  profileUrl: string;
  // Profile data for commonality matching
  universities: string[];
  languages: string[];
  locations: string[];
  previousCompanies: string[];
  certifications: string[];
  volunteerOrgs: string[];
  // Pipeline status
  status: 'discovered' | 'request_sent' | 'accepted' |
          'messaged' | 'replied' | 'meeting_set' | 'cold';
  // Commonality data
  commonalities: CommonalityResult[];
  commonalityScore: number;      // Sum of priority-weighted matches
  // Timestamps
  discoveredAt: Date;
  requestSentAt?: Date;
  acceptedAt?: Date;
  messagedAt?: Date;
  repliedAt?: Date;
  meetingSetAt?: Date;
  // Message tracking
  messagesSent: number;
  lastMessageDraft?: string;
  // User notes
  notes: string;
  tags: string[];
}

// Target companies
interface TargetCompany {
  id: string;
  name: string;
  linkedInUrl: string;
  logoUrl?: string;
  // Aggregated stats (computed)
  totalContacts: number;
  requestsSent: number;
  connectionsAccepted: number;
  messaged: number;
  replied: number;
  meetingsSet: number;
  addedAt: Date;
}

// Message templates
interface MessageTemplate {
  id: string;
  name: string;
  type: 'connection_note' | 'initial_message' | 'follow_up' | 'nudge';
  targetRole: string;            // "recruiter" | "hiring_manager" | "team_member" | "any"
  commonalityType: string;       // "university" | "language" | "last_name" | ... | "none"
  body: string;                  // Template with {variables}
  // Performance tracking
  timesUsed: number;
  repliesReceived: number;
  replyRate: number;
  isCustom: boolean;             // User-created vs. built-in
}

// Activity log
interface ActivityLog {
  id: string;
  contactId: string;
  companyId: string;
  action: 'discovered' | 'request_sent' | 'accepted' |
          'draft_generated' | 'message_sent' | 'reply_received' |
          'follow_up_sent' | 'meeting_set';
  timestamp: Date;
  details: string;
  templateUsed?: string;         // Which template ID was used
}

// Commonality result (stored per contact)
interface CommonalityResult {
  type: 'university' | 'language' | 'last_name' | 'location' |
        'company' | 'volunteer' | 'certification' | 'industry';
  priority: number;
  userValue: string;
  contactValue: string;
  matchStrength: 'exact' | 'partial';
  suggestedIcebreaker: string;
}
```

---

## 10. Project Structure

```
liwarrior/
├── manifest.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── background/
│   │   ├── service-worker.ts        # Main orchestrator
│   │   ├── commonality-engine.ts    # Profile comparison logic
│   │   ├── message-generator.ts     # Draft generation
│   │   ├── notification-handler.ts  # Browser notifications
│   │   └── storage-manager.ts       # IndexedDB via Dexie
│   ├── content/
│   │   ├── observers/
│   │   │   ├── search-observer.ts   # Reads search result pages
│   │   │   ├── profile-observer.ts  # Reads individual profiles
│   │   │   ├── notification-observer.ts  # Watches notification feed
│   │   │   └── connection-observer.ts    # Detects when user clicks Connect
│   │   ├── ui/
│   │   │   ├── profile-badge.ts     # Commonality badge on profiles
│   │   │   └── track-button.ts      # "Track with LIWarrior" overlay
│   │   ├── dom-selectors.ts         # Centralized selectors
│   │   └── content-main.ts          # Entry point
│   ├── popup/
│   │   ├── Popup.tsx                # Quick stats + alerts
│   │   └── components/
│   ├── sidepanel/
│   │   ├── SidePanel.tsx            # Message draft viewer
│   │   └── components/
│   │       ├── MessageDraft.tsx
│   │       ├── CommonalityBadges.tsx
│   │       └── ContactSummary.tsx
│   ├── dashboard/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Pipeline.tsx         # Kanban board
│   │   │   ├── Companies.tsx        # Company management
│   │   │   ├── Contacts.tsx         # Contact table
│   │   │   ├── Messages.tsx         # Template editor
│   │   │   ├── Analytics.tsx        # Performance stats
│   │   │   ├── Profile.tsx          # User profile setup
│   │   │   └── Settings.tsx
│   │   └── components/
│   │       ├── KanbanBoard.tsx
│   │       ├── ContactCard.tsx
│   │       ├── CompanyCard.tsx
│   │       ├── StatsChart.tsx
│   │       ├── TemplateEditor.tsx
│   │       └── CommonalityDisplay.tsx
│   ├── lib/
│   │   ├── db.ts                    # Dexie.js setup
│   │   ├── commonality.ts           # Commonality matching logic
│   │   ├── templates.ts             # Built-in message templates
│   │   ├── template-engine.ts       # Variable substitution
│   │   └── constants.ts
│   └── types/
│       └── index.ts
├── public/
│   ├── icons/
│   ├── sidepanel.html
│   └── dashboard.html
└── tests/
    ├── commonality-engine.test.ts
    ├── message-generator.test.ts
    └── template-engine.test.ts
```

---

## 11. Development Roadmap

### Week 1: Foundation
- [ ] Chrome extension scaffold (MV3 + Vite + CRXJS)
- [ ] IndexedDB schema with Dexie.js
- [ ] User profile onboarding page
- [ ] DOM selectors for LinkedIn pages (search results, profiles, notifications)

### Week 2: Observer System
- [ ] Search results observer (reads profiles as user browses)
- [ ] Profile observer (extracts education, languages, companies, etc.)
- [ ] Connection event observer (detects when user sends a request)
- [ ] "Track" button overlay on LinkedIn profile cards

### Week 3: Commonality Engine + Messaging
- [ ] Commonality matching algorithm
- [ ] Message template system with variable substitution
- [ ] Notification observer (detects acceptances)
- [ ] Side panel with message draft viewer
- [ ] Copy-to-clipboard + "Open chat" functionality

### Week 4: Dashboard MVP
- [ ] Kanban pipeline board
- [ ] Company management page
- [ ] Contact table with filters
- [ ] Basic analytics (acceptance rate, response rate)
- [ ] Template editor

### Week 5–6: Polish
- [ ] Follow-up reminder notifications
- [ ] Commonality badges on LinkedIn profiles
- [ ] Message performance tracking
- [ ] Onboarding tutorial
- [ ] Chrome Web Store listing prep

### Week 7–8: Enhanced Features
- [ ] Profile match scoring
- [ ] Calendar link integration
- [ ] Multi-step follow-up reminders
- [ ] Export to CSV
- [ ] A/B testing for templates

---

## 12. Monetization

| Tier | Price | Features |
|------|-------|---------|
| Free | $0 | 3 target companies, basic templates, pipeline tracker |
| Warrior | $7/mo | Unlimited companies, Commonality Engine, all templates, analytics |
| Squad | $14/mo | Follow-up sequences, A/B testing, priority support, export |

Undercuts every competitor. The free tier alone is more useful than most paid job tracker tools.

---

## 13. Branding

**LIWarrior** — for the LinkedIn warriors grinding their way into their dream companies.

Potential tagline options:
- "Your networking grind, organized."
- "Connect smarter, not harder."
- "The job search CRM that fights for you."
- "Stop networking blind. Start networking smart."

Visual identity: Bold, energetic, slightly irreverent. Think: startup-y but not corporate. Appeals to the hustle culture crowd on LinkedIn without being cringe about it.

---

## Summary

LIWarrior v2 is a **semi-automated Chrome extension** that acts as a networking tracker and smart message assistant. It never clicks buttons or sends messages on your behalf — it reads LinkedIn pages as you browse, tracks your connections, finds commonalities between you and recruiters, and generates personalized message drafts for you to send manually.

This "observer + advisor" model makes it safe to use (minimal account risk), safe to distribute (Chrome Web Store friendly), and safe to advertise on LinkedIn itself. The Commonality Engine is the killer feature — turning generic outreach into messages that feel genuinely personal because they ARE personal.

MVP in 4 weeks. Tech stack: TypeScript + React + Vite + Dexie.js. All data local. Zero backend needed for Phase 1.
