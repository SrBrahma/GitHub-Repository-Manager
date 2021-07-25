import fse from 'fs-extra';
import path from 'path';
import execa from 'execa';
import GitUrlParse from 'git-url-parse';
import { Configs } from '../../../main/configs';

// mz lib is a little old but does the job.
// https://stackoverflow.com/a/37532027/10247962

interface DirWithGitUrl {
  dirPath: string;
  gitUrl: string;
}
async function getGitUrls(dirsPath: string[]): Promise<DirWithGitUrl[]> {
  const dirsWithGitUrl: DirWithGitUrl[] = [];

  // forEach would call all execs 'at the same time', as it doesnt wait await.
  for (const dirPath of dirsPath) {
    try {
      // https://stackoverflow.com/a/23682620/10247962
      // was using git remote -v, but git ls-remote --get-url seems to also do the job with a single output.
      const { stdout: result } = await execa('git', ['ls-remote', '--get-url'], { cwd: dirPath });


      // Remove whitespaces chars.
      const url = result.trim();

      if (url) {
        // Parse the git URL into a repository URL, as it could be the git@github.com:author/reponame url pattern.
        // This changes any known kind to the https://github.com/author/reponame pattern.
        const gitUrl = GitUrlParse(url).toString('https').replace(/\.git$/, ''); // remove final .git
        dirsWithGitUrl.push({ gitUrl, dirPath });
      }
    } catch (err) {
      // If error, it's because there isn't a remote. No need to manage it, may be left empty.
      // console.log(dirPath, error); // Uncomment to debug.
    }
  }
  return dirsWithGitUrl;
}



// Recursive function to find directories with .git dir.
async function getDirsWithDotGit(currentPath: string, availableDepth: number, dirsToSkip: string[]): Promise<string[]> {

  const dirsName = (await fse.readdir(currentPath, { withFileTypes: true }))
    .filter(file => file.isDirectory())
    .map(dir => dir.name);

  // If current dir is a repository
  if (dirsName.find(dir => dir === '.git'))
    return [currentPath];

  // If this was the last depth and we didn't find a .gir dir, return empty array;
  if (availableDepth === 0)
    return [];

  // Else, go deeper!
  const results = [];
  for (const dirName of dirsName) { // Maybe could use forEach as it doesn't wait awaits, the 'parallelism' could work nice. Needs benchmark.
    if (!dirsToSkip.includes(dirName))
      results.push(...await getDirsWithDotGit(path.resolve(currentPath, dirName), availableDepth - 1, dirsToSkip));
  }
  return results;
}

export let noLocalSearchPaths: boolean = false;


interface StartingSearchPaths {
  path: string;
  availableDepth: number;
}
function getStartingSearchPaths(): StartingSearchPaths[] {
  const searchPaths: StartingSearchPaths[] = [];

  if (Configs.gitDefaultCloneDir)
    searchPaths.push({
      path: Configs.gitDefaultCloneDir,
      availableDepth: Configs.defaultCloneDirectoryMaximumDepth,
    });

  return searchPaths;
}


// TODO: Add custom dirs
// This method returns all found git folders in the search location regardless if they are in the users Github or not
export async function getLocalReposPathAndUrl(): Promise<DirWithGitUrl[]> {
  // If the user don't have any repository in GitHub

  // Get starting search paths.
  const startingSearchPaths = getStartingSearchPaths();
  if (startingSearchPaths.length === 0) {
    noLocalSearchPaths = true;
    return [];
  }

  noLocalSearchPaths = false; // Reset it if was true

  // Get local repositories paths.
  const repositoriesPaths: string[] = [];
  const dirsToSkip = Configs.directoriesToIgnore;
  for (const startingSearchPath of startingSearchPaths)
    repositoriesPaths.push(...(await getDirsWithDotGit(
      startingSearchPath.path,
      startingSearchPath.availableDepth,
      dirsToSkip)
    ));

  return await getGitUrls(repositoriesPaths);
}
