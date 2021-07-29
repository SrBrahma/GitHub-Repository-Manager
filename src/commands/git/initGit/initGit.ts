import execa from 'execa';
import fse from 'fs-extra';
import path from 'path';
import { getRepositoryGitUrl } from '../getRepositoryGitUrl';
import { pathHasGit } from '../pathHasGit/pathHasGit';


type Options = {
  /** If defined, will add remote and a branch with it as remote. '.git' is added to its end. */
  remoteUrl?: {
    owner: string;
    repositoryName: string;
  };
  /** Will 'git add .', 'git commit -m "Initial Commit"' and 'git push'.
   * remoteUrl must be defined.
   * @default undefined */
  commitAllAndPush?: {
    token: string;
  };
  /** If should remove .git on error, if it didn't exist before this function.
   * @default true */
  cleanOnError?: boolean;
};

export async function initGit(projectPath: string, options?: Options): Promise<void> {
  const { cleanOnError, commitAllAndPush, remoteUrl } = options ?? {};

  if (await pathHasGit(projectPath))
    throw new Error('Path already contains .git!');

  try {

    await execa('git', ['init'], { cwd: projectPath });

    const headBranch: string = 'main';
    /** https://stackoverflow.com/a/42871621/10247962 */
    await execa('git', ['checkout', '-b', headBranch], { cwd: projectPath });

    if (remoteUrl) {
      const repositoryUrl = getRepositoryGitUrl(remoteUrl);
      await execa('git', ['remote', 'add', 'origin', repositoryUrl], { cwd: projectPath });

      await fse.appendFile(path.join(projectPath, '.git', 'config'),
        `[branch "${headBranch}"]
\tremote = origin
\tmerge = refs/heads/${headBranch}`);

      if (commitAllAndPush) {
        await execa('git', ['add', '.'], { cwd: projectPath });
        await execa('git', ['commit', '-m', 'Initial Commit'], { cwd: projectPath });
        // push needs user auth. https://stackoverflow.com/a/57624220/10247962
        const tokenizedRepositoryUrl = getRepositoryGitUrl({
          owner: remoteUrl.owner,
          repositoryName: remoteUrl.repositoryName,
          token: commitAllAndPush.token,
        });
        await execa('git', ['push', tokenizedRepositoryUrl], { cwd: projectPath });
      }
    }
  } catch (err) {
    if (cleanOnError)
      await fse.remove(path.join(projectPath, '.git')); // Remove created .git on error
    throw err;
  }
}