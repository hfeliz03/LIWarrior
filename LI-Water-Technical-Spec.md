# LI Water — Technical Specification

**Version:** 1.0
**Date:** March 20, 2026
**Status:** Planning Phase

---

## 1. Product Overview

**LI Water** is a LinkedIn networking automation tool designed for job seekers who don't have LinkedIn Premium. It automates the process of finding and connecting with recruiters and hiring team members at target companies, then sends a personalized follow-up message the moment they accept the connection — turning passive job searching into an active networking pipeline.

### Core Value Proposition

Most job seekers know they should network on LinkedIn, but the manual process of finding recruiters, sending connection requests, and following up is tedious and easy to forget. LI Water automates the entire funnel: target a company → find the right people → connect → auto-message on acceptance → track everything in a dashboard.

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
| Dux-Soup | Chrome Extension | $14–99/mo | DOM manipulation, content scripts | High (extension detection) |
| Linked Helper | Desktop App | $15–45/mo | Standalone app, less detectable | Medium |
| PhantomBuster | Cloud Platform | $69–159/mo | Cloud-based API scripts | High (datacenter IPs) |
| Expandi | Cloud Platform | $99/mo | Residential IPs, behavior emulation | Medium |
| Waalaxy | Chrome Extension | $60–80/mo | Browser-based workflows | High |

### LI Water's Differentiator

- **Free or very low cost** — targeting users who can't afford Premium, let alone $99/mo tools
- **Job seeker focused** — not a sales/lead-gen tool; optimized for networking with recruiters
- **Smart messaging** — pre-built templates optimized for recruiter engagement, not generic outreach
- **Connection tracker** — CRM-like dashboard to manage your networking pipeline

---

## 3. Architecture Decision: Recommended Approach

### The Hard Truth About LinkedIn Automation

Before choosing an architecture, here's what you need to know:

1. **LinkedIn's official API** does NOT allow third-party apps to search for people by company/role, send connection requests, or send messages at scale — unless you're an approved LinkedIn Partner (which requires a legitimate business, a formal review process, and typically months of approval).

2. **Chrome extensions that automate LinkedIn** violate LinkedIn's Terms of Service. LinkedIn actively detects and blocks them. Account bans are permanent. As of 2026, LinkedIn claims ~97% detection rates for non-compliant automation tools.

3. **Chrome's Manifest V3** (required since mid-2025) severely limits background script execution, making persistent automation extensions harder to build and maintain.

### Recommended Architecture: Hybrid Chrome Extension + Local Dashboard

Despite the risks, a **Chrome Extension** is the only viable approach for the features you described without LinkedIn Partner access. Here's why:

- The official API simply doesn't expose the endpoints needed (people search by company, connection requests, messaging)
- A standalone web app can't interact with LinkedIn's UI
- Desktop apps (like Linked Helper) work but are harder to distribute and maintain

**The hybrid model:**

