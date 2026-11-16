#!/usr/bin/env node
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const phrase = process.argv.slice(2).join(' ');
if (!phrase || phrase.length < 8) {
  console.error('8文字以上の合言葉を指定してください: npm run lock-key -- "受講者に伝える合言葉"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(phrase, salt, 210000, 32, 'sha256');
console.log(`lockKeySalt: ${salt.toString('hex')}`);
console.log(`lockKeyHash: ${hash.toString('hex')}`);
