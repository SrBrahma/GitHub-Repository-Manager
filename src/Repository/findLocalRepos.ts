import { configs } from "../configs";
import { readdir } from 'mz/fs';
import path from 'path';
import { exec } from 'mz/child_process';
import { Repository } from "./Repository";

// TODO: Stores the cloned repos local path in globalState

// mz lib is a little old but does the job.
// https://stackoverflow.com/a/37532027/10247962



interface DirWithGitUrl {
  dirPath: string,
  gitUrl: string,
}

async function getGitUrls(dirsPath: string[]): Promise<DirWithGitUrl[]> {
  const dirsWithGitUrl: DirWithGitUrl[] = [];

  // forEach would call all execs 'at the same time', as it doesnt wait await.
  for (const dirPath of dirsPath) {
    try {
      let [gitUrl] = await exec('git config --get remote.origin.url', { cwd: dirPath });
      gitUrl = gitUrl.trim(); // The gitUrl have a line break on end.
      dirsWithGitUrl.push({ gitUrl, dirPath });
    }
    catch (error) { } // If error, it's because there isn't a remote.
  };
  return dirsWithGitUrl;
}


async function getDirsByPath(parentPath: string): Promise<string[]> {
  const files = await readdir(parentPath, { withFileTypes: true });
  const dirs = files.filter(file => file.isDirectory())
    .map(dir => path.resolve(parentPath, dir.name));
  return dirs;
}

// async function getPossibleDirs() {
//   // const dirs = [];
//   // const parentDirs = [];
//   // parentDirs.push(configs.defaultCloneDir);

//   // parentDirs.forEach(async (parentDir) => {

//   // });
// }



// TODO: Add custom dirs
export async function findLocalReposAndSetRepoPath(repos: Repository[]): Promise<void> {
  if (!repos.length)
    return;
  const dirs = await getDirsByPath(configs.defaultCloneDir);
  const dirsWithGitUrl = await getGitUrls(dirs);

  for (const repo of repos) {
    const index = dirsWithGitUrl.findIndex(dirWithGitUrl => dirWithGitUrl.gitUrl === repo.htmlUrl);
    if (index !== -1) {
      repo.localPath = dirsWithGitUrl[index].dirPath;
      dirsWithGitUrl.splice(index, 1);
    }
  }
}

