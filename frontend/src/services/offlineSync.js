import apiClient from './apiClient';

/**
 * Basic offline capabilities:
 * Intercept session submissions when network is down and store in localStorage
 */

const PENDING_SESSIONS_KEY = 'rehabai_pending_sessions';

export const saveSessionOffline = (sessionData) => {
  const existing = JSON.parse(localStorage.getItem(PENDING_SESSIONS_KEY) || '[]');
  existing.push({
    ...sessionData,
    savedAt: new Date().toISOString()
  });
  localStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(existing));
  console.log('Session saved offline temporarily.');
};

export const syncOfflineData = async () => {
  if (!navigator.onLine) return; // Only sync if online

  const existing = JSON.parse(localStorage.getItem(PENDING_SESSIONS_KEY) || '[]');
  if (existing.length === 0) return;

  console.log(`Syncing ${existing.length} offline sessions...`);

  const failedSyncs = [];
  
  for (const session of existing) {
    try {
      // POST logic to normal session endpoint
      await apiClient.post(`/advanced/session/log`, session);
    } catch (e) {
      console.error('Failed to sync session, keeping in queue', e);
      failedSyncs.push(session);
    }
  }

  // Update localStorage with whatever couldn't be synced
  localStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(failedSyncs));
  if (failedSyncs.length === 0) {
    console.log('Offline sync completed successfully.');
  }
};

// Start listening for reconnection events
export const initOfflineSync = () => {
  window.addEventListener('online', syncOfflineData);
  // Optional: setInterval to retry periodically if already online
  setInterval(() => {
    if (navigator.onLine) {
      syncOfflineData();
    }
  }, 60000); // Check every minute
};
