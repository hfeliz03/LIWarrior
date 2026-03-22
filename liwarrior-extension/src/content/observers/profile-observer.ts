import { SELECTORS, safeQuery, safeQueryAll } from '../dom-selectors';
import type { Contact } from '@/types';

// ============================================================
// Profile Observer
// Reads a LinkedIn profile page to extract detailed info
// for the Commonality Engine. READ-ONLY — never modifies DOM.
// ============================================================

export function scrapeProfile(): Partial<Contact> | null {
  try {
    const nameEl = safeQuery(SELECTORS.profile.name);
    const headlineEl = safeQuery(SELECTORS.profile.headline);
    const locationEl = safeQuery(SELECTORS.profile.location);
    const canonicalEl = safeQuery<HTMLLinkElement>(SELECTORS.profile.profileUrl);

    const fullName = nameEl?.textContent?.trim() || '';
    if (!fullName) return null;

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const title = headlineEl?.textContent?.trim() || '';
    const location = locationEl?.textContent?.trim() || '';
    const profileUrl = canonicalEl?.href || window.location.href.split('?')[0];

    // Extract education
    const universities = extractEducation();

    // Extract languages
    const languages = extractLanguages();

    // Extract experience (companies)
    const { currentCompany, previousCompanies } = extractExperience();

    return {
      firstName,
      lastName,
      fullName,
      title,
      profileUrl,
      universities,
      languages,
      locations: location ? [location] : [],
      previousCompanies,
      company: currentCompany,
    };
  } catch (e) {
    console.debug('[LIWarrior] Error scraping profile:', e);
    return null;
  }
}

function extractEducation(): string[] {
  const universities: string[] = [];
  const section = document.querySelector('#education');
  if (!section) return universities;

  // Walk up to the parent section container
  const container = section.closest('section') || section.parentElement?.parentElement;
  if (!container) return universities;

  const items = safeQueryAll('.pvs-entity--padded', container);
  for (const item of items) {
    const schoolEl = safeQuery('.t-bold span[aria-hidden="true"]', item);
    const school = schoolEl?.textContent?.trim();
    if (school) {
      universities.push(school);
    }
  }

  return universities;
}

function extractLanguages(): string[] {
  const languages: string[] = [];

  // Languages can be in different sections depending on profile
  const possibleSections = document.querySelectorAll('section');
  for (const section of possibleSections) {
    const header = section.querySelector('#languages, [id*="language"]');
    if (!header) continue;

    const items = safeQueryAll('.pvs-entity--padded', section);
    for (const item of items) {
      const langEl = safeQuery('.t-bold span[aria-hidden="true"]', item);
      const lang = langEl?.textContent?.trim();
      if (lang) {
        languages.push(lang);
      }
    }
  }

  return languages;
}

function extractExperience(): { currentCompany: string; previousCompanies: string[] } {
  const companies: string[] = [];
  let currentCompany = '';

  const section = document.querySelector('#experience');
  if (!section) return { currentCompany, previousCompanies: companies };

  const container = section.closest('section') || section.parentElement?.parentElement;
  if (!container) return { currentCompany, previousCompanies: companies };

  const items = safeQueryAll('.pvs-entity--padded', container);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // Company name can be in different positions depending on grouped vs ungrouped
    const companyEl = safeQuery('.t-normal span[aria-hidden="true"]', item)
      || safeQuery('.t-bold span[aria-hidden="true"]', item);
    const company = companyEl?.textContent?.trim()?.replace(/·.*$/, '').trim();

    if (company && !companies.includes(company)) {
      if (i === 0) {
        currentCompany = company;
      }
      companies.push(company);
    }
  }

  return {
    currentCompany,
    previousCompanies: companies,
  };
}

/**
 * Check if we're on a LinkedIn profile page
 */
export function isProfilePage(): boolean {
  return /^\/in\/[^/]+\/?$/.test(window.location.pathname);
}
