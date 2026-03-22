import { observeSearchResults, isSearchPage } from './observers/search-observer';
import { scrapeProfile, isProfilePage } from './observers/profile-observer';
import { observeNotifications, isNotificationsPage } from './observers/notification-observer';
import { observeConnectionActions } from './observers/connection-observer';
import type { ExtensionMessage, Contact } from '@/types';

// ============================================================
// LIWarrior Content Script — Main Entry
// Runs on linkedin.com pages. All observers are READ-ONLY.
// ============================================================

console.log('[LIWarrior] Content script loaded on:', window.location.pathname);

const activeObservers: MutationObserver[] = [];

function sendMessage(message: ExtensionMessage): void {
  chrome.runtime.sendMessage(message).catch((err) => {
    console.debug('[LIWarrior] Message send failed (service worker may be inactive):', err);
  });
}

function initObservers(): void {
  // Clean up any existing observers
  activeObservers.forEach(obs => obs.disconnect());
  activeObservers.length = 0;

  const path = window.location.pathname;

  // 1. Search results page — read visible results
  if (isSearchPage()) {
    console.log('[LIWarrior] Observing search results');
    const obs = observeSearchResults((contacts) => {
      console.log(`[LIWarrior] Found ${contacts.length} profiles in search results`);
      sendMessage({ type: 'SEARCH_RESULTS_SCRAPED', data: contacts as Partial<Contact>[] });
    });
    activeObservers.push(obs);
  }

  // 2. Profile page — scrape detailed profile data
  if (isProfilePage()) {
    console.log('[LIWarrior] On profile page, scraping...');
    // Wait a moment for the page to fully render
    setTimeout(() => {
      const profileData = scrapeProfile();
      if (profileData) {
        console.log('[LIWarrior] Profile scraped:', profileData.fullName);
        sendMessage({ type: 'PROFILE_SCRAPED', data: profileData });
      }
    }, 2000);
  }

  // 3. Notifications page — watch for acceptance events
  if (isNotificationsPage()) {
    console.log('[LIWarrior] Observing notifications');
    const obs = observeNotifications((event) => {
      console.log('[LIWarrior] Connection accepted:', event.name);
      sendMessage({
        type: 'CONNECTION_ACCEPTED',
        data: { name: event.name, profileUrl: event.profileUrl },
      });
    });
    activeObservers.push(obs);
  }

  // 4. Always watch for connection button state changes
  const connObs = observeConnectionActions((event) => {
    console.log('[LIWarrior] Connection request sent to:', event.name);
    sendMessage({
      type: 'CONNECTION_SENT',
      data: { name: event.name, profileUrl: event.profileUrl },
    });
  });
  activeObservers.push(connObs);
}

// Initialize on page load
initObservers();

// LinkedIn is a SPA — watch for URL changes to re-init observers
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    console.log('[LIWarrior] URL changed to:', window.location.pathname);
    // Wait for new page content to load
    setTimeout(initObservers, 1500);
  }
});

urlObserver.observe(document.body, { childList: true, subtree: true });
