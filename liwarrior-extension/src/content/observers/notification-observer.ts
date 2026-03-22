import { SELECTORS, safeQueryAll } from '../dom-selectors';

// ============================================================
// Notification Observer
// Watches LinkedIn's notification feed for connection acceptances.
// PASSIVE — only reads notification text, never clicks anything.
// ============================================================

interface AcceptanceEvent {
  name: string;
  profileUrl?: string;
  timestamp: Date;
}

const processedNotifications = new Set<string>();

export function observeNotifications(
  onAcceptance: (event: AcceptanceEvent) => void
): MutationObserver {
  const checkNotifications = () => {
    // Check notification items on the page
    const notificationItems = safeQueryAll(
      SELECTORS.notifications.item
    );

    for (const item of notificationItems) {
      const textEl = item.querySelector(
        SELECTORS.notifications.text
      );
      const text = textEl?.textContent?.trim() || '';

      // Skip if already processed
      const itemKey = text.slice(0, 100);
      if (processedNotifications.has(itemKey)) continue;

      // Check if this is a connection acceptance
      if (SELECTORS.notifications.acceptedPattern.test(text)) {
        processedNotifications.add(itemKey);

        // Extract name from the notification
        const strongEl = item.querySelector('strong');
        const name = strongEl?.textContent?.trim() || extractNameFromText(text);

        // Try to get profile URL
        const linkEl = item.querySelector<HTMLAnchorElement>('a[href*="/in/"]');
        const profileUrl = linkEl?.href?.split('?')[0];

        if (name) {
          onAcceptance({
            name,
            profileUrl,
            timestamp: new Date(),
          });
        }
      }
    }
  };

  // Check existing notifications
  checkNotifications();

  // Watch for new notifications appearing
  const observer = new MutationObserver(() => {
    checkNotifications();
  });

  // Observe the notification container or body
  const container =
    document.querySelector('.nt-card-list') ||
    document.querySelector('.notifications-container') ||
    document.body;

  observer.observe(container, { childList: true, subtree: true });

  return observer;
}

/**
 * Extracts a name from notification text like "John Smith accepted your invitation"
 */
function extractNameFromText(text: string): string {
  const match = text.match(/^(.+?)\s+accepted\s+your/i);
  return match?.[1]?.trim() || '';
}

/**
 * Check if we're on the notifications page
 */
export function isNotificationsPage(): boolean {
  return window.location.pathname.startsWith('/notifications');
}
