// ============================================================
// Connection Observer
// Detects when the USER clicks "Connect" on a profile.
// PASSIVE — listens for DOM changes after user interaction,
// never initiates clicks or actions.
//
// Detection strategies:
// 1. Direct click listener on Connect buttons (captures the intent)
// 2. Modal detection: watches for the "Add note" / "Send" modal
// 3. Button state change: catches "Connect" → "Pending" transitions
// 4. Toast/feedback detection: catches LinkedIn's success toast
// ============================================================

interface ConnectionSentEvent {
  name: string;
  profileUrl: string;
}

export function observeConnectionActions(
  onConnectionSent: (event: ConnectionSentEvent) => void
): MutationObserver {
  const reportedConnections = new Set<string>();

  function report(name: string, profileUrl: string) {
    const key = `${name}_${profileUrl}`;
    if (name && !reportedConnections.has(key)) {
      reportedConnections.add(key);
      console.log('[LIWarrior][ConnObs] Connection detected:', name, profileUrl);
      onConnectionSent({ name, profileUrl });
    }
  }

  // Extract the profile name from the current page or nearest context
  function getProfileName(context?: Element | null): string {
    const h1 = context?.querySelector('h1') || document.querySelector('h1.text-heading-xlarge');
    if (h1?.textContent?.trim()) return h1.textContent.trim();

    // In a search result card or similar list item
    const searchName = context?.querySelector(
      '.entity-result__title-text a span[aria-hidden="true"], .entity-result__title-text a, .app-aware-link span[aria-hidden="true"]'
    );
    if (searchName?.textContent?.trim()) return searchName.textContent.trim();

    // Fallback: Use the text from the profile link itself
    const profileLink = context?.querySelector('.app-aware-link[href*="/in/"]');
    if (profileLink?.textContent?.trim()) {
      // Split by newline and take the first line to strip out extra fluff
      return profileLink.textContent.trim().split('\n')[0].trim();
    }

    return '';
  }

  function parseNameFromAriaLabel(label: string): string {
    const invite = label.match(/^Invite\s+(.+?)\s+to connect/i);
    if (invite) return invite[1];
    const pending = label.match(/^(.+?)\s+is now/i);
    if (pending) return pending[1];
    return '';
  }

  function getProfileUrl(context?: Element | null): string {
    const link = context?.querySelector('.entity-result__title-text a, .app-aware-link') as HTMLAnchorElement;
    if (link?.href && link.href.includes('/in/')) return link.href.split('?')[0];

    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical?.href?.includes('/in/')) return canonical.href;
    
    // Default to the current page path
    return window.location.href.split('?')[0];
  }

  // We store the target of the last "Connect" click because the modal
  // won't have the profile URL available in its DOM.
  let pendingConnection: { name: string; url: string; timestamp: number } | null = null;

  // ------------------------------------------------------------------
  // Strategy 1: Click listener on Connect buttons
  // We use event delegation on the body to catch clicks on current
  // and future Connect buttons.
  // ------------------------------------------------------------------
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    // LinkedIn's UI is extremely varied. It can be a `<button>`, an `<a>`, a `<div>` with `role="button"`, or an `<li>` in a dropdown ("More" menu)
    const clickable = target.closest('button, [role="button"], a, li, .artdeco-dropdown__item, .artdeco-button');

    if (!clickable) return;

    const ariaLabel = (clickable.getAttribute('aria-label') || '').toLowerCase();
    const buttonText = (clickable.textContent || '').trim().toLowerCase();

    // Check if this is a Connect-type button
    const isConnectButton =
      ariaLabel.includes('invite') && ariaLabel.includes('connect') ||
      ariaLabel.includes('connect with') ||
      buttonText === 'connect' ||
      buttonText === 'send' && clickable.closest('[data-test-modal],.artdeco-modal,.send-invite');

    if (!isConnectButton) return;
    
    console.log('[LIWarrior] Connect button click detected. Text:', buttonText, '| Aria:', ariaLabel);

    const container = clickable.closest(
      'section, .entity-result, .pvs-profile-actions, .artdeco-modal, .send-invite'
    );

    let name = parseNameFromAriaLabel(ariaLabel);
    if (!name) name = getProfileName(container);

    const profileUrl = getProfileUrl(container);
    console.log('[LIWarrior] Extracted intent -> Name:', name, '| URL:', profileUrl);

    if (name || profileUrl) {
      pendingConnection = { name, url: profileUrl, timestamp: Date.now() };
      
      setTimeout(() => {
        const modalOpen = !!document.querySelector('.artdeco-modal, [role="dialog"]');
        console.log('[LIWarrior] 2s Connect Check -> Modal Open?', modalOpen);
        if (!modalOpen) {
          console.log('[LIWarrior] No modal found, assuming immediate send.');
          if (name && profileUrl) report(name, profileUrl);
        }
      }, 2000);
    } else {
      console.warn('[LIWarrior] Connect clicked but failed to extract both name and URL from DOM');
    }
  }, true); // Capture phase so we see it before LinkedIn can stop propagation

  // ------------------------------------------------------------------
  // Strategy 2: Modal detection ("Send invitation" modal)
  // When user clicks Connect, LinkedIn often shows a modal with
  // "Add a note" or "Send without a note". Watch for the Send click.
  // ------------------------------------------------------------------
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const clickable = target.closest('button, [role="button"], a, .artdeco-button');

    if (!clickable) return;

    const ariaLabel = (clickable.getAttribute('aria-label') || '').toLowerCase();
    const buttonText = (clickable.textContent || '').trim().toLowerCase();

    // The modal "Send" or "Send without a note" button
    const isModalSend =
      (buttonText === 'send' || buttonText.includes('send without') || buttonText.includes('send invitation') || buttonText.includes('connect')) &&
      clickable.closest('.artdeco-modal, [role="dialog"], .send-invite');

    if (!isModalSend) return;
    
    console.log('[LIWarrior] Modal Send button clicked. Text:', buttonText);

    const modal = clickable.closest('.artdeco-modal, [role="dialog"], .send-invite');
    let name = '';

    const strongName = modal?.querySelector('strong')?.textContent?.trim();
    if (strongName) {
      name = strongName;
    } else {
      const modalName = modal?.querySelector('h2, h3, .artdeco-modal__header')?.textContent?.trim();
      if (modalName) {
        const parsed = modalName.match(/Invite\s+(.+?)\s+to connect/i);
        name = parsed ? parsed[1] : modalName;
      }
    }

    if (!name) name = getProfileName(modal);
    
    let profileUrl = getProfileUrl(modal);
    console.log('[LIWarrior] Extracted modal target -> Name:', name, '| URL:', profileUrl);

    if (pendingConnection && Date.now() - pendingConnection.timestamp < 10000) {
      console.log('[LIWarrior] Using pendingConnection data instead:', pendingConnection);
      if (!profileUrl.includes('/in/') || window.location.pathname.startsWith('/search')) {
        profileUrl = pendingConnection.url;
      }
      if (!name) name = pendingConnection.name;
    }

    if (name || profileUrl) {
      console.log('[LIWarrior] Reporting sending from modal:', name);
      setTimeout(() => {
        if (name && profileUrl) report(name, profileUrl);
      }, 500);
    } else {
      console.warn('[LIWarrior] Send clicked in modal but no target data found');
    }
  }, true);

  // ------------------------------------------------------------------
  // Strategy 3: MutationObserver for button state changes
  // After a successful connection request, LinkedIn changes buttons
  // to "Pending" or shows a toast. This catches edge cases.
  // ------------------------------------------------------------------
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      
      // Check for raw text node changes (LinkedIn might just recycle a toast element and change its inner text)
      if (mutation.type === 'characterData') {
        const text = mutation.target.nodeValue?.toLowerCase() || '';
        if (text.includes('invitation sent') || text.includes('connection request sent')) {
          console.log('[LIWarrior] Toast text-mutation detected:', text);
          let name = pendingConnection?.name || getProfileName(null);
          let profileUrl = pendingConnection?.url || getProfileUrl(null);
          if (name) report(name, profileUrl);
        }
      }

      // Check for newly added nodes (toasts, state changes)
      for (const node of mutation.addedNodes) {
        // --- Check for toast/feedback messages ---
        const toastText = node.textContent?.toLowerCase() || '';
        if (
          toastText.includes('invitation sent') ||
          toastText.includes('connection request sent')
        ) {
          console.log('[LIWarrior] Toast detected:', toastText);
          // A toast confirms the action went through
          let name = pendingConnection?.name || getProfileName(null);
          let profileUrl = pendingConnection?.url || getProfileUrl(null);
          
          if (!name) {
            // Extract from e.g. "invitation sent to junko."
            const match = toastText.match(/sent to (.+?)(?:\.|$)/i);
            if (match) name = match[1].trim();
          }

          if (name) {
            report(name, profileUrl);
          }
        }

        // Only search for buttons if the node has querySelector (i.e. is an Element)
        if (node instanceof Element) {
          // --- Check for "Pending" buttons appearing ---
          let pendingBtns: HTMLButtonElement[] = [];
          if (node.tagName === 'BUTTON') {
            pendingBtns.push(node as HTMLButtonElement);
          } else {
            pendingBtns.push(...Array.from(node.querySelectorAll('button')));
          }
          for (const btn of pendingBtns) {
            const label = (btn.getAttribute('aria-label') || '').toLowerCase();
            const text = (btn.textContent || '').trim().toLowerCase();
            if (text === 'pending' || label.includes('pending')) {
              const container = btn.closest(
                'section, .entity-result, .pvs-profile-actions'
              );
              let name = getProfileName(container);
              let profileUrl = getProfileUrl(container);
              
              if (!name && pendingConnection) {
                 name = pendingConnection.name;
              }
              if (!profileUrl && pendingConnection) {
                 profileUrl = pendingConnection.url;
              }
              
              if (name && profileUrl) report(name, profileUrl);
            }
          }
        } // <--- Added missing closing brace
      }

      // Check for attribute changes on buttons (Connect → Pending)
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
        const el = mutation.target;
        if (el.tagName === 'BUTTON') {
          const text = (el.textContent || '').trim().toLowerCase();
          const label = (el.getAttribute('aria-label') || '').toLowerCase();
          if (text === 'pending' || label.includes('pending')) {
            const container = el.closest(
              'section, .entity-result, .pvs-profile-actions'
            );
            let name = getProfileName(container);
            let profileUrl = getProfileUrl(container);
            
            if (!name && pendingConnection) {
               name = pendingConnection.name;
            }
            if (!profileUrl && pendingConnection) {
               profileUrl = pendingConnection.url;
            }
            if (name && profileUrl) report(name, profileUrl);
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
    attributeFilter: ['aria-label', 'class', 'disabled'],
  });

  return observer;
}
