import { SELECTORS, safeQuery, safeQueryAll } from '../dom-selectors';
import type { Contact, ContactRole } from '@/types';

// ============================================================
// Search Results Observer
// Reads LinkedIn search results as the user browses.
// PASSIVE — never clicks or navigates, only reads visible DOM.
// ============================================================

const RECRUITER_KEYWORDS = [
  'recruiter', 'recruiting', 'talent acquisition', 'campus recruiter',
  'university recruiter', 'technical recruiter', 'sourcer', 'sourcing',
  'staffing', 'hr ', 'human resources', 'people operations', 'people partner',
];

const HIRING_MANAGER_KEYWORDS = [
  'hiring manager', 'engineering manager', 'team lead', 'director',
  'vp of engineering', 'head of', 'principal', 'staff engineer',
];

export function observeSearchResults(
  onResultsFound: (contacts: Partial<Contact>[]) => void
): MutationObserver {
  let lastProcessedCount = 0;

  const processResults = () => {
    const resultItems = safeQueryAll(SELECTORS.searchResults.resultItem);
    if (resultItems.length === lastProcessedCount) return;
    lastProcessedCount = resultItems.length;

    const contacts: Partial<Contact>[] = [];

    for (const item of resultItems) {
      try {
        const nameEl = safeQuery(SELECTORS.searchResults.resultName, item);
        const titleEl = safeQuery(SELECTORS.searchResults.resultTitle, item);
        const locationEl = safeQuery(SELECTORS.searchResults.resultLocation, item);
        const imageEl = safeQuery<HTMLImageElement>(SELECTORS.searchResults.resultImage, item);
        const linkEl = item.querySelector<HTMLAnchorElement>('a[href*="/in/"]');

        const fullName = nameEl?.textContent?.trim() || '';
        const title = titleEl?.textContent?.trim() || '';
        const location = locationEl?.textContent?.trim() || '';
        const profileUrl = linkEl?.href?.split('?')[0] || '';
        const imageUrl = imageEl?.src || '';

        if (!fullName || !profileUrl) continue;

        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        contacts.push({
          firstName,
          lastName,
          fullName,
          title,
          profileUrl,
          imageUrl,
          role: inferRole(title),
          locations: location ? [location] : [],
          status: 'discovered',
          discoveredAt: new Date(),
        });
      } catch (e) {
        console.debug('[LIWarrior] Error parsing search result:', e);
      }
    }

    if (contacts.length > 0) {
      onResultsFound(contacts);
    }
  };

  // Process existing results
  processResults();

  // Watch for new results loading (scroll pagination)
  const observer = new MutationObserver(() => {
    processResults();
  });

  const container = document.querySelector('.search-results-container') || document.body;
  observer.observe(container, { childList: true, subtree: true });

  return observer;
}

function inferRole(title: string): ContactRole {
  const lower = title.toLowerCase();

  if (RECRUITER_KEYWORDS.some(k => lower.includes(k))) return 'recruiter';
  if (HIRING_MANAGER_KEYWORDS.some(k => lower.includes(k))) return 'hiring_manager';
  return 'team_member';
}

/**
 * Check if we're on a LinkedIn search results page
 */
export function isSearchPage(): boolean {
  return window.location.pathname.startsWith('/search/');
}
