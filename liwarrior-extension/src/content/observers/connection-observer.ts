// ============================================================
// Connection Observer
// Detects when the USER clicks "Connect" on a profile.
// PASSIVE — listens for DOM changes after user interaction,
// never initiates clicks or actions.
// ============================================================

interface ConnectionSentEvent {
  name: string;
  profileUrl: string;
}

export function observeConnectionActions(
  onConnectionSent: (event: ConnectionSentEvent) => void
): MutationObserver {
  // Watch for the "Pending" or "Sent" state change on Connect buttons
  // When a user clicks Connect, LinkedIn changes the button text
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        checkForConnectionSent(onConnectionSent);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label', 'class'],
  });

  return observer;
}

const reportedConnections = new Set<string>();

function checkForConnectionSent(
  onConnectionSent: (event: ConnectionSentEvent) => void
) {
  // Look for "Pending" buttons that indicate a connection was just sent
  const pendingButtons = document.querySelectorAll(
    'button[aria-label*="Pending"], button.artdeco-button--muted'
  );

  for (const button of pendingButtons) {
    const buttonText = button.textContent?.trim().toLowerCase() || '';
    if (!buttonText.includes('pending')) continue;

    // Try to find the associated profile name
    const section = button.closest('section, .pvs-profile-actions, .entity-result');
    if (!section) continue;

    const nameEl =
      section.querySelector('h1') ||
      section.querySelector('.entity-result__title-text a span[aria-hidden="true"]');
    const name = nameEl?.textContent?.trim() || '';

    const profileUrl = window.location.href.split('?')[0];
    const key = `${name}_${profileUrl}`;

    if (name && !reportedConnections.has(key)) {
      reportedConnections.add(key);
      onConnectionSent({ name, profileUrl });
    }
  }
}
