// based on / copied https://github.com/JPeer264/node-is-git-dirty/blob/main/index.ts
// git diff-index --quiet HEAD https://unix.stackexchange.com/a/394674/447527
import execa, { ExecaError } from 'execa';

export type Dirtiness = 'clean' | 'dirty' | 'unknown' | 'error';

/** It will either return 'clean' or 'dirty'. Won't throw error. */
export async function getDirtiness(projectPath: string): Promise<Dirtiness> {
  try {
    return (await isGitDirty(projectPath, 'slow')) ? 'dirty' : 'clean';
  } catch (err1) {
    try {
      return (await isGitDirty(projectPath, 'slow')) ? 'dirty' : 'clean';
    } catch (err2) {
      console.error(`We tried two tactics to get project dirtiness and both failed. ProjectPath='${projectPath}'. Printing both errors:`
        + `1) Error with 'git diff-index --quiet HEAD': ${err1}\n`
        + `2) Error with 'git status --short': ${err2}\n`);
      return 'error';
    }
  }
}


/** 'fast' will false-positive if the remote is new/without a head yet,
 * but is faster than 'git status --short'. Use it for all repos,
 * and for those cases that it fails, use 'slow'.
 *
 * Edit: I tested using only the slower one, and indeed it would take 10-20% more time on my tests,
 * and may take even more for projects with a lot of files changed.
 * May throw errors. */
export async function isGitDirty(gitDirPath: string, mode: 'fast' | 'slow'): Promise<boolean> {
  if (mode === 'fast') {
    // May throw errors.
    try {
      await execa('git', ['diff-index', '--quiet', 'HEAD'], { cwd: gitDirPath });
      return false;
    } catch (err) {
      const execaError = err as ExecaError;
      if (execaError.exitCode === 1)
        return true;
      else
        throw err; // Rethrow
    }
  } else { // else, 'slow'
    const { stdout } = await execa('git', ['status', '--short'], { cwd: gitDirPath });
    return (stdout.length > 0);
  }
}