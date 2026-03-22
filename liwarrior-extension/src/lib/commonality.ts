import type { UserProfile, Contact, CommonalityResult, CommonalityType } from '@/types';

// ============================================================
// Commonality Engine
// Compares user profile against a contact to find shared
// connections that make messages feel personal.
// ============================================================

const PRIORITY_MAP: Record<CommonalityType, number> = {
  university: 1,
  language: 2,
  last_name: 3,
  location: 4,
  company: 5,
  volunteer: 6,
  certification: 7,
  industry: 8,
};

export function findCommonalities(
  user: UserProfile,
  contact: Contact
): CommonalityResult[] {
  const results: CommonalityResult[] = [];

  // 1. University match
  for (const userUni of user.universities) {
    for (const contactUni of contact.universities) {
      if (normalize(userUni) === normalize(contactUni)) {
        results.push({
          type: 'university',
          priority: PRIORITY_MAP.university,
          userValue: userUni,
          contactValue: contactUni,
          matchStrength: 'exact',
          suggestedIcebreaker: getUniversityIcebreaker(userUni),
        });
      }
    }
  }

  // 2. Language match (non-English)
  for (const userLang of user.languages) {
    if (normalize(userLang) === 'english') continue;
    for (const contactLang of contact.languages) {
      if (normalize(contactLang) === 'english') continue;
      if (normalize(userLang) === normalize(contactLang)) {
        results.push({
          type: 'language',
          priority: PRIORITY_MAP.language,
          userValue: userLang,
          contactValue: contactLang,
          matchStrength: 'exact',
          suggestedIcebreaker: getLanguageIcebreaker(userLang),
        });
      }
    }
  }

  // 3. Last name match
  if (
    user.lastName &&
    contact.lastName &&
    normalize(user.lastName) === normalize(contact.lastName)
  ) {
    results.push({
      type: 'last_name',
      priority: PRIORITY_MAP.last_name,
      userValue: user.lastName,
      contactValue: contact.lastName,
      matchStrength: 'exact',
      suggestedIcebreaker: getLastNameIcebreaker(contact.lastName),
    });
  }

  // 4. Location match
  const userLocations = [user.currentLocation, ...user.previousLocations].filter(Boolean);
  for (const userLoc of userLocations) {
    for (const contactLoc of contact.locations) {
      if (locationsMatch(userLoc, contactLoc)) {
        results.push({
          type: 'location',
          priority: PRIORITY_MAP.location,
          userValue: userLoc,
          contactValue: contactLoc,
          matchStrength: isExactLocationMatch(userLoc, contactLoc) ? 'exact' : 'partial',
          suggestedIcebreaker: getLocationIcebreaker(contactLoc),
        });
      }
    }
  }

  // 5. Previous company match
  for (const userCompany of user.companies) {
    for (const contactCompany of contact.previousCompanies) {
      if (normalize(userCompany) === normalize(contactCompany)) {
        results.push({
          type: 'company',
          priority: PRIORITY_MAP.company,
          userValue: userCompany,
          contactValue: contactCompany,
          matchStrength: 'exact',
          suggestedIcebreaker: getCompanyIcebreaker(contactCompany),
        });
      }
    }
  }

  // 6. Volunteer match
  for (const userVol of user.volunteerOrgs) {
    for (const contactVol of contact.volunteerOrgs) {
      if (normalize(userVol) === normalize(contactVol)) {
        results.push({
          type: 'volunteer',
          priority: PRIORITY_MAP.volunteer,
          userValue: userVol,
          contactValue: contactVol,
          matchStrength: 'exact',
          suggestedIcebreaker: `Noticed we're both involved with ${contactVol} — that's awesome!`,
        });
      }
    }
  }

  // 7. Certification match
  for (const userCert of user.certifications) {
    for (const contactCert of contact.certifications) {
      if (normalize(userCert) === normalize(contactCert)) {
        results.push({
          type: 'certification',
          priority: PRIORITY_MAP.certification,
          userValue: userCert,
          contactValue: contactCert,
          matchStrength: 'exact',
          suggestedIcebreaker: `Fellow ${contactCert} holder here!`,
        });
      }
    }
  }

  // Sort by priority (lower number = higher priority)
  results.sort((a, b) => a.priority - b.priority);

  return results;
}

