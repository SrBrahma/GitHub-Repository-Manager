// Notice that it doesn't actually uses git clone. Read if you want to.
//
// Writing this simple function took me more than a day. Here are the main whys:
//
// 1) If we used `git clone https://${user.token}@github.com/${owner}/${repositoryName}`,
// it would save the token in the .git.config.
//
// 2) If we used git clone with only the username (so, it wouldn't save the password / token
// in .git files), it would request the password via user input. I didn't find out a way to
// automatically input the password (= token) when requested by git clone, using childProcess
// (probably using .spawn() instead of .exec() and using some Stream STDIN sorcery that I didn't find out).
// Also, I ain't sure of how it would works if user already already logged via git --global credential.
// Didn't want to find out. I really don't like using git via cli (or any program at all). Not in the mood.
//
// 3) I didn't want to get the user's username and password, like the vscode does. We have a token, right?
// Don't make too much sense not using it.
//
// Links for the solution:
// 1) https://serverfault.com/a/815145 -> The answer command required mkdir and cd, and I don't know
// if it would work properly in windows the same way. I found out that git init <path> creates a dir.
//
// 2) https://www.reddit.com/r/git/comments/30i3we/git_pull_to_a_different_directory_other_than/cpsncul?utm_source=share&utm_medium=web2x
// -> We can pull to a specific path using git -C <path> pull <...>
//
// After those two, the pulled repo don't have a remote (github link). So we add it.

import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import { getRemoteHead as getRemoteHeadBranch } from '../getRemoteHeadBranch/getRemoteHeadBranch';
import { getRepositoryGitUrl } from '../getRepositoryGitUrl';


export async function cloneRepo(options: {
  repositoryName: string;
  owner: string;
  parentPath: string;
  token: string;
}): Promise<void> {

  const { owner, repositoryName, parentPath, token } = options;

  const repositoryPath = path.join(parentPath, repositoryName);

  if (await fse.pathExists(repositoryPath))
    throw new Error(`There is already a directory named '${repositoryName}' at '${parentPath}'!`);

  const remoteUrl = getRepositoryGitUrl({ owner, repositoryName });
  const remoteUrlTokenized = getRepositoryGitUrl({ owner, repositoryName, token });

  try {
    await execa('git', ['init', repositoryName], { cwd: parentPath });

    const headBranchRaw = await getRemoteHeadBranch({ remoteUrl: remoteUrlTokenized, repositoryPath });
    const repositoryIsEmpty = !headBranchRaw;

    /** Defaults to main if there is no HEAD */
    const headBranch: string = repositoryIsEmpty ? 'main' : headBranchRaw;

    /** https://stackoverflow.com/a/42871621/10247962 */
    await execa('git', ['checkout', '-b', headBranch], { cwd: repositoryPath });
    await execa('git', ['remote', 'add', 'origin', remoteUrl], { cwd: repositoryPath });

    // If repository has a HEAD branch, aka has a commit, aka isn't empty
    if (!repositoryIsEmpty)
      /** TODO: "If you don't want your token to be stored in your shell history, you can set GITHUB_TOKEN
       * in the environment and that will be read instead"
       * https://github.com/mheap/github-default-branch */
      await execa('git', ['pull', remoteUrlTokenized], { cwd: repositoryPath });


    /** I didn't find a way to automatically set the push destination.
     * The usual way is by doing "git push -u origin main", however, it requires the user being
     * logged, which isn't always true (and we actually didn't in previous steps). #22. */
    await fse.appendFile(path.join(repositoryPath, '.git', 'config'),
      `[branch "${headBranch}"]
\tremote = origin
\tmerge = refs/heads/${headBranch}`);

  } catch (err: any) {
    // Removes the repo dir if error. We already checked before the try if the path existed,
    // so we are only removing what we possibly created.
    await fse.remove(repositoryPath);

    /** Error message with user token censored, if included */
    const censoredMsg = (err.message as string).replace(new RegExp(token, 'g'), '[tokenHidden]');
    throw new Error(censoredMsg);
  }
}