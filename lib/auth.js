import crypto from 'crypto';

/**
 * Generates a secure random token for email verification
 * @returns {string} The generated token
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculates token expiration date
 * @param {number} hours Number of hours until token expires
 * @returns {Date} Expiration date
 */
export function getTokenExpiration(hours = 24) {
  const now = new Date();
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Validates if a token is expired
 * @param {Date} expiryDate The token expiration date
 * @returns {boolean} True if token is expired
 */
export function isTokenExpired(expiryDate) {
  return new Date() > new Date(expiryDate);
} 