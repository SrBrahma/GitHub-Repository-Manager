// git diff-index --quiet HEAD
// based on / copied https://github.com/JPeer264/node-is-git-dirty/blob/main/index.ts
import execa from 'execa';

export type Dirtiness = 'clean' | 'dirty' | 'unknown' | 'error';

/** @returns 'clean', 'dirty' or 'error'.
 *
 * Won't throw errors. */
export async function getDirtiness(projectPath: string): Promise<Dirtiness> {
  try {
    return (await isGitDirty(projectPath)) ? 'dirty' : 'clean';
  } catch (err: any) {
    console.error(
      `Error getting local project dirtiness with 'git status --short'. ProjectPath='${projectPath}', Error=${err}`,
    );
    return 'error';
  }
}

/** May throw errors. */
// We used to use 'git diff-index --quiet HEAD' (https://unix.stackexchange.com/a/394674/447527),
// which was a little faster but it would false-positive at some cases, like for new project without
// head/remote. We used both diff-index and status but to avoid code complexness, we are just using the status.
export async function isGitDirty(gitDirPath: string): Promise<boolean> {
  const { stdout } = await execa('git', ['status', '--short'], { cwd: gitDirPath });
  return stdout.length > 0;
}
