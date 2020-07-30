// Notice that it doesn't actually uses git clone. Read if you want to.
//
// Writing this simple function took me more than a day. Here are the main whys:
//
// 1) If we used `git clone https://${user.token}@github.com/${repo.ownerLogin}/${repo.name}`,
// it would save the token in the .git.config.
//
// 2) If we used git clone with only the username (so, it wouldn't save the password / token
// in .git files), it would request the password via user input. I didn't find out a way to
// automatically inputs the password (= token) when requested by git clone, using childProcess
// (probably using .spawn() instead of .exec() and using some Stream STDIN sorcery that I didnt find out).
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



import { RepositoryInterface } from '../../store/types';
import { exec } from 'mz/child_process';
import path from 'path';
import fs from 'fs';
import { token } from "../octokit";
import rimraf from 'rimraf';
/**
 *
 *
 * @export
 * @param {Repository} repo
 * @param {string} parentPath The path which will contain the new repository directory
 */
export async function cloneRepo(repo: RepositoryInterface, parentPath: string) {
  const repoPath = path.resolve(parentPath, repo.name);

  if (fs.existsSync(repoPath))
    throw new Error(`There is already a directory named ${repo.name} in ${parentPath}!`);

  try {
    await exec(`git init ${repo.name}`,
      { cwd: parentPath });
    await exec(`git remote add origin https://github.com/${repo.ownerLogin}/${repo.name}.git`,
      { cwd: repoPath });
    await exec(`git pull https://${token}@github.com/${repo.ownerLogin}/${repo.name}.git master`,
      { cwd: repoPath });

    // I didn't find a way to automatically set the push destination.
    // The usual way is by doing "git push -u origin master", however, it requires the user being
    // logged, which isn't always true (and we actually didn't in previous steps)

    fs.appendFileSync(path.resolve(parentPath, repo.name, '.git', 'config'),
      `[branch "master"]
\tremote = origin
\tmerge = refs/heads/master`);

  }
  catch (err) {
    // This will happen if the repository never had a push. As we know it really exists, isn't a problem at all.
    if ((err.message as string).includes("couldn't find remote ref master"))
      return;

    // Removes the repo dir if error. For some reason rimraf needs this empty callback.
    rimraf(repoPath, () => { });

    // Removes the token from the error message
    const censoredMsg = (err.message as string).replace(token, '[tokenHidden]');
    throw new Error(censoredMsg);
  }
}