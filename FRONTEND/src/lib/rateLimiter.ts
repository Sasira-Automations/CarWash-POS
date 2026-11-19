/**
 * Application Password Rate Limiter & Brute-Force Protection
 *
 * Enforces rate limiting on password attempts:
 * - Maximum 5 consecutive failed attempts per account/email
 * - 5-minute (300 seconds) lockout cooldown upon reaching the limit
 * - Exponential backoff if repeatedly triggered
 */

export interface RateLimitStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockTimeRemainingSeconds: number;
  totalFailures: number;
}

const STORAGE_PREFIX = 'washflow_rl_';
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 300; // 5 minutes

interface RateLimitRecord {
  failures: number;
  lockedUntil: number | null; // Unix timestamp ms
  lastAttemptAt: number;
}

const sanitizeKey = (identifier: string): string => {
  return `${STORAGE_PREFIX}${identifier.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
};

const getRecord = (identifier: string): RateLimitRecord => {
  if (typeof window === 'undefined') {
    return { failures: 0, lockedUntil: null, lastAttemptAt: 0 };
  }

  try {
    const raw = localStorage.getItem(sanitizeKey(identifier));
    if (!raw) {
      return { failures: 0, lockedUntil: null, lastAttemptAt: 0 };
    }
    const parsed = JSON.parse(raw);
    return {
      failures: Number(parsed.failures) || 0,
      lockedUntil: parsed.lockedUntil ? Number(parsed.lockedUntil) : null,
      lastAttemptAt: Number(parsed.lastAttemptAt) || 0,
    };
  } catch {
    return { failures: 0, lockedUntil: null, lastAttemptAt: 0 };
  }
};

const saveRecord = (identifier: string, record: RateLimitRecord): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(sanitizeKey(identifier), JSON.stringify(record));
  } catch (err) {
    console.warn('Failed to save rate limit record:', err);
  }
};

export const checkRateLimit = (identifier: string): RateLimitStatus => {
  const email = identifier.trim().toLowerCase();
  if (!email) {
    return {
      isLocked: false,
      remainingAttempts: MAX_ATTEMPTS,
      lockTimeRemainingSeconds: 0,
      totalFailures: 0,
    };
  }

  const record = getRecord(email);
  const now = Date.now();

  // If lockout expired, clear lockout
  if (record.lockedUntil) {
    if (now >= record.lockedUntil) {
      // Cooldown expired: reset lock but keep failure baseline lower
      record.lockedUntil = null;
      record.failures = 0;
      saveRecord(email, record);
      return {
        isLocked: false,
        remainingAttempts: MAX_ATTEMPTS,
        lockTimeRemainingSeconds: 0,
        totalFailures: 0,
      };
    } else {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockTimeRemainingSeconds: remainingSeconds,
        totalFailures: record.failures,
      };
    }
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.failures);
  return {
    isLocked: false,
    remainingAttempts: remaining,
    lockTimeRemainingSeconds: 0,
    totalFailures: record.failures,
  };
};

export const recordFailedAttempt = (identifier: string): RateLimitStatus => {
  const email = identifier.trim().toLowerCase();
  if (!email) {
    return {
      isLocked: false,
      remainingAttempts: MAX_ATTEMPTS,
      lockTimeRemainingSeconds: 0,
      totalFailures: 0,
    };
  }

  const record = getRecord(email);
  const now = Date.now();

  record.failures += 1;
  record.lastAttemptAt = now;

  if (record.failures >= MAX_ATTEMPTS) {
    // Progressive lockout: 5 mins for first lockout, extending up to 25 mins if attacks continue
    const multiplier = Math.min(5, Math.max(1, Math.floor(record.failures / MAX_ATTEMPTS)));
    const dynamicCooldown = COOLDOWN_SECONDS * multiplier;
    record.lockedUntil = now + dynamicCooldown * 1000;
    saveRecord(email, record);
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockTimeRemainingSeconds: dynamicCooldown,
      totalFailures: record.failures,
    };
  }

  saveRecord(email, record);
  return {
    isLocked: false,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.failures),
    lockTimeRemainingSeconds: 0,
    totalFailures: record.failures,
  };
};

export const resetRateLimit = (identifier: string): void => {
  const email = identifier.trim().toLowerCase();
  if (!email || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(sanitizeKey(email));
  } catch (err) {
    console.warn('Failed to clear rate limit record:', err);
  }
};
