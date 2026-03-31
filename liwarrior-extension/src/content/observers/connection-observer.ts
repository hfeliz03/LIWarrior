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

  // Helper: Capitalize first letters of a name and clean degrees/pronouns
  function capitalizeName(name: string): string {
    if (!name) return '';
    // Strip common degrees, certifications, and parentheticals
    let clean = name.split(',')[0] // Degrees after comma
                    .split('|')[0] // Title pipes
                    .replace(/\(.+?\)/g, '') // Remove (Maiden Name) or (Pronouns)
                    .trim();
    
    return clean.split(/\s+/)
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
      'h1[class*="top-card-layout__title"]',
      '.entity-result__title-text a span[aria-hidden="true"]',
      '.pv-text-details__left-panel h1',
      '.artdeco-entity-lockup__title',
      '[data-field="name"]',
      'h1'
    ];
    
    for (const selector of nameSelectors) {
      const el = context ? context.querySelector(selector) : document.querySelector(selector);
      if (el?.textContent?.trim()) return capitalizeName(el?.textContent?.trim());
    }

    // GUERRILLA STRATEGY: Search for largest font element on profile
    if (!context && window.location.pathname.startsWith('/in/')) {
       const titleName = document.title.split('|')[0].trim();
       const elements = Array.from(document.querySelectorAll('div, span, p'));
       for (const el of elements) {
         const style = window.getComputedStyle(el);
         const fontSize = parseFloat(style.fontSize);
         if (fontSize > 22 && el.textContent?.includes(titleName.split(' ')[0])) {
            console.log('[LIWarrior v2.4] Guerrilla Name Found:', el.textContent.trim());
            return capitalizeName(el.textContent.trim());
         }
       }
       return capitalizeName(titleName); // Tab title fallback
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
      '.pv-top-card-layout__image img',
      '.profile-photo-edit__preview',
      'img[class*="profile-displayphoto"]',
      'img[class*="EntityPhoto"]',
      // User-discovered obfuscated classes
      'img[class*="ivm-view-attr__img"]', // New obfuscated class
      'img[class*="actor__avatar"]',
      'img[class*="pv-top-card"]'
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

    // GUERRILLA STRATEGY: Find by source pattern (LinkedIn standard)
    if (!meta.imageUrl && !context) {
      // Deep scan: look for any element (div/img/span) with a media.licdn.com URL
      const allElements = Array.from(document.querySelectorAll('img, [style*="url"]'));
      for (const el of allElements) {
        let src = '';
        if (el instanceof HTMLImageElement) {
          src = el.src || el.getAttribute('data-src') || el.getAttribute('data-delayed-url') || '';
        } else {
          const style = window.getComputedStyle(el).backgroundImage;
          const match = style.match(/url\("?(.+?)"?\)/);
          if (match) src = match[1];
        }

        if (src.includes('media.licdn.com') && (src.includes('profile-displayphoto') || src.includes('profile-displayphoto-shrink'))) {
           // HIGH-RES STRIP: Remove shrink filter
           src = src.replace(/-shrink_\d+_\d+/, '');
           console.log('[LIWarrior v2.7] Found High-Res Image:', src);
           meta.imageUrl = src;
           break;
        }
      }
    }

    // GUERRILLA STRATEGY: Find biggest circular image (Fallback)
    if (!meta.imageUrl && !context) {
      const imgs = Array.from(document.querySelectorAll('img'));
      for (const img of imgs) {
        if (img.width > 120 && img.width < 300) {
          const style = window.getComputedStyle(img);
          if (style.borderRadius === '50%' || parseFloat(style.borderRadius) > 50) {
            meta.imageUrl = img.src;
            break;
          }
        }
      }
    }

    const titleSelectors = [
      'h1 + .text-body-medium', 
      'h1 + div + .text-body-medium',
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

    // GUERRILLA STRATEGY: Neighborhood search + Coordinate Search
    if (!meta.title && !context) {
      const titleName = document.title.split('|')[0].trim();
      const elements = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4'));
      
      // Find the name element first
      let nameEl: HTMLElement | null = null;
      for (const el of elements as HTMLElement[]) {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize > 20 && el.textContent?.includes(titleName.split(' ')[0])) {
           nameEl = el;
           break;
        }
      }

      if (nameEl) {
        // Visual search: What is directly below the name?
        const rect = nameEl.getBoundingClientRect();
        const below = document.elementFromPoint(rect.left + 5, rect.bottom + 15) as HTMLElement;
        if (below?.innerText?.trim().length > 5 && !below.innerText.includes(titleName.split(' ')[0])) {
           meta.title = below.innerText.trim();
        } else {
          // Fallback to neighbor crawl
          const idx = elements.indexOf(nameEl);
          for (let j = 1; j <= 10; j++) {
            const neigh = elements[idx + j];
            if (neigh?.textContent?.trim().length > 10 && !neigh.textContent.includes(titleName.split(' ')[0])) {
               meta.title = neigh.textContent.trim();
               break;
            }
          }
        }
      }
    }

    // GUERRILLA STRATEGY: Find company in Experience Section (Deep Scan)
    if (!meta.company && !context) {
      const experienceSection = document.getElementById('experience') || 
                                document.querySelector('section[data-member-id] .pvs-list__outer-container');
      if (experienceSection) {
        // Look for the first "Current" job
        const firstJob = experienceSection.querySelector('.pvs-list__item-no-padding-bottom, .artdeco-list__item');
        if (firstJob) {
          const companyEl = firstJob.querySelector('.t-14.t-black--light, .t-14.t-normal span[aria-hidden="true"]');
          if (companyEl?.textContent?.includes(' · ')) {
            meta.company = companyEl.textContent.split(' · ')[0].trim();
          } else if (companyEl?.textContent) {
            meta.company = companyEl.textContent.trim();
          }
        }
      }
    }

    // FINAL FALLBACK: Domain Search
    if (!meta.company && !context) {
      const titleName = document.title.split('|')[0].trim();
      const allText = document.body.innerText;
      const companies = ['Meta', 'Facebook', 'Salesforce', 'Bloomberg', 'Google', 'Microsoft', 'Amazon', 'Apple', 'Netflix'];
      for (const c of companies) {
        if (allText.includes(` at ${c}`) || allText.includes(` @ ${c}`)) {
          meta.company = c;
          break;
        }
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
      console.log('[LIWarrior][ConnObs] Connection detected:', name, profileUrl, metadata);
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
                // Better regex to catch "invitation sent to [Name]."
                const match = node.innerText.match(/(?:invitation|request) sent to (.+?)(?:\.|\!|$)/i);
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
