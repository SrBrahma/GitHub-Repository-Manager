// based on / copied https://github.com/JPeer264/node-is-git-dirty/blob/main/index.ts
// git diff-index --quiet HEAD https://unix.stackexchange.com/a/394674/447527
import execa, { ExecaError } from 'execa';

export type IsGitDirty = 'clean' | 'dirty' | 'unknown' | 'error';

/** It will either return 'clean' or 'dirty'. Won't throw error. */
export async function isGitDirty(gitDirPath: string): Promise<IsGitDirty> {
  try {

    /** It will fail if the remote is new/without a head yet,
     * but seems to be faster than git status --short. We use it for all repos,
     * and for those cases that it fails, we run git status. */
    await execa('git', ['diff-index', '--quiet', 'HEAD'], { cwd: gitDirPath });
    return 'clean';
  } catch (err) {
    const execaError = err as ExecaError;

    let gitStatusError: string | undefined;

    if (execaError.exitCode !== 1) {
      // This one apparently is slower but will work
      try {
        const { stdout } = await execa('git', ['status', '--short'], { cwd: gitDirPath });
        return (stdout.length > 0) ? 'dirty' : 'clean';
      } catch (err) {
        gitStatusError = `-> It was also tried to check its dirtiness with 'git status --short', but an error also happened:\n${err}`;
      }
      const additionalText = `${gitStatusError ?? ''}'\n'`;
      console.error(`Error getting cloned repository dirtiness state with 'git diff-index --quiet HEAD'.\nRepositoryPath='${gitDirPath}'\n${err}${additionalText}`);
      return 'error';
    }

    // Else, is dirty!
    return 'dirty';
  }
}