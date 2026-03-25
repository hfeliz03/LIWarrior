// ============================================================
// LIWarrior — Connection Observer (v2)
// Strategies:
// 1. Click capture: catches "Connect" clicks before modals open
// 2. Modal Send capture: catches the final "Send" inside the popup
// 3. Status change: watches for buttons changing to "Pending"
// 4. Toast/feedback detection: catches LinkedIn's success toast
// ============================================================

export interface ConnectionSentEvent {
  name: string;
  profileUrl: string;
  title?: string;
  company?: string;
  imageUrl?: string;
}

export function observeConnectionActions(
  onConnectionSent: (event: ConnectionSentEvent) => void
): MutationObserver {
  const reportedConnections = new Set<string>();

  // Helper: Capitalize first letters of a name
  function capitalizeName(name: string): string {
    if (!name) return '';
    return name.trim().split(/\s+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  function parseNameFromAriaLabel(label: string): string {
    const invite = label.match(/^Invite\s+(.+?)\s+to connect/i);
    if (invite) return capitalizeName(invite[1]);
    return capitalizeName(label);
  }

  function getProfileName(context?: Element | null): string {
    const nameSelectors = [
      'h1.text-heading-xlarge',
      '.entity-result__title-text a span[aria-hidden="true"]',
      '.pv-text-details__left-panel h1',
      '.artdeco-entity-lockup__title',
      '[data-field="name"]'
    ];
    
    for (const selector of nameSelectors) {
      const el = context ? context.querySelector(selector) : document.querySelector(selector);
      if (el?.textContent?.trim()) return capitalizeName(el?.textContent?.trim());
    }

    const ariaEl = context?.querySelector('[aria-label*="Invite"], [aria-label*="View profile"]');
    if (ariaEl) {
      const label = ariaEl.getAttribute('aria-label') || '';
      const name = parseNameFromAriaLabel(label);
      if (name && name !== capitalizeName(label)) return name;
    }

    const profileLink = context?.querySelector('.app-aware-link[href*="/in/"]');
    if (profileLink?.textContent?.trim()) {
      return capitalizeName(profileLink.textContent.trim().split('\n')[0].trim());
    }

    return '';
  }

  function getProfileUrl(context?: Element | null): string {
    const link = (context?.querySelector('.entity-result__title-text a, .app-aware-link, a[href*="/in/"]') || 
                 document.querySelector('.pv-text-details__left-panel a[href*="/in/"]')) as HTMLAnchorElement;
    if (link?.href && link.href.includes('/in/')) return link.href.split('?')[0].replace(/\/$/, '');
    if (window.location.pathname.startsWith('/in/')) return window.location.href.split('?')[0].replace(/\/$/, '');
    return '';
  }

  function getProfileMetadata(context?: Element | null): { title: string; company: string; imageUrl: string } {
    const meta = { title: '', company: '', imageUrl: '' };
    
    const imgSelectors = [
      '.pv-top-card-profile-picture__image',
      '.entity-result__image img',
      '.presence-entity__image img',
      '.ivm-view-attr__img--centered img',
      '.ivm-image-view-model img',
      '.artdeco-entity-lockup__image img',
      '.update-components-actor__avatar img',
      'img[class*="actor__avatar"]'
    ];
    
    for (const selector of imgSelectors) {
      const img = (context?.querySelector(selector) || document.querySelector(selector)) as HTMLImageElement;
      if (img) {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-delayed-url');
        if (src && !src.includes('data:image') && !src.includes('ghost')) {
          meta.imageUrl = src;
          break;
        }
      }
    }

    const titleSelectors = [
      'h1 + .text-body-medium', 
      '.text-body-medium.break-words',
      '.entity-result__primary-subtitle',
      '.artdeco-entity-lockup__subtitle',
      '.text-body-small.t-black--light',
      '.pv-text-details__left-panel .text-body-medium'
    ];
    
    for (const selector of titleSelectors) {
      const el = context?.querySelector(selector) || document.querySelector(selector);
      if (el?.textContent?.trim()) {
        meta.title = el.textContent.trim();
        break;
      }
    }

    const companySelectors = [
      '[data-field="experience_company_logo"] img',
      '.pv-text-details__right-panel [aria-label*="Current company"]',
      '.entity-result__primary-subtitle',
      '.artdeco-entity-lockup__subtitle',
      'button[aria-label*="Current company"]'
    ];

    for (const selector of companySelectors) {
      const el = context?.querySelector(selector) || document.querySelector(selector);
      let val = '';
      if (el?.getAttribute('aria-label')) val = el.getAttribute('aria-label') || '';
      else if (el?.textContent) val = el.textContent;
      
      if (val.includes(' at ')) {
         meta.company = val.split(' at ')[1].split('|')[0].split('·')[0].trim();
         if (meta.company) break;
      } else if (val.trim() && val.trim().length > 2 && val.trim().length < 50 && !val.toLowerCase().includes('recruiter')) {
         meta.company = val.trim();
         break;
      }
    }

    return meta;
  }

  function isStudent(text: string): boolean {
    const studentKeywords = [
      'student', 'university', 'college', 'candidate', 'intern', 
      'graduate student', 'undergraduate', 'mba candidate', 'phd student'
    ];
    const lower = text.toLowerCase();
    return studentKeywords.some(keyword => lower.includes(keyword));
  }

  function scrape(context?: Element | null) {
    const name = getProfileName(context);
    const url = getProfileUrl(context);
    const meta = getProfileMetadata(context);
    console.log('[LIWarrior v2] Scrape Result:', { name, url, meta });
    return { name, url, meta };
  }

  function report(name: string, profileUrl: string, metadata?: any) {
    const key = `${name}_${profileUrl}`;
    if (name && !reportedConnections.has(key)) {
      reportedConnections.add(key);
      console.log('[LIWarrior v2][ConnObs] Connection detected:', name, profileUrl, metadata);
      
      // On-page debug toast
      const debugToast = document.createElement('div');
      debugToast.style.cssText = 'position:fixed;bottom:100px;left:20px;background:#1a1a2e;color:#00ff00;padding:12px;z-index:99999;font-family:monospace;font-size:11px;border:2px solid #00ff00;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.5);max-width:300px;';
      debugToast.innerHTML = `<b>[LIWarrior v2] SENT!</b><br>Name: ${name}<br>Title: ${metadata?.title?.slice(0, 30) || 'FAIL'}<br>Img: ${metadata?.imageUrl ? 'OK' : 'FAIL'}`;
      document.body.appendChild(debugToast);
      setTimeout(() => debugToast.remove(), 6000);

      onConnectionSent({ name, profileUrl, ...metadata });
    }
  }

  let pendingConnection: { 
    name: string; 
    url: string; 
    metadata: { title: string; company: string; imageUrl: string };
    timestamp: number 
  } | null = null;

  // ------------------------------------------------------------------
  // Listeners
  // ------------------------------------------------------------------

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const clickable = target.closest('button, [role="button"], a, li');
    if (!clickable) return;

    const buttonText = clickable.textContent?.toLowerCase().trim();
    const ariaLabel = clickable.getAttribute('aria-label')?.toLowerCase() || '';

    // A. Main Connect Click
    if (buttonText === 'connect' || ariaLabel.includes('invite') || ariaLabel.includes('connect')) {
      const container = clickable.closest('section, .entity-result, .pvs-profile-actions, .artdeco-modal, .send-invite');
      const { name, url: profileUrl, meta: metadata } = scrape(container);
      
      if (isStudent(metadata.title)) {
         console.log('[LIWarrior v2] Skipping student:', name);
         return;
      }

      if (name || profileUrl) {
        pendingConnection = { name, url: profileUrl, metadata, timestamp: Date.now() };
        console.log('[LIWarrior v2] Pending set:', pendingConnection);

        setTimeout(() => {
          const modalOpen = !!document.querySelector('.artdeco-modal, [role="dialog"]');
          if (!modalOpen) {
            if (name && profileUrl) report(name, profileUrl, metadata);
          }
        }, 2000);
      }
    }

    // B. Modal Send Click
    if (buttonText === 'send' || buttonText === 'send without a note') {
      const modal = clickable.closest('.artdeco-modal, [role="dialog"], .send-invite');
      const { name: mName, url: mUrl, meta: mMeta } = scrape(modal);
      
      let name = mName || pendingConnection?.name || '';
      let profileUrl = mUrl || pendingConnection?.url || '';
      let metadata = (mMeta.title ? mMeta : pendingConnection?.metadata) || mMeta;

      if (isStudent(metadata.title)) return;

      if (name || profileUrl) {
        setTimeout(() => report(name, profileUrl, metadata), 500);
      }
    }
  }, true);

  // ------------------------------------------------------------------
  // MutationObserver for Toasts
  // ------------------------------------------------------------------

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const toastText = node.innerText?.toLowerCase() || '';
            if (toastText.includes('invitation sent') || toastText.includes('connection request sent')) {
              console.log('[LIWarrior v2] Toast detected!');
              const current = scrape(null);
              let name = pendingConnection?.name || current.name;
              let profileUrl = pendingConnection?.url || current.url;
              let metadata = pendingConnection?.metadata || current.meta;

              if (!name) {
                const match = node.innerText.match(/sent to (.+?)(?:\.|$)/i);
                if (match) name = capitalizeName(match[1]);
              }
              if (name && profileUrl) report(name, profileUrl, metadata);
            }
          }
        });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return observer;
}
