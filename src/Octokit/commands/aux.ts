const util = require('util');

// https://stackoverflow.com/a/56095793/10247962
/**
 * @example async function lsExample() {
 *   try {
 *     const { stdout, stderr } = await exec('ls');
 *     console.log('stdout:', stdout);
 *     console.log('stderr:', stderr);
 *   } catch (e) {
 *     console.error(e); // should contain code (exit code) and signal (that caused the termination).
 *   }
 * }
 */
export const exec = util.promisify(require('child_process').exec);


// lsExample();