// ============================================================
// Centralized DOM Selectors for LinkedIn
// When LinkedIn changes their UI, update selectors HERE only.
// Using data attributes and ARIA labels where possible for stability.
// ============================================================

export const SELECTORS = {
  // Search results page
  searchResults: {
    container: '.search-results-container',
    resultItem: '.reusable-search__result-container',
    resultName: '.entity-result__title-text a span[aria-hidden="true"]',
    resultTitle: '.entity-result__primary-subtitle',
    resultLocation: '.entity-result__secondary-subtitle',
    resultImage: '.entity-result__image img, .presence-entity__image',
    connectButton: 'button[aria-label*="Invite"][aria-label*="connect"]',
    nextPage: 'button[aria-label="Next"]',
  },

  // Individual profile page
  profile: {
    name: 'h1.text-heading-xlarge',
    headline: '.text-body-medium.break-words',
    location: '.text-body-small.inline.t-black--light.break-words',
    about: '#about ~ div .inline-show-more-text',
    experience: {
      section: '#experience ~ div .pvs-list__outer-container',
      item: '.pvs-entity--padded',
      title: '.t-bold span[aria-hidden="true"]',
      company: '.t-normal span[aria-hidden="true"]',
    },
    education: {
      section: '#education ~ div .pvs-list__outer-container',
      item: '.pvs-entity--padded',
      school: '.t-bold span[aria-hidden="true"]',
      degree: '.t-normal span[aria-hidden="true"]',
    },
    languages: {
      section: '[id*="languages"] ~ div .pvs-list__outer-container',
      item: '.pvs-entity--padded',
      name: '.t-bold span[aria-hidden="true"]',
    },
    skills: {
      section: '#skills ~ div .pvs-list__outer-container',
      item: '.pvs-entity--padded',
      name: '.t-bold span[aria-hidden="true"]',
    },
    connectButton: '.pvs-profile-actions button[aria-label*="connect" i], button.pv-s-profile-actions--connect',
    profileUrl: 'link[rel="canonical"]',
  },

  // Notification feed
  notifications: {
    container: '.nt-card-list, .notifications-container',
    item: '.nt-card, .notification-card',
    text: '.nt-card__text, .notification-card__text',
    acceptedPattern: /accepted your (invitation|connection request)/i,
    nameInNotification: '.nt-card__text strong, .notification-card__text strong',
    profileLink: '.nt-card a[href*="/in/"], .notification-card a[href*="/in/"]',
  },

  // Messaging
  messaging: {
    conversationLink: (name: string) =>
      `a[href*="messaging"][aria-label*="${name}"], .msg-conversation-card__content`,
    messageInput: '.msg-form__contenteditable',
    sendButton: '.msg-form__send-button',
  },

  // My Network page
  myNetwork: {
    invitationsList: '.mn-invitation-list',
    invitationItem: '.invitation-card',
    connectionsList: '.mn-connections',
  },

  // General
  general: {
    searchInput: 'input[aria-label="Search"]',
    globalNav: '#global-nav',
    notificationBell: '#global-nav .notification-badge',
  },
};

/**
 * Safely query a selector, returning null if not found
 */
export function safeQuery<T extends Element>(
  selector: string,
  parent: Element | Document = document
): T | null {
  try {
    return parent.querySelector<T>(selector);
  } catch {
    return null;
  }
}

/**
 * Safely query all matching elements
 */
export function safeQueryAll<T extends Element>(
  selector: string,
  parent: Element | Document = document
): T[] {
  try {
    return Array.from(parent.querySelectorAll<T>(selector));
  } catch {
    return [];
  }
}

/**
 * Wait for an element to appear in the DOM
 */
export function waitForElement(
  selector: string,
  timeout = 5000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver((_, obs) => {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}