/**
 * Calculate a numeric commonality score for ranking contacts
 */
export function calculateCommonalityScore(commonalities: CommonalityResult[]): number {
  return commonalities.reduce((score, c) => {
    const baseScore = 10 - c.priority; // Higher priority = higher score
    const strengthMultiplier = c.matchStrength === 'exact' ? 1 : 0.5;
    return score + baseScore * strengthMultiplier;
  }, 0);
}

// ============================================================
// Icebreaker generators
// ============================================================

function getUniversityIcebreaker(uni: string): string {
  const templates = [
    `Fellow ${getShortUniName(uni)} alum here!`,
    `Always great to connect with someone from ${getShortUniName(uni)}!`,
    `${getShortUniName(uni)} represent! Love seeing fellow alumni in the industry.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function getLanguageIcebreaker(language: string): string {
  const greetings: Record<string, string> = {
    spanish: 'siempre es bueno encontrar a alguien que hable espanol por aqui!',
    portuguese: 'sempre bom encontrar outros por aqui!',
    french: 'toujours un plaisir de croiser un francophone!',
    german: 'immer schon, andere Deutschsprachige zu treffen!',
    mandarin: 'nice to meet a fellow Mandarin speaker!',
    cantonese: 'nice to meet a fellow Cantonese speaker!',
    japanese: 'nice to meet a fellow Japanese speaker!',
    korean: 'nice to meet a fellow Korean speaker!',
    hindi: 'nice to meet a fellow Hindi speaker!',
    arabic: 'nice to meet a fellow Arabic speaker!',
    italian: 'sempre un piacere incontrare altri italofoni!',
  };

  const greeting = greetings[normalize(language)];
  if (greeting) {
    return `I noticed you also speak ${language} — ${greeting}`;
  }
  return `I noticed you also speak ${language} — always cool to find that in common!`;
}

function getLastNameIcebreaker(lastName: string): string {
  const templates = [
    `Love seeing another ${lastName} in the industry — what if we're long-lost cousins? haha`,
    `Hey, another ${lastName}! Small world — maybe we're distant relatives? haha`,
    `Can't help but notice we share the last name — ${lastName} fam! haha`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function getLocationIcebreaker(location: string): string {
  return `Always great to connect with someone from ${location}!`;
}

function getCompanyIcebreaker(company: string): string {
  const templates = [
    `I see you were at ${company} too — small world!`,
    `Fellow ${company} alum! Always cool to cross paths.`,
    `Noticed you have ${company} on your resume too — great to connect!`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ============================================================
// Utilities
// ============================================================

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

function getShortUniName(uni: string): string {
  // Common abbreviations
  const abbrevs: Record<string, string> = {
    'university of texas at austin': 'UT Austin',
    'massachusetts institute of technology': 'MIT',
    'california institute of technology': 'Caltech',
    'university of california los angeles': 'UCLA',
    'university of california berkeley': 'UC Berkeley',
    'georgia institute of technology': 'Georgia Tech',
    'carnegie mellon university': 'CMU',
    'university of michigan': 'UMich',
    'university of illinois': 'UIUC',
    'new york university': 'NYU',
    'university of southern california': 'USC',
    'university of pennsylvania': 'UPenn',
  };

  const normalized = normalize(uni);
  return abbrevs[normalized] || uni;
}

function locationsMatch(loc1: string, loc2: string): boolean {
  const parts1 = normalize(loc1).split(/[,\s]+/);
  const parts2 = normalize(loc2).split(/[,\s]+/);
  // Match if any significant location part overlaps
  return parts1.some(p => p.length > 2 && parts2.includes(p));
}

function isExactLocationMatch(loc1: string, loc2: string): boolean {
  return normalize(loc1) === normalize(loc2);
}