```
┌─────────────────────────────────────────────────┐
│              LI WATER ARCHITECTURE               │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────┐    ┌────────────────────────┐  │
│  │ Chrome       │    │ Local Dashboard        │  │
│  │ Extension    │◄──►│ (React SPA)            │  │
│  │              │    │                        │  │
│  │ - Content    │    │ - Connection tracker   │  │
│  │   scripts    │    │ - Company targets      │  │
│  │ - Background │    │ - Message templates    │  │
│  │   worker     │    │ - Analytics            │  │
│  │ - LinkedIn   │    │ - Settings             │  │
│  │   page       │    │                        │  │
│  │   injection  │    └──────────┬─────────────┘  │
│  └──────┬───────┘               │                │
│         │                       │                │
│         ▼                       ▼                │
│  ┌──────────────────────────────────────────┐    │
│  │ Local Storage Layer                      │    │
│  │ (IndexedDB via Dexie.js)                 │    │
│  │                                          │    │
│  │ - Connections database                   │    │
│  │ - Message queue                          │    │
│  │ - Company/recruiter cache                │    │
│  │ - User preferences                       │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │ Optional: Backend API (Phase 2)          │    │
│  │ - Cross-device sync                      │    │
│  │ - Shared message templates               │    │
│  │ - Usage analytics                        │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Why NOT a Web App or Mobile App?

- **Web app alone** can't interact with LinkedIn's pages — you'd need the official API (which doesn't support what we need)
- **Mobile app** has no way to inject into LinkedIn's mobile app
- **Desktop app** (Electron) could work but adds installation friction and is overkill for MVP

---

## 4. Technical Stack

### Chrome Extension (Core)

| Component | Technology | Why |
|-----------|-----------|-----|
| Manifest | Manifest V3 | Required by Chrome since 2025 |
| Content Scripts | TypeScript | Inject into LinkedIn pages to read DOM and simulate actions |
| Service Worker | TypeScript | Background logic, message queue processing, connection monitoring |
| Extension UI | React + Tailwind | Popup and options page |
| Storage | IndexedDB (Dexie.js) | Structured local data with querying support |
| Build | Vite + CRXJS | Fast builds with HMR for extension development |

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
| API | Node.js + Hono (or Express) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Supabase Auth (free tier) |
| Hosting | Railway or Fly.io |

---

## 5. Feature Breakdown

### Phase 1: MVP (Weeks 1–4)

#### 5.1 Company Targeting

**What it does:** User selects target companies from a search interface.

**How it works:**
1. User opens LI Water popup/dashboard
2. Types a company name (e.g., "Microsoft")
3. Extension navigates to LinkedIn's people search filtered by that company
4. Scrapes visible results for recruiters, HR, hiring managers
5. Stores results locally with metadata (name, title, company, profile URL)

**Technical detail:**
- Content script reads LinkedIn's search results DOM
- Filters by title keywords: "recruiter", "talent acquisition", "campus recruiter", "hiring manager", "engineering manager" (configurable)
- Respects LinkedIn's pagination (scrolls to load more results)
- Rate-limited: max 30 profiles scraped per session with random delays (2–5 seconds between actions)

#### 5.2 Smart Connection Requests

**What it does:** Sends personalized connection requests to discovered recruiters/team members.

**How it works:**
1. User reviews list of discovered people in the dashboard
2. Selects who to connect with (or "connect with all")
3. Extension queues connection requests
4. Sends them one by one with human-like delays (60–180 seconds between requests)
5. Each request includes a short personalized note (under 300 characters)

**Connection request note templates:**

```
Template A (Recruiter):
"Hi {firstName}, I'm a {userRole} interested in {company}'s
{department} team. Would love to connect and learn more about
opportunities. Thanks!"

Template B (Team Member):
"Hi {firstName}, I admire the work {company}'s {department}
team is doing in {area}. I'm exploring roles in this space and
would value connecting."

Template C (Campus Recruiter):
"Hi {firstName}, I'm a {year} student at {university} interested
in {company}'s internship programs. Would love to connect!"
```

**Safety limits:**
- Maximum 20 connection requests per day (LinkedIn's informal safe threshold)
- Minimum 60-second delay between requests
- Random jitter added to all timings
- Daily quota resets at midnight

#### 5.3 Auto-Message on Acceptance

**What it does:** Detects when a connection request is accepted and immediately sends a follow-up message.

**How it works:**
1. Service worker periodically checks the user's connections page (every 30 minutes)
2. Compares current connections against the "pending" list in IndexedDB
3. When a new acceptance is detected, queues a follow-up message
4. Sends the message with a delay (5–30 minutes after detection to feel natural)

**Follow-up message templates:**

```
Template A (Coffee Chat):
"Thanks for connecting, {firstName}! I've been following
{company}'s work in {area} and I'm really impressed.
Would you be open to a quick 15-minute virtual coffee
chat? I'd love to hear about your experience and any
advice you might have for someone looking to break in.
Happy to work around your schedule!"

Template B (Role-Specific):
"Really appreciate the connection, {firstName}! I noticed
{company} has some exciting openings in {department}.
I've been working on {relevantSkill} and think my
background could be a great fit. Would you have a few
minutes to chat about what the team is looking for?
I'd love any insight you could share."

