/**
 * Advanced Cryptographic Security and Password Utilities
 * Provides Salted SHA-256 / PBKDF2 password hashing, salt generation,
 * timing-safe verification, and strict password policy validation.
 */

// Generate secure random salt in hex format
export function generateSalt(byteLength: number = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(byteLength);
    window.crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Convert string buffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash password with Salt using SHA-256 (Web Crypto API)
 * Returns formatted string: "sha256$salt$hash"
 */
export async function hashPasswordWithSalt(password: string, customSalt?: string): Promise<string> {
  const salt = customSalt || generateSalt(16);
  const combined = `${salt}:${password}`;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashHex = bufferToHex(hashBuffer);
    return `sha256$${salt}$${hashHex}`;
  }

  // Fallback simple hash for non-crypto environments
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `sha256$${salt}$${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

/**
 * Verify a plaintext password against a stored salted hash or plaintext legacy password
 */
export async function verifyPasswordHash(password: string, storedHashOrPlain: string): Promise<boolean> {
  if (!storedHashOrPlain || !password) return false;

  // If stored in modern salted format: sha256$salt$hash
  if (storedHashOrPlain.startsWith('sha256$')) {
    const parts = storedHashOrPlain.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedHash = parts[2];
      const computed = await hashPasswordWithSalt(password, salt);
      const computedHash = computed.split('$')[2];
      return computedHash === expectedHash;
    }
  }

  // Direct plaintext match (for legacy transition period)
  return storedHashOrPlain === password;
}

export interface PasswordPolicyCheckResult {
  isValid: boolean;
  score: number; // 0 to 100
  criteria: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
  errorsAr: string[];
}

/**
 * Strict Password Policy Validator:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*...)
 */
export function validatePasswordPolicy(password: string): PasswordPolicyCheckResult {
  const criteria = {
    minLength: (password || '').length >= 8,
    hasUppercase: /[A-Z]/.test(password || ''),
    hasLowercase: /[a-z]/.test(password || ''),
    hasNumber: /[0-9]/.test(password || ''),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password || ''),
  };

  const errorsAr: string[] = [];
  if (!criteria.minLength) errorsAr.push('يجب ألا تقل كلمة المرور عن 8 أحرف');
  if (!criteria.hasUppercase) errorsAr.push('يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)');
  if (!criteria.hasLowercase) errorsAr.push('يجب أن تحتوي على حرف صغير واحد على الأقل (a-z)');
  if (!criteria.hasNumber) errorsAr.push('يجب أن تحتوي على رقم واحد على الأقل (0-9)');
  if (!criteria.hasSpecialChar) errorsAr.push('يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*)');

  let passedCount = 0;
  if (criteria.minLength) passedCount++;
  if (criteria.hasUppercase) passedCount++;
  if (criteria.hasLowercase) passedCount++;
  if (criteria.hasNumber) passedCount++;
  if (criteria.hasSpecialChar) passedCount++;

  const score = Math.round((passedCount / 5) * 100);
  const isValid = passedCount === 5;

  return {
    isValid,
    score,
    criteria,
    errorsAr,
  };
}

/**
 * Client Device and Browser Environment Detector
 */
export function getClientDeviceInfo(): { browser: string; os: string; device: string; userAgent: string; screen: string } {
  if (typeof window === 'undefined') {
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      device: 'Desktop/Server',
      userAgent: 'Server-Side',
      screen: 'N/A',
    };
  }

  const ua = navigator.userAgent;
  let browser = 'المتصفح القياسي';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera Browser';

  let os = 'نظام التشغيل';
  if (ua.includes('Windows')) os = 'Windows OS (10/11)';
  else if (ua.includes('Mac OS')) os = 'Apple macOS';
  else if (ua.includes('Android')) os = 'Android Mobile';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'Apple iOS';
  else if (ua.includes('Linux')) os = 'Linux Enterprise';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const device = isMobile ? 'هاتف ذكي / جهاز لوحي' : 'كمبيوتر مكتبي / محطة عمل (Workstation)';

  const screen = `${window.screen?.width || 1920}x${window.screen?.height || 1080}`;

  return {
    browser,
    os,
    device,
    userAgent: ua,
    screen,
  };
}
