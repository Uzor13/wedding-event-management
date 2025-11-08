import crypto from 'crypto';

export function generateUniqueId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