Template C (Warm & Casual):
"Hey {firstName}, thanks for accepting! I'm a big fan of
what {company} is building. I'm currently exploring new
opportunities and your team caught my eye. If you ever
have a few minutes for a quick chat, I'd really appreciate
the chance to learn from your perspective. No pressure
at all!"
```

#### 5.4 Connection Tracker Dashboard

**What it does:** CRM-like interface showing your entire networking pipeline.

**Dashboard columns:**

| Status | Description |
|--------|------------|
| Discovered | Found via company search, not yet contacted |
| Request Sent | Connection request sent, awaiting response |
| Connected | Request accepted, follow-up message sent |
| Replied | They responded to your message |
| Meeting Scheduled | You've set up a call/chat |
| No Response | Connected but no reply after follow-up |

**Dashboard features:**
- Filter by company, status, date
- Sort by most recent activity
- Bulk actions (send requests to all "Discovered")
- Activity timeline per contact
- Response rate analytics per company
- Export to CSV

### Phase 2: Enhanced Features (Weeks 5–8)

#### 5.5 Smart Scheduling
- Integrate with Calendly or Cal.com link
- Auto-include scheduling link in follow-up messages
- Track when meetings are booked

#### 5.6 Multi-Step Follow-Up Sequences
- If no reply after 5 days → send a gentle nudge
- If no reply after 12 days → send a final check-in
- Max 3 messages total to avoid being annoying
- Auto-stop if they reply at any point

#### 5.7 Profile Optimization Tips
- Analyze user's LinkedIn profile against best practices
- Suggest improvements to headline, summary, experience
- Score profile "readiness" before starting outreach

#### 5.8 Message A/B Testing
- Track which message templates get the best response rates
- Recommend top-performing templates
- Allow users to create custom templates

### Phase 3: Growth Features (Weeks 9–12)

#### 5.9 Optional Backend Sync
- Cross-device dashboard access
- Shared community templates (anonymized)
- Aggregated analytics ("Microsoft recruiters respond 23% of the time")

#### 5.10 Job Board Integration
- Pull job listings from LinkedIn, Greenhouse, Lever
- Auto-suggest companies based on job preferences
- Match job postings to people already in your network

---

## 6. Messaging Strategy Deep Dive

### What the Research Says

- Personalized connection requests get **9.36% reply rate** vs. 5.44% for blank requests
- Messages under 500 characters perform best (mobile readability)
- Recruiters/HR have a **12.08% response rate** — the highest of any job function
- Multi-step sequences (2–3 follow-ups) boost response rates to **20–30%+**
- Best days: Tuesday, Wednesday, Thursday
- Best times: 9–11 AM, 1–2 PM (recipient's timezone)

### Message Design Principles

1. **Be specific about WHY them** — not "I saw your profile" but "I noticed your team shipped X"
2. **One clear ask** — coffee chat OR role question, not both
3. **Under 150 words** — respect their time
4. **Conversational tone** — not corporate-speak
5. **Make it easy to say yes** — suggest specific times, include calendar link

### Template Variables the System Supports

| Variable | Source | Example |
|----------|--------|---------|
| `{firstName}` | Scraped from profile | "Sarah" |
| `{company}` | User's target company | "Microsoft" |
| `{department}` | Scraped from title | "Cloud Engineering" |
| `{userRole}` | User's profile | "Software Engineer" |
| `{university}` | User's profile | "UCLA" |
| `{area}` | Inferred from job listing | "AI/ML" |
| `{relevantSkill}` | User's profile | "distributed systems" |

---

## 7. Safety & Risk Mitigation

### LinkedIn Detection Avoidance

| Tactic | Implementation |
|--------|---------------|
| Human-like delays | Random 60–180s between actions |
| Daily limits | Max 20 connections/day, 40 messages/day |
| Session limits | Max 2 hours active per session |
| Natural patterns | Actions clustered during business hours |
| Profile views first | View profile before sending request (mimics human behavior) |
| Gradual ramp-up | Start with 5/day, increase to 20 over 2 weeks |
| Random jitter | All timings have ±30% randomization |

### User Warnings & Disclaimers

The extension MUST include:
- Clear warning that automation violates LinkedIn's ToS
- Risk of account restriction or ban
- Recommendation to use a secondary account for testing
- Option to set conservative vs. aggressive action limits
- Emergency stop button that halts all queued actions immediately

### Data Privacy

- All data stored locally (IndexedDB) — nothing leaves the user's browser in Phase 1
- No tracking, no analytics sent to any server
- User can export and delete all data at any time
- No LinkedIn credentials are stored (extension runs in the context of the user's authenticated session)

---

## 8. Technical Implementation Details

### Content Script Architecture

```
content-scripts/
├── linkedin-search.ts      # Scrapes search results pages
├── linkedin-profile.ts     # Reads individual profile data
├── linkedin-connect.ts     # Handles connection request flow
├── linkedin-messaging.ts   # Sends messages to connections
├── linkedin-connections.ts # Monitors connection acceptance
├── dom-selectors.ts        # Centralized CSS selectors (easy to update when LinkedIn changes)
└── utils/
    ├── delay.ts            # Human-like delay utilities
    ├── rate-limiter.ts     # Daily/hourly action limits
    └── dom-observer.ts     # MutationObserver for dynamic content
