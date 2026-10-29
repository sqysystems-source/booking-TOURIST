/** Error raised by the data layer. `userMessage` is safe to show to visitors. */
export class DataError extends Error {
  /**
   * @param {'config'|'network'|'timeout'|'permission'|'index'|'unknown'} code
   * @param {string} userMessage plain-language explanation for the visitor
   * @param {unknown} [cause] original error, logged to the console only
   */
  constructor(code, userMessage, cause) {
    super(userMessage);
    this.name = 'DataError';
    this.code = code;
    this.userMessage = userMessage;
    this.cause = cause;
  }
}

export const DATA_MESSAGES = {
  config:
    'The live villa database is selected but Firebase has not been configured yet. Add your Firebase settings in js/config/firebase-config.js.',
  network: 'We could not reach the villa database. Please check your connection and try again.',
  timeout: 'The villa database took too long to respond. Please try again.',
  permission: 'The villa database refused the request. Check the Firestore security rules and that the villa is published.',
  index: 'The villa database needs an index for this request. See the README section on Firestore indexes.',
  unknown: 'Something went wrong while loading villas. Please try again.',
};
