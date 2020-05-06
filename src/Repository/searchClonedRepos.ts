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
      // https://stackoverflow.com/a/23682620/10247962
      // This one seems to work better than the other commands.
      // The others, won't work with a custom remote name or other git stuff that I really don't understand.
      // But managed to make this work.
      let [gitUrl] = await exec('git ls-remote --get-url', { cwd: dirPath });

      // Remove the .git the gitUrl may or not have (as our repository object htmlUrl never has .git)
      gitUrl = gitUrl.replace('.git', '');

      // The gitUrl have a line break on end.
      gitUrl = gitUrl.trim();

      dirsWithGitUrl.push({ gitUrl, dirPath });
    }
    catch (error) { } // If error, it's because there isn't a remote.
  };
  return dirsWithGitUrl;
}



// Recursive function to find directories with .git dir.
async function getDirsWithDotGit(currentPath: string, availableDepth: number): Promise<string[]> {
  const dirsPath = (await readdir(currentPath, { withFileTypes: true }))
    .filter(file => file.isDirectory()).map(dir => dir.name);

  // If current dir is a repository
  if (dirsPath.find(dir => dir === '.git'))
    return [currentPath];

  // If this was the last depth and we didn't find a .gir dir, return empty array;
  if (availableDepth === 0)
    return [];

  // Else, go deeper!
  const results = [];
  for (const dirPath of dirsPath) // Maybe could use forEach as it doesn't wait awaits, the 'parallelism' could work nice. Needs benchmark.
    results.push(...await getDirsWithDotGit(path.resolve(currentPath, dirPath), availableDepth - 1));

  return results;
}

interface StartingSearchPaths {
  path: string,
  availableDepth: number,
}
function getStartingSearchPaths(): StartingSearchPaths[] {
  const searchPaths: StartingSearchPaths[] = [];

  // Adds the git.defaultCloneDirectory, if it exists and if the settings allows using it.
  if (configs.clonedReposSearch.searchOnDefaultCloneDir && configs.defaultCloneDir)
    searchPaths.push({
      path: configs.defaultCloneDir,
      availableDepth: configs.clonedReposSearch.defaultCloneDirMaxDepth
    });

  return searchPaths;
}



// Searching is used by Repositories.
export enum SearchClonedReposStatus {
  ok, searching, noStartingSearchDirs, noClonedReposFound
}
// TODO: Add custom dirs
export async function searchLocalReposAndSetRepoPath(repos: Repository[]): Promise<SearchClonedReposStatus> {
  // If the user don't have any repository in GitHub
  if (!repos.length)
    return SearchClonedReposStatus.ok; // This will display nothing under Cloned tree.

  // Get starting search paths.
  const startingSearchPaths = getStartingSearchPaths();
  if (startingSearchPaths.length === 0)
    return SearchClonedReposStatus.noStartingSearchDirs;

  // Get local repositories paths
  const repositoriesPaths: string[] = [];
  for (const startingSearchPath of startingSearchPaths)
    repositoriesPaths.push(...(await getDirsWithDotGit(startingSearchPath.path, startingSearchPath.availableDepth)));

  console.log(repositoriesPaths);
  // Get the repositories remotes (git url) and compare with the user repositories url,
  // and set the repo.localPath.
  const dirsWithGitUrl = await getGitUrls(repositoriesPaths);
  console.log(dirsWithGitUrl);
  console.log(repos);
  for (const repo of repos) {
    const index = dirsWithGitUrl.findIndex(dirWithGitUrl => dirWithGitUrl.gitUrl === repo.htmlUrl);
    if (index !== -1) {
      repo.localPath = dirsWithGitUrl[index].dirPath;
      dirsWithGitUrl.splice(index, 1);
    }
  }
  return SearchClonedReposStatus.ok;
}

