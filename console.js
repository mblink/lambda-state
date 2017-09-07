/* eslint-disable no-console */
module.exports = {
  trace: (...args) => console.trace(...args),
  log: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
};
/* eslint-enable no-console */
