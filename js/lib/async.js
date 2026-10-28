import { DataError, DATA_MESSAGES } from '../data/data-error.js';

/** Rejects with a DataError('timeout') if `promise` takes longer than `ms`. */
export function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new DataError('timeout', DATA_MESSAGES.timeout)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