```

### Service Worker (Background)

```
background/
├── service-worker.ts       # Main orchestrator
├── queue-manager.ts        # Action queue (connect, message, etc.)
├── connection-monitor.ts   # Polls for new acceptances
├── scheduler.ts            # Timing logic for actions
└── storage-manager.ts      # IndexedDB interface via Dexie.js
```

### Database Schema (IndexedDB via Dexie)

```typescript
// contacts table
interface Contact {
  id: string;                    // LinkedIn profile ID
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  profileUrl: string;
  status: 'discovered' | 'request_sent' | 'connected' |
          'messaged' | 'replied' | 'meeting_scheduled' |
          'no_response';
  connectionRequestDate?: Date;
  connectionAcceptedDate?: Date;
  lastMessageDate?: Date;
  messagesSent: number;
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// companies table
interface TargetCompany {
  id: string;
  name: string;
  linkedInUrl: string;
  totalContacts: number;
  connectedContacts: number;
  repliedContacts: number;
  addedAt: Date;
}

// messages table
interface MessageTemplate {
  id: string;
  name: string;
  type: 'connection_note' | 'follow_up' | 'nudge';
  body: string;
  variables: string[];
  sendCount: number;
  replyCount: number;
  replyRate: number;
}

// activity_log table
interface ActivityLog {
  id: string;
  contactId: string;
  action: 'profile_view' | 'connect_sent' | 'connect_accepted' |
          'message_sent' | 'reply_received';
  timestamp: Date;
  details: string;
}
```

### Key Technical Challenges

**1. LinkedIn's Dynamic DOM**
LinkedIn uses React and frequently changes class names and structure. Mitigation:
- Use `data-*` attributes and ARIA labels for selectors (more stable than class names)
- Centralize all selectors in `dom-selectors.ts` for easy updates
- Include a selector health-check that warns users when selectors break

**2. Manifest V3 Service Worker Limitations**
Service workers in MV3 can be terminated after 30 seconds of inactivity. Mitigation:
- Use Chrome alarms API for periodic tasks (connection monitoring)
- Keep service worker alive during active operations with keepalive patterns
- Store all state in IndexedDB (not in memory)

**3. Detecting Connection Acceptance**
No push notification from LinkedIn's DOM for acceptances. Mitigation:
- Poll the connections page every 30 minutes using Chrome alarms
- Compare against local "pending" list
- Use LinkedIn's "My Network" page notifications as a secondary signal

**4. Rate Limiting Without Getting Caught**
- Implement a token bucket algorithm for action rate limiting
- Track daily/hourly/session action counts in IndexedDB
- Auto-pause if approaching limits
- Resume next day automatically

---

## 9. Project Structure

```
li-water/
├── manifest.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── background/
│   │   ├── service-worker.ts
│   │   ├── queue-manager.ts
│   │   ├── connection-monitor.ts
│   │   └── scheduler.ts
│   ├── content/
│   │   ├── linkedin-search.ts
│   │   ├── linkedin-profile.ts
│   │   ├── linkedin-connect.ts
│   │   ├── linkedin-messaging.ts
│   │   ├── linkedin-connections.ts
│   │   └── dom-selectors.ts
│   ├── popup/
│   │   ├── Popup.tsx
│   │   ├── QuickActions.tsx
│   │   └── StatusBar.tsx
│   ├── dashboard/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Companies.tsx
│   │   │   ├── Contacts.tsx
│   │   │   ├── Messages.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   └── components/
│   │       ├── ContactTable.tsx
│   │       ├── CompanyCard.tsx
│   │       ├── PipelineBoard.tsx
│   │       ├── MessageEditor.tsx
│   │       └── StatsChart.tsx
│   ├── lib/
│   │   ├── db.ts              # Dexie.js database setup
│   │   ├── rate-limiter.ts
│   │   ├── delay.ts
│   │   └── template-engine.ts  # Variable substitution
│   └── types/
│       └── index.ts
├── public/
│   ├── icons/
│   └── dashboard.html
└── tests/
    ├── queue-manager.test.ts
    ├── rate-limiter.test.ts
    └── template-engine.test.ts
```

---

## 10. Development Roadmap

### Week 1: Foundation
- [ ] Set up Chrome extension scaffold (Manifest V3 + Vite + CRXJS)
- [ ] Build IndexedDB schema with Dexie.js
- [ ] Create basic popup UI with React
- [ ] Implement DOM selectors for LinkedIn search results

### Week 2: Core Automation
- [ ] Build company search scraper (content script)
- [ ] Implement connection request sender with rate limiting
- [ ] Build action queue system in service worker
- [ ] Add human-like delay utilities

### Week 3: Auto-Messaging
- [ ] Build connection acceptance detector (polling approach)
- [ ] Implement message template engine with variable substitution
- [ ] Build auto-message queue triggered by acceptance detection
- [ ] Add message sending content script

### Week 4: Dashboard MVP
- [ ] Build dashboard as extension options page
- [ ] Contact list with status filters
- [ ] Company management page
- [ ] Basic analytics (connections sent, accepted, replied)
- [ ] Message template editor

### Week 5–6: Polish & Safety
- [ ] Selector health checker
- [ ] Emergency stop button
- [ ] Gradual ramp-up system
- [ ] User onboarding flow with ToS warning
- [ ] Export data to CSV
- [ ] Bug fixes and edge cases

### Week 7–8: Enhanced Features
- [ ] Multi-step follow-up sequences
- [ ] Message A/B testing tracking
- [ ] Profile optimization tips
- [ ] Calendar link integration

---

## 11. Monetization Options

| Tier | Price | Features |
|------|-------|---------|
| Free | $0 | 3 target companies, 10 connections/day, basic templates |
| Pro | $9/mo | Unlimited companies, 20 connections/day, custom templates, analytics |
| Team | $19/mo | Multi-step sequences, A/B testing, priority support |

This pricing undercuts every competitor significantly (cheapest is Dux-Soup at $14/mo for basic).

---

## 12. Legal Considerations

### What You Should Know

1. **LinkedIn ToS Violation**: This tool automates LinkedIn actions, which violates their User Agreement. This is the same territory as Dux-Soup, Linked Helper, and every other automation tool on the market.

2. **hiQ Labs v. LinkedIn (2022)**: The Supreme Court ruling established that scraping publicly available data is not necessarily a violation of the Computer Fraud and Abuse Act. However, this only applies to public data — actions taken within an authenticated session (like sending connection requests) are in grayer territory.

3. **User Assumption of Risk**: The tool must clearly communicate that users accept the risk of account restrictions. This should be in the onboarding flow and settings.

4. **Distribution**: Publishing on the Chrome Web Store may be difficult if LinkedIn files a complaint. Consider self-hosted distribution (direct download from your website).

5. **Privacy Compliance**: If you store any user data on a backend (Phase 2+), you'll need GDPR/CCPA compliance for any personal data collected.

### Recommended Legal Safeguards

- Include a clear Terms of Service
- Add a disclaimer that users accept risk of LinkedIn account action
- Never store LinkedIn credentials
- Keep all data local in Phase 1 (no server-side personal data = no GDPR scope)
- Consider distributing outside the Chrome Web Store

---

## 13. Name & Branding Notes

**LI Water** — "watering" your LinkedIn network to help it grow. Plays on:
- LI = LinkedIn
- Water = nurturing connections, like watering a garden
- Could extend the metaphor: "Seeds" (discovered contacts), "Sprouts" (pending connections), "Blooms" (active connections)

---

## Summary

LI Water is a Chrome extension with a built-in dashboard that automates LinkedIn networking for job seekers. It finds recruiters at target companies, sends connection requests, auto-messages on acceptance, and tracks everything in a pipeline view. The recommended tech stack is TypeScript + React + Vite + Dexie.js, with all data stored locally for privacy. MVP target is 4 weeks, with enhanced features following in weeks 5–8.

The biggest risk is LinkedIn detection and account restrictions. Mitigation includes human-like behavior patterns, conservative daily limits, and clear user warnings. This is the same risk profile as every tool in the LinkedIn automation market — the key is building safety-first defaults.
