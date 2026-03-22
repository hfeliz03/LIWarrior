# LIWarrior — Setup Guide

## Quick Start (3 commands)

```bash
cd liwarrior-extension
npm install
npm run build
```

Then load in Chrome:
1. Open `chrome://extensions`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `dist/` folder inside `liwarrior-extension/`
5. You should see the LIWarrior icon in your toolbar

## Development Mode

```bash
npm run dev
```

This runs `vite build --watch` — it rebuilds automatically when you edit files.
After each rebuild, go to `chrome://extensions` and click the refresh icon on LIWarrior.

## Project Structure

```
liwarrior-extension/
├── manifest.json          # Source manifest (for reference)
├── manifest.dist.json     # Manifest that gets copied to dist/
├── vite.config.ts         # Build config
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── public/icons/          # Extension icons (PNG)
└── src/
    ├── types/             # TypeScript types + Chrome API declarations
    ├── lib/               # Core logic
    │   ├── db.ts          # IndexedDB database (Dexie.js)
    │   ├── commonality.ts # Commonality Engine — finds shared connections
    │   └── templates.ts   # Message templates + variable substitution
    ├── background/        # Service worker (background processing)
    ├── content/           # Content scripts (LinkedIn page observers)
    │   ├── observers/     # Search, profile, notification, connection observers
    │   ├── dom-selectors.ts # All LinkedIn CSS selectors (centralized)
    │   └── content-styles.css # Injected styles for LIWarrior UI overlays
    ├── popup/             # Extension popup (click toolbar icon)
    ├── dashboard/         # Full dashboard (options page)
    │   └── pages/         # Pipeline, Companies, Contacts, Templates, Analytics, Profile
    └── sidepanel/         # Side panel (message draft viewer)
```

## How It Works

1. **Browse LinkedIn normally** — the extension watches passively
2. **Search results** — the observer reads profiles as you scroll
3. **Click "Connect"** yourself — the extension detects and tracks it
4. **Notifications** — when someone accepts, extension spots it and generates a message draft
5. **Copy & paste** the draft into LinkedIn chat — you send it manually

The extension NEVER clicks buttons or sends messages for you.

## First Steps After Install

1. Click the LIWarrior icon → "Open Dashboard"
2. Go to "My Profile" tab → fill in your info (universities, languages, companies)
3. Go to "Companies" tab → add your target companies
4. Click "Find Recruiters on LinkedIn" → browse the results
5. Send connection requests yourself — LIWarrior tracks them automatically
6. When someone accepts → you get a notification with a personalized draft message

## Tech Stack

- TypeScript + React 18
- Vite (build)
- Tailwind CSS (styling)
- Dexie.js / IndexedDB (local database)
- Chrome Extension Manifest V3
